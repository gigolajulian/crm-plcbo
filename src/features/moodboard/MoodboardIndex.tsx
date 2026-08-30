import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Images, Pin } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { cn, formatRelativeTime, matches, pluralize, sortBy } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, Pill } from '@/components/ui/primitives'
import { SearchInput } from '@/components/ui/form'
import { EmptyState, NoResults } from '@/components/ui/feedback'
import { Img } from '@/components/common/Img'
import { LinkedRecord } from '@/components/common/records'
import { MOOD_KIND_LABELS } from '@/data/types'

/* ============================================================================
   MOODBOARD INDEX
   Every board in the studio, shown as a visual contact sheet. This is the
   "wander through the work" screen rather than an operational one.
   ========================================================================== */

export default function MoodboardIndex() {
  const [query, setQuery] = useState('')
  const boards = useStore((s) => s.moodboards)
  const items = useStore((s) => s.moodItems)
  const projects = useStore((s) => s.projects)
  const companies = useStore((s) => s.companies)

  const cards = useMemo(() => {
    const list = boards.map((board) => {
      const project = projects.find((p) => p.id === board.projectId)
      const company = companies.find((c) => c.id === project?.companyId)
      const boardItems = items.filter((i) => i.boardId === board.id)
      // Lead with pinned references — they are the ones people chose to hoist.
      const preview = sortBy(boardItems, (i) => (i.pinned ? 0 : 1)).filter(
        (i) => i.kind === 'image' || i.kind === 'shot' || i.kind === 'material',
      )
      return {
        board,
        project,
        company,
        count: boardItems.length,
        pinned: boardItems.filter((i) => i.pinned).length,
        kinds: Array.from(new Set(boardItems.map((i) => i.kind))),
        preview: preview.slice(0, 5),
      }
    })

    const filtered = query
      ? list.filter((card) =>
          matches(`${card.board.title} ${card.project?.name ?? ''} ${card.company?.name ?? ''}`, query),
        )
      : list

    return sortBy(filtered, (c) => c.board.updatedAt, -1)
  }, [boards, items, projects, companies, query])

  return (
    <div className="animate-in">
      <PageHeader
        eyebrow="Inspiration"
        title="Moodboards"
        description="Every reference the studio is holding on to, one board per project."
        actions={
          <SearchInput
            value={query}
            onChange={setQuery}
            label="Search moodboards"
            placeholder="Search moodboards"
            className="w-full sm:w-64"
          />
        }
      />

      {boards.length === 0 ? (
        <EmptyState
          icon={<Images size={20} />}
          title="No moodboards yet"
          body="Every project gets one automatically. Start a project and the board comes with it."
          size="lg"
        />
      ) : cards.length === 0 ? (
        <NoResults query={query} onClear={() => setQuery('')} entity="moodboards" />
      ) : (
        <ul className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card, index) => (
            <li key={card.board.id} style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}>
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
                      Nothing visual yet
                    </div>
                  ) : (
                    <>
                      <div className="col-span-2 row-span-2">
                        <Img
                          src={
                            card.preview[0].payload.kind === 'image' ||
                            card.preview[0].payload.kind === 'shot' ||
                            card.preview[0].payload.kind === 'material'
                              ? card.preview[0].payload.url
                              : undefined
                          }
                          seed={card.board.id}
                          alt=""
                          className="h-full w-full"
                          imgClassName="transition-transform duration-slow ease-out-soft group-hover:scale-[1.05]"
                        />
                      </div>
                      {card.preview.slice(1, 5).map((item, i) => (
                        <div key={item.id}>
                          <Img
                            src={
                              item.payload.kind === 'image' ||
                              item.payload.kind === 'shot' ||
                              item.payload.kind === 'material'
                                ? item.payload.url
                                : undefined
                            }
                            seed={`${card.board.id}-${i}`}
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
                        to={`/projects/${card.board.projectId}?tab=moodboard`}
                        className="after:absolute after:inset-0 after:content-['']"
                      >
                        {card.board.title}
                      </Link>
                    </h2>
                    {card.company && (
                      <p className="truncate text-sm text-ink-muted">{card.company.name}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {card.kinds.slice(0, 4).map((kind) => (
                      <Pill key={kind} tone="neutral" size="sm">
                        {MOOD_KIND_LABELS[kind]}
                      </Pill>
                    ))}
                  </div>

                  <div className="mt-auto flex items-center gap-3 border-t border-line-soft pt-3 text-xs text-ink-faint">
                    <span>{pluralize(card.count, 'reference')}</span>
                    {card.pinned > 0 && (
                      <span className="flex items-center gap-1">
                        <Pin size={10} aria-hidden />
                        {card.pinned}
                      </span>
                    )}
                    <span className={cn('ml-auto')}>{formatRelativeTime(card.board.updatedAt)}</span>
                  </div>

                  {card.project && (
                    <div className="relative z-10">
                      <LinkedRecord kind="project" id={card.project.id} size="sm" />
                    </div>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
