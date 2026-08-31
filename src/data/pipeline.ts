import type { PipelineStage, StageKind } from './types'

/* ============================================================================
   THE LIFECYCLE

   One continuous run from enquiry to the licence lapsing, because that is one
   job. The stages are user-editable in Settings — these are only the defaults
   a new workspace starts with, and the ids are stable so the store migration
   and the demo seed can both point at them.

   `kind` is what the app actually reasons about. Renaming "Quoted" to
   "Proposal out" must not stop follow-up timers from running, so nothing
   matches on the name.
   ========================================================================== */

export const DEFAULT_PIPELINE: PipelineStage[] = [
  { id: 'st_inquiry', name: 'Inquiry', order: 0, probability: 10, kind: 'lead' },
  { id: 'st_quoted', name: 'Quoted', order: 1, probability: 30, kind: 'quoted' },
  { id: 'st_deposit', name: 'Deposit due', order: 2, probability: 70, kind: 'booked' },
  { id: 'st_scheduled', name: 'Scheduled', order: 3, probability: 90, kind: 'booked' },
  { id: 'st_shot', name: 'Shot', order: 4, probability: 100, kind: 'production' },
  { id: 'st_edited', name: 'Edited', order: 5, probability: 100, kind: 'production' },
  { id: 'st_delivered', name: 'Delivered', order: 6, probability: 100, kind: 'delivered' },
  { id: 'st_licensed', name: 'Licence active', order: 7, probability: 100, kind: 'licensing' },
  { id: 'st_expiring', name: 'Licence expiring', order: 8, probability: 100, kind: 'licensing' },
  { id: 'st_wrapped', name: 'Wrapped', order: 9, probability: 100, kind: 'won' },
  { id: 'st_lost', name: 'Closed lost', order: 10, probability: 0, kind: 'lost' },
]

/**
 * Money is committed once a deposit is due — that is the point the client has
 * agreed, not the point the work is finished. Leads and quotes are forecast
 * only; lost work counts for nothing.
 */
export const COMMITTED_KINDS: StageKind[] = [
  'booked',
  'production',
  'delivered',
  'licensing',
  'won',
]

/** Kinds that have left the board: nothing more will happen on them. */
export const CLOSED_KINDS: StageKind[] = ['won', 'lost']

export function isCommitted(kind: StageKind): boolean {
  return COMMITTED_KINDS.includes(kind)
}

export function isClosed(kind: StageKind): boolean {
  return CLOSED_KINDS.includes(kind)
}
