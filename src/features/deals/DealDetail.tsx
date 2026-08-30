import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Briefcase, Pencil, Plus } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useActivityFeed, useDeal, useSortedPipeline } from '@/store/selectors'
import { useUI } from '@/store/useUI'
import { cn, formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { Button, Card, Meter, Pill } from '@/components/ui/primitives'
import { Textarea } from '@/components/ui/form'
import { Menu } from '@/components/ui/overlay'
import { EmptyState, toast } from '@/components/ui/feedback'
import {
  ActivityDot,
  DueBadge,
  LinkedRecord,
  PersonCell,
  SectionHeading,
  TagList,
  TaskCheck,
} from '@/components/common/records'
import { ProjectRow } from '@/features/projects/ProjectCard'

export default function DealDetail() {
  const { id = '' } = useParams()
  const deal = useDeal(id)
  const pipeline = useSortedPipeline()
  const projects = useStore((s) => s.projects)
  const allTasks = useStore((s) => s.tasks)
  const moveDeal = useStore((s) => s.moveDeal)
  const updateDeal = useStore((s) => s.updateDeal)
  const toggleTask = useStore((s) => s.toggleTask)
  const openQuickAdd = useUI((s) => s.openQuickAdd)
  const feed = useActivityFeed({ dealId: id })

  const [editingNotes, setEditingNotes] = useState(false)
  const [draft, setDraft] = useState('')

  const tasks = useMemo(() => allTasks.filter((t) => t.dealId === id), [allTasks, id])

  if (!deal) {
    return <EmptyState title="Deal not found" body="It may have been deleted." size="lg" />
  }

  const stage = pipeline.find((s) => s.id === deal.stageId)
  const project = projects.find((p) => p.id === deal.projectId)
  const open = stage?.kind === 'open'

  return (
    <div className="animate-in">
      <PageHeader
        crumbs={[{ label: 'Pipeline', to: '/deals' }, { label: deal.name }]}
        title={deal.name}
        meta={
          <>
            <Pill
              tone={stage?.kind === 'won' ? 'positive' : stage?.kind === 'lost' ? 'critical' : 'ink'}
              size="md"
            >
              {stage?.name}
            </Pill>
            <LinkedRecord kind="company" id={deal.companyId} />
            <LinkedRecord kind="contact" id={deal.contactId} />
            <Pill tone="neutral" size="md">
              {deal.source}
            </Pill>
          </>
        }
        actions={
          <>
            <Menu
              label="Move to stage"
              items={pipeline
                .filter((s) => s.id !== deal.stageId)
                .map((s) => ({
                  label: `Move to ${s.name}`,
                  onSelect: () => {
                    moveDeal(deal.id, s.id)
                    toast.success(`Moved to ${s.name}`)
                  },
                }))}
              trigger={({ onClick, ...rest }) => (
                <Button onClick={onClick} {...rest}>
                  Move stage
                </Button>
              )}
            />
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => openQuickAdd('task')}>
              Add task
            </Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-5">
          {/* ------------------------------------------------------ money */}
          <Card variant="raised" padding="lg" radius="3xl">
            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <p className="eyebrow mb-1.5">Value</p>
                <p className="tabular text-display font-medium tracking-display">
                  {formatCurrency(deal.value, { compact: true })}
                </p>
              </div>
              <div>
                <p className="eyebrow mb-1.5">Probability</p>
                <p className="tabular text-xl font-medium">{deal.probability}%</p>
                <Meter className="mt-2" value={deal.probability / 100} tone="lime" label="Probability" />
              </div>
              <div>
                <p className="eyebrow mb-1.5">{open ? 'Weighted' : 'Outcome'}</p>
                <p className="tabular text-xl font-medium">
                  {open
                    ? formatCurrency((deal.value * deal.probability) / 100, { compact: true })
                    : stage?.kind === 'won'
                      ? 'Won'
                      : 'Lost'}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  {deal.closedAt
                    ? `Closed ${formatDate(deal.closedAt)}`
                    : `Expected ${formatDate(deal.expectedCloseDate)}`}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <DueBadge date={deal.expectedCloseDate} done={!open} size="md" prefix="Close" />
              <TagList ids={deal.tags} size="md" />
            </div>
          </Card>

          {/* ------------------------------------------------------ notes */}
          <Card variant="raised" padding="lg" radius="2xl">
            <SectionHeading
              title="Notes"
              action={
                !editingNotes && (
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Pencil size={13} />}
                    onClick={() => {
                      setDraft(deal.notes)
                      setEditingNotes(true)
                    }}
                  >
                    Edit
                  </Button>
                )
              }
            />
            {editingNotes ? (
              <div className="flex flex-col gap-2">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={5}
                  aria-label="Deal notes"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditingNotes(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      updateDeal(deal.id, { notes: draft })
                      setEditingNotes(false)
                      toast.success('Notes saved')
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : deal.notes ? (
              <p className="max-w-prose text-body leading-relaxed text-pretty text-ink-muted">
                {deal.notes}
              </p>
            ) : (
              <p className="text-sm text-ink-faint">
                Nothing recorded yet. What is actually going on with this one?
              </p>
            )}
          </Card>

          {/* --------------------------------------------------- activity */}
          <Card variant="surface" padding="lg" radius="2xl">
            <SectionHeading
              title="History"
              count={feed.length}
              action={
                <Button size="sm" onClick={() => openQuickAdd('log')}>
                  Log
                </Button>
              }
            />
            {feed.length === 0 ? (
              <p className="py-4 text-center text-sm text-ink-muted">
                Nothing logged against this deal yet.
              </p>
            ) : (
              <ul className="flex flex-col">
                {feed.map((event, index) => (
                  <li
                    key={event.id}
                    className={cn(
                      'flex items-start gap-3 py-3',
                      index > 0 && 'border-t border-line-soft',
                    )}
                  >
                    <ActivityDot type={event.type} />
                    <div className="min-w-0 flex-1">
                      <p className="text-base leading-snug">{event.subject}</p>
                      {event.body && (
                        <p className="mt-1 text-sm text-pretty text-ink-muted">{event.body}</p>
                      )}
                      <p className="mt-1 text-xs text-ink-faint">{formatRelativeTime(event.at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* ------------------------------------------------------- side */}
        <div className="flex flex-col gap-5">
          <Card variant="raised" padding="md" radius="2xl">
            <SectionHeading title="People" />
            <div className="flex flex-col gap-4">
              <div>
                <p className="eyebrow mb-2">Client</p>
                <PersonCell id={deal.contactId} kind="contact" size="md" />
              </div>
              <div>
                <p className="eyebrow mb-2">Owner</p>
                <PersonCell id={deal.ownerId} kind="team" size="md" />
              </div>
            </div>
          </Card>

          <Card variant="surface" padding="md" radius="2xl">
            <SectionHeading title="Tasks" count={tasks.length} />
            {tasks.length === 0 ? (
              <p className="py-3 text-sm text-ink-muted">No tasks linked to this deal.</p>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {tasks.map((task) => (
                  <li key={task.id} className="flex items-start gap-2.5 py-2">
                    <TaskCheck
                      done={task.status === 'done'}
                      label={task.title}
                      onToggle={() => toggleTask(task.id)}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'text-base leading-snug',
                          task.status === 'done' && 'text-ink-muted line-through',
                        )}
                      >
                        {task.title}
                      </p>
                      <DueBadge date={task.dueDate} done={task.status === 'done'} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card variant="surface" padding="md" radius="2xl">
            <SectionHeading title="Resulting project" />
            {project ? (
              <ProjectRow project={project} />
            ) : (
              <EmptyState
                icon={<Briefcase size={18} />}
                title="No project yet"
                body={
                  stage?.kind === 'won'
                    ? 'This deal is won — time to open the project.'
                    : 'A project gets created once this is won.'
                }
                size="sm"
                className="border-0 px-0"
                action={
                  stage?.kind === 'won' ? (
                    <Button variant="primary" size="sm" onClick={() => openQuickAdd('project')}>
                      Create the project
                    </Button>
                  ) : undefined
                }
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
