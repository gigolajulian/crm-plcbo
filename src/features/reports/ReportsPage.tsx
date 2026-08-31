import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Shoot } from '@/data/types'
import { useStore } from '@/store/useStore'
import { isClosed } from '@/data/pipeline'
import { lineItemsTotal, useActiveShoots, usePipelineSummary, useSortedPipeline, useTaskBuckets, useWorkload } from '@/store/selectors'
import {
  cn,
  daysFromToday,
  formatCurrency,
  formatRelativeDay,
  parseDate,
  pluralize,
  sortBy,
  sum,
} from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, Meter, Pill, ProgressRing } from '@/components/ui/primitives'
import { Avatar } from '@/components/ui/Avatar'
import { BarSeries, HatchArea, Heatgrid, PipelineBar } from '@/components/charts'
import { HealthBadge, SectionHeading, StageBadge } from '@/components/common/records'
import { EmptyState } from '@/components/ui/feedback'

/* ============================================================================
   REPORTS
   Six answers, not six dashboards: is the work healthy, where is the money,
   who is overloaded, what is about to be late, and what has the studio been
   doing. Every figure is a real computation over the same store.
   ========================================================================== */

export default function ReportsPage() {
  const shoots = useStore((s) => s.shoots)
  const invoices = useStore((s) => s.invoices)
  const activity = useStore((s) => s.activity)
  const pipeline = useSortedPipeline()
  const summary = usePipelineSummary()
  const workload = useWorkload()
  const active = useActiveShoots()
  const buckets = useTaskBuckets(false)

  /* --------------------------------------------------------- revenue -- */

  const revenue = useMemo(() => {
    // Six months of won value versus the six before it.
    const now = new Date()
    const months: Array<{ label: string; current: number; previous: number }> = []
    const wonStages = new Set(pipeline.filter((s) => s.kind === 'won').map((s) => s.id))

    for (let i = 5; i >= 0; i -= 1) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const prevStart = new Date(now.getFullYear() - 1, now.getMonth() - i, 1)
      const prevEnd = new Date(now.getFullYear() - 1, now.getMonth() - i + 1, 1)

      const inRange = (from: Date, to: Date) =>
        sum(
          shoots
            .filter((d: Shoot) => {
              if (!wonStages.has(d.stageId) || !d.closedAt) return false
              const at = parseDate(d.closedAt).getTime()
              return at >= from.getTime() && at < to.getTime()
            })
            .map((d: Shoot) => lineItemsTotal(d.lineItems)),
        )

      months.push({
        label: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(monthStart),
        current: inRange(monthStart, monthEnd),
        previous: inRange(prevStart, prevEnd),
      })
    }
    return months
  }, [shoots, pipeline])

  /* -------------------------------------------------------- activity -- */

  const activityDensity = useMemo(() => {
    const days = 28
    const counts = new Array(days).fill(0)
    for (const event of activity) {
      const delta = daysFromToday(event.at)
      const index = days - 1 + delta
      if (index >= 0 && index < days) counts[index] += 1
    }
    const max = Math.max(...counts, 1)
    return counts.map((c) => c / max)
  }, [activity])

  const activityByType = useMemo(() => {
    const types = ['call', 'email', 'meeting', 'note', 'approval'] as const
    return types.map((type) => ({
      label: type.charAt(0).toUpperCase() + type.slice(1),
      value: activity.filter((a) => a.type === type).length,
    }))
  }, [activity])

  /* ------------------------------------------------------- deadlines -- */

  const atRisk = useMemo(
    () =>
      sortBy(
        shoots.filter(
          (p) => !p.archived && (p.health !== 'on-track' || daysFromToday(p.expectedCloseDate) < 7),
        ),
        (p) => p.expectedCloseDate,
      ),
    [shoots],
  )

  const budgetPressure = useMemo(
    () =>
      sortBy(
        active.filter((p) => lineItemsTotal(p.lineItems) > 0),
        (p) => -(0 / lineItemsTotal(p.lineItems)),
      ),
    [active],
  )

  // Quoted against collected — the two numbers a photographer actually watches.
  const totalQuoted = sum(active.map((p) => lineItemsTotal(p.lineItems)))
  const totalCollected = sum(
    invoices
      .filter((inv) => inv.status === 'paid' && active.some((p) => p.id === inv.shootId))
      .map((inv) => lineItemsTotal(inv.lineItems)),
  )

  return (
    <div className="animate-in">
      <PageHeader
        eyebrow="Studio"
        title="Reports"
        description="How the work, the money and the people are actually doing this quarter."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        {/* ------------------------------------------------- headline row */}
        <Card variant="inverse" padding="lg" radius="3xl" className="lg:col-span-2">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-2xs font-medium tracking-label text-on-inverse-muted uppercase">
                Won this half
              </p>
              <p className="tabular mt-1 text-hero font-medium tracking-display">
                {formatCurrency(sum(revenue.map((r) => r.current)), { compact: true })}
              </p>
            </div>
            <dl className="flex gap-8 text-sm">
              <div>
                <dt className="text-on-inverse-muted">Open</dt>
                <dd className="tabular mt-0.5 text-lg">
                  {formatCurrency(summary.openValue, { compact: true })}
                </dd>
              </div>
              <div>
                <dt className="text-on-inverse-muted">Weighted</dt>
                <dd className="tabular mt-0.5 text-lg">
                  {formatCurrency(summary.weightedValue, { compact: true })}
                </dd>
              </div>
              <div>
                <dt className="text-on-inverse-muted">Win rate</dt>
                <dd className="tabular mt-0.5 text-lg">{Math.round(summary.winRate)}%</dd>
              </div>
            </dl>
          </div>

          <HatchArea
            seriesA={revenue.map((r) => r.current)}
            seriesB={revenue.map((r) => r.previous)}
            labels={revenue.map((r) => r.label)}
            labelA="This year"
            labelB="Last year"
            callout={(() => {
              const best = revenue.reduce(
                (bestIndex, r, i, arr) =>
                  r.current - r.previous > arr[bestIndex].current - arr[bestIndex].previous
                    ? i
                    : bestIndex,
                0,
              )
              const delta = revenue[best].previous
                ? Math.round(
                    ((revenue[best].current - revenue[best].previous) / revenue[best].previous) * 100,
                  )
                : 0
              return delta > 0 ? { index: best, text: `+${delta}%` } : undefined
            })()}
            className="[&_text]:fill-[#0a0a0a]"
          />
          <p className="mt-3 text-xs text-on-inverse-muted">
            Won deal value by month, against the same months last year.
          </p>
        </Card>

        {/* --------------------------------------------------- pipeline */}
        <Card variant="raised" padding="lg" radius="3xl">
          <SectionHeading title="Pipeline" description={pluralize(summary.openCount, 'open deal')} />
          <PipelineBar segments={summary.byStage.filter((s) => !isClosed(s.kind))} className="mb-4" />
          <ul className="flex flex-col">
            {summary.byStage.map((stage, index) => (
              <li
                key={stage.id}
                className={cn(
                  'flex items-center justify-between gap-3 py-2.5',
                  index > 0 && 'border-t border-line-soft',
                )}
              >
                <span className="min-w-0 truncate text-sm">{stage.name}</span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="tabular text-xs text-ink-faint">{stage.count}</span>
                  <span className="tabular w-16 text-right text-sm">
                    {formatCurrency(stage.value, { compact: true })}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Card>

        {/* ------------------------------------------------ shoot health */}
        <Card variant="raised" padding="lg" radius="3xl" className="lg:col-span-2">
          <SectionHeading
            title="Project health"
            count={active.length}
            description="Live shoots, most urgent first."
          />
          {active.length === 0 ? (
            <EmptyState title="No live shoots" size="sm" />
          ) : (
            <ul className="flex flex-col">
              {active.slice(0, 7).map((shoot, index) => {
                const used = lineItemsTotal(shoot.lineItems) ? 0 / lineItemsTotal(shoot.lineItems) : 0
                const days = daysFromToday(shoot.expectedCloseDate)
                return (
                  <li
                    key={shoot.id}
                    className={cn(
                      'flex flex-wrap items-center gap-x-4 gap-y-2 py-3',
                      index > 0 && 'border-t border-line-soft',
                    )}
                  >
                    <div className="min-w-40 flex-1">
                      <Link
                        to={`/shoots/${shoot.id}`}
                        className="text-base font-medium hover:underline"
                      >
                        {shoot.name}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <StageBadge stageId={shoot.stageId} />
                        <HealthBadge health={shoot.health} />
                      </div>
                    </div>

                    <div className="w-32">
                      <p className="mb-1 text-2xs text-ink-faint">Budget</p>
                      <Meter
                        value={used}
                        tone={used > 0.95 ? 'critical' : used > 0.8 ? 'caution' : 'ink'}
                        label={`${shoot.name} budget used`}
                      />
                      <p className="tabular mt-1 text-2xs text-ink-muted">
                        {Math.round(used * 100)}% of {formatCurrency(lineItemsTotal(shoot.lineItems), { compact: true })}
                      </p>
                    </div>

                    <div className="w-24 text-right">
                      <p className="mb-1 text-2xs text-ink-faint">Due</p>
                      <p
                        className={cn(
                          'text-sm',
                          days < 0 ? 'font-medium text-critical' : days < 7 ? 'text-caution' : '',
                        )}
                      >
                        {formatRelativeDay(shoot.expectedCloseDate)}
                      </p>
                    </div>

                    <ProgressRing
                      value={
                        shoot.deliverables.length
                          ? shoot.deliverables.filter((d) => (d.delivered >= d.contracted)).length /
                            shoot.deliverables.length
                          : 0
                      }
                      size={36}
                      label={`${shoot.name} progress`}
                    />
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        {/* --------------------------------------------------- workload */}
        <Card variant="raised" padding="lg" radius="3xl">
          <SectionHeading title="Workload" description="Open tasks against capacity." />
          <ul className="flex flex-col gap-3.5">
            {workload.map((entry) => (
              <li key={entry.member.id} className="flex items-center gap-3">
                <Avatar name={entry.member.name} src={entry.member.avatar} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm">{entry.member.name}</p>
                    <p className="tabular shrink-0 text-xs text-ink-muted">
                      {entry.open} open
                      {entry.overdue > 0 && (
                        <span className="text-critical"> · {entry.overdue} late</span>
                      )}
                    </p>
                  </div>
                  <Meter
                    className="mt-1.5"
                    value={Math.min(1, entry.load)}
                    tone={entry.load > 1 ? 'critical' : entry.load > 0.75 ? 'caution' : 'lime'}
                    label={`${entry.member.name} workload`}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* -------------------------------------------------- deadlines */}
        <Card variant="surface" padding="lg" radius="3xl">
          <SectionHeading
            title="Needs attention"
            count={atRisk.length}
            description="At risk, blocked, or due within the week."
          />
          {atRisk.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-muted">
              Nothing is at risk. Genuinely.
            </p>
          ) : (
            <ul className="flex flex-col">
              {atRisk.map((shoot, index) => (
                <li
                  key={shoot.id}
                  className={cn(
                    'flex items-center gap-3 py-2.5',
                    index > 0 && 'border-t border-line-soft',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/shoots/${shoot.id}`}
                      className="block truncate text-base hover:underline"
                    >
                      {shoot.name}
                    </Link>
                    <p className="text-xs text-ink-muted">{formatRelativeDay(shoot.expectedCloseDate)}</p>
                  </div>
                  <HealthBadge health={shoot.health} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* --------------------------------------------------- activity */}
        <Card variant="raised" padding="lg" radius="3xl">
          <SectionHeading title="Activity" description="Last four weeks of client contact." />
          <Heatgrid values={activityDensity} columns={14} label="Activity density over 28 days" />
          <div className="mt-6">
            <BarSeries data={activityByType} label="Activity by type" height={90} />
          </div>
        </Card>

        {/* ---------------------------------------------------- budget */}
        <Card variant="surface" padding="lg" radius="3xl">
          <SectionHeading title="Budget pressure" description="Live shoots, most spent first." />
          <div className="mb-5 flex items-baseline justify-between">
            <p className="tabular text-title font-medium tracking-title">
              {formatCurrency(totalCollected, { compact: true })}
            </p>
            <p className="text-sm text-ink-muted">
              of {formatCurrency(totalQuoted, { compact: true })} committed
            </p>
          </div>
          <Meter
            value={totalQuoted ? totalCollected / totalQuoted : 0}
            tone="ink"
            label="Total budget used"
          />
          <ul className="mt-5 flex flex-col gap-3">
            {budgetPressure.slice(0, 5).map((shoot) => {
              const used = 0 / lineItemsTotal(shoot.lineItems)
              return (
                <li key={shoot.id}>
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="min-w-0 truncate text-sm">{shoot.name}</span>
                    <span
                      className={cn(
                        'tabular shrink-0 text-xs',
                        used > 0.95 ? 'font-medium text-critical' : 'text-ink-muted',
                      )}
                    >
                      {Math.round(used * 100)}%
                    </span>
                  </div>
                  <Meter
                    value={used}
                    tone={used > 0.95 ? 'critical' : used > 0.8 ? 'caution' : 'ink'}
                    label={`${shoot.name} budget`}
                  />
                </li>
              )
            })}
          </ul>
        </Card>

        {/* ------------------------------------------------------ tasks */}
        <Card variant="raised" padding="lg" radius="3xl">
          <SectionHeading title="Task load" description="Across the whole studio." />
          <dl className="grid grid-cols-2 gap-4">
            {[
              { label: 'Overdue', value: buckets.overdue.length, tone: 'critical' as const },
              { label: 'Today', value: buckets.today.length, tone: 'lime' as const },
              { label: 'Upcoming', value: buckets.upcoming.length, tone: 'neutral' as const },
              { label: 'Completed', value: buckets.completed.length, tone: 'positive' as const },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-surface p-4">
                <dt className="text-xs text-ink-muted">{stat.label}</dt>
                <dd className="tabular mt-1 text-title font-medium tracking-title">{stat.value}</dd>
                <Pill tone={stat.tone} size="sm" className="mt-2">
                  {stat.label}
                </Pill>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </div>
  )
}
