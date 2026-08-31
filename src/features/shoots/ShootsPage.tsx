import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { CalendarRange, Columns3, GripVertical, LayoutGrid, List, Plus } from 'lucide-react'
import type { ID, PipelineStage, Shoot } from '@/data/types'
import { SHOOT_TYPES, STAGE_KINDS } from '@/data/types'
import { useStore } from '@/store/useStore'
import { lineItemsTotal, useSortedPipeline } from '@/store/selectors'
import { useUI } from '@/store/useUI'
import { cn, formatCurrency, matches, sortBy, sum } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import {
  FilterBar,
  passesFilters,
  useFilterState,
  type FilterGroup,
} from '@/components/common/FilterBar'
import { Button, SegmentedControl } from '@/components/ui/primitives'
import { EmptyState, NoResults, toast } from '@/components/ui/feedback'
import { Menu } from '@/components/ui/overlay'
import { ShootBoardCard, ShootCard, ShootRow } from './ShootCard'
import { ShootTimeline } from './ShootTimeline'

type View = 'gallery' | 'board' | 'timeline' | 'list'

const VIEWS = [
  { value: 'gallery' as const, label: 'Gallery', icon: <LayoutGrid size={14} /> },
  { value: 'board' as const, label: 'Board', icon: <Columns3 size={14} /> },
  { value: 'timeline' as const, label: 'Timeline', icon: <CalendarRange size={14} /> },
  { value: 'list' as const, label: 'List', icon: <List size={14} /> },
]

const SORTS = [
  { value: 'due-asc', label: 'Due soonest' },
  { value: 'due-desc', label: 'Due latest' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'budget-desc', label: 'Largest budget' },
  { value: 'recent', label: 'Recently added' },
]

