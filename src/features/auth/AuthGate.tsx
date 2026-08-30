import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AlertTriangle, Cloud, HardDrive } from 'lucide-react'
import { BRAND } from '@/lib/brand'
import { isRemote, requireSupabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { hydrate, pushAll, startSync, stopSync } from '@/store/sync'
import { createSeedDatabase, createEmptyDatabase } from '@/data/seed'
import { Button, Card, Pill, Skeleton } from '@/components/ui/primitives'
import { Input } from '@/components/ui/form'
import { Logo } from '@/components/shell/Logo'
import { toast } from '@/components/ui/feedback'
import { cn } from '@/lib/utils'

/* ============================================================================
   AUTH GATE

   In local mode this is a pass-through — the app behaves exactly as before and
   works offline. With Supabase configured it takes over: sign in, resolve the
   user's workspace, hydrate the store from Postgres, and start mirroring
   changes back.
   ========================================================================== */

type Phase = 'checking' | 'signed-out' | 'loading' | 'ready' | 'error'

export function AuthGate({ children }: { children: ReactNode }) {
  if (!isRemote) return <>{children}</>
  return <RemoteGate>{children}</RemoteGate>
}

function RemoteGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('checking')
  const [error, setError] = useState<string>('')
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    const supabase = requireSupabase()

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setPhase(data.session ? 'loading' : 'signed-out')
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      if (!next) {
        stopSync()
        setPhase('signed-out')
      } else {
        setPhase('loading')
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  /* Once signed in: find or create the workspace, then hydrate and sync. */
  useEffect(() => {
    if (phase !== 'loading' || !session) return
    let cancelled = false

    ;(async () => {
      try {
        const workspaceId = await resolveWorkspace(session)
        if (cancelled) return
        const hadData = await hydrate(workspaceId)
        if (cancelled) return

        // A brand-new workspace starts from whatever the local store holds —
        // the demo studio, or the empty one chosen during setup.
        if (!hadData) await pushAll(workspaceId)

        startSync(workspaceId)
        setPhase('ready')
      } catch (caught) {
        if (cancelled) return
        setError(caught instanceof Error ? caught.message : String(caught))
        setPhase('error')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [phase, session])

  if (phase === 'signed-out') return <SignIn />
  if (phase === 'checking' || phase === 'loading') return <Loading />
  if (phase === 'error') return <ConnectionError message={error} onRetry={() => setPhase('loading')} />
  return <>{children}</>
}

/* ------------------------------------------------------------- workspace -- */

/**
 * Every user belongs to exactly one workspace in this version. Returns the
 * existing one, or creates it plus the owner's membership on first sign-in.
 */
async function resolveWorkspace(session: Session): Promise<string> {
  const supabase = requireSupabase()

  const { data: membership, error: memberError } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', session.user.id)
    .limit(1)
    .maybeSingle()

  if (memberError) throw new Error(memberError.message)
  if (membership?.workspace_id) return membership.workspace_id as string

  const local = useStore.getState().settings.workspace
  const { data: created, error: createError } = await supabase
    .from('workspaces')
    .insert({
      owner_id: session.user.id,
      name: local.name || 'My studio',
      tagline: local.tagline ?? '',
      accent: local.accent ?? 'lime',
    })
    .select('id')
    .single()

  if (createError) throw new Error(createError.message)

  const { error: joinError } = await supabase.from('workspace_members').insert({
    workspace_id: created.id,
    user_id: session.user.id,
    permission_role: 'owner',
  })
  if (joinError) throw new Error(joinError.message)

  return created.id as string
}

/* ---------------------------------------------------------------- screens -- */

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-5 py-10">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}

function SignIn() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    const supabase = requireSupabase()

    const { error } =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    setBusy(false)
    if (error) {
      setMessage(error.message)
      return
    }
    if (mode === 'sign-up') {
      setMessage('Check your email to confirm the address, then sign in.')
      toast.success('Account created')
    }
  }

  return (
    <Shell>
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <Logo size={44} />
        <div>
          <h1 className="text-title font-medium tracking-title">{BRAND.full}</h1>
          <p className="mt-1 text-base text-ink-muted">{BRAND.tagline}</p>
        </div>
      </div>

      <Card variant="raised" padding="lg" radius="3xl">
        <div
          role="tablist"
          aria-label="Sign in or create an account"
          className="mb-6 flex gap-1.5"
        >
          {(['sign-in', 'sign-up'] as const).map((option) => (
            <button
              key={option}
              role="tab"
              aria-selected={mode === option}
              onClick={() => {
                setMode(option)
                setMessage('')
              }}
              className={cn(
                'h-9 flex-1 rounded-pill text-sm font-medium transition-colors duration-fast',
                mode === option ? 'bg-inverse text-on-inverse' : 'bg-surface text-ink-muted',
              )}
            >
              {option === 'sign-in' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Password"
            type="password"
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            hint={mode === 'sign-up' ? 'At least 8 characters.' : undefined}
            required
          />

          {message && (
            <p className="rounded-lg bg-surface px-3 py-2.5 text-sm text-ink-muted" role="status">
              {message}
            </p>
          )}

          <Button type="submit" variant="primary" block disabled={busy}>
            {busy ? 'Working…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
          </Button>
        </form>
      </Card>

      <p className="mt-5 flex items-center justify-center gap-2 text-xs text-ink-faint">
        <Cloud size={12} aria-hidden />
        Connected to Supabase
      </p>
    </Shell>
  )
}

function Loading() {
  return (
    <Shell>
      <div className="flex flex-col items-center gap-5">
        <Logo size={44} />
        <p className="text-base text-ink-muted">Opening your studio…</p>
        <div className="w-full space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    </Shell>
  )
}

function ConnectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const supabase = requireSupabase()

  return (
    <Shell>
      <Card variant="raised" padding="lg" radius="3xl" className="text-center">
        <span className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-critical-wash text-critical">
          <AlertTriangle size={20} aria-hidden />
        </span>
        <h1 className="text-xl font-medium tracking-title">Could not open the workspace</h1>
        <p className="mt-2 text-sm text-pretty text-ink-muted">{message}</p>
        <p className="mt-3 text-xs text-pretty text-ink-faint">
          If this mentions a missing table or a policy, the migration in
          <code className="mx-1">supabase/migrations</code> has not been run yet.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Button variant="primary" block onClick={onRetry}>
            Try again
          </Button>
          <Button block onClick={() => void supabase.auth.signOut()}>
            Sign out
          </Button>
        </div>
      </Card>
    </Shell>
  )
}

/* --------------------------------------------------------- mode indicator -- */

/** Small badge for Settings showing where the data actually lives. */
export function StorageModeBadge() {
  const workspace = useStore((s) => s.settings.workspace)
  void workspace
  return isRemote ? (
    <Pill tone="positive" icon={<Cloud size={11} />}>
      Synced to Supabase
    </Pill>
  ) : (
    <Pill tone="neutral" icon={<HardDrive size={11} />}>
      This browser only
    </Pill>
  )
}

export async function signOut() {
  stopSync()
  await requireSupabase().auth.signOut()
}

/** Re-export so callers do not need to know where the seed helpers live. */
export { createSeedDatabase, createEmptyDatabase }
