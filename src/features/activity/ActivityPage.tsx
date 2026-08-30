import { useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Clock3, MessageSquarePlus } from 'lucide-react'
import type { ActivityType } from '@/data/types'
import { ACTIVITY_LABELS } from '@/data/types'
import { useStore } from '@/store/useStore'
import { useActivityFeed, useOpenFollowUps } from '@/store/selectors'
import { useUI } from '@/store/useUI'
import { cn, formatDate, formatRelativeDay, formatRelativeTime, matches, parseDate } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { Button, Card, Chip, Pill } from '@/components/ui/primitives'
import { SearchInput } from '@/components/ui/form'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState, NoResults, toast } from '@/components/ui/feedback'
import { ActivityDot, LinkedRecord, SectionHeading } from '@/components/common/records'

/* ============================================================================
   ACTIVITY
   The studio's shared memory: calls, emails, meetings, notes, status changes
   and approvals, grouped by day, with the outstanding follow-ups pulled out.
   ========================================================================== */

const TYPES: ActivityType[] = ['call', 'email', 'meeting', 'note', 'approval', 'status', 'deal', 'update']

export default function ActivityPage() {
  const [types, setTypes] = useState<ActivityType[]>([])
  const [query, setQuery] = useState('')
  const feed = useActivityFeed({})
  const followUps = useOpenFollowUps()
  const team = useStore((s) => s.team)
  const contacts = useStore((s) => s.contacts)
  const completeFollowUp = useStore((s) => s.completeFollowUp)
  const openQuickAdd = useUI((s) => s.openQuickAdd)

  const filtered = useMemo(
    () =>
      feed.filter((event) => {
        if (types.length > 0 && !types.includes(event.type)) return false
        if (query && !matches(`${event.subject} ${event.body ?? ''}`, query)) return false
        return true
      }),
    [feed, types, query],
  )

  /** Group into day buckets so the stream reads as a diary, not a list. */
  const days = useMemo(() => {
    const map = new Map<string, typeof filtered>()
    for (const event of filtered) {
      const key = parseDate(event.at).toDateString()
      const existing = map.get(key)
      if (existing) existing.push(event)
      else map.set(key, [event])
    }
    return Array.from(map.entries())
  }, [filtered])

  function actorOf(id: string, kind: 'team' | 'client' | 'system') {
    if (kind === 'client') return contacts.find((c) => c.id === id)
    if (kind === 'team') return team.find((m) => m.id === id)
    return undefined
  }

  return (
    <div className="animate-in">
      <PageHeader
        eyebrow="Communication"
        title="Activity"
        description="Everything said and decided, in one place — so nobody has to reconstruct it from memory."
        actions={
          <Button
            variant="primary"
            icon={<MessageSquarePlus size={16} />}
            onClick={() => openQuickAdd('log')}
          >
            Log something
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
        <div>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <SearchInput
              value={query}
              onChange={setQuery}
              label="Search activity"
              placeholder="Search activity"
              className="min-w-0 flex-1 sm:max-w-64"
            />
            <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-0.5">
              {TYPES.map((type) => (
                <Chip
                  key={type}
                  selected={types.includes(type)}
                  onClick={() =>
                    setTypes((current) =>
                      current.includes(type)
                        ? current.filter((t) => t !== type)
                        : [...current, type],
                    )
                  }
                >
                  {ACTIVITY_LABELS[type]}
                </Chip>
              ))}
            </div>
          </div>

          {feed.length === 0 ? (
            <EmptyState
              title="Nothing logged yet"
              body="Every call, email and decision you record becomes context the whole studio can use later."
              action={
                <Button variant="primary" onClick={() => openQuickAdd('log')}>
                  Log the first one
                </Button>
              }
              size="lg"
            />
          ) : filtered.length === 0 ? (
            <NoResults
              query={query}
              entity="entries"
              onClear={() => {
                setQuery('')
                setTypes([])
              }}
            />
          ) : (
            <div className="flex flex-col gap-6">
              {days.map(([day, events]) => (
                <section key={day}>
                  <h2 className="eyebrow sticky top-[68px] z-10 mb-2 bg-canvas/90 py-1.5 backdrop-blur-sm">
                    {formatRelativeDay(events[0].at)} · {formatDate(events[0].at, 'day')}
                  </h2>

                  <Card variant="raised" padding="none" radius="2xl">
                    <ul>
                      {events.map((event, index) => {
                        const actor = actorOf(event.actorId, event.actorKind)
                        return (
                          <li
                            key={event.id}
                            className={cn(
                              'flex items-start gap-3 p-4',
                              index > 0 && 'border-t border-line-soft',
                            )}
                          >
                            <ActivityDot type={event.type} />

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-baseline gap-x-2">
                                <p className="text-body leading-snug">{event.subject}</p>
                                {event.direction && (
                                  <span
                                    className="flex items-center gap-1 text-2xs text-ink-faint"
                                    title={event.direction}
                                  >
                                    {event.direction === 'inbound' ? (
                                      <ArrowDownLeft size={11} aria-hidden />
                                    ) : (
                                      <ArrowUpRight size={11} aria-hidden />
                                    )}
                                    {event.direction}
                                  </span>
                                )}
                              </div>

                              {event.body && (
                                <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-pretty text-ink-muted">
                                  {event.body}
                                </p>
                              )}

                              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-faint">
                                <span className="flex items-center gap-1.5">
                                  {actor && (
                                    <Avatar
                                      name={actor.name}
                                      src={'avatar' in actor ? actor.avatar : undefined}
                                      size="xs"
                                    />
                                  )}
                                  {actor?.name ?? 'The studio'}
                                </span>
                                <span>{formatRelativeTime(event.at)}</span>
                                {event.links.projectId && (
                                  <LinkedRecord kind="project" id={event.links.projectId} size="sm" />
                                )}
                                {event.links.contactId && (
                                  <LinkedRecord kind="contact" id={event.links.contactId} size="sm" />
                                )}
                                {event.links.dealId && (
                                  <LinkedRecord kind="deal" id={event.links.dealId} size="sm" />
                                )}
                              </div>
                            </div>

                            {event.followUpAt && !event.followUpDone && (
                              <Pill tone="caution" size="sm" icon={<Clock3 size={10} />}>
                                {formatRelativeDay(event.followUpAt)}
                              </Pill>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </Card>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* ------------------------------------------------------ follow-ups */}
        <aside>
          <Card variant="surface" padding="md" radius="2xl" className="lg:sticky lg:top-20">
            <SectionHeading
              title="Owed a reply"
              count={followUps.length}
              description="Nothing here should be a surprise to the client."
            />
            {followUps.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-muted">
                Nobody is waiting on the studio.
              </p>
            ) : (
              <ul className="flex flex-col">
                {followUps.map((event, index) => (
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
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
                        <Clock3 size={11} aria-hidden />
                        {formatRelativeDay(event.followUpAt!)}
                      </p>
                      {event.links.contactId && (
                        <LinkedRecord
                          kind="contact"
                          id={event.links.contactId}
                          size="sm"
                          className="mt-1"
                        />
                      )}
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
        </aside>
      </div>
    </div>
  )
}