export default function ShootsPage() {
  const [params, setParams] = useSearchParams()
  const view = (params.get('view') as View) ?? 'gallery'
  const [sort, setSort] = useState('due-asc')

  const shoots = useStore((s) => s.shoots)
  const companies = useStore((s) => s.companies)
  const team = useStore((s) => s.team)
  const tags = useStore((s) => s.tags)
  const savedViews = useStore((s) => s.savedViews)
  const saveView = useStore((s) => s.saveView)
  const deleteView = useStore((s) => s.deleteView)

  const pipeline = useSortedPipeline()
  const closedStages = useMemo(
    () => new Set(pipeline.filter((stage) => stage.kind === 'won' || stage.kind === 'lost').map((s) => s.id)),
    [pipeline],
  )

  const { filters, setFilters, query, setQuery, toggle, clear, activeCount } = useFilterState()

  const groups: FilterGroup[] = useMemo(
    () => [
      {
        id: 'stage',
        label: 'Stage',
        options: pipeline.map((stage) => ({
          value: stage.id,
          label: stage.name,
          count: shoots.filter((p) => p.stageId === stage.id).length,
        })),
      },
      {
        id: 'health',
        label: 'Health',
        options: [
          { value: 'on-track', label: 'On track' },
          { value: 'at-risk', label: 'At risk' },
          { value: 'blocked', label: 'Blocked' },
        ].map((option) => ({
          ...option,
          count: shoots.filter((p) => p.health === option.value).length,
        })),
      },
      {
        id: 'company',
        label: 'Client',
        options: companies.map((company) => ({
          value: company.id,
          label: company.name,
          count: shoots.filter((p) => p.companyId === company.id).length,
        })),
      },
      {
        id: 'type',
        label: 'Type',
        options: SHOOT_TYPES.map((type) => ({
          value: type.id,
          label: type.label,
          count: shoots.filter((p) => p.shootType === type.id).length,
        })),
      },
      {
        id: 'lead',
        label: 'Owner',
        options: team
          .filter((m) => m.active)
          .map((member) => ({
            value: member.id,
            label: member.name,
            count: shoots.filter((p) => p.ownerId === member.id).length,
          })),
      },
      {
        id: 'tags',
        label: 'Tags',
        options: tags.map((tag) => ({
          value: tag.id,
          label: tag.label,
          count: shoots.filter((p) => p.tags.includes(tag.id)).length,
        })),
      },
    ],
    [shoots, companies, team, tags, pipeline],
  )

  const filtered = useMemo(() => {
    const list = shoots.filter((shoot) => {
      if (shoot.archived) return false
      if (
        query &&
        !matches(`${shoot.name} ${shoot.code} ${shoot.summary}`, query)
      ) {
        return false
      }
      return passesFilters(filters, {
        stage: shoot.stageId,
        health: shoot.health,
        company: shoot.companyId,
        type: shoot.shootType,
        lead: shoot.ownerId,
        tags: shoot.tags,
      })
    })

    switch (sort) {
      case 'due-desc':
        return sortBy(list, (p) => p.expectedCloseDate, -1)
      case 'name':
        return sortBy(list, (p) => p.name.toLowerCase())
      case 'budget-desc':
        return sortBy(list, (p) => lineItemsTotal(p.lineItems), -1)
      case 'recent':
        return sortBy(list, (p) => p.createdAt, -1)
      default:
        // Closed work sinks to the bottom — a wrapped shoot is not "due".
        return sortBy(list, (p) => `${closedStages.has(p.stageId) ? 1 : 0}${p.expectedCloseDate}`)
    }
  }, [shoots, query, filters, sort, closedStages])

  function setView(next: View) {
    setParams((current) => {
      const updated = new URLSearchParams(current)
      updated.set('view', next)
      return updated
    })
  }

  const shootViews = savedViews.filter((v) => v.scope === 'shoots')

  return (
    <div className="animate-in">
      <PageHeader
        eyebrow="Studio"
        title="Shoots"
        description="Every piece of work the studio has in hand, from first conversation to final delivery."
        actions={
          <>
            <SegmentedControl
              value={view}
              onChange={setView}
              segments={VIEWS}
              label="Shoot view"
              size="sm"
              className="hidden sm:inline-flex"
            />
            <Menu
              label="Choose view"
              items={VIEWS.map((v) => ({
                label: v.label,
                selected: v.value === view,
                onSelect: () => setView(v.value),
              }))}
              trigger={({ onClick, ...rest }) => (
                <Button className="sm:hidden" onClick={onClick} {...rest}>
                  {VIEWS.find((v) => v.value === view)?.label}
                </Button>
              )}
            />
            <NewShootButton />
          </>
        }
      />

      <FilterBar
        query={query}
        onQuery={setQuery}
        searchLabel="Search shoots"
        groups={groups}
        filters={filters}
        onToggle={toggle}
        onClear={clear}
        activeCount={activeCount}
        sort={sort}
        onSort={setSort}
        sortOptions={SORTS}
        savedViews={shootViews}
        onApplyView={(v) => {
          setFilters(v.filters as Record<string, string[]>)
          if (v.sort) setSort(v.sort)
          if (v.layout) setView(v.layout as View)
          toast.show(`Applied “${v.name}”`)
        }}
        onSaveView={(name) => {
          saveView({ scope: 'shoots', name, filters, sort, layout: view })
          toast.success(`Saved “${name}”`)
        }}
        onDeleteView={(id) => {
          deleteView(id)
          toast.show('View deleted')
        }}
        resultCount={filtered.length}
        entity="shoot"
      />

      {shoots.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid size={20} />}
          title="No shoots yet"
          body="Shoots are where briefs, moodboards, tasks and approvals come together. Start with the client and the shape of the work."
          size="lg"
          action={<NewShootButton />}
        />
      ) : filtered.length === 0 ? (
        <NoResults query={query} onClear={clear} entity="shoots" />
      ) : view === 'gallery' ? (
        <GalleryView shoots={filtered} />
      ) : view === 'board' ? (
        <BoardView shoots={filtered} />
      ) : view === 'timeline' ? (
        <ShootTimeline shoots={filtered} />
      ) : (
        <ListView shoots={filtered} />
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- views -- */

function GalleryView({ shoots }: { shoots: Shoot[] }) {
  return (
    <ul className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {shoots.map((shoot, index) => (
        <li key={shoot.id} style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}>
          <ShootCard shoot={shoot} size="lg" />
        </li>
      ))}
    </ul>
  )
}

function ListView({ shoots }: { shoots: Shoot[] }) {
  return (
    <ul className="stagger flex flex-col gap-2">
      {shoots.map((shoot, index) => (
        <li key={shoot.id} style={{ animationDelay: `${Math.min(index, 10) * 25}ms` }}>
          <ShootRow shoot={shoot} />
        </li>
      ))}
    </ul>
  )
}

/**
 * Board view is the lifecycle: one column per stage, from the enquiry landing
 * to the licence lapsing. Dragging is the fast path and every card also carries
 * a "move to" menu, because a drag is not something you can do from a keyboard
 * without one.
 */
function BoardView({ shoots }: { shoots: Shoot[] }) {
  const pipeline = useSortedPipeline()
  const moveShoot = useStore((s) => s.moveShoot)
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
    const shoot = shoots.find((s) => s.id === active.id)
    const stage = pipeline.find((s) => s.id === stageId)
    if (!shoot || !stage || shoot.stageId === stageId) return
    const from = shoot.stageId
    moveShoot(shoot.id, stageId)
    toast.success(`${shoot.name} → ${stage.name}`, {
      action: { label: 'Undo', onClick: () => moveShoot(shoot.id, from) },
    })
  }

  const dragShoot = dragId ? shoots.find((s) => s.id === dragId) : undefined

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
              stage={stage}
              shoots={sortBy(
                shoots.filter((s) => s.stageId === stage.id),
                (s) => s.expectedCloseDate,
              )}
            />
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.22,1,0.36,1)' }}>
        {dragShoot ? (
          <div className="w-72 rotate-2">
            <ShootBoardCard shoot={dragShoot} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function StageColumn({ stage, shoots }: { stage: PipelineStage; shoots: Shoot[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })
  const total = sum(shoots.map((s) => lineItemsTotal(s.lineItems)))

  return (
    <section className="flex w-72 shrink-0 flex-col">
      <header className="mb-1 flex items-baseline justify-between gap-2 px-1">
        <h2 className="flex items-baseline gap-2 text-base font-medium">
          {stage.name}
          <span className="tabular text-sm text-ink-faint">{shoots.length}</span>
        </h2>
        <span className="tabular text-sm text-ink-muted">
          {formatCurrency(total, { compact: true })}
        </span>
      </header>
      <p className="mb-2 px-1 text-2xs text-ink-faint">{STAGE_KINDS[stage.kind].hint}</p>

      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-32 flex-1 flex-col gap-2.5 rounded-2xl p-2 transition-colors duration-base',
          'bg-surface/60',
          stage.kind === 'won' && 'bg-positive-wash/40',
          stage.kind === 'lost' && 'bg-canvas-sunk/60',
          stage.kind === 'licensing' && 'bg-lime-wash/50',
          isOver && 'bg-lime-pale',
        )}
      >
        {shoots.map((shoot) => (
          <DraggableShoot key={shoot.id} shoot={shoot} stageId={stage.id} />
        ))}
        {shoots.length === 0 && (
          <p className="px-2 py-8 text-center text-sm text-ink-faint">
            {isOver ? `Drop into ${stage.name}` : 'Nothing here'}
          </p>
        )}
      </div>
    </section>
  )
}

