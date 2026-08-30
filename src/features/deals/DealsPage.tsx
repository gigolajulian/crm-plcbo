import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Columns3, GripVertical, List, Plus } from 'lucide-react'
import type { Deal, ID } from '@/data/types'
import { useStore } from '@/store/useStore'
import { useOpenStages, usePipelineSummary, useSortedPipeline } from '@/store/selectors'
import { useUI } from '@/store/useUI'
import { cn, daysFromToday, formatCurrency, formatRelativeDay, matches, sortBy, sum } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { FilterBar, passesFilters, useFilterState, type FilterGroup } from '@/components/common/FilterBar'
import { Button, Card, Meter, Pill, SegmentedControl } from '@/components/ui/primitives'
import { Avatar } from '@/components/ui/Avatar'
import { Menu } from '@/components/ui/overlay'
import { EmptyState, NoResults, toast } from '@/components/ui/feedback'
import { CompanyMark } from '@/components/common/Img'
import { DueBadge, TagList } from '@/components/common/records'

/* ============================================================================
   PIPELINE
   Kanban with real drag-and-drop, plus a "move to stage" menu on every card so
   the same action is available without a pointer.
   ========================================================================== */

type View = 'board' | 'list'

export default function DealsPage() {
  const [params, setParams] = useSearchParams()
  const view = (params.get('view') as View) ?? 'board'

  const deals = useStore((s) => s.deals)
  const companies = useStore((s) => s.companies)
  const team = useStore((s) => s.team)
  const tags = useStore((s) => s.tags)
  const pipeline = useSortedPipeline()
  const summary = usePipelineSummary()

  const { filters, query, setQuery, toggle, clear, activeCount } = useFilterState()

  const groups: FilterGroup[] = useMemo(
    () => [
      {
        id: 'stage',
        label: 'Stage',
        options: pipeline.map((stage) => ({
          value: stage.id,
          label: stage.name,
          count: deals.filter((d) => d.stageId === stage.id).length,
        })),
      },
      {
        id: 'owner',
        label: 'Owner',
        options: team
          .filter((m) => m.active)
          .map((member) => ({
            value: member.id,
            label: member.name,
            count: deals.filter((d) => d.ownerId === member.id).length,
          })),
      },
      {
        id: 'company',
        label: 'Company',
        options: companies.map((company) => ({
          value: company.id,
          label: company.name,
          count: deals.filter((d) => d.companyId === company.id).length,
        })),
      },
      {
        id: 'tags',
        label: 'Tags',
        options: tags.map((tag) => ({
          value: tag.id,
          label: tag.label,
          count: deals.filter((d) => d.tags.includes(tag.id)).length,
        })),
      },
    ],
    [deals, pipeline, team, companies, tags],
  )

  const filtered = useMemo(
    () =>
      deals.filter((deal) => {
        if (query && !matches(deal.name, query)) return false
        return passesFilters(filters, {
          stage: deal.stageId,
          owner: deal.ownerId,
          company: deal.companyId,
          tags: deal.tags,
        })
      }),
    [deals, query, filters],
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
        eyebrow="New business"
        title="Pipeline"
        description="Where the next projects come from — and which of them need a nudge this week."
        meta={
          <>
            <Pill tone="ink" size="md">
              {formatCurrency(summary.openValue, { compact: true })} open
            </Pill>
            <Pill tone="lime" size="md">
              {formatCurrency(summary.weightedValue, { compact: true })} weighted
            </Pill>
            <Pill tone="neutral" size="md">
              {Math.round(summary.winRate)}% win rate
            </Pill>
          </>
        }
        actions={
          <>
            <SegmentedControl
              value={view}
              onChange={setView}
              segments={[
                { value: 'board', label: 'Board', icon: <Columns3 size={14} /> },
                { value: 'list', label: 'List', icon: <List size={14} /> },
              ]}
              label="Pipeline view"
              size="sm"
            />
            <NewDealButton />
          </>
        }
      />

      <FilterBar
        query={query}
        onQuery={setQuery}
        searchLabel="Search deals"
        groups={groups}
        filters={filters}
        onToggle={toggle}
        onClear={clear}
        activeCount={activeCount}
        resultCount={filtered.length}
        entity="deal"
      />

      {deals.length === 0 ? (
        <EmptyState
          title="No deals yet"
          body="Track the conversations that turn into work — who, how much, and when you expect to know."
          action={<NewDealButton />}
          size="lg"
        />
      ) : filtered.length === 0 ? (
        <NoResults query={query} onClear={clear} entity="deals" />
      ) : view === 'board' ? (
        <PipelineBoard deals={filtered} />
      ) : (
        <PipelineList deals={filtered} />
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- board -- */

function PipelineBoard({ deals }: { deals: Deal[] }) {
  const pipeline = useSortedPipeline()
  const moveDeal = useStore((s) => s.moveDeal)
  const [dragId, setDragId] = useState<ID | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )

  function onDragEnd(event: DragEndEvent) {
    setDragId(null)
    const { active, over } = event
    if (!over) return
    const stageId = String(over.id)
    const deal = deals.find((d) => d.id === active.id)
    const stage = pipeline.find((s) => s.id === stageId)
    if (!deal || !stage || deal.stageId === stageId) return
    moveDeal(deal.id, stageId)
    toast.success(`${deal.name} → ${stage.name}`, {
      action: { label: 'Undo', onClick: () => moveDeal(deal.id, deal.stageId) },
    })
  }

  const dragDeal = dragId ? deals.find((d) => d.id === dragId) : undefined

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={(event) => setDragId(String(event.active.id))}
      onDragCancel={() => setDragId(null)}
      onDragEnd={onDragEnd}
    >
      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
        <div className="flex min-w-max gap-3">
          {pipeline.map((stage) => (
            <StageColumn
              key={stage.id}
              stageId={stage.id}
              name={stage.name}
              kind={stage.kind}
              deals={sortBy(
                deals.filter((d) => d.stageId === stage.id),
                (d) => d.expectedCloseDate,
              )}
            />
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.22,1,0.36,1)' }}>
        {dragDeal ? (
          <div className="w-72 rotate-2">
            <DealCard deal={dragDeal} preview />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function StageColumn({
  stageId,
  name,
  kind,
  deals,
}: {
  stageId: ID
  name: string
  kind: string
  deals: Deal[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stageId })
  const total = sum(deals.map((d) => d.value))

  return (
    <section className="flex w-72 shrink-0 flex-col">
      <header className="mb-3 flex items-baseline justify-between gap-2 px-1">
        <h2 className="flex items-baseline gap-2 text-base font-medium">
          {name}
          <span className="tabular text-sm text-ink-faint">{deals.length}</span>
        </h2>
        <span className="tabular text-sm text-ink-muted">
          {formatCurrency(total, { compact: true })}
        </span>
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-32 flex-1 flex-col gap-2.5 rounded-2xl p-2 transition-colors duration-base',
          isOver ? 'bg-lime-pale' : 'bg-surface/60',
          kind === 'won' && 'bg-positive-wash/40',
          kind === 'lost' && 'bg-canvas-sunk/60',
          isOver && 'bg-lime-pale',
        )}
      >
        {deals.map((deal) => (
          <DraggableDeal key={deal.id} deal={deal} />
        ))}
        {deals.length === 0 && (
          <p className="px-2 py-8 text-center text-sm text-ink-faint">
            {isOver ? `Drop into ${name}` : 'Nothing here'}
          </p>
        )}
      </div>
    </section>
  )
}

function DraggableDeal({ deal }: { deal: Deal }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } =
    useDraggable({ id: deal.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn('relative', isDragging && 'opacity-40')}
    >
      <DealCard deal={deal} />
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`Drag ${deal.name} to another stage`}
        className="absolute top-2 right-9 grid size-7 cursor-grab place-items-center rounded-full text-ink-faint opacity-0 transition-opacity duration-fast focus-visible:opacity-100 group-hover:opacity-100 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} aria-hidden />
      </button>
    </div>
  )
}

function DealCard({ deal, preview }: { deal: Deal; preview?: boolean }) {
  const company = useStore((s) => s.companies.find((c) => c.id === deal.companyId))
  const owner = useStore((s) => s.team.find((m) => m.id === deal.ownerId))
  const pipeline = useSortedPipeline()
  const moveDeal = useStore((s) => s.moveDeal)
  const daysToClose = daysFromToday(deal.expectedCloseDate)
  const stage = pipeline.find((s) => s.id === deal.stageId)
  const open = stage?.kind === 'open'

  return (
    <Card
      variant="raised"
      padding="sm"
      radius="xl"
      className={cn('group relative flex flex-col gap-2.5', !preview && 'hover:shadow-md')}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 text-base leading-snug font-medium">
          <Link to={`/deals/${deal.id}`} className="after:absolute after:inset-0 after:content-['']">
            {deal.name}
          </Link>
        </h3>
        {!preview && (
          <div className="relative z-10 shrink-0">
            <Menu
              label={`Move ${deal.name} to another stage`}
              items={pipeline
                .filter((s) => s.id !== deal.stageId)
                .map((s) => ({
                  label: `Move to ${s.name}`,
                  onSelect: () => {
                    moveDeal(deal.id, s.id)
                    toast.success(`${deal.name} → ${s.name}`)
                  },
                }))}
              trigger={({ onClick, ...rest }) => (
                <button
                  type="button"
                  onClick={onClick}
                  aria-label={`Move ${deal.name} to another stage`}
                  className="grid size-7 place-items-center rounded-full text-ink-faint transition-colors duration-fast hover:bg-surface hover:text-ink"
                  {...rest}
                >
                  <span aria-hidden>⋯</span>
                </button>
              )}
            />
          </div>
        )}
      </div>

      {company && (
        <div className="flex items-center gap-2">
          <CompanyMark name={company.name} seed={company.artSeed} size={18} />
          <span className="truncate text-xs text-ink-muted">{company.name}</span>
        </div>
      )}

      <p className="tabular text-xl font-medium tracking-tight">
        {formatCurrency(deal.value, { compact: true })}
      </p>

      {open && (
        <div>
          <div className="mb-1 flex items-baseline justify-between text-2xs text-ink-muted">
            <span>{deal.probability}% likely</span>
            <span className="tabular">
              {formatCurrency((deal.value * deal.probability) / 100, { compact: true })}
            </span>
          </div>
          <Meter value={deal.probability / 100} tone="lime" label="Win probability" />
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            'text-2xs',
            open && daysToClose < 0 ? 'font-medium text-critical' : 'text-ink-faint',
          )}
        >
          {open ? formatRelativeDay(deal.expectedCloseDate) : `Closed ${formatRelativeDay(deal.expectedCloseDate)}`}
        </span>
        {owner && <Avatar name={owner.name} src={owner.avatar} size="xs" />}
      </div>
    </Card>
  )
}

/* ----------------------------------------------------------------- list -- */

function PipelineList({ deals }: { deals: Deal[] }) {
  const pipeline = useSortedPipeline()
  const companies = useStore((s) => s.companies)
  const team = useStore((s) => s.team)
  const moveDeal = useStore((s) => s.moveDeal)

  return (
    <Card variant="raised" padding="none" radius="2xl" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <caption className="sr-only-focusable absolute">All deals in the pipeline</caption>
          <thead>
            <tr className="border-b border-line-soft text-2xs tracking-label text-ink-faint uppercase">
              <th scope="col" className="px-4 py-3 font-medium">Deal</th>
              <th scope="col" className="px-4 py-3 font-medium">Company</th>
              <th scope="col" className="px-4 py-3 font-medium">Stage</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Value</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Weighted</th>
              <th scope="col" className="px-4 py-3 font-medium">Close</th>
              <th scope="col" className="px-4 py-3 font-medium">Owner</th>
            </tr>
          </thead>
          <tbody>
            {sortBy(deals, (d) => d.value, -1).map((deal) => {
              const company = companies.find((c) => c.id === deal.companyId)
              const owner = team.find((m) => m.id === deal.ownerId)
              const stage = pipeline.find((s) => s.id === deal.stageId)
              return (
                <tr
                  key={deal.id}
                  className="border-b border-line-soft last:border-0 transition-colors duration-fast hover:bg-surface"
                >
                  <td className="px-4 py-3">
                    <Link to={`/deals/${deal.id}`} className="text-base font-medium hover:underline">
                      {deal.name}
                    </Link>
                    <TagList ids={deal.tags} max={2} className="mt-1" />
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-muted">{company?.name}</td>
                  <td className="px-4 py-3">
                    <Menu
                      label={`Move ${deal.name} to another stage`}
                      items={pipeline
                        .filter((s) => s.id !== deal.stageId)
                        .map((s) => ({
                          label: `Move to ${s.name}`,
                          onSelect: () => {
                            moveDeal(deal.id, s.id)
                            toast.success(`${deal.name} → ${s.name}`)
                          },
                        }))}
                      trigger={({ onClick, ...rest }) => (
                        <button type="button" onClick={onClick} {...rest}>
                          <Pill
                            tone={
                              stage?.kind === 'won'
                                ? 'positive'
                                : stage?.kind === 'lost'
                                  ? 'critical'
                                  : 'neutral'
                            }
                          >
                            {stage?.name}
                          </Pill>
                        </button>
                      )}
                    />
                  </td>
                  <td className="tabular px-4 py-3 text-right text-base">
                    {formatCurrency(deal.value, { compact: true })}
                  </td>
                  <td className="tabular px-4 py-3 text-right text-base text-ink-muted">
                    {stage?.kind === 'open'
                      ? formatCurrency((deal.value * deal.probability) / 100, { compact: true })
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <DueBadge date={deal.expectedCloseDate} done={stage?.kind !== 'open'} />
                  </td>
                  <td className="px-4 py-3">
                    {owner && <Avatar name={owner.name} src={owner.avatar} size="sm" />}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

/* ----------------------------------------------------------------- misc -- */

function NewDealButton() {
  const openQuickAdd = useUI((s) => s.openQuickAdd)
  const stages = useOpenStages()
  return (
    <Button
      variant="primary"
      icon={<Plus size={16} />}
      onClick={() => openQuickAdd('deal')}
      disabled={stages.length === 0}
    >
      New deal
    </Button>
  )
}
