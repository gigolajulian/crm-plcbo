import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react'
import type { Accent } from '@/data/types'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { Button, Card, Pill } from '@/components/ui/primitives'
import { Input } from '@/components/ui/form'
import { Logo } from '@/components/shell/Logo'
import { ACCENTS } from './accents'

/* ============================================================================
   SETUP
   Four short steps, shown once, before the workspace is used. Everything here
   is editable afterwards in Settings — nothing is a one-way door.

   This creates a *local profile*, not an authenticated account: there is no
   server, so there is no password and nothing leaves the browser.
   ========================================================================== */

const STEPS = ['Studio', 'You', 'Look', 'Start'] as const
type Step = number

export function Onboarding() {
  const workspace = useStore((s) => s.settings.workspace)
  const completeSetup = useStore((s) => s.completeSetup)
  const updateWorkspace = useStore((s) => s.updateWorkspace)

  const [step, setStep] = useState<Step>(0)
  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerRole, setOwnerRole] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [accent, setAccent] = useState<Accent>(workspace.accent)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light')

  const updateSettings = useStore((s) => s.updateSettings)

  /* Preview the accent and theme live while they are being chosen. */
  useEffect(() => {
    document.documentElement.dataset.accent = accent
  }, [accent])

  useEffect(() => {
    const dark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', dark)
  }, [theme])

  const canContinue = useMemo(() => {
    if (step === 0) return name.trim().length > 0
    if (step === 1) return ownerName.trim().length > 0
    return true
  }, [step, name, ownerName])

  function finish(start: 'demo' | 'empty') {
    updateSettings({ theme })
    completeSetup(
      {
        name: name.trim(),
        tagline: tagline.trim() || 'Creative relationship management',
        ownerName: ownerName.trim(),
        ownerRole: ownerRole.trim() || 'Founder',
        ownerEmail: ownerEmail.trim(),
        accent,
      },
      start,
    )
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-5 py-8 sm:px-8 sm:py-14">
        <header className="mb-8 flex items-center justify-between gap-4">
          <Logo size={40} />
          <ol className="flex items-center gap-1.5" aria-label="Setup progress">
            {STEPS.map((label, index) => (
              <li key={label}>
                <span
                  className={cn(
                    'flex h-7 items-center gap-1.5 rounded-pill px-3 text-xs font-medium transition-colors duration-base',
                    index === step
                      ? 'bg-inverse text-on-inverse'
                      : index < step
                        ? 'bg-lime-pale text-ink'
                        : 'text-ink-faint',
                  )}
                  aria-current={index === step ? 'step' : undefined}
                >
                  {index < step && <Check size={11} aria-hidden />}
                  {label}
                </span>
              </li>
            ))}
          </ol>
        </header>

        <main className="flex flex-1 flex-col justify-center">
          {step === 0 && (
            <Section
              eyebrow="Step one"
              title="What is the studio called?"
              body="It appears in the sidebar, on reports, and anywhere the workspace refers to itself."
            >
              <Input
                label="Studio name"
                placeholder="Northlight Studio"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
              <Input
                label="Tagline"
                hint="Optional. Shown under the name in Settings."
                placeholder="Creative relationship management"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
              />
            </Section>
          )}

          {step === 1 && (
            <Section
              eyebrow="Step two"
              title="And who are you?"
              body="This becomes your profile in the studio — the person tasks get assigned to and approvals get recorded against."
            >
              <Input
                label="Your name"
                placeholder="Alex Moreau"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                autoFocus
                required
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Your role"
                  placeholder="Founder & Creative Director"
                  value={ownerRole}
                  onChange={(e) => setOwnerRole(e.target.value)}
                />
                <Input
                  label="Email"
                  type="email"
                  hint="Stored in this browser only."
                  placeholder="alex@studio.com"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                />
              </div>
            </Section>
          )}

          {step === 2 && (
            <Section
              eyebrow="Step three"
              title="Pick an accent"
              body="One saturated colour carries every highlight in the workspace. The rest of the palette stays warm grey and near-black."
            >
              <fieldset>
                <legend className="eyebrow mb-3">Accent</legend>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
                  {ACCENTS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={accent === option.id}
                      onClick={() => setAccent(option.id)}
                      className={cn(
                        'flex flex-col items-start gap-2 rounded-xl p-3 text-left transition-[box-shadow,transform] duration-fast',
                        accent === option.id
                          ? 'bg-raised shadow-md ring-2 ring-ink'
                          : 'bg-surface hover:bg-surface-hover',
                      )}
                    >
                      <span
                        className="h-8 w-full rounded-md"
                        style={{ backgroundColor: option.swatch }}
                        aria-hidden
                      />
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="mt-2">
                <legend className="eyebrow mb-3">Theme</legend>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {(
                    [
                      { id: 'light', label: 'Light', hint: 'The studio default' },
                      { id: 'dark', label: 'Dark', hint: 'For late edits' },
                      { id: 'system', label: 'System', hint: 'Follow the OS' },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={theme === option.id}
                      onClick={() => setTheme(option.id)}
                      className={cn(
                        'rounded-xl p-3.5 text-left transition-colors duration-base',
                        theme === option.id
                          ? 'bg-inverse text-on-inverse'
                          : 'bg-surface hover:bg-surface-hover',
                      )}
                    >
                      <span className="block text-base font-medium">{option.label}</span>
                      <span
                        className={cn(
                          'mt-0.5 block text-xs',
                          theme === option.id ? 'text-on-inverse-muted' : 'text-ink-muted',
                        )}
                      >
                        {option.hint}
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <Card variant="raised" padding="md" radius="2xl" className="mt-2">
                <p className="eyebrow mb-3">Preview</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="lime" size="md">
                    Today
                  </Pill>
                  <Pill tone="ink" size="md">
                    In production
                  </Pill>
                  <Pill tone="neutral" size="md">
                    Due Friday
                  </Pill>
                  <Button variant="accent" size="sm">
                    Approve
                  </Button>
                  <Button variant="primary" size="sm">
                    New project
                  </Button>
                </div>
              </Card>
            </Section>
          )}

          {step === 3 && (
            <Section
              eyebrow="Step four"
              title="Start with something, or nothing"
              body="The demo studio is a fully populated agency — nine projects, real moodboards, a pipeline and an approval history. It is the fastest way to see how everything connects."
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => finish('demo')}
                  className="flex flex-col gap-2 rounded-2xl bg-raised p-5 text-left shadow-sm transition-[box-shadow,transform] duration-base hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <Sparkles size={18} className="text-ink-muted" aria-hidden />
                  <span className="text-lg font-medium tracking-tight">
                    Explore the demo studio
                  </span>
                  <span className="text-sm text-pretty text-ink-muted">
                    Everything already filled in. Reset or clear it whenever you like.
                  </span>
                  <span className="mt-2">
                    <Pill tone="lime">Recommended</Pill>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => finish('empty')}
                  className="flex flex-col gap-2 rounded-2xl bg-surface p-5 text-left transition-colors duration-base hover:bg-surface-hover"
                >
                  <span className="grid size-[18px] place-items-center text-ink-muted" aria-hidden>
                    ○
                  </span>
                  <span className="text-lg font-medium tracking-tight">Start empty</span>
                  <span className="text-sm text-pretty text-ink-muted">
                    Just your studio, a default pipeline and a set of tags. Add your own clients
                    and work.
                  </span>
                </button>
              </div>
            </Section>
          )}
        </main>

        <footer className="mt-10 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            icon={<ArrowLeft size={15} />}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            Back
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                updateWorkspace({ onboarded: true })
              }}
            >
              Skip setup
            </Button>
            {step < STEPS.length - 1 && (
              <Button
                variant="primary"
                iconAfter={<ArrowRight size={15} />}
                onClick={() => setStep((s) => s + 1)}
                disabled={!canContinue}
              >
                Continue
              </Button>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}

function Section({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string
  title: string
  body: string
  children: React.ReactNode
}) {
  return (
    <section className="animate-in flex flex-col gap-5">
      <div>
        <p className="eyebrow mb-2">{eyebrow}</p>
        <h1 className="text-title font-medium tracking-display text-balance sm:text-display">
          {title}
        </h1>
        <p className="mt-2 max-w-xl text-body text-pretty text-ink-muted">{body}</p>
      </div>
      {children}
    </section>
  )
}
