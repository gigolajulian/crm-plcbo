import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Mail, MapPin, Pencil, Phone, Plus, Star } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useActivityFeed, useContact } from '@/store/selectors'
import { useUI } from '@/store/useUI'
import { cn, formatRelativeDay, formatRelativeTime } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { Button, Card, Pill } from '@/components/ui/primitives'
import { Avatar } from '@/components/ui/Avatar'
import { Textarea } from '@/components/ui/form'
import { EmptyState, toast } from '@/components/ui/feedback'
import {
  ActivityDot,
  DueBadge,
  LinkedRecord,
  SectionHeading,
  TagList,
  TaskCheck,
} from '@/components/common/records'
import { ShootRow } from '@/features/shoots/ShootCard'

export default function ContactDetail() {
  const { id = '' } = useParams()
  const contact = useContact(id)
  const company = useStore((s) => s.companies.find((c) => c.id === contact?.companyId))
  const allProjects = useStore((s) => s.shoots)
  const allTasks = useStore((s) => s.tasks)
  const updateContact = useStore((s) => s.updateContact)
  const toggleTask = useStore((s) => s.toggleTask)
  const openQuickAdd = useUI((s) => s.openQuickAdd)
  const feed = useActivityFeed({ contactId: id })

  const [editing, setEditing] = useState<'notes' | 'prefs' | null>(null)
  const [draft, setDraft] = useState('')

  const contactShoots = useMemo(
    () => allProjects.filter((p) => p.contactId === id),
    [allProjects, id],
  )
  const tasks = useMemo(() => allTasks.filter((t) => t.contactId === id), [allTasks, id])

  if (!contact) {
    return <EmptyState title="Client not found" body="They may have been removed." size="lg" />
  }

  function save(field: 'notes' | 'creativePrefs') {
    updateContact(id, { [field]: draft })
    setEditing(null)
    toast.success('Saved')
  }

  return (
    <div className="animate-in">
      <PageHeader
        crumbs={[{ label: 'Clients', to: '/contacts' }, { label: contact.name }]}
        title={contact.name}
        description={`${contact.role}${company ? ` at ${company.name}` : ''}`}
        meta={
          <>
            <LinkedRecord kind="company" id={contact.companyId} />
            {contact.location && (
              <span className="flex items-center gap-1.5 text-sm text-ink-muted">
                <MapPin size={13} aria-hidden />
                {contact.location}
              </span>
            )}
            <Pill tone={contact.favourite ? 'lime' : 'neutral'}>
              Last spoke {formatRelativeDay(contact.lastTouchedAt)}
            </Pill>
          </>
        }
        actions={
          <>
            <Button
              icon={<Star size={15} className={cn(contact.favourite && 'fill-lime text-lime-deep')} />}
              onClick={() => updateContact(id, { favourite: !contact.favourite })}
            >
              {contact.favourite ? 'Favourite' : 'Add to favourites'}
            </Button>
            <Button onClick={() => openQuickAdd('log')}>Log contact</Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => openQuickAdd('task')}>
              Add task
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.6fr]">
        {/* ------------------------------------------------------ profile */}
        <div className="flex flex-col gap-5">
          <Card variant="raised" padding="lg" radius="3xl">
            <div className="flex flex-col items-start gap-4">
              <Avatar name={contact.name} src={contact.avatar} size="xl" />
              <div>
                <h2 className="text-xl font-medium tracking-title">{contact.name}</h2>
                <p className="text-base text-ink-muted">{contact.role}</p>
              </div>
              <TagList ids={contact.tags} size="md" />
            </div>

            <dl className="mt-6 flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-2.5">
                <dt className="sr-only-focusable absolute">Email</dt>
                <Mail size={15} className="shrink-0 text-ink-faint" aria-hidden />
                <dd className="min-w-0">
                  <a
                    href={`mailto:${contact.email}`}
                    className="truncate underline-offset-2 hover:underline"
                  >
                    {contact.email}
                  </a>
                </dd>
              </div>
              <div className="flex items-center gap-2.5">
                <dt className="sr-only-focusable absolute">Phone</dt>
                <Phone size={15} className="shrink-0 text-ink-faint" aria-hidden />
                <dd>
                  <a href={`tel:${contact.phone}`} className="underline-offset-2 hover:underline">
                    {contact.phone}
                  </a>
                </dd>
              </div>
            </dl>
          </Card>

          {/* ------------------------------------------- creative context */}
          <Card variant="accent" padding="md" radius="2xl">
            <div className="mb-2 flex items-start justify-between gap-3">
              <h3 className="text-base font-medium">How they like to work</h3>
              {editing !== 'prefs' && (
                <button
                  type="button"
                  onClick={() => {
                    setDraft(contact.creativePrefs)
                    setEditing('prefs')
                  }}
                  aria-label="Edit creative preferences"
                  className="shrink-0 text-[#0a0a0a] opacity-60 transition-opacity hover:opacity-100"
                >
                  <Pencil size={13} />
                </button>
              )}
            </div>
            {editing === 'prefs' ? (
              <div className="flex flex-col gap-2">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={4}
                  aria-label="Creative preferences"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" variant="primary" onClick={() => save('creativePrefs')}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-base leading-relaxed text-pretty text-[#1a1a18]">
                {contact.creativePrefs || 'Nothing recorded yet.'}
              </p>
            )}
          </Card>

          {/* --------------------------------------------------- notes */}
          <Card variant="surface" padding="md" radius="2xl">
            <SectionHeading
              title="Relationship notes"
              action={
                editing !== 'notes' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Pencil size={13} />}
                    onClick={() => {
                      setDraft(contact.notes)
                      setEditing('notes')
                    }}
                  >
                    Edit
                  </Button>
                )
              }
            />
            {editing === 'notes' ? (
              <div className="flex flex-col gap-2">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={4}
                  aria-label="Relationship notes"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" variant="primary" onClick={() => save('notes')}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-base leading-relaxed text-pretty text-ink-muted">
                {contact.notes || 'Nothing yet.'}
              </p>
            )}
          </Card>

          {/* --------------------------------------------------- tasks */}
          <Card variant="surface" padding="md" radius="2xl">
            <SectionHeading title="Follow-ups" count={tasks.length} />
            {tasks.length === 0 ? (
              <p className="py-3 text-sm text-ink-muted">Nothing owed.</p>
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
        </div>

        {/* ------------------------------------------------------- right */}
        <div className="flex flex-col gap-5">
          <section>
            <SectionHeading title="Projects" count={contactShoots.length} />
            {contactShoots.length === 0 ? (
              <EmptyState
                title="No contactShoots with this client yet"
                body="When a deal is won, start the project here."
                size="sm"
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {contactShoots.map((shoot) => (
                  <li key={shoot.id}>
                    <ShootRow shoot={shoot} />
                  </li>
                ))}
              </ul>
            )}
          </section>


          <Card variant="raised" padding="lg" radius="2xl">
            <SectionHeading
              title="Communication"
              count={feed.length}
              action={
                <Button size="sm" onClick={() => openQuickAdd('log')}>
                  Log
                </Button>
              }
            />
            {feed.length === 0 ? (
              <EmptyState
                title="Nothing logged yet"
                body="Calls, emails and meetings you record show up here as a shared memory."
                size="sm"
                action={
                  <Button variant="primary" size="sm" onClick={() => openQuickAdd('log')}>
                    Log a conversation
                  </Button>
                }
              />
            ) : (
              <ul className="flex flex-col">
                {feed.map((event, index) => (
                  <li
                    key={event.id}
                    className={cn(
                      'flex items-start gap-3 py-3.5',
                      index > 0 && 'border-t border-line-soft',
                    )}
                  >
                    <ActivityDot type={event.type} />
                    <div className="min-w-0 flex-1">
                      <p className="text-base leading-snug">{event.subject}</p>
                      {event.body && (
                        <p className="mt-1 text-sm leading-relaxed text-pretty text-ink-muted">
                          {event.body}
                        </p>
                      )}
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 text-xs text-ink-faint">
                        <span>{formatRelativeTime(event.at)}</span>
                        {event.direction && <span>{event.direction}</span>}
                        {event.links.shootId && (
                          <LinkedRecord kind="shoot" id={event.links.shootId} size="sm" />
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