function DraggableShoot({ shoot, stageId }: { shoot: Shoot; stageId: ID }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } =
    useDraggable({ id: shoot.id })
  const pipeline = useSortedPipeline()
  const moveShoot = useStore((s) => s.moveShoot)

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn('group relative', isDragging && 'opacity-40')}
    >
      <ShootBoardCard shoot={shoot} />

      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`Drag ${shoot.name} to another stage`}
        className="absolute top-2 right-9 z-10 grid size-7 cursor-grab place-items-center rounded-full bg-[#0a0a0a]/45 text-[#f2f2f0] opacity-0 backdrop-blur-sm transition-opacity duration-fast focus-visible:opacity-100 group-hover:opacity-100 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} aria-hidden />
      </button>

      <div className="absolute top-2 right-2 z-10">
        <Menu
          label={`Move ${shoot.name} to another stage`}
          items={pipeline
            .filter((s) => s.id !== stageId)
            .map((s) => ({
              label: `Move to ${s.name}`,
              onSelect: () => {
                moveShoot(shoot.id, s.id)
                toast.success(`${shoot.name} moved to ${s.name}`, {
                  action: { label: 'Undo', onClick: () => moveShoot(shoot.id, stageId) },
                })
              },
            }))}
          trigger={({ onClick, ...rest }) => (
            <button
              type="button"
              onClick={onClick}
              aria-label={`Move ${shoot.name} to another stage`}
              className="grid size-7 place-items-center rounded-full bg-[#0a0a0a]/45 text-[#f2f2f0] backdrop-blur-sm transition-colors duration-fast hover:bg-[#0a0a0a]/70"
              {...rest}
            >
              <span aria-hidden>⋯</span>
            </button>
          )}
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ new button -- */

function NewShootButton() {
  const openQuickAdd = useUI((s) => s.openQuickAdd)
  return (
    <Button variant="primary" icon={<Plus size={16} />} onClick={() => openQuickAdd('shoot')}>
      New shoot
    </Button>
  )
}
