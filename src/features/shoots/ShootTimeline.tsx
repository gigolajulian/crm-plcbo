import { useMemo } from 'react'
import { shootEnd, shootStart } from '@/store/selectors'
import { Link } from 'react-router-dom'
import type { Shoot } from '@/data/types'
import { useStore } from '@/store/useStore'
import { isClosed } from '@/data/pipeline'
import { cn, formatDate, parseDate } from '@/lib/utils'
import { Card } from '@/components/ui/primitives'
import { HealthBadge, StageBadge } from '@/components/common/records'
import { Img } from '@/components/common/Img'

/* ============================================================================
   TIMELINE VIEW
   A schedule, not a Gantt chart with dependency arrows: bars for the run of
   each shoot, dots for its milestones, and a line for today. The point is to
   see collisions and gaps, not to manage critical paths.
   ========================================================================== */

const DAY = 86400000

export function ShootTimeline({ shoots }: { shoots: Shoot[] }) {
  const milestones = useStore((s) => s.milestones)
  const pipeline = useStore((s) => s.pipeline)
  // A closed shoot draws grey rather than accent — it is history, not work.
  const closedStages = useMemo(
    () => new Set(pipeline.filter((p) => isClosed(p.kind)).map((p) => p.id)),
    [pipeline],
  )

  const { start, end, months, todayOffset, totalDays } = useMemo(() => {
    const dates = shoots.flatMap((p) => [parseDate(shootStart(p)), parseDate(shootEnd(p))])
    const now = new Date()
    dates.push(now)

    const min = new Date(Math.min(...dates.map((d) => d.getTime())))
    const max = new Date(Math.max(...dates.map((d) => d.getTime())))
    // Pad a fortnight either side so bars never touch the edges.
    min.setDate(min.getDate() - 14)
    max.setDate(max.getDate() + 14)

    const span = Math.max(1, Math.round((max.getTime() - min.getTime()) / DAY))

    const monthList: Array<{ label: string; offset: number; width: number }> = []
    const cursor = new Date(min.getFullYear(), min.getMonth(), 1)
    while (cursor <= max) {
      const monthStart = new Date(Math.max(cursor.getTime(), min.getTime()))
      const nextMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
      const monthEnd = new Date(Math.min(nextMonth.getTime(), max.getTime()))
      monthList.push({
        label: new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit' }).format(cursor),
        offset: ((monthStart.getTime() - min.getTime()) / DAY / span) * 100,
        width: ((monthEnd.getTime() - monthStart.getTime()) / DAY / span) * 100,
      })
      cursor.setMonth(cursor.getMonth() + 1)
    }

    return {
      start: min,
      end: max,
      months: monthList,
      totalDays: span,
      todayOffset: ((now.getTime() - min.getTime()) / DAY / span) * 100,
    }
  }, [shoots])

  function positionOf(dateString: string) {
    return ((parseDate(dateString).getTime() - start.getTime()) / DAY / totalDays) * 100
  }

  if (shoots.length === 0) return null

  return (
    <Card variant="raised" padding="none" radius="2xl" className="overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[820px]">
          {/* month scale */}
          <div className="relative flex h-9 items-end border-b border-line-soft pl-56">
            {months.map((month) => (
              <span
                key={month.label}
                className="absolute bottom-1.5 border-l border-line-soft pl-2 text-2xs text-ink-faint"
                style={{ left: `calc(14rem + ${month.offset}%  * 0.999)`, width: `${month.width}%` }}
              >
                {month.label}
              </span>
            ))}
          </div>

          <ul className="relative">
            {/* today marker spans the whole grid */}
            <li
              aria-hidden
              className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-lime"
              style={{ left: `calc(14rem + ${todayOffset}% * 0.999)` }}
            >
              <span className="absolute -top-0.5 -left-1 size-2 rounded-full bg-lime" />
            </li>

            {shoots.map((shoot, index) => {
              const shootMilestones = milestones.filter((m) => m.shootId === shoot.id)
              const left = positionOf(shootStart(shoot))
              const right = positionOf(shootEnd(shoot))
              const width = Math.max(1.5, right - left)

              return (
                <li
                  key={shoot.id}
                  className={cn(
                    'relative flex items-center gap-3 py-2.5 pr-6',
                    index > 0 && 'border-t border-line-soft',
                  )}
                >
                  <div className="flex w-56 shrink-0 items-center gap-2.5 pl-4">
                    <Img
                      src={shoot.coverUrl}
                      seed={shoot.artSeed}
                      alt=""
                      ratio={1}
                      className="w-9 shrink-0 rounded-md"
                    />
                    <div className="min-w-0">
                      <Link
                        to={`/shoots/${shoot.id}`}
                        className="block truncate text-sm font-medium hover:underline"
                      >
                        {shoot.name}
                      </Link>
                      <p className="tabular truncate text-2xs text-ink-faint">{shoot.code}</p>
                    </div>
                  </div>

                  <div className="relative h-9 flex-1">
                    <div
                      className={cn(
                        'group absolute top-1/2 flex h-7 -translate-y-1/2 items-center rounded-pill px-3',
                        shoot.health === 'blocked'
                          ? 'bg-critical-wash'
                          : shoot.health === 'at-risk'
                            ? 'bg-caution-wash'
                            : closedStages.has(shoot.stageId)
                              ? 'bg-line'
                              : 'bg-lime-pale',
                      )}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      title={`${shoot.name}: ${formatDate(shootStart(shoot))} – ${formatDate(shootEnd(shoot))}`}
                    >
                      <span className="truncate text-2xs font-medium text-[#2b2b28] dark:text-ink">
                        {formatDate(shootStart(shoot), 'short')} – {formatDate(shootEnd(shoot), 'short')}
                      </span>
                    </div>

                    {shootMilestones.map((milestone) => (
                      <span
                        key={milestone.id}
                        className={cn(
                          'absolute top-1/2 z-10 size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45',
                          milestone.status === 'done'
                            ? 'bg-ink'
                            : milestone.status === 'missed'
                              ? 'bg-critical'
                              : 'bg-raised ring-1 ring-ink',
                        )}
                        style={{ left: `${positionOf(milestone.date)}%` }}
                        title={`${milestone.name} — ${formatDate(milestone.date)}`}
                      />
                    ))}
                  </div>

                  <div className="hidden w-40 shrink-0 justify-end gap-1.5 lg:flex">
                    <StageBadge stageId={shoot.stageId} />
                    {shoot.health !== 'on-track' && <HealthBadge health={shoot.health} />}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <footer className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line-soft px-4 py-3 text-2xs text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-lime" aria-hidden /> Today
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rotate-45 bg-ink" aria-hidden /> Milestone met
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rotate-45 bg-raised ring-1 ring-ink" aria-hidden /> Upcoming
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rotate-45 bg-critical" aria-hidden /> Missed
        </span>
        <span className="ml-auto">
          {formatDate(start.toISOString().slice(0, 10))} – {formatDate(end.toISOString().slice(0, 10))}
        </span>
      </footer>
    </Card>
  )
}
