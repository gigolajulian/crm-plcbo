import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import {
  FolderPlus,
  Images,
  Pin,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import type { ID, MoodItem, MoodItemKind } from '@/data/types'
import { MOOD_KIND_LABELS } from '@/data/types'
import { useStore } from '@/store/useStore'
import { cn, matches, sortBy } from '@/lib/utils'
import { Button, Chip, IconButton, Pill } from '@/components/ui/primitives'
import { InlineEdit, SearchInput } from '@/components/ui/form'
import { ConfirmDialog, Lightbox } from '@/components/ui/overlay'
import { EmptyState, NoResults, toast } from '@/components/ui/feedback'
import { Img } from '@/components/common/Img'
import { Avatar } from '@/components/ui/Avatar'
import { MoodItemBody, SortableMoodItem } from './MoodItemCard'
import { AddReferenceSheet } from './AddReferenceSheet'
import { CosmosPanel } from './CosmosPanel'

/* ============================================================================
   MOODBOARD CANVAS
   A masonry of references grouped into sections. Dragging reorders within a
   section; the item menu moves between sections and doubles as the keyboard
   path. Pinned references are lifted into their own band at the top.
   ========================================================================== */

const KIND_FILTERS: MoodItemKind[] = ['image', 'shot', 'material', 'color', 'type', 'link', 'note']

export function MoodboardCanvas({ shootId }: { shootId: ID }) {
  const ensureMoodboard = useStore((s) => s.ensureMoodboard)
  const boards = useStore((s) => s.moodboards)
  const allSections = useStore((s) => s.moodSections)
  const allItems = useStore((s) => s.moodItems)
  const team = useStore((s) => s.team)

  const reorderMoodItems = useStore((s) => s.reorderMoodItems)
  const moveMoodItemToSection = useStore((s) => s.moveMoodItemToSection)
  const toggleMoodPin = useStore((s) => s.toggleMoodPin)
  const deleteMoodItem = useStore((s) => s.deleteMoodItem)
  const updateMoodItem = useStore((s) => s.updateMoodItem)
  const addMoodSection = useStore((s) => s.addMoodSection)
  const updateMoodSection = useStore((s) => s.updateMoodSection)
  const deleteMoodSection = useStore((s) => s.deleteMoodSection)

  const board = boards.find((b) => b.shootId === shootId)
  const boardId = board?.id

  const [query, setQuery] = useState('')
  const [kinds, setKinds] = useState<MoodItemKind[]>([])
  const [pinnedOnly, setPinnedOnly] = useState(false)
  const [addingTo, setAddingTo] = useState<ID | null>(null)
  const [lightboxId, setLightboxId] = useState<ID | null>(null)
  const [dragId, setDragId] = useState<ID | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ kind: 'item' | 'section'; id: ID } | null>(
    null,
  )

  const sections = useMemo(
    () => sortBy(allSections.filter((s) => s.boardId === boardId), (s) => s.order),
    [allSections, boardId],
  )

  const items = useMemo(
    () => sortBy(allItems.filter((i) => i.boardId === boardId), (i) => i.order),
    [allItems, boardId],
  )

  const visible = useMemo(
    () =>
      items.filter((item) => {
        if (pinnedOnly && !item.pinned) return false
        if (kinds.length > 0 && !kinds.includes(item.kind)) return false
        if (!query) return true
        const haystack = [
          item.caption,
          item.note ?? '',
          item.payload.kind === 'color' ? `${item.payload.name} ${item.payload.hex}` : '',
          item.payload.kind === 'type' ? `${item.payload.family} ${item.payload.sample}` : '',
          item.payload.kind === 'link' ? `${item.payload.title} ${item.payload.site}` : '',
          item.payload.kind === 'note' ? item.payload.body : '',
        ].join(' ')
        return matches(haystack, query)
      }),
    [items, query, kinds, pinnedOnly],
  )

  const pinned = visible.filter((i) => i.pinned)
  const filtering = Boolean(query) || kinds.length > 0 || pinnedOnly

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  if (!boardId) {
    return (
      <EmptyState
        icon={<Images size={20} />}
        title="No moodboard yet"
        body="Every project gets a place to collect references, colours, typefaces and materials."
        action={
          <Button
            variant="primary"
            onClick={() => {
              ensureMoodboard(shootId)
              toast.success('Moodboard created')
            }}
          >
            Create the moodboard
          </Button>
        }
        size="lg"
      />
    )
  }

  const dragItem = dragId ? items.find((i) => i.id === dragId) : undefined
  const lightboxItems = visible.filter(
    (i) => i.kind === 'image' || i.kind === 'shot' || i.kind === 'material',
  )
  const lightboxIndex = lightboxItems.findIndex((i) => i.id === lightboxId)
  const lightboxItem = lightboxItems[lightboxIndex]

  function onDragEnd(event: DragEndEvent) {
    setDragId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    const activeItem = items.find((i) => i.id === active.id)
    const overItem = items.find((i) => i.id === over.id)
    if (!activeItem || !overItem) return

    if (activeItem.sectionId === overItem.sectionId) {
      reorderMoodItems(activeItem.sectionId, String(active.id), String(over.id))
    } else {
      moveMoodItemToSection(String(active.id), overItem.sectionId, overItem.order)
      toast.show('Moved to another section')
    }
  }

  function itemMenu(item: MoodItem) {
    const otherSections = sections.filter((s) => s.id !== item.sectionId)
    return [
      {
        label: item.pinned ? 'Unpin' : 'Pin to the top',
        icon: <Pin size={14} />,
        onSelect: () => toggleMoodPin(item.id),
      },
      ...otherSections.map((section) => ({
        label: `Move to ${section.title}`,
        onSelect: () => {
          moveMoodItemToSection(item.id, section.id)
          toast.success(`Moved to ${section.title}`)
        },
      })),
      {
        label: 'Remove',
        icon: <Trash2 size={14} />,
        destructive: true,
        onSelect: () => setConfirmDelete({ kind: 'item', id: item.id }),
      },
    ]
  }

  return (
    <div>
      {board && <CosmosPanel board={board} />}

      {/* ------------------------------------------------------- toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <SearchInput
          value={query}
          onChange={setQuery}
          label="Search references"
          placeholder="Search references"
          className="min-w-0 flex-1 sm:max-w-64"
        />

        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-0.5">
          <Chip selected={pinnedOnly} onClick={() => setPinnedOnly((v) => !v)}>
            <Pin size={12} aria-hidden />
            Pinned
          </Chip>
          {KIND_FILTERS.map((kind) => (
            <Chip
              key={kind}
              selected={kinds.includes(kind)}
              onClick={() =>
                setKinds((current) =>
                  current.includes(kind) ? current.filter((k) => k !== kind) : [...current, kind],
                )
              }
            >
              {MOOD_KIND_LABELS[kind]}
            </Chip>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            icon={<FolderPlus size={15} />}
            onClick={() => {
              const id = addMoodSection(boardId, 'New section')
              toast.success('Section added', { detail: 'Rename it by clicking the title.' })
              window.setTimeout(
                () => document.getElementById(`section-${id}`)?.scrollIntoView({ block: 'center' }),
                60,
              )
            }}
          >
            <span className="hidden sm:inline">Section</span>
          </Button>
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => setAddingTo(sections[0]?.id ?? null)}
            disabled={sections.length === 0}
          >
            Add reference
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Sparkles size={20} />}
          title="An empty board is a good place to start"
          body="Drop in the photograph that started it, the colour you cannot stop thinking about, the typeface you want to argue for. Sort it out later."
          action={
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setAddingTo(sections[0]?.id ?? null)}>
              Add the first reference
            </Button>
          }
          size="lg"
        />
      ) : visible.length === 0 ? (
        <NoResults
          query={query}
          entity="references"
          onClear={() => {
            setQuery('')
            setKinds([])
            setPinnedOnly(false)
          }}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(event: DragStartEvent) => setDragId(String(event.active.id))}
          onDragCancel={() => setDragId(null)}
          onDragEnd={onDragEnd}
        >
          {/* -------------------------------------------------- pinned band
              Pinned references are lifted out of their section rather than
              copied, so nothing on the board is ever shown twice. */}
          {pinned.length > 0 && !pinnedOnly && (
            <section className="mb-8">
              <header className="mb-3 flex flex-wrap items-center gap-2">
                <Pill tone="lime" icon={<Pin size={11} />}>
                  Pinned
                </Pill>
                <span className="tabular text-sm text-ink-faint">{pinned.length}</span>
                <span className="text-xs text-ink-faint">
                  Lifted out of their sections below
                </span>
              </header>
              <div className="columns-2 gap-4 md:columns-3 xl:columns-4">
                {pinned.map((item) => (
                  <div key={`pin-${item.id}`} className="group mb-4 break-inside-avoid">
                    <MoodItemBody
                      item={item}
                      onOpen={() => setLightboxId(item.id)}
                      onTogglePin={() => toggleMoodPin(item.id)}
                      menuItems={itemMenu(item)}
                      onCaption={(caption) => updateMoodItem(item.id, { caption })}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ---------------------------------------------------- sections */}
          <div className="flex flex-col gap-10">
            {sections.map((section) => {
              const inSection = visible.filter((i) => i.sectionId === section.id)
              // While the band is up, its items are shown there, not here.
              const sectionItems = pinnedOnly ? inSection : inSection.filter((i) => !i.pinned)
              const liftedCount = inSection.length - sectionItems.length
              if (filtering && inSection.length === 0) return null

              return (
                <section key={section.id} id={`section-${section.id}`}>
                  <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-xl font-medium tracking-title">
                        <InlineEdit
                          value={section.title}
                          label={`Section title: ${section.title}`}
                          onCommit={(title) => updateMoodSection(section.id, { title })}
                        />
                        <span className="tabular ml-2 text-base font-normal text-ink-faint">
                          {inSection.length}
                        </span>
                      </h3>
                      {liftedCount > 0 && (
                        <p className="mt-0.5 text-xs text-ink-faint">
                          {liftedCount} pinned above
                        </p>
                      )}
                      {section.description && (
                        <p className="mt-1 max-w-xl text-sm text-pretty text-ink-muted">
                          {section.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" icon={<Plus size={14} />} onClick={() => setAddingTo(section.id)}>
                        Add
                      </Button>
                      <IconButton
                        label={`Delete section ${section.title}`}
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmDelete({ kind: 'section', id: section.id })}
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </div>
                  </header>

                  {sectionItems.length === 0 ? (
                    liftedCount > 0 ? (
                      <p className="rounded-2xl bg-surface px-4 py-6 text-center text-sm text-ink-muted">
                        Everything in {section.title} is pinned to the top.
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAddingTo(section.id)}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line py-10 text-sm text-ink-muted transition-colors duration-fast hover:border-ink-faint hover:text-ink"
                      >
                        <Plus size={15} aria-hidden />
                        Add the first reference to {section.title}
                      </button>
                    )
                  ) : (
                    <SortableContext
                      items={sectionItems.map((i) => i.id)}
                      strategy={rectSortingStrategy}
                    >
                      <div className="columns-2 gap-4 md:columns-3 xl:columns-4">
                        {sectionItems.map((item) => (
                          <SortableMoodItem
                            key={item.id}
                            item={item}
                            onOpen={() => setLightboxId(item.id)}
                            onTogglePin={() => toggleMoodPin(item.id)}
                            menuItems={itemMenu(item)}
                      onCaption={(caption) => updateMoodItem(item.id, { caption })}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  )}
                </section>
              )
            })}
          </div>

          <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.22,1,0.36,1)' }}>
            {dragItem ? (
              <div className="w-56 rotate-2 opacity-95">
                <MoodItemBody item={dragItem} preview />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* ------------------------------------------------------ lightbox */}
      <Lightbox
        open={Boolean(lightboxItem)}
        onClose={() => setLightboxId(null)}
        onPrev={
          lightboxIndex > 0 ? () => setLightboxId(lightboxItems[lightboxIndex - 1].id) : undefined
        }
        onNext={
          lightboxIndex < lightboxItems.length - 1
            ? () => setLightboxId(lightboxItems[lightboxIndex + 1].id)
            : undefined
        }
        caption={lightboxItem?.caption}
        meta={
          lightboxItem && (
            <span className="flex items-center gap-2.5">
              <Avatar
                name={team.find((m) => m.id === lightboxItem.addedBy)?.name ?? 'Studio'}
                src={team.find((m) => m.id === lightboxItem.addedBy)?.avatar}
                size="sm"
              />
              <span className="text-sm">
                <span className="block">
                  Added by {team.find((m) => m.id === lightboxItem.addedBy)?.name ?? 'the studio'}
                </span>
                <span className="block text-xs opacity-60">
                  {lightboxIndex + 1} of {lightboxItems.length}
                </span>
              </span>
            </span>
          )
        }
      >
        {lightboxItem && lightboxItem.payload.kind !== 'link' && lightboxItem.payload.kind !== 'color' &&
          lightboxItem.payload.kind !== 'type' && lightboxItem.payload.kind !== 'note' && (
            <Img
              src={lightboxItem.payload.url}
              seed={lightboxItem.payload.artSeed}
              alt={lightboxItem.caption || 'Reference'}
              eager
              className={cn('max-h-[70vh] rounded-lg')}
              imgClassName="max-h-[70vh] w-auto object-contain"
            />
          )}
      </Lightbox>

      {/* -------------------------------------------------- add reference */}
      <AddReferenceSheet
        boardId={boardId}
        sectionId={addingTo}
        sections={sections}
        onClose={() => setAddingTo(null)}
      />

      {/* ------------------------------------------------------- confirms */}
      <ConfirmDialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title={confirmDelete?.kind === 'section' ? 'Delete this section?' : 'Remove this reference?'}
        body={
          confirmDelete?.kind === 'section'
            ? 'Every reference inside it will be removed too. This cannot be undone.'
            : 'It will be removed from the moodboard. This cannot be undone.'
        }
        confirmLabel={confirmDelete?.kind === 'section' ? 'Delete section' : 'Remove'}
        destructive
        onConfirm={() => {
          if (!confirmDelete) return
          if (confirmDelete.kind === 'section') {
            deleteMoodSection(confirmDelete.id)
            toast.show('Section deleted')
          } else {
            deleteMoodItem(confirmDelete.id)
            toast.show('Reference removed')
          }
        }}
      />
    </div>
  )
}
