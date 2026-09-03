import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ExternalLink, MapPin, Plus, Users } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { isCommitted } from '@/data/pipeline'
import { lineItemsTotal, useActivityFeed, useCompany } from '@/store/selectors'
import { useUI } from '@/store/useUI'
import { cn, daysFromToday, formatCurrency, formatDate, formatRelativeTime, pluralize, sum } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { InstagramField } from '@/components/common/InstagramField'
import { Button, Card, Pill } from '@/components/ui/primitives'
import { EmptyState, toast } from '@/components/ui/feedback'
import { CompanyMark } from '@/components/common/Img'
import {
  ActivityDot,
  LinkedRecord,
  PersonCell,
  SectionHeading,
  TagList,
} from '@/components/common/records'
import { ShootRow } from '@/features/shoots/ShootCard'

export default function CompanyDetail() {
  const { id = '' } = useParams()
  const company = useCompany(id)
  const allContacts = useStore((s) => s.contacts)
  const allShoots = useStore((s) => s.shoots)
  const pipeline = useStore((s) => s.pipeline)
  const openQuickAdd = useUI((s) => s.openQuickAdd)
  const updateCompany = useStore((s) => s.updateCompany)
  const feed = useActivityFeed({ companyId: id }, 12)
  const allLicences = useStore((s) => s.licenses)
  const licences = useMemo(() => allLicences.filter((l) => l.companyId === id), [allLicences, id])

  const people = useMemo(() => allContacts.filter((c) => c.companyId === id), [allContacts, id])
  const shoots = useMemo(() => allShoots.filter((p) => p.companyId === id), [allShoots, id])

  if (!company) {
    return <EmptyState title="Company not found" body="It may have been removed." size="lg" />
  }

  // Forecast is what has not committed yet; lifetime is what actually landed.
  const openStages = new Set(
    pipeline.filter((s) => s.kind === 'lead' || s.kind === 'quoted').map((s) => s.id),
  )
  const committedStages = new Set(pipeline.filter((s) => isCommitted(s.kind)).map((s) => s.id))
  const openValue = sum(
    shoots.filter((p) => openStages.has(p.stageId)).map((p) => lineItemsTotal(p.lineItems)),
  )
  const lifetime = sum(
    shoots.filter((p) => committedStages.has(p.stageId)).map((p) => lineItemsTotal(p.lineItems)),
  )
  const live = shoots.filter((p) => !p.archived)

  return (
    <div className="animate-in">
      <PageHeader
        crumbs={[
          { label: 'Clients', to: '/contacts' },
          { label: 'Companies', to: '/contacts?view=companies' },
          { label: company.name },
        ]}
        title={company.name}
        description={company.industry}
        meta={
          <>
            <span className="flex items-center gap-1.5 text-sm text-ink-muted">
              <MapPin size={13} aria-hidden />
              {company.location}
            </span>
            <a
              href={`https://${company.website}`}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-1.5 text-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline"
            >
              <ExternalLink size={13} aria-hidden />
              {company.website}
            </a>
            <InstagramField
              value={company.instagram}
              onChange={(instagram) => {
                updateCompany(id, { instagram })
                toast.success(instagram ? `Linked @${instagram}` : 'Instagram removed')
              }}
            />
            <Pill tone="neutral">{company.size}</Pill>
            <Pill tone="neutral">Client since {formatDate(company.since)}</Pill>
          </>
        }
        actions={
          <>
            <Button onClick={() => openQuickAdd('contact')} icon={<Users size={15} />}>
              Add contact
            </Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => openQuickAdd('shoot')}>
              New shoot
            </Button>
          </>
        }
      />

      {/* ------------------------------------------------------ headline */}
      <Card variant="raised" padding="lg" radius="3xl" className="mb-5">
        <div className="flex flex-wrap items-start gap-6">
          <CompanyMark name={company.name} seed={company.artSeed} size={88} className="rounded-2xl" />
          <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            <div>
              <dt className="eyebrow mb-1.5">Lifetime</dt>
              <dd className="tabular text-xl font-medium">
                {formatCurrency(lifetime, { compact: true })}
              </dd>
            </div>
            <div>
              <dt className="eyebrow mb-1.5">Open pipeline</dt>
              <dd className="tabular text-xl font-medium">
                {formatCurrency(openValue, { compact: true })}
              </dd>
            </div>
            <div>
              <dt className="eyebrow mb-1.5">Live shoots</dt>
              <dd className="tabular text-xl font-medium">{live.length}</dd>
            </div>
            <div>
              <dt className="eyebrow mb-1.5">People</dt>
              <dd className="tabular text-xl font-medium">{people.length}</dd>
            </div>
          </dl>
        </div>

        {company.notes && (
          <p className="mt-6 max-w-prose text-body leading-relaxed text-pretty text-ink-muted">
            {company.notes}
          </p>
        )}

        <TagList ids={company.tags} size="md" className="mt-4" />
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-5">
          <section>
            <SectionHeading title="Shoots" count={shoots.length} />
            {shoots.length === 0 ? (
              <EmptyState title="No shoots yet" body="Nothing has been made for them so far." size="sm" />
            ) : (
              <ul className="flex flex-col gap-2">
                {shoots.map((shoot) => (
                  <li key={shoot.id}>
                    <ShootRow shoot={shoot} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Card variant="surface" padding="lg" radius="2xl">
            <SectionHeading title="Activity" count={feed.length} />
            {feed.length === 0 ? (
              <p className="py-4 text-center text-sm text-ink-muted">Nothing logged yet.</p>
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
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-ink-faint">
                        <span>{formatRelativeTime(event.at)}</span>
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
        </div>

        <div className="flex flex-col gap-5">
          <Card variant="raised" padding="md" radius="2xl">
            <SectionHeading title="People" count={people.length} />
            {people.length === 0 ? (
              <p className="py-3 text-sm text-ink-muted">Nobody added yet.</p>
            ) : (
              <ul className="flex flex-col">
                {people.map((person, index) => (
                  <li key={person.id} className={cn(index > 0 && 'border-t border-line-soft')}>
                    <Link
                      to={`/contacts/${person.id}`}
                      className="flex items-center gap-3 py-3 transition-opacity duration-fast hover:opacity-70"
                    >
                      <PersonCell id={person.id} kind="contact" size="md" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card variant="surface" padding="md" radius="2xl">
            <SectionHeading
              title="Licences"
              count={licences.length}
              description={pluralize(licences.length, 'licence')}
            />
            {licences.length === 0 ? (
              <p className="py-3 text-sm text-ink-muted">No licences recorded.</p>
            ) : (
              <ul className="flex flex-col">
                {licences.map((licence, index) => {
                  const days = daysFromToday(licence.endDate)
                  return (
                    <li
                      key={licence.id}
                      className={cn(
                        'flex items-center gap-3 py-2.5',
                        index > 0 && 'border-t border-line-soft',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <LinkedRecord kind="licence" id={licence.id} className="text-ink" />
                        <p className="text-xs text-ink-muted">
                          {days > 3650
                            ? 'No expiry'
                            : days < 0
                              ? `Lapsed ${Math.abs(days)}d ago`
                              : `${days}d left`}
                        </p>
                      </div>
                      <span className="tabular shrink-0 text-sm">
                        {formatCurrency(licence.fee, { compact: true })}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
