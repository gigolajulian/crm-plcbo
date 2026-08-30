/* ============================================================================
   ACTIVE FORMATTING

   Currency and locale are a workspace decision made during setup, but they are
   read from render paths all over the app — every deal value, every budget bar.
   Threading them through as props or hooks would touch ~40 call sites for no
   benefit, so they live here and the store keeps them current.
   ========================================================================== */

let currency = 'USD'
let locale = 'en-US'

export function setMoneyFormat(nextCurrency?: string, nextLocale?: string) {
  if (nextCurrency) currency = nextCurrency
  if (nextLocale) locale = nextLocale
}

export const activeCurrency = () => currency
export const activeLocale = () => locale

/** The currencies offered at setup. Symbol is only for the picker. */
export const CURRENCIES = [
  { code: 'USD', label: 'US dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GBP', label: 'Pound sterling', symbol: '£' },
  { code: 'CAD', label: 'Canadian dollar', symbol: '$' },
  { code: 'AUD', label: 'Australian dollar', symbol: '$' },
  { code: 'DKK', label: 'Danish krone', symbol: 'kr' },
  { code: 'SEK', label: 'Swedish krona', symbol: 'kr' },
  { code: 'CHF', label: 'Swiss franc', symbol: 'CHF' },
  { code: 'JPY', label: 'Japanese yen', symbol: '¥' },
  { code: 'BRL', label: 'Brazilian real', symbol: 'R$' },
] as const

/** Locales offered at setup — these drive date order and number separators. */
export const LOCALES = [
  { code: 'en-US', label: 'English (US) — Mar 4, 2026' },
  { code: 'en-GB', label: 'English (UK) — 4 Mar 2026' },
  { code: 'en-AU', label: 'English (Australia)' },
  { code: 'en-CA', label: 'English (Canada)' },
  { code: 'de-DE', label: 'Deutsch' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'es-ES', label: 'Español' },
  { code: 'pt-BR', label: 'Português (Brasil)' },
  { code: 'nl-NL', label: 'Nederlands' },
  { code: 'da-DK', label: 'Dansk' },
] as const
