import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Images, Pin } from 'lucide-react'
import type { MoodItem, Shoot } from '@/data/types'
import { MOOD_KIND_LABELS } from '@/data/types'
import { useStore } from '@/store/useStore'
import { formatRelativeTime, pluralize, sortBy } from '@/lib/utils'
import { Card, Pill } from '@/components/ui/primitives'
import { EmptyState } from '@/components/ui/feedback'
import { Img } from '@/components/common/Img'

/* ============================================================================
   BOARDS VIEW

   The moodboards, in place. They used to live behind their own nav item, which
   meant the references for a shoot sat one section away from the shoot itself.
   They are a way of looking at the same list of work — so they are a view on
   this page, filtered by whatever the filter bar is filtering, and each card
   opens the shoot's own board rather than a separate screen.
   ========================================================================== */

export function ShootBoards({ shoots }: { shoots: Shoot[] }) {
  const boards = useStore((s) => s.moodboards)
  const items = useStore((s) => s.moodItems)
  const companies = useStore((s) => s.companies)

  const cards = useMemo(
    () =>
      shoots.map((shoot) => {
        const board = boards.find((b) => b.shootId === shoot.id)
        const boardItems = board ? items.filter((i) => i.boardId === board.id) : []
        // Lead with pinned references — they are the ones someone chose to hoist.
        const preview = sortBy(boardItems, (i) => (i.pinned ? 0 : 1)).filter(
          (i) => i.kind === 'image' || i.kind === 'shot' || i.kind === 'material',
        )
        return {
          shoot,
          board,
          company: companies.find((c) => c.id === shoot.companyId),
          count: boardItems.length,
          pinned: boardItems.filter((i) => i.pinned).length,
          kinds: Array.from(new Set(boardItems.map((i) => i.kind))),
          preview: preview.slice(0, 5),
          updatedAt: board?.updatedAt,
        }
      }),
    [shoots, boards, items, companies],
  )

  if (cards.length === 0) {
    return (
      <EmptyState
        icon={<Images size={20} />}
        title="No boards to show"
        body="Every shoot carries a moodboard. Start a shoot and its board comes with it."
        size="lg"
      />
    )
  }

  return (
    <ul className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card, index) => (
        <li key={card.shoot.id} style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}>
          <Card
            variant="raised"
            padding="none"
            radius="2xl"
            interactive
            className="group relative flex h-full flex-col overflow-hidden"
          >
            {/* contact sheet: one lead image plus a strip of four */}
            <div className="grid h-44 grid-cols-4 grid-rows-2 gap-0.5 bg-line-soft">
              {card.preview.length === 0 ? (
                <div className="col-span-4 row-span-2 grid place-items-center bg-surface text-sm text-ink-faint">
                  Nothing pinned yet
                </div>
              ) : (
                <>
                  <div className="col-span-2 row-span-2">
                    <Img
                      src={referenceUrl(card.preview[0])}
                      seed={card.shoot.artSeed}
                      alt=""
                      className="h-full w-full"
                      imgClassName="transition-transform duration-slow ease-out-soft group-hover:scale-[1.05]"
                    />
                  </div>
                  {card.preview.slice(1, 5).map((item, i) => (
                    <div key={item.id}>
                      <Img
                        src={referenceUrl(item)}
                        seed={`${card.shoot.id}-${i}`}
                        alt=""
                        className="h-full w-full"
                      />
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-2.5 p-4">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-medium tracking-tight">
                  <Link
                    to={`/shoots/${card.shoot.id}?tab=moodboard`}
                    className="after:absolute after:inset-0 after:content-['']"
                  >
                    {card.board?.title ?? card.shoot.name}
                  </Link>
                </h2>
                {card.company && (
                  <p className="truncate text-sm text-ink-muted">{card.company.name}</p>
                )}
              </div>

              {card.kinds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {card.kinds.slice(0, 4).map((kind) => (
                    <Pill key={kind} tone="neutral" size="sm">
                      {MOOD_KIND_LABELS[kind]}
                    </Pill>
                  ))}
                </div>
              )}

              <div className="mt-auto flex items-center gap-3 border-t border-line-soft pt-3 text-xs text-ink-faint">
                <span>{pluralize(card.count, 'reference')}</span>
                {card.pinned > 0 && (
                  <span className="flex items-center gap-1">
                    <Pin size={10} aria-hidden />
                    {card.pinned}
                  </span>
                )}
                {card.updatedAt && (
                  <span className="ml-auto">{formatRelativeTime(card.updatedAt)}</span>
                )}
              </div>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  )
}

/** Only the visual reference kinds carry a url; the rest draw a placeholder. */
function referenceUrl(item: MoodItem): string | undefined {
  return item.payload.kind === 'image' ||
    item.payload.kind === 'shot' ||
    item.payload.kind === 'material'
    ? item.payload.url
    : undefined
}
