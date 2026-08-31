import { useMemo, useState } from 'react'
import { CheckCircle2, ListTodo, Plus, Trash2 } from 'lucide-react'
import type { Task, TaskPriority } from '@/data/types'
import { useStore } from '@/store/useStore'
import { useActiveTeam, useTaskBuckets } from '@/store/selectors'
import { cn, formatRelativeDay, formatRelativeTime, matches, pluralize } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { Button, Card, Chip, IconButton, Pill, SegmentedControl } from '@/components/ui/primitives'
import { SearchInput } from '@/components/ui/form'
import { Avatar } from '@/components/ui/Avatar'
import { Menu } from '@/components/ui/overlay'
import { EmptyState, NoResults, toast } from '@/components/ui/feedback'
import { DueBadge, LinkedRecord, PriorityBadge, TaskCheck } from '@/components/common/records'

/* ============================================================================
   TASKS
   Four buckets, a one-line quick add, one-tap complete with undo, and bulk
   actions on selection. Nothing here should take more than a second.
   ========================================================================== */

type Bucket = 'today' | 'upcoming' | 'overdue' | 'completed'

export default function TasksPage() {
  const [bucket, setBucket] = useState<Bucket>('today')
  const [mineOnly, setMineOnly] = useState(true)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string[]>([])

  const buckets = useTaskBuckets(mineOnly)
  const allBuckets = useTaskBuckets(false)
  const team = useActiveTeam()
  const shoots = useStore((s) => s.shoots)
  const addTask = useStore((s) => s.addTask)
  const toggleTask = useStore((s) => s.toggleTask)
  const deleteTask = useStore((s) => s.deleteTask)
  const updateTask = useStore((s) => s.updateTask)
  const bulkUpdateTasks = useStore((s) => s.bulkUpdateTasks)
  const currentUserId = useStore((s) => s.settings.currentUserId)

  const [draft, setDraft] = useState('')
  const [draftProject, setDraftProject] = useState('')

  const list = useMemo(() => {
    const source =
      bucket === 'today'
        ? [...buckets.today, ...buckets.someday]
        : bucket === 'upcoming'
          ? buckets.upcoming
          : bucket === 'overdue'
            ? buckets.overdue
            : buckets.completed
    return query ? source.filter((t) => matches(t.title, query)) : source
  }, [bucket, buckets, query])

  function quickAdd(event: React.FormEvent) {
    event.preventDefault()
    if (!draft.trim()) return
    addTask({
      title: draft.trim(),
      shootId: draftProject || undefined,
      dueDate:
        bucket === 'today' || bucket === 'overdue'
          ? new Date().toISOString().slice(0, 10)
          : undefined,
      assigneeId: currentUserId,
    })
    setDraft('')
    toast.success('Task added')
  }

  function complete(task: Task) {
    toggleTask(task.id)
    toast.success(task.status === 'done' ? 'Marked as not done' : 'Task completed', {
      detail: task.title,
      action: { label: 'Undo', onClick: () => toggleTask(task.id) },
    })
  }

  const counts = mineOnly ? buckets : allBuckets

  return (
    <div className="animate-in">
      <PageHeader
        eyebrow="Work"
        title="Tasks"
        description="Everything the studio owes itself and its clients, in the order it matters."
        actions={
          <>
            <SegmentedControl
              value={mineOnly ? 'mine' : 'all'}
              onChange={(v) => setMineOnly(v === 'mine')}
              segments={[
                { value: 'mine', label: 'Mine' },
                { value: 'all', label: 'Everyone' },
              ]}
              label="Whose tasks"
              size="sm"
            />
          </>
        }
      />

      {/* -------------------------------------------------------- buckets */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-0.5">
          {(
            [
              { id: 'today' as const, label: 'Today', count: counts.today.length + counts.someday.length },
              { id: 'overdue' as const, label: 'Overdue', count: counts.overdue.length },
              { id: 'upcoming' as const, label: 'Upcoming', count: counts.upcoming.length },
              { id: 'completed' as const, label: 'Completed', count: counts.completed.length },
            ] as const
          ).map((item) => (
            <Chip key={item.id} selected={bucket === item.id} onClick={() => setBucket(item.id)}>
              {item.label}
              <span
                className={cn(
                  'tabular ml-0.5',
                  bucket === item.id ? 'text-on-inverse-muted' : 'text-ink-faint',
                  item.id === 'overdue' && item.count > 0 && bucket !== item.id && 'text-critical',
                )}
              >
                {item.count}
              </span>
            </Chip>
          ))}
        </div>

        <SearchInput
          value={query}
          onChange={setQuery}
          label="Search tasks"
          placeholder="Search tasks"
          className="ml-auto min-w-0 flex-1 sm:max-w-64"
        />
      </div>

      {/* ------------------------------------------------------ quick add */}
      {bucket !== 'completed' && (
        <Card variant="raised" padding="sm" radius="xl" className="mb-4">
          <form onSubmit={quickAdd} className="flex flex-wrap items-center gap-2">
            <label htmlFor="task-quick" className="sr-only-focusable absolute">
              Add a task
            </label>
            <Plus size={16} className="ml-1.5 shrink-0 text-ink-faint" aria-hidden />
            <input
              id="task-quick"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a task and press enter"
              className="h-9 min-w-40 flex-1 bg-transparent text-base outline-none placeholder:text-ink-faint"
            />
            <select
              value={draftProject}
              onChange={(e) => setDraftProject(e.target.value)}
              aria-label="Link to a shoot"
              className="h-9 rounded-pill bg-surface px-3 text-sm text-ink-muted"
            >
              <option value="">No shoot</option>
              {shoots
                .filter((p) => !p.archived)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
            <Button type="submit" variant="primary" size="sm" disabled={!draft.trim()}>
              Add
            </Button>
          </form>
        </Card>
      )}

      {/* ---------------------------------------------------- bulk bar */}
      {selected.length > 0 && (
        <Card
          variant="inverse"
          padding="sm"
          radius="2xl"
          className="animate-in sticky top-20 z-10 mb-4 flex flex-wrap items-center gap-2 px-4"
        >
          <span className="text-sm">{pluralize(selected.length, 'task')} selected</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Menu
              label="Reassign selected tasks"
              items={team.map((member) => ({
                label: `Assign to ${member.name}`,
                onSelect: () => {
                  bulkUpdateTasks(selected, { assigneeId: member.id })
                  toast.success(`${pluralize(selected.length, 'task')} reassigned`)
                  setSelected([])
                },
              }))}
              trigger={({ onClick, ...rest }) => (
                <Button size="sm" variant="secondary" onClick={onClick} {...rest}>
                  Assign
                </Button>
              )}
            />
            <Menu
              label="Set priority on selected tasks"
              items={(['urgent', 'high', 'normal', 'low'] as TaskPriority[]).map((priority) => ({
                label: priority.charAt(0).toUpperCase() + priority.slice(1),
                onSelect: () => {
                  bulkUpdateTasks(selected, { priority })
                  toast.success('Priority updated')
                  setSelected([])
                },
              }))}
              trigger={({ onClick, ...rest }) => (
                <Button size="sm" variant="secondary" onClick={onClick} {...rest}>
                  Priority
                </Button>
              )}
            />
            <Button
              size="sm"
              variant="accent"
              icon={<CheckCircle2 size={14} />}
              onClick={() => {
                bulkUpdateTasks(selected, { status: 'done', completedAt: new Date().toISOString() })
                toast.success(`${pluralize(selected.length, 'task')} completed`)
                setSelected([])
              }}
            >
              Complete
            </Button>
            <Button size="sm" variant="ghost" className="text-on-inverse" onClick={() => setSelected([])}>
              Clear
            </Button>
          </div>
        </Card>
      )}

      {/* ---------------------------------------------------------- list */}
      {list.length === 0 ? (
        query ? (
          <NoResults query={query} onClear={() => setQuery('')} entity="tasks" />
        ) : (
          <EmptyState
            icon={bucket === 'overdue' ? <CheckCircle2 size={20} /> : <ListTodo size={20} />}
            title={EMPTY_COPY[bucket].title}
            body={EMPTY_COPY[bucket].body}
            size="lg"
          />
        )
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((task) => {
            const assignee = team.find((m) => m.id === task.assigneeId)
            const isSelected = selected.includes(task.id)
            return (
              <li key={task.id}>
                <Card
                  variant="raised"
                  padding="sm"
                  radius="xl"
                  className={cn(
                    'group flex items-start gap-3 transition-shadow duration-base hover:shadow-md',
                    isSelected && 'ring-2 ring-ink',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) =>
                      setSelected((current) =>
                        e.target.checked
                          ? [...current, task.id]
                          : current.filter((id) => id !== task.id),
                      )
                    }
                    aria-label={`Select ${task.title}`}
                    className="mt-1 size-4 shrink-0 cursor-pointer accent-[#0a0a0a] opacity-0 transition-opacity duration-fast group-hover:opacity-100 focus-visible:opacity-100 checked:opacity-100"
                  />

                  <TaskCheck
                    done={task.status === 'done'}
                    label={task.title}
                    onToggle={() => complete(task)}
                  />

                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'text-body leading-snug',
                        task.status === 'done' && 'text-ink-muted line-through',
                      )}
                    >
                      {task.title}
                    </p>
                    {task.detail && (
                      <p className="mt-1 text-sm text-pretty text-ink-muted">{task.detail}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <PriorityBadge priority={task.priority} />
                      {task.status === 'done' && task.completedAt ? (
                        <Pill tone="positive" size="sm">
                          Done {formatRelativeTime(task.completedAt)}
                        </Pill>
                      ) : (
                        <DueBadge date={task.dueDate} />
                      )}
                      {task.shootId && <LinkedRecord kind="shoot" id={task.shootId} size="sm" />}
                      {task.contactId && <LinkedRecord kind="contact" id={task.contactId} size="sm" />}
                      {task.reminderAt && (
                        <Pill tone="lime" size="sm">
                          Reminder {formatRelativeDay(task.reminderAt)}
                        </Pill>
                      )}
                    </div>
                  </div>

                  {assignee && (
                    <Menu
                      label={`Reassign ${task.title}`}
                      items={team.map((member) => ({
                        label: member.name,
                        selected: member.id === task.assigneeId,
                        onSelect: () => {
                          updateTask(task.id, { assigneeId: member.id })
                          toast.show(`Assigned to ${member.name}`)
                        },
                      }))}
                      trigger={({ onClick, ...rest }) => (
                        <button
                          type="button"
                          onClick={onClick}
                          aria-label={`Assigned to ${assignee.name}. Reassign.`}
                          className="shrink-0"
                          {...rest}
                        >
                          <Avatar name={assignee.name} src={assignee.avatar} size="sm" />
                        </button>
                      )}
                    />
                  )}

                  <IconButton
                    label={`Delete ${task.title}`}
                    size="sm"
                    variant="ghost"
                    className="opacity-0 transition-opacity duration-fast group-hover:opacity-100 focus-visible:opacity-100"
                    onClick={() => {
                      const snapshot = { ...task }
                      deleteTask(task.id)
                      toast.show('Task deleted', {
                        action: {
                          label: 'Undo',
                          onClick: () => useStore.getState().addTask(snapshot),
                        },
                      })
                    }}
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

const EMPTY_COPY: Record<Bucket, { title: string; body: string }> = {
  today: {
    title: 'Nothing due today',
    body: 'Either you are ahead, or something needs a date. Add one above and it will show up here.',
  },
  overdue: {
    title: 'Nothing overdue',
    body: 'Everything with a date on it is still in the future. Enjoy the rare feeling.',
  },
  upcoming: {
    title: 'Nothing scheduled ahead',
    body: 'The week is clear. A good moment to plan the next stretch of work.',
  },
  completed: {
    title: 'Nothing completed yet',
    body: 'Finished tasks collect here, so you can see what the week actually contained.',
  },
}
