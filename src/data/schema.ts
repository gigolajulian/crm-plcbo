import type { Database } from './types'

/* ============================================================================
   TABLE MAP

   One declaration per collection describing how the client shape relates to the
   Postgres one. Everything else — hydration, write-through, deletes — is driven
   from this, so adding a field means editing one line rather than four files.
   ========================================================================== */

/** Collections in `Database` that are arrays of records with an `id`. */
export type CollectionKey = Exclude<keyof Database, 'settings'>

export interface TableSpec {
  /** Postgres table name. */
  table: string
  /**
   * Client field -> column, for anything that is not a plain snake_case
   * conversion of the same word. Only exceptions are listed.
   */
  rename?: Record<string, string>
  /** Columns that must be quoted because they collide with SQL keywords. */
  quoted?: string[]
}

export const TABLES: Record<CollectionKey, TableSpec> = {
  team: { table: 'team_members' },
  companies: { table: 'companies' },
  contacts: { table: 'contacts' },
  leadSources: { table: 'lead_sources' },
  shoots: { table: 'shoots' },
  milestones: { table: 'milestones' },
  tasks: { table: 'tasks' },
  licenses: { table: 'licenses' },
  invoices: { table: 'invoices' },
  pipeline: { table: 'pipeline_stages', quoted: ['order'] },
  moodboards: { table: 'moodboards' },
  moodSections: { table: 'mood_sections', quoted: ['order'] },
  moodItems: { table: 'mood_items', quoted: ['order'] },
  assets: { table: 'assets' },
  assetVersions: { table: 'asset_versions' },
  comments: { table: 'comments' },
  activity: { table: 'activity_events' },
  tags: { table: 'tags' },
  customFields: { table: 'custom_fields' },
  savedViews: { table: 'saved_views' },
}

export const COLLECTIONS = Object.keys(TABLES) as CollectionKey[]

/* ---------------------------------------------------------------- casing -- */

const toSnake = (key: string) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
const toCamel = (key: string) => key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())

/** Client record -> database row, with the workspace stamped on. */
export function toRow(
  record: Record<string, unknown>,
  workspaceId: string,
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId }
  for (const [key, value] of Object.entries(record)) {
    // `undefined` means "not set"; Postgres wants an explicit null.
    row[toSnake(key)] = value === undefined ? null : value
  }
  return row
}

/** Database row -> client record, dropping the columns the client never sees. */
export function fromRow(row: Record<string, unknown>): Record<string, unknown> {
  const record: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    if (key === 'workspace_id' || key === 'user_id' || key === 'storage_path') continue
    // A null column is an absent optional field on the client, not a null one.
    if (value === null) continue
    record[toCamel(key)] = value
  }
  return record
}
