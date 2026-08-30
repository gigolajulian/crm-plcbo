import { addDays, startOfToday, toISODate } from '@/lib/utils'

/**
 * Every seeded date is expressed relative to *today*, so the demo always has
 * genuinely overdue tasks, something due this afternoon, and milestones next
 * week — no matter when the app is opened.
 */

/** ISO date N days from today. */
export function d(offset: number): string {
  return toISODate(addDays(startOfToday(), offset))
}

/** ISO datetime N days from today at the given local time. */
export function t(offset: number, hour = 10, minute = 0): string {
  const date = addDays(startOfToday(), offset)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}
