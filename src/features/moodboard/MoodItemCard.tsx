import { forwardRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ExternalLink, GripVertical, Pin, Quote } from 'lucide-react'
import type { MoodItem } from '@/data/types'
import { MOOD_KIND_LABELS } from '@/data/types'
import { cn, hexToRgb, readableOn } from '@/lib/utils'
import { Img } from '@/components/common/Img'
import { TagList } from '@/components/common/records'
import { IconButton, Pill } from '@/components/ui/primitives'
import { Menu, type MenuItem } from '@/components/ui/overlay'
import { InlineEdit } from '@/components/ui/form'

/* ============================================================================
   MOOD ITEM
   Six kinds, each with a card designed for what it actually is: a photograph
   crops, a colour shows its value, a typeface renders a real specimen, a note
   reads as a quote. A generic "card with a thumbnail" would waste all of them.
   ========================================================================== */

export interface MoodItemCardProps {
  item: MoodItem
  onOpen?: () => void
  onTogglePin?: () => void
  menuItems?: MenuItem[]
  /** When provided, the caption becomes editable in place. */
  onCaption?: (caption: string) => void
  /** Rendered inside the drag overlay — no interaction, no sortable wiring. */
  preview?: boolean
}

/** The card body, without any drag behaviour. Shared by the grid and the overlay. */
export const MoodItemBody = forwardRef<HTMLDivElement, MoodItemCardProps & { dragging?: boolean }>(
  function MoodItemBody({ item, onOpen, onTogglePin, menuItems, onCaption, dragging, preview }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex flex-col overflow-hidden rounded-xl bg-raised shadow-sm',
          'transition-[box-shadow,transform] duration-base ease-out-soft',
          !preview && 'hover:-translate-y-0.5 hover:shadow-lift',
          dragging && 'opacity-40',
        )}
      >
        {/* --------------------------------------------------------- media */}
        {(item.kind === 'image' || item.kind === 'shot' || item.kind === 'material') &&
          item.payload.kind !== 'link' &&
          item.payload.kind !== 'color' &&
          item.payload.kind !== 'type' &&
          item.payload.kind !== 'note' && (
            <button
              type="button"
              onClick={onOpen}
              disabled={preview}
              aria-label={`Open ${item.caption || MOOD_KIND_LABELS[item.kind]}`}
              className="relative block w-full cursor-zoom-in"
            >
              <Img
                src={item.payload.url}
                seed={item.payload.artSeed}
                alt={item.caption || 'Reference image'}
                ratio={item.payload.ratio}
                className="w-full"
                imgClassName={cn(
                  'transition-transform duration-slow ease-out-soft',
                  !preview && 'group-hover:scale-[1.04]',
                )}
              />
              {item.kind === 'material' && (
                <span className="absolute bottom-2 left-2">
                  <Pill tone="ink" size="sm">
                    Material
                  </Pill>
                </span>
              )}
            </button>
          )}

        {/* --------------------------------------------------------- colour */}
        {item.payload.kind === 'color' && (
          <div
            className="flex aspect-[4/3] flex-col justify-end p-4"
            style={{ backgroundColor: item.payload.hex }}
          >
            <p
              className="text-base font-medium"
              style={{ color: readableOn(item.payload.hex) }}
            >
              {item.payload.name}
            </p>
            <p
              className="tabular mt-0.5 text-xs opacity-70"
              style={{ color: readableOn(item.payload.hex) }}
            >
              {item.payload.hex.toUpperCase()} ·{' '}
              {(() => {
                const { r, g, b } = hexToRgb(item.payload.hex)
                return `${r} ${g} ${b}`
              })()}
            </p>
          </div>
        )}

        {/* ------------------------------------------------------ typeface */}
        {item.payload.kind === 'type' && (
          <div className="flex aspect-[4/3] flex-col justify-between bg-surface p-4">
            <p className="eyebrow">{item.payload.family}</p>
            <p
              className="truncate text-[clamp(1.5rem,4.5vw,2.25rem)] leading-none"
              style={{ fontFamily: item.payload.stack, fontWeight: item.payload.weight }}
            >
              {item.payload.sample}
            </p>
            <p className="text-xs text-pretty text-ink-muted">{item.payload.usage}</p>
          </div>
        )}

        {/* ---------------------------------------------------------- link */}
        {item.payload.kind === 'link' && (
          <a
            href={item.payload.url}
            target="_blank"
            rel="noreferrer noopener"
            className="flex flex-col gap-2 bg-lime-wash p-4 transition-colors duration-fast hover:bg-lime-pale"
          >
            <span className="eyebrow flex items-center gap-1.5">
              <ExternalLink size={11} aria-hidden />
              {item.payload.site}
            </span>
            <span className="text-base leading-snug font-medium text-balance">
              {item.payload.title}
            </span>
          </a>
        )}

        {/* ---------------------------------------------------------- note */}
        {item.payload.kind === 'note' && (
          <blockquote className="flex flex-col gap-3 bg-inverse p-5 text-on-inverse">
            <Quote size={16} className="shrink-0 opacity-50" aria-hidden />
            <p className="text-base leading-relaxed text-pretty">{item.payload.body}</p>
          </blockquote>
        )}

        {/* ------------------------------------------------------- caption */}
        {(item.caption || item.tags.length > 0 || onCaption) && (
          <div className="flex flex-col gap-2 p-3">
            {onCaption && !preview ? (
              <InlineEdit
                as="p"
                value={item.caption}
                placeholder="Add a caption"
                label={`Caption for this ${MOOD_KIND_LABELS[item.kind].toLowerCase()}`}
                onCommit={onCaption}
                className="text-sm leading-snug text-pretty text-ink-muted"
              />
            ) : (
              item.caption && (
                <p className="text-sm leading-snug text-pretty text-ink-muted">{item.caption}</p>
              )
            )}
            {item.tags.length > 0 && <TagList ids={item.tags} max={3} />}
          </div>
        )}

        {/* ------------------------------------------------------ controls */}
        {!preview && (
          <div
            className={cn(
              'absolute top-2 right-2 flex items-center gap-1',
              'opacity-0 transition-opacity duration-fast group-focus-within:opacity-100 group-hover:opacity-100',
              item.pinned && 'opacity-100',
            )}
          >
            {onTogglePin && (
              <IconButton
                label={item.pinned ? 'Unpin reference' : 'Pin reference'}
                size="sm"
                onClick={onTogglePin}
                className={cn(
                  'shadow-sm backdrop-blur-sm',
                  item.pinned ? 'bg-lime text-[#0a0a0a] hover:bg-lime-deep' : 'bg-raised/90',
                )}
              >
                <Pin size={13} className={item.pinned ? 'fill-current' : undefined} />
              </IconButton>
            )}
            {menuItems && menuItems.length > 0 && (
              <Menu
                label={`Actions for ${item.caption || MOOD_KIND_LABELS[item.kind]}`}
                items={menuItems}
                trigger={({ onClick, ...rest }) => (
                  <IconButton
                    label="Reference actions"
                    size="sm"
                    onClick={onClick}
                    className="bg-raised/90 shadow-sm backdrop-blur-sm"
                    {...rest}
                  >
                    <span aria-hidden>⋯</span>
                  </IconButton>
                )}
              />
            )}
          </div>
        )}

      </div>
    )
  },
)

/** Grid cell: the card plus a keyboard-and-pointer drag handle. */
export function SortableMoodItem(props: MoodItemCardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.item.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('group relative mb-4 break-inside-avoid', isDragging && 'z-20')}
    >
      <MoodItemBody {...props} dragging={isDragging} />

      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`Reorder ${props.item.caption || 'reference'}. Press space, then use the arrow keys.`}
        className={cn(
          'absolute top-2 left-2 grid size-7 cursor-grab place-items-center rounded-full bg-raised/90 shadow-sm backdrop-blur-sm',
          'opacity-0 transition-opacity duration-fast focus-visible:opacity-100 group-hover:opacity-100',
          'active:cursor-grabbing',
        )}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={13} aria-hidden />
      </button>
    </div>
  )
}
