import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Sparkles,
  Stamp,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { isClosed } from '@/data/pipeline'
import {
  useActiveShoots,
  useActivityFeed,
  useCurrentUser,
  useOpenFollowUps,
  usePipelineSummary,
  usePriorityActions,
  useReviewQueue,
  useTaskBuckets,
  useUpcomingMilestones,
} from '@/store/selectors'
import {
  cn,
  daysFromToday,
  formatCurrency,
  formatRelativeDay,
  formatRelativeTime,
  pluralize,
} from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import {
  ActivityDot,
  LinkedRecord,
  SectionHeading,
  TaskCheck,
} from '@/components/common/records'
import { ShootCard } from '@/features/shoots/ShootCard'
import { Button, ButtonLink, Card, Meter, Pill } from '@/components/ui/primitives'
import { EmptyState, toast } from '@/components/ui/feedback'
import { PipelineBar } from '@/components/charts'

/* ============================================================================
   STUDIO TODAY
   Deliberately not a wall of charts. The order is: what needs you now, what is
   in flight, what is coming, and only then how the business is doing.
   ========================================================================== */

export default function DashboardPage() {
  const user = useCurrentUser()
  const actions = usePriorityActions(6)
  const shoots = useActiveShoots()
  const milestones = useUpcomingMilestones(5)
  const buckets = useTaskBuckets(true)
  const reviews = useReviewQueue(['pending'])
  const followUps = useOpenFollowUps()
  const pipeline = usePipelineSummary()
  const feed = useActivityFeed({}, 7)

  const firstName = user.name.split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="animate-in">
      <PageHeader
        eyebrow={new Intl.DateTimeFormat('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        }).format(new Date())}
        title={`${greeting}, ${firstName}`}
        description={summarise(buckets.overdue.length, reviews.length, milestones.length)}
        actions={
          <>
            <ButtonLink to="/tasks" icon={<CheckCircle2 size={15} />}>
              Tasks
            </ButtonLink>
            <ButtonLink to="/approvals" variant="primary" icon={<Stamp size={15} />}>
              Review queue
              {reviews.length > 0 && (
                <span className="tabular ml-1 grid h-5 min-w-5 place-items-center rounded-pill bg-lime px-1.5 text-2xs text-[#0a0a0a]">
                  {reviews.length}
                </span>
              )}
            </ButtonLink>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        {/* ---------------------------------------------- priority column */}
        <div className="flex flex-col gap-4 lg:col-span-2 lg:gap-5">
          <PriorityPanel actions={actions} />
          <ActiveShoots shoots={shoots.slice(0, 4)} />
          <RecentActivity feed={feed} />
        </div>

        {/* ------------------------------------------------- side column */}
        <div className="flex flex-col gap-4 lg:gap-5">
          <TodayTasks />
          <UpcomingPanel milestones={milestones} />
          <FollowUpsPanel followUps={followUps} />
          <PipelinePanel summary={pipeline} />
        </div>
      </div>
    </div>
  )
}

function summarise(overdue: number, reviews: number, milestones: number): string {
  const parts: string[] = []
  if (overdue) parts.push(`${pluralize(overdue, 'task')} overdue`)
  if (reviews) parts.push(`${pluralize(reviews, 'review')} waiting on you`)
  if (milestones) parts.push(`${pluralize(milestones, 'milestone')} coming up`)
  if (parts.length === 0) return 'Nothing is overdue and nothing is waiting. A rare and beautiful thing.'
  return `${parts.join(', ')}.`
}

/* ------------------------------------------------------- priority panel -- */

function PriorityPanel({ actions }: { actions: ReturnType<typeof usePriorityActions> }) {
  const URGENCY = {
    overdue: { label: 'Overdue', tone: 'critical' as const },
    today: { label: 'Today', tone: 'lime' as const },
    soon: { label: 'Soon', tone: 'neutral' as const },
  }

  return (
    <Card variant="raised" padding="lg" radius="3xl">
      <SectionHeading
        title="Do this next"
        description="Pulled from tasks, reviews, follow-ups and deadlines."
        action={
          <ButtonLink to="/tasks" variant="ghost" size="sm" iconAfter={<ArrowUpRight size={14} />}>
            All work
          </ButtonLink>
        }
      />

      {actions.length === 0 ? (
        <EmptyState
          icon={<Sparkles size={20} />}
          title="You are completely clear"
          body="No overdue work, no reviews waiting, nothing due in the next few days. Good time to start something."
          action={
            <ButtonLink to="/shoots?view=boards" variant="primary">
              Open a moodboard
            </ButtonLink>
          }
          size="sm"
        />
      ) : (
        <ul className="flex flex-col">
          {actions.map((action, index) => (
            <li key={action.id}>
              <Link
                to={action.href}
                className={cn(
                  'group flex items-center gap-3 py-3 transition-colors duration-fast',
                  index > 0 && 'border-t border-line-soft',
                )}
              >
                <Pill tone={URGENCY[action.urgency].tone} size="sm">
                  {URGENCY[action.urgency].label}
                </Pill>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body group-hover:underline">
                    {action.title}
                  </span>
                  <span className="block truncate text-sm text-ink-muted">{action.context}</span>
                </span>
                <ArrowUpRight
                  size={16}
                  className="shrink-0 text-ink-faint transition-transform duration-fast group-hover:-translate-y-0.5 group-hover:text-ink"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

/* ------------------------------------------------------ active shoots -- */

function ActiveShoots({ shoots }: { shoots: ReturnType<typeof useActiveShoots> }) {
  return (
    <section>
      <SectionHeading
        title="In flight"
        count={shoots.length}
        action={
          <ButtonLink to="/projects" variant="ghost" size="sm" iconAfter={<ArrowUpRight size={14} />}>
            All shoots
          </ButtonLink>
        }
      />

      {shoots.length === 0 ? (
        <EmptyState
          title="No active shoots"
          body="Everything is either complete or not started yet."
          size="sm"
          action={
            <ButtonLink to="/projects" variant="primary">
              Start a shoot
            </ButtonLink>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {shoots.map((shoot) => (
            <li key={shoot.id}>
              <ShootCard shoot={shoot} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/* ---------------------------------------------------------- today tasks -- */

function TodayTasks() {
  const buckets = useTaskBuckets(true)
  const toggleTask = useStore((s) => s.toggleTask)
  const list = [...buckets.overdue, ...buckets.today].slice(0, 6)

  return (
    <Card variant="surface" padding="md" radius="2xl">
      <SectionHeading
        title="Your day"
        count={buckets.overdue.length + buckets.today.length}
        action={
          <ButtonLink to="/tasks" variant="ghost" size="sm">
            Open
          </ButtonLink>
        }
      />

      {list.length === 0 ? (
        <p className="py-4 text-center text-sm text-ink-muted">
          Nothing due today. Enjoy it.
        </p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {list.map((task) => {
            const overdue = task.dueDate ? daysFromToday(task.dueDate) < 0 : false
            return (
              <li key={task.id} className="flex items-start gap-2.5 py-2">
                <TaskCheck
                  done={task.status === 'done'}
                  label={task.title}
                  onToggle={() => {
                    toggleTask(task.id)
                    toast.success('Task completed', {
                      detail: task.title,
                      action: { label: 'Undo', onClick: () => toggleTask(task.id) },
                    })
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-base leading-snug">{task.title}</p>
                  <p
                    className={cn(
                      'mt-0.5 text-xs',
                      overdue ? 'font-medium text-critical' : 'text-ink-muted',
                    )}
                  >
                    {task.dueDate ? formatRelativeDay(task.dueDate) : 'No date'}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

/* ------------------------------------------------------- upcoming panel -- */

function UpcomingPanel({ milestones }: { milestones: ReturnType<typeof useUpcomingMilestones> }) {
  return (
    <Card variant="surface" padding="md" radius="2xl">
      <SectionHeading title="Coming up" />
      {milestones.length === 0 ? (
        <p className="py-4 text-center text-sm text-ink-muted">No milestones scheduled.</p>
      ) : (
        <ul className="flex flex-col">
          {milestones.map((milestone, index) => {
            const delta = daysFromToday(milestone.date)
            return (
              <li
                key={milestone.id}
                className={cn('flex items-center gap-3 py-2.5', index > 0 && 'border-t border-line-soft')}
              >
                <span
                  className={cn(
                    'tabular grid size-10 shrink-0 place-items-center rounded-lg text-center text-2xs leading-tight font-medium',
                    delta < 0 ? 'bg-critical-wash text-critical' : 'bg-raised text-ink',
                  )}
                  aria-hidden
                >
                  {new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(
                    new Date(milestone.date),
                  )}
                  <br />
                  {new Intl.DateTimeFormat('en-US', { month: 'short' }).format(
                    new Date(milestone.date),
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/shoots/${milestone.shootId}`}
                    className="block truncate text-base hover:underline"
                  >
                    {milestone.name}
                  </Link>
                  <p className="truncate text-xs text-ink-muted">
                    {milestone.shoot?.name} · {formatRelativeDay(milestone.date)}
                  </p>
                </div>
                {milestone.status === 'missed' && <Pill tone="critical" size="sm">Missed</Pill>}
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

/* ------------------------------------------------------ follow-up panel -- */

function FollowUpsPanel({ followUps }: { followUps: ReturnType<typeof useOpenFollowUps> }) {
  const completeFollowUp = useStore((s) => s.completeFollowUp)

  return (
    <Card variant="surface" padding="md" radius="2xl">
      <SectionHeading
        title="Owed a reply"
        count={followUps.length}
        action={
          <ButtonLink to="/activity" variant="ghost" size="sm">
            Activity
          </ButtonLink>
        }
      />
      {followUps.length === 0 ? (
        <p className="py-4 text-center text-sm text-ink-muted">Nobody is waiting on you.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {followUps.slice(0, 4).map((event) => (
            <li key={event.id} className="flex items-start gap-2.5">
              <ActivityDot type={event.type} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-base leading-snug">{event.subject}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted">
                  <Clock3 size={11} aria-hidden />
                  {formatRelativeDay(event.followUpAt!)}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  completeFollowUp(event.id)
                  toast.success('Follow-up cleared')
                }}
              >
                Done
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

/* -------------------------------------------------------- pipeline card -- */

function PipelinePanel({ summary }: { summary: ReturnType<typeof usePipelineSummary> }) {
  // Everything still in play — the closed columns are not a forecast.
  const open = summary.byStage.filter((s) => !isClosed(s.kind))

  return (
    <Card variant="inverse" padding="md" radius="2xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-2xs font-medium tracking-label text-on-inverse-muted uppercase">
            Open pipeline
          </p>
          <p className="tabular mt-1 text-title font-medium tracking-display">
            {formatCurrency(summary.openValue, { compact: true })}
          </p>
        </div>
        <Link
          to="/shoots?view=board"
          aria-label="Open the pipeline"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-[#ffffff1a] transition-colors duration-fast hover:bg-[#ffffff2e]"
        >
          <ArrowUpRight size={16} aria-hidden />
        </Link>
      </div>

      <PipelineBar segments={open} className="mb-4" />

      <dl className="grid grid-cols-2 gap-y-3 text-sm">
        <div>
          <dt className="text-on-inverse-muted">Weighted</dt>
          <dd className="tabular mt-0.5 text-base">
            {formatCurrency(summary.weightedValue, { compact: true })}
          </dd>
        </div>
        <div>
          <dt className="text-on-inverse-muted">Open enquiries</dt>
          <dd className="tabular mt-0.5 text-base">{summary.openCount}</dd>
        </div>
        <div>
          <dt className="text-on-inverse-muted">Won</dt>
          <dd className="tabular mt-0.5 text-base">
            {formatCurrency(summary.wonValue, { compact: true })}
          </dd>
        </div>
        <div>
          <dt className="text-on-inverse-muted">Win rate</dt>
          <dd className="tabular mt-0.5 text-base">{Math.round(summary.winRate)}%</dd>
        </div>
      </dl>

      <div className="mt-4">
        <Meter value={summary.winRate / 100} tone="lime" label="Win rate" />
      </div>
    </Card>
  )
}

/* ------------------------------------------------------- recent updates -- */

function RecentActivity({ feed }: { feed: ReturnType<typeof useActivityFeed> }) {
  return (
    <Card variant="surface" padding="lg" radius="3xl">
      <SectionHeading
        title="Latest from the studio"
        action={
          <ButtonLink to="/activity" variant="ghost" size="sm" iconAfter={<ArrowUpRight size={14} />}>
            Everything
          </ButtonLink>
        }
      />

      {feed.length === 0 ? (
        <EmptyState
          icon={<CalendarClock size={20} />}
          title="No activity yet"
          body="Calls, emails, approvals and status changes will collect here."
          size="sm"
        />
      ) : (
        <ul className="flex flex-col">
          {feed.map((event, index) => (
            <li
              key={event.id}
              className={cn('flex items-start gap-3 py-3', index > 0 && 'border-t border-line-soft')}
            >
              <ActivityDot type={event.type} />
              <div className="min-w-0 flex-1">
                <p className="text-base leading-snug">{event.subject}</p>
                {event.body && (
                  <p className="mt-1 line-clamp-2 text-sm text-pretty text-ink-muted">
                    {event.body}
                  </p>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
                  <span>{formatRelativeTime(event.at)}</span>
                  {event.links.shootId && (
                    <LinkedRecord kind="shoot" id={event.links.shootId} size="sm" />
                  )}
                  {event.links.contactId && (
                    <LinkedRecord kind="contact" id={event.links.contactId} size="sm" />
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
