/**
 * Everything brand-specific lives here so the product can be renamed in one place.
 * The pill/capsule motif is deliberate: the entire component language is built
 * from pills, so the mark and the UI share a single idea.
 */
export const BRAND = {
  studio: 'PLCBO',
  product: 'CRM',
  full: 'CRM PLCBO',
  /** Used where only one word fits — the rail, the mobile header. */
  short: 'PLCBO',
  tagline: 'Creative relationship management',
  /** Shown in the workspace switcher. */
  workspace: 'PLCBO Studio',
  currency: 'USD',
  locale: 'en-US',
} as const
