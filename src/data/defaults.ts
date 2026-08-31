import type { BillingProfile, NotificationPrefs } from './types'

/* ============================================================================
   Defaults for a brand-new workspace.

   Kept out of the seed file because they are not demo data — a workspace that
   clears every trace of the demo studio still needs these.
   ========================================================================== */

/**
 * Empty rather than plausible. An invoice letterhead with invented details is
 * worse than a blank one: blank is obviously unfinished, invented gets sent.
 */
export const EMPTY_BILLING: BillingProfile = {
  businessName: '',
  addressLines: ['', '', ''],
  email: '',
  phone: '',
  taxId: '',
  defaultNotes:
    'Payment due within 14 days. Late payment may delay delivery of final files.',
  defaultSignoff: 'Thank you,',
  depositPct: 50,
  paymentTermsDays: 14,
}

export const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  approvalRequests: true,
  taskAssignments: true,
  stageChanges: true,
  milestoneReminders: true,
  clientReplies: true,
  licenceExpiry: true,
  weeklyDigest: false,
  channel: 'both',
}
