import type { Database } from '@/data/types'
import { COLLECTIONS, TABLES, fromRow, toRow, type CollectionKey } from '@/data/schema'
import { requireSupabase } from '@/lib/supabase'
import { useStore } from './useStore'

/* ============================================================================
   SYNC

   The store's ~40 actions are left untouched. Instead this subscribes to the
   store, diffs each collection against the last synced snapshot by id, and
   pushes only what changed. Writes are debounced and coalesced, so dragging a
   moodboard item across a section is one round trip, not thirty.

   Last-write-wins. That is honest for a small studio where two people rarely
   edit the same record in the same second; proper conflict resolution would
   need per-field versioning and is noted in the README as future work.
   ========================================================================== */

type Row = Record<string, unknown>
type Snapshot = Partial<Record<CollectionKey, Map<string, string>>>

let workspaceId: string | null = null
let snapshot: Snapshot = {}
let unsubscribe: (() => void) | null = null
let timer: number | undefined
/** Set while hydrating, so writing the fetched state back is not mistaken for an edit. */
let applyingRemote = false

const pending = new Set<CollectionKey>()

/** Stable identity for a record, used to detect "did this actually change". */
function fingerprint(record: unknown): string {
  return JSON.stringify(record)
}

function indexOf(records: Array<{ id: string }>): Map<string, string> {
  const map = new Map<string, string>()
  for (const record of records) map.set(record.id, fingerprint(record))
  return map
}

/* --------------------------------------------------------------- hydrate -- */

/** Pull the whole workspace into the store. Returns false if it is empty. */
export async function hydrate(ws: string): Promise<boolean> {
  const supabase = requireSupabase()
  workspaceId = ws

  const next: Partial<Database> = {}
  let total = 0

  await Promise.all(
    COLLECTIONS.map(async (key) => {
      const { data, error } = await supabase
        .from(TABLES[key].table)
        .select('*')
        .eq('workspace_id', ws)

      if (error) throw new Error(`${TABLES[key].table}: ${error.message}`)
      const records = (data ?? []).map((row) => fromRow(row as Row))
      total += records.length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(next as any)[key] = records
    }),
  )

  // Personal preferences live in their own table, keyed by user.
  const { data: prefs } = await supabase
    .from('user_settings')
    .select('*')
    .eq('workspace_id', ws)
    .maybeSingle()

  const { data: ws_row } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', ws)
    .maybeSingle()

  applyingRemote = true
  useStore.setState((state) => ({
    ...state,
    ...next,
    settings: {
      ...state.settings,
      theme: (prefs?.theme as Database['settings']['theme']) ?? state.settings.theme,
      density: (prefs?.density as Database['settings']['density']) ?? state.settings.density,
      notifications: (prefs?.notifications as never) ?? state.settings.notifications,
      currentUserId: (prefs?.current_user_id as string) ?? state.settings.currentUserId,
      workspace: {
        ...state.settings.workspace,
        name: (ws_row?.name as string) ?? state.settings.workspace.name,
        tagline: (ws_row?.tagline as string) ?? state.settings.workspace.tagline,
        accent: (ws_row?.accent as never) ?? state.settings.workspace.accent,
        onboarded: true,
      },
    },
  }))
  applyingRemote = false

  snapshot = {}
  const state = useStore.getState()
  for (const key of COLLECTIONS) {
    snapshot[key] = indexOf(state[key] as Array<{ id: string }>)
  }

  return total > 0
}

/* ----------------------------------------------------------------- flush -- */

async function flush() {
  if (!workspaceId) return
  const supabase = requireSupabase()
  const state = useStore.getState()
  const keys = Array.from(pending)
  pending.clear()

  for (const key of keys) {
    const spec = TABLES[key]
    const records = state[key] as Array<{ id: string }>
    const before = snapshot[key] ?? new Map()
    const after = indexOf(records)

    const changed = records.filter((record) => before.get(record.id) !== after.get(record.id))
    const removed = [...before.keys()].filter((id) => !after.has(id))

    try {
      if (changed.length > 0) {
        const rows = changed.map((record) =>
          toRow(record as unknown as Row, workspaceId!),
        )
        const { error } = await supabase
          .from(spec.table)
          .upsert(rows, { onConflict: 'workspace_id,id' })
        if (error) throw error
      }

      if (removed.length > 0) {
        const { error } = await supabase
          .from(spec.table)
          .delete()
          .eq('workspace_id', workspaceId)
          .in('id', removed)
        if (error) throw error
      }

      snapshot[key] = after
    } catch (error) {
      // Keep the old snapshot so the change is retried on the next flush
      // rather than being silently dropped.
      pending.add(key)
      console.error(`[crmo] sync failed for ${spec.table}`, error)
    }
  }

  // Settings ride along with whatever else changed.
  await supabase.from('user_settings').upsert(
    {
      workspace_id: workspaceId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      theme: state.settings.theme,
      density: state.settings.density,
      notifications: state.settings.notifications,
      current_user_id: state.settings.currentUserId,
      onboarded: true,
    },
    { onConflict: 'workspace_id,user_id' },
  )

  await supabase
    .from('workspaces')
    .update({
      name: state.settings.workspace.name,
      tagline: state.settings.workspace.tagline,
      accent: state.settings.workspace.accent,
    })
    .eq('id', workspaceId)
}

/* ----------------------------------------------------------------- start -- */

/** Begin mirroring store changes to Postgres. Idempotent. */
export function startSync(ws: string) {
  workspaceId = ws
  unsubscribe?.()

  unsubscribe = useStore.subscribe((state, previous) => {
    if (applyingRemote) return

    let dirty = false
    for (const key of COLLECTIONS) {
      if (state[key] !== previous[key]) {
        pending.add(key)
        dirty = true
      }
    }
    if (state.settings !== previous.settings) dirty = true
    if (!dirty) return

    window.clearTimeout(timer)
    timer = window.setTimeout(() => void flush(), 400)
  })
}

export function stopSync() {
  unsubscribe?.()
  unsubscribe = null
  workspaceId = null
  snapshot = {}
  pending.clear()
  window.clearTimeout(timer)
}

/** Push the entire current store up — used when seeding a new workspace. */
export async function pushAll(ws: string) {
  workspaceId = ws
  snapshot = {}
  for (const key of COLLECTIONS) pending.add(key)
  await flush()
}
