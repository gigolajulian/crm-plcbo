/**
 * The product's own identity.
 *
 * Distinct from the *workspace* identity in `settings.workspace`, which is the
 * studio using the app and is set during setup. CRMO is the tool; the workspace
 * is whoever's studio it is.
 */
export const BRAND = {
  /** The application name. */
  full: 'CRMO',
  product: 'CRMO',
  short: 'CRMO',
  tagline: 'Creative relationship management',
  /** Fallback workspace label before setup names one. */
  workspace: 'Your studio',
  currency: 'USD',
  locale: 'en-US',
} as const
