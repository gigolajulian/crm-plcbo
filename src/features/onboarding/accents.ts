import type { Accent } from '@/data/types'

/**
 * The accent options offered during setup and in Settings.
 *
 * `swatch` is only for rendering the picker itself — the live values come from
 * the `[data-accent]` blocks in tokens.css, so a preset is defined in exactly
 * one place for light and dark.
 */
export const ACCENTS: Array<{ id: Accent; label: string; swatch: string }> = [
  { id: 'lime', label: 'Lime', swatch: '#c7f33c' },
  { id: 'amber', label: 'Amber', swatch: '#ffc53d' },
  { id: 'coral', label: 'Coral', swatch: '#ff8a6b' },
  { id: 'sky', label: 'Sky', swatch: '#7fd4ff' },
  { id: 'iris', label: 'Iris', swatch: '#c3b4ff' },
]
