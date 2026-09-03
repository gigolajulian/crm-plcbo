import { useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  Activity as ActivityIcon,
  CheckSquare,
  FileText,
  Images,
  Plus,
  Stamp,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import {
  shootEnd,
  shootStart,
  useActivityFeed,
  useShoot,
  useShootVitals,
  useSortedPipeline,
} from '@/store/selectors'
import { useUI } from '@/store/useUI'
import {
  cn,
  daysFromToday,
  formatCurrency,
  formatDate,
  formatRelativeTime,
  sum,
} from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { Img } from '@/components/common/Img'
import {
  ActivityDot,
  DueBadge,
  LinkedRecord,
  SectionHeading,
  TagList,
  TaskCheck,
} from '@/components/common/records'
import { Button, Card, Meter, Pill, ProgressRing } from '@/components/ui/primitives'
import { Avatar, AvatarStack } from '@/components/ui/Avatar'
import { Tabs, TabPanel } from '@/components/ui/Tabs'
import { Menu } from '@/components/ui/overlay'
import { EmptyState, toast } from '@/components/ui/feedback'
import { MoodboardCanvas } from '@/features/moodboard/MoodboardCanvas'
import { ReviewRoom } from '@/features/approvals/ReviewRoom'
import { ShootBrief } from './ShootBrief'

type Tab = 'overview' | 'moodboard' | 'tasks' | 'work' | 'activity'

const HEALTH_LABELS = {
  'on-track': 'On track',
  'at-risk': 'At risk',
  blocked: 'Blocked',
} as const

export default function ShootDetail() {
  const { id = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const shoot = useShoot(id)
  const vitals = useShootVitals(id)

  const allTasks = useStore((s) => s.tasks)
  const allAssets = useStore((s) => s.assets)
  // Filtering inside a zustand selector returns a new array on every render,
  // which sends useSyncExternalStore into a loop. Derive with useMemo instead.
  const tasks = useMemo(() => allTasks.filter((t) => t.shootId === id), [allTasks, id])
  const assets = useMemo(() => allAssets.filter((a) => a.shootId === id), [allAssets, id])
  const moodItems = useStore((s) => s.moodItems)
  const boards = useStore((s) => s.moodboards)
  const moveShoot = useStore((s) => s.moveShoot)
  const pipeline = useSortedPipeline()
  const updateShoot = useStore((s) => s.updateShoot)

  const tab = (params.get('tab') as Tab) ?? 'overview'
  function setTab(next: Tab) {
    setParams((current) => {
      const updated = new URLSearchParams(current)
      updated.set('tab', next)
      return updated
    })
  }

  if (!shoot) {
    return (
      <EmptyState
        title="Shoot not found"
        body="It may have been deleted, or the link may be out of date."
        size="lg"
      />
    )
  }

  const board = boards.find((b) => b.shootId === shoot.id)
  const referenceCount = board ? moodItems.filter((i) => i.boardId === board.id).length : 0
  const openTasks = tasks.filter((t) => t.status !== 'done').length

  return (
    <div className="animate-in">
      <PageHeader
        crumbs={[
          { label: 'Shoots', to: '/shoots' },
          { label: shoot.name },
        ]}
        title={shoot.name}
        description={shoot.summary}
        meta={
          <>
            <Pill tone="neutral">{shoot.code}</Pill>
            <DueBadge
              date={vitals.nextShootDate ?? shoot.expectedCloseDate}
              size="md"
              prefix={vitals.nextShootDate ? 'Shoots' : 'Closes'}
            />
            <LinkedRecord kind="company" id={shoot.companyId} />
            <LinkedRecord kind="contact" id={shoot.contactId} />
          </>
        }
        actions={
          <>
            <Menu
              label="Change stage"
              items={pipeline.map((stage) => ({
                label: stage.name,
                selected: stage.id === shoot.stageId,
                onSelect: () => {
                  moveShoot(shoot.id, stage.id)
                  toast.success(`Moved to ${stage.name}`)
                },
              }))}
              trigger={({ onClick, ...rest }) => (
                <Button onClick={onClick} {...rest}>
                  Stage: {pipeline.find((s) => s.id === shoot.stageId)?.name ?? 'Unset'}
                </Button>
              )}
            />
            <Menu
              label="Change health"
              items={(['on-track', 'at-risk', 'blocked'] as const).map((health) => ({
                label: HEALTH_LABELS[health],
                selected: health === shoot.health,
                onSelect: () => {
                  updateShoot(shoot.id, { health })
                  toast.show('Health updated')
                },
              }))}
              trigger={({ onClick, ...rest }) => (
                <Button onClick={onClick} {...rest}>
                  Health: {HEALTH_LABELS[shoot.health]}
                </Button>
              )}
            />
            <AddTaskButton />
          </>
        }
      />

      {/* -------------------------------------------------------- hero */}
      <Card variant="raised" padding="none" radius="3xl" className="mb-6 overflow-hidden">
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1.4fr_1fr]">
          <Img
            src={shoot.coverUrl}
            seed={shoot.artSeed}
            alt={`Cover for ${shoot.name}`}
            ratio={16 / 9}
            eager
            className="w-full lg:h-full"
          />
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 p-6 sm:grid-cols-3 lg:grid-cols-2 lg:p-7">
            <Vital label="Progress">
              <div className="flex items-center gap-2.5">
                <ProgressRing value={vitals.progress} size={36} />
                <span className="text-sm text-ink-muted">
                  {sum(shoot.deliverables.map((d) => d.delivered))} of{' '}
                  {sum(shoot.deliverables.map((d) => d.contracted))} files
                </span>
              </div>
            </Vital>

            <Vital label="Collected">
              <p className="tabular text-lg font-medium">
                {formatCurrency(vitals.money.received, { compact: true })}
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                of {formatCurrency(vitals.money.quoted, { compact: true })} quoted
              </p>
              <Meter
                className="mt-2"
                value={vitals.collected}
                tone={vitals.money.overdue.length > 0 ? 'critical' : vitals.collected >= 1 ? 'lime' : 'ink'}
                label="Share of the quote collected"
              />
            </Vital>

            <Vital label="Timeline">
              <p className="text-lg font-medium">
                {vitals.daysRemaining < 0
                  ? `${Math.abs(vitals.daysRemaining)}d over`
                  : `${vitals.daysRemaining}d left`}
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                {formatDate(shootStart(shoot), 'short')} → {formatDate(shootEnd(shoot), 'short')}
              </p>
            </Vital>

            <Vital label="Next milestone">
              {vitals.nextMilestone ? (
                <>
                  <p className="truncate text-base">{vitals.nextMilestone.name}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {formatDate(vitals.nextMilestone.date, 'day')}
                  </p>
                </>
              ) : (
                <p className="text-sm text-ink-muted">Nothing scheduled</p>
              )}
            </Vital>

            <Vital label="Team">
              <ShootTeam shootId={shoot.id} />
            </Vital>

            <Vital label="Tags">
              {shoot.tags.length > 0 ? (
                <TagList ids={shoot.tags} />
              ) : (
                <p className="text-sm text-ink-muted">None</p>
              )}
            </Vital>
          </div>
        </div>
      </Card>

      {/* -------------------------------------------------------- tabs */}
      <Tabs
        value={tab}
        onChange={setTab}
        label="Shoot sections"
        className="mb-6"
        items={[
          { value: 'overview', label: 'Brief', icon: <FileText size={14} /> },
          { value: 'moodboard', label: 'Moodboard', icon: <Images size={14} />, count: referenceCount },
          { value: 'tasks', label: 'Tasks', icon: <CheckSquare size={14} />, count: openTasks },
          { value: 'work', label: 'Work & approvals', icon: <Stamp size={14} />, count: vitals.awaitingApproval },
          { value: 'activity', label: 'Activity', icon: <ActivityIcon size={14} /> },
        ]}
      />

      <TabPanel when="overview" value={tab}>
        <ShootBrief shoot={shoot} />
      </TabPanel>

      <TabPanel when="moodboard" value={tab}>
        <MoodboardCanvas shootId={shoot.id} />
      </TabPanel>

      <TabPanel when="tasks" value={tab}>
        <ShootTasks shootId={shoot.id} />
      </TabPanel>

      <TabPanel when="work" value={tab}>
        <ReviewRoom shootId={shoot.id} assetIds={assets.map((a) => a.id)} />
      </TabPanel>

      <TabPanel when="activity" value={tab}>
        <ShootActivity shootId={shoot.id} />
      </TabPanel>
    </div>
  )
}

/* ---------------------------------------------------------------- parts -- */

function Vital({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="eyebrow mb-1.5">{label}</p>
      {children}
    </div>
  )
}

function ShootTeam({ shootId }: { shootId: string }) {
  const shoot = useShoot(shootId)
  const team = useStore((s) => s.team)
  if (!shoot) return null
  const members = team.filter((m) => shoot.memberIds.includes(m.id))
  const lead = team.find((m) => m.id === shoot.ownerId)

  return (
    <div className="flex items-center gap-2.5">
      <AvatarStack
        people={members.map((m) => ({ id: m.id, name: m.name, avatar: m.avatar }))}
        max={4}
        size="sm"
      />
      {lead && <span className="truncate text-xs text-ink-muted">{lead.name} leads</span>}
    </div>
  )
}

function AddTaskButton() {
  const openQuickAdd = useUI((s) => s.openQuickAdd)
  return (
    <Button variant="primary" icon={<Plus size={16} />} onClick={() => openQuickAdd('task')}>
      Add task
    </Button>
  )
}

/* ---------------------------------------------------------------- tasks -- */

function ShootTasks({ shootId }: { shootId: string }) {
  const tasks = useStore((s) => s.tasks)
  const team = useStore((s) => s.team)
  const toggleTask = useStore((s) => s.toggleTask)
  const addTask = useStore((s) => s.addTask)
  const [draft, setDraft] = useState('')

  const mine = tasks.filter((t) => t.shootId === shootId)
  const open = mine.filter((t) => t.status !== 'done')
  const done = mine.filter((t) => t.status === 'done')

  function quickAdd(event: React.FormEvent) {
    event.preventDefault()
    if (!draft.trim()) return
    addTask({ title: draft.trim(), shootId })
    toast.success('Task added')
    setDraft('')
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
      <div>
        <Card variant="raised" padding="md" radius="2xl" className="mb-4">
          <form onSubmit={quickAdd} className="flex items-center gap-2">
            <label htmlFor="shoot-task" className="sr-only-focusable absolute">
              Add a task to this shoot
            </label>
            <input
              id="shoot-task"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a task and press enter"
              className="h-10 w-full bg-transparent text-base outline-none placeholder:text-ink-faint"
            />
            <Button type="submit" variant="primary" size="sm" disabled={!draft.trim()}>
              Add
            </Button>
          </form>
        </Card>

        <SectionHeading title="Open" count={open.length} />
        {open.length === 0 ? (
          <EmptyState title="Nothing open" body="Every task on this shoot is done." size="sm" />
        ) : (
          <ul className="flex flex-col gap-2">
            {open.map((task) => {
              const assignee = team.find((m) => m.id === task.assigneeId)
              return (
                <li key={task.id}>
                  <Card variant="raised" padding="sm" radius="xl" className="flex items-start gap-3">
                    <TaskCheck
                      done={false}
                      label={task.title}
                      onToggle={() => {
                        toggleTask(task.id)
                        toast.success('Task completed', {
                          action: { label: 'Undo', onClick: () => toggleTask(task.id) },
                        })
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-base leading-snug">{task.title}</p>
                      {task.detail && (
                        <p className="mt-1 text-sm text-pretty text-ink-muted">{task.detail}</p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <DueBadge date={task.dueDate} />
                        {task.priority === 'urgent' && <Pill tone="critical" size="sm">Urgent</Pill>}
                        {task.priority === 'high' && <Pill tone="caution" size="sm">High</Pill>}
                      </div>
                    </div>
                    {assignee && <Avatar name={assignee.name} src={assignee.avatar} size="sm" />}
                  </Card>
                </li>
              )
            })}
          </ul>
        )}

        {done.length > 0 && (
          <>
            <SectionHeading title="Completed" count={done.length} className="mt-8" />
            <ul className="flex flex-col gap-1.5">
              {done.map((task) => (
                <li key={task.id} className="flex items-center gap-3 px-1 py-1.5">
                  <TaskCheck done label={task.title} onToggle={() => toggleTask(task.id)} />
                  <span className="min-w-0 flex-1 truncate text-base text-ink-muted line-through">
                    {task.title}
                  </span>
                  {task.completedAt && (
                    <span className="shrink-0 text-xs text-ink-faint">
                      {formatRelativeTime(task.completedAt)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <ShootMilestones shootId={shootId} />
    </div>
  )
}

/* ----------------------------------------------------------- milestones -- */

function ShootMilestones({ shootId }: { shootId: string }) {
  const allMilestones = useStore((s) => s.milestones)
  const updateMilestone = useStore((s) => s.updateMilestone)
  const sorted = useMemo(
    () =>
      allMilestones
        .filter((m) => m.shootId === shootId)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [allMilestones, shootId],
  )

  return (
    <Card variant="surface" padding="md" radius="2xl" className="h-fit">
      <SectionHeading title="Milestones" count={sorted.length} />
      {sorted.length === 0 ? (
        <p className="py-4 text-center text-sm text-ink-muted">No milestones yet.</p>
      ) : (
        <ol className="relative flex flex-col">
          {sorted.map((milestone, index) => {
            const delta = daysFromToday(milestone.date)
            const done = milestone.status === 'done'
            return (
              <li key={milestone.id} className="relative flex gap-3 pb-5 last:pb-0">
                {index < sorted.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute top-5 bottom-0 left-[7px] w-px bg-line"
                  />
                )}
                <span
                  aria-hidden
                  className={cn(
                    'relative z-10 mt-1.5 size-3.5 shrink-0 rotate-45 rounded-[2px]',
                    done
                      ? 'bg-ink'
                      : milestone.status === 'missed'
                        ? 'bg-critical'
                        : 'bg-raised ring-1 ring-line-strong',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className={cn('text-base leading-snug', done && 'text-ink-muted line-through')}>
                    {milestone.name}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {formatDate(milestone.date, 'day')}
                    {!done && delta < 0 && (
                      <span className="text-critical"> · {Math.abs(delta)} days late</span>
                    )}
                  </p>
                  {milestone.note && (
                    <p className="mt-1 text-xs text-pretty text-ink-faint">{milestone.note}</p>
                  )}
                  {!done && (
                    <button
                      type="button"
                      onClick={() => {
                        updateMilestone(milestone.id, { status: 'done' })
                        toast.success('Milestone marked done')
                      }}
                      className="mt-1.5 text-xs font-medium text-ink underline-offset-2 hover:underline"
                    >
                      Mark as met
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </Card>
  )
}

/* ------------------------------------------------------------- activity -- */

function ShootActivity({ shootId }: { shootId: string }) {
  const feed = useActivityFeed({ shootId })
  const openQuickAdd = useUI((s) => s.openQuickAdd)

  if (feed.length === 0) {
    return (
      <EmptyState
        icon={<ActivityIcon size={20} />}
        title="No activity on this shoot yet"
        body="Calls, emails, approvals and status changes appear here as they happen."
        action={
          <Button variant="primary" onClick={() => openQuickAdd('log')}>
            Log something
          </Button>
        }
      />
    )
  }

  return (
    <Card variant="raised" padding="lg" radius="2xl">
      <SectionHeading
        title="Everything that happened"
        count={feed.length}
        action={
          <Button size="sm" onClick={() => openQuickAdd('log')}>
            Log
          </Button>
        }
      />
      <ul className="flex flex-col">
        {feed.map((event, index) => (
          <li
            key={event.id}
            className={cn('flex items-start gap-3 py-3.5', index > 0 && 'border-t border-line-soft')}
          >
            <ActivityDot type={event.type} />
            <div className="min-w-0 flex-1">
              <p className="text-base leading-snug">{event.subject}</p>
              {event.body && (
                <p className="mt-1 text-sm text-pretty text-ink-muted">{event.body}</p>
              )}
              <p className="mt-1.5 text-xs text-ink-faint">{formatRelativeTime(event.at)}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
