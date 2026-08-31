import { useMemo } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Building2, Plus, Star, Users } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useUI } from '@/store/useUI'
import { cn, daysFromToday, formatRelativeDay, matches, pluralize, sortBy } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { FilterBar, passesFilters, useFilterState, type FilterGroup } from '@/components/common/FilterBar'
import { Button, Card, IconButton, Pill, SegmentedControl } from '@/components/ui/primitives'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState, NoResults } from '@/components/ui/feedback'
import { CompanyMark } from '@/components/common/Img'
import { TagList } from '@/components/common/records'

/* ============================================================================
   CLIENTS
   People first, companies second — a creative studio's relationships live with
   individuals. The same route serves both, switched by a pill.
   ========================================================================== */

type View = 'people' | 'companies'

export default function ContactsPage() {
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const defaultView: View = location.pathname.startsWith('/companies') ? 'companies' : 'people'
  const view = (params.get('view') as View) ?? defaultView

  const contacts = useStore((s) => s.contacts)
  const companies = useStore((s) => s.companies)
  const shoots = useStore((s) => s.shoots)
    const tags = useStore((s) => s.tags)
  const updateContact = useStore((s) => s.updateContact)

  const { filters, query, setQuery, toggle, clear, activeCount } = useFilterState()

  const groups: FilterGroup[] = useMemo(
    () => [
      {
        id: 'company',
        label: 'Company',
        options: companies.map((company) => ({
          value: company.id,
          label: company.name,
          count: contacts.filter((c) => c.companyId === company.id).length,
        })),
      },
      {
        id: 'tags',
        label: 'Tags',
        options: tags.map((tag) => ({
          value: tag.id,
          label: tag.label,
          count: contacts.filter((c) => c.tags.includes(tag.id)).length,
        })),
      },
      {
        id: 'touch',
        label: 'Last contact',
        options: [
          { value: 'week', label: 'This week' },
          { value: 'month', label: 'This month' },
          { value: 'stale', label: 'Over a month ago' },
        ],
      },
    ],
    [companies, contacts, tags],
  )

  const filteredContacts = useMemo(() => {
    const list = contacts.filter((contact) => {
      if (query && !matches(`${contact.name} ${contact.role} ${contact.email}`, query)) return false
      const days = Math.abs(daysFromToday(contact.lastTouchedAt))
      const touch = days <= 7 ? 'week' : days <= 31 ? 'month' : 'stale'
      return passesFilters(filters, {
        company: contact.companyId,
        tags: contact.tags,
        touch,
      })
    })
    // Favourites first, then most recently in touch.
    return sortBy(list, (c) => `${c.favourite ? 0 : 1}${9999999999999 - new Date(c.lastTouchedAt).getTime()}`)
  }, [contacts, query, filters])

  const filteredCompanies = useMemo(
    () =>
      companies.filter(
        (company) => !query || matches(`${company.name} ${company.industry}`, query),
      ),
    [companies, query],
  )

  function setView(next: View) {
    setParams((current) => {
      const updated = new URLSearchParams(current)
      updated.set('view', next)
      return updated
    })
  }

  return (
    <div className="animate-in">
      <PageHeader
        eyebrow="Relationships"
        title="Clients"
        description="The people the work is for — what they care about, and when you last spoke."
        actions={
          <>
            <SegmentedControl
              value={view}
              onChange={setView}
              segments={[
                { value: 'people', label: 'People', icon: <Users size={14} /> },
                { value: 'companies', label: 'Companies', icon: <Building2 size={14} /> },
              ]}
              label="Directory view"
              size="sm"
            />
            <NewClientButton />
          </>
        }
      />

      <FilterBar
        query={query}
        onQuery={setQuery}
        searchLabel={view === 'people' ? 'Search people' : 'Search companies'}
        groups={view === 'people' ? groups : []}
        filters={filters}
        onToggle={toggle}
        onClear={clear}
        activeCount={activeCount}
        resultCount={view === 'people' ? filteredContacts.length : filteredCompanies.length}
        entity={view === 'people' ? 'person' : 'company'}
      />

      {view === 'people' ? (
        contacts.length === 0 ? (
          <EmptyState
            icon={<Users size={20} />}
            title="No clients yet"
            body="Add the people you work with, and the studio starts remembering things for you."
            action={<NewClientButton />}
            size="lg"
          />
        ) : filteredContacts.length === 0 ? (
          <NoResults query={query} onClear={clear} entity="people" />
        ) : (
          <ul className="stagger grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredContacts.map((contact, index) => {
              const company = companies.find((c) => c.id === contact.companyId)
              // One record now, so a contact's live work is one count.
              const contactShoots = shoots.filter(
                (p) => p.contactId === contact.id && !p.archived,
              )
              const stale = daysFromToday(contact.lastTouchedAt) < -21

              return (
                <li key={contact.id} style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}>
                  <Card
                    variant="raised"
                    padding="md"
                    radius="2xl"
                    interactive
                    className="group relative flex h-full flex-col gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar name={contact.name} src={contact.avatar} size="lg" />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-lg font-medium tracking-tight">
                          <Link
                            to={`/contacts/${contact.id}`}
                            className="after:absolute after:inset-0 after:content-['']"
                          >
                            {contact.name}
                          </Link>
                        </h3>
                        <p className="truncate text-sm text-ink-muted">{contact.role}</p>
                        {company && (
                          <Link
                            to={`/companies/${company.id}`}
                            className="relative z-10 mt-1 inline-block truncate text-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline"
                          >
                            {company.name}
                          </Link>
                        )}
                      </div>
                      <IconButton
                        label={
                          contact.favourite
                            ? `Remove ${contact.name} from favourites`
                            : `Add ${contact.name} to favourites`
                        }
                        size="sm"
                        variant="ghost"
                        className="relative z-10"
                        onClick={() => updateContact(contact.id, { favourite: !contact.favourite })}
                      >
                        <Star
                          size={15}
                          className={cn(contact.favourite && 'fill-lime text-lime-deep')}
                        />
                      </IconButton>
                    </div>

                    <TagList ids={contact.tags} max={3} />

                    <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-line-soft pt-3 text-xs text-ink-muted">
                      <span>{pluralize(contactShoots.length, 'live shoot')}</span>
                      <span aria-hidden>·</span>
                      <span>{pluralize(contactShoots.length, 'deal')}</span>
                      <span
                        className={cn('ml-auto', stale && 'font-medium text-caution')}
                      >
                        {formatRelativeDay(contact.lastTouchedAt)}
                      </span>
                    </div>
                  </Card>
                </li>
              )
            })}
          </ul>
        )
      ) : filteredCompanies.length === 0 ? (
        <NoResults query={query} onClear={clear} entity="companies" />
      ) : (
        <ul className="stagger grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCompanies.map((company, index) => {
            const people = contacts.filter((c) => c.companyId === company.id)
            const live = shoots.filter(
              (p) => p.companyId === company.id && !p.archived,
            )
            return (
              <li key={company.id} style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}>
                <Card
                  variant="raised"
                  padding="md"
                  radius="2xl"
                  interactive
                  className="group relative flex h-full flex-col gap-3"
                >
                  <div className="flex items-start gap-3">
                    <CompanyMark name={company.name} seed={company.artSeed} size={48} />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-medium tracking-tight">
                        <Link
                          to={`/companies/${company.id}`}
                          className="after:absolute after:inset-0 after:content-['']"
                        >
                          {company.name}
                        </Link>
                      </h3>
                      <p className="truncate text-sm text-ink-muted">{company.industry}</p>
                      <p className="truncate text-xs text-ink-faint">{company.location}</p>
                    </div>
                  </div>

                  <TagList ids={company.tags} max={3} />

                  <div className="mt-auto flex items-center gap-2 border-t border-line-soft pt-3 text-xs text-ink-muted">
                    <span>{pluralize(people.length, 'contact')}</span>
                    <span aria-hidden>·</span>
                    <span>{pluralize(live.length, 'live shoot')}</span>
                    {live.length > 0 && (
                      <Pill tone="lime" size="sm" className="ml-auto">
                        Active
                      </Pill>
                    )}
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function NewClientButton() {
  const openQuickAdd = useUI((s) => s.openQuickAdd)
  return (
    <Button variant="primary" icon={<Plus size={16} />} onClick={() => openQuickAdd('contact')}>
      Add client
    </Button>
  )
}
