import { BRAND } from './brand'

/** Join class names, dropping falsy values. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/* ------------------------------------------------------------------ ids -- */

let counter = 0
export function uid(prefix = 'id'): string {
  counter += 1
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}`
}

/** Stable 32-bit hash — used to seed deterministic artwork and avatar colours. */
export function hashCode(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

/** Deterministic pseudo-random generator, so a given seed always looks the same. */
export function seededRandom(seed: string): () => number {
  let state = hashCode(seed) || 1
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return ((state >>> 0) % 100000) / 100000
  }
}

/* -------------------------------------------------------------- numbers -- */

export function formatCurrency(value: number, opts: { compact?: boolean } = {}): string {
  if (opts.compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat(BRAND.locale, {
      style: 'currency',
      currency: BRAND.currency,
      notation: 'compact',
      maximumFractionDigits: Math.abs(value) >= 100000 ? 0 : 1,
    }).format(value)
  }
  return new Intl.NumberFormat(BRAND.locale, {
    style: 'currency',
    currency: BRAND.currency,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number, compact = false): string {
  return new Intl.NumberFormat(BRAND.locale, {
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

/* ---------------------------------------------------------------- dates -- */

/** Local-midnight ISO date (YYYY-MM-DD). Avoids the UTC off-by-one. */
export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseDate(value: string): Date {
  // Date-only strings parse as UTC; splitting keeps them in local time.
  const [datePart, timePart] = value.split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  if (!timePart) return new Date(y, (m ?? 1) - 1, d ?? 1)
  return new Date(value)
}

export function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/** Whole days from today. Negative = in the past. */
export function daysFromToday(value: string): number {
  const target = parseDate(value)
  const target0 = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  return Math.round((target0.getTime() - startOfToday().getTime()) / 86400000)
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function formatDate(
  value: string,
  style: 'short' | 'medium' | 'long' | 'day' = 'medium',
): string {
  const date = parseDate(value)
  const opts: Intl.DateTimeFormatOptions =
    style === 'short'
      ? { month: 'short', day: 'numeric' }
      : style === 'long'
        ? { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
        : style === 'day'
          ? { weekday: 'short', month: 'short', day: 'numeric' }
          : { month: 'short', day: 'numeric', year: 'numeric' }
  return new Intl.DateTimeFormat(BRAND.locale, opts).format(date)
}

export function formatMonth(value: string): string {
  return new Intl.DateTimeFormat(BRAND.locale, { month: 'short' }).format(parseDate(value))
}

export function formatTime(value: string): string {
  return new Intl.DateTimeFormat(BRAND.locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(parseDate(value))
}

/** "Today", "Tomorrow", "3 days ago", "Next week" — human, never a raw date. */
export function formatRelativeDay(value: string): string {
  const delta = daysFromToday(value)
  if (delta === 0) return 'Today'
  if (delta === 1) return 'Tomorrow'
  if (delta === -1) return 'Yesterday'
  if (delta > 1 && delta < 7) return `In ${delta} days`
  if (delta < -1 && delta > -7) return `${Math.abs(delta)} days ago`
  if (delta >= 7 && delta < 14) return 'Next week'
  if (delta <= -7 && delta > -14) return 'Last week'
  return formatDate(value, 'short')
}

/** Compact "just now / 3h / 2d / Mar 4" for activity streams. */
export function formatRelativeTime(value: string): string {
  const then = parseDate(value).getTime()
  const diffMin = Math.round((Date.now() - then) / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.round(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return formatDate(value, 'short')
}

/* --------------------------------------------------------------- arrays -- */

export function groupBy<T, K extends string>(items: T[], key: (item: T) => K): Record<K, T[]> {
  return items.reduce(
    (acc, item) => {
      const k = key(item)
      ;(acc[k] ||= []).push(item)
      return acc
    },
    {} as Record<K, T[]>,
  )
}

export function sortBy<T>(items: T[], key: (item: T) => number | string, dir: 1 | -1 = 1): T[] {
  return [...items].sort((a, b) => {
    const ka = key(a)
    const kb = key(b)
    if (ka === kb) return 0
    return (ka > kb ? 1 : -1) * dir
  })
}

export function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items))
}

/** Move an item within an array — the primitive behind every drag reorder. */
export function arrayMove<T>(items: T[], from: number, to: number): T[] {
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

/* ----------------------------------------------------------------- text -- */

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`
}

/** Case-insensitive substring match used by search and filters. */
export function matches(haystack: string, needle: string): boolean {
  if (!needle) return true
  return haystack.toLowerCase().includes(needle.toLowerCase().trim())
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

/** Pick ink or paper for text sitting on an arbitrary swatch colour. */
export function readableOn(hex: string): '#0a0a0a' | '#ffffff' {
  const { r, g, b } = hexToRgb(hex)
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return luminance > 0.55 ? '#0a0a0a' : '#ffffff'
}
