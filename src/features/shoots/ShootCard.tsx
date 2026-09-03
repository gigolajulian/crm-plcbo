import { Link } from 'react-router-dom'
import { Images, MessageSquare, Paperclip } from 'lucide-react'
import type { Shoot } from '@/data/types'
import { useStore } from '@/store/useStore'
import { useShootVitals } from '@/store/selectors'
import { cn, formatCurrency, pluralize } from '@/lib/utils'
import { Card, Meter, Pill, ProgressRing } from '@/components/ui/primitives'
import { AvatarStack } from '@/components/ui/Avatar'
import { Img } from '@/components/common/Img'
import { DueBadge, HealthBadge, StageBadge, TagList } from '@/components/common/records'

/** References held on this shoot's board. Counted here, not in a selector. */
function useReferenceCount(shootId: string) {
  const boards = useStore((s) => s.moodboards)
  const items = useStore((s) => s.moodItems)
  const board = boards.find((b) => b.shootId === shootId)
  return board ? items.filter((i) => i.boardId === board.id).length : 0
}

/**
 * The gallery shoot card.
 *
 * Uses a stretched link: the title anchor covers the whole card via a
 * pseudo-element, so the card is one big target while the company link and
 * other controls stay individually reachable — and no anchor nests in another.
 */
export function ShootCard({
  shoot,
  size = 'md',
}: {
  shoot: Shoot
  size?: 'md' | 'lg'
}) {
  const team = useStore((s) => s.team)
  const company = useStore((s) => s.companies.find((c) => c.id === shoot.companyId))
  const vitals = useShootVitals(shoot.id)
  const references = useReferenceCount(shoot.id)

  const members = team.filter((m) => shoot.memberIds.includes(m.id))
  const owner = team.find((m) => m.id === shoot.ownerId)

  return (
    <Card
      variant="raised"
      padding="none"
      radius="2xl"
      interactive
      className="group relative flex h-full flex-col overflow-hidden"
    >
      <div className="relative">
        <Img
          src={shoot.coverUrl}
          seed={shoot.artSeed}
          alt=""
          ratio={size === 'lg' ? 16 / 10 : 3 / 2}
          className="w-full"
          imgClassName="transition-transform duration-slow ease-out-soft group-hover:scale-[1.03]"
        />
        <span className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <Pill tone="ink" size="sm" className="backdrop-blur-sm">
            {shoot.code}
          </Pill>
          {shoot.health !== 'on-track' && <HealthBadge health={shoot.health} />}
        </span>
        {vitals.awaitingApproval > 0 && (
          <span className="absolute top-3 right-3">
            <Pill tone="lime" size="sm">
              {vitals.awaitingApproval} to review
            </Pill>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className={cn('truncate font-medium tracking-tight', size === 'lg' ? 'text-xl' : 'text-lg')}>
              <Link
                to={`/shoots/${shoot.id}`}
                className="after:absolute after:inset-0 after:content-['']"
              >
                {shoot.name}
              </Link>
            </h3>
            {company && (
              <Link
                to={`/companies/${company.id}`}
                className="relative z-10 mt-0.5 inline-block text-sm text-ink-muted transition-colors duration-fast hover:text-ink"
              >
                {company.name}
              </Link>
            )}
          </div>
          <ProgressRing value={vitals.progress} size={40} label={`${Math.round(vitals.progress * 100)}% of deliverables done`} />
        </div>

        {size === 'lg' && (
          <p className="line-clamp-2 text-sm text-pretty text-ink-muted">{shoot.summary}</p>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <StageBadge stageId={shoot.stageId} />
          <DueBadge date={shoot.expectedCloseDate} />
        </div>

        {size === 'lg' && <TagList ids={shoot.tags} max={3} />}

        <div className="mt-auto flex flex-col gap-3 pt-1">
          <div>
            <div className="mb-1.5 flex items-baseline justify-between text-xs text-ink-muted">
              <span>Collected</span>
              <span className="tabular">
                {formatCurrency(vitals.money.received, { compact: true })} of{' '}
                {formatCurrency(vitals.money.quoted, { compact: true })}
              </span>
            </div>
            <Meter
              value={vitals.collected}
              tone={vitals.money.overdue.length > 0 ? 'critical' : vitals.collected >= 1 ? 'lime' : 'ink'}
              label={`${Math.round(vitals.collected * 100)}% of the quote collected`}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <AvatarStack
              people={members.map((m) => ({ id: m.id, name: m.name, avatar: m.avatar }))}
              max={4}
              size="xs"
            />
            <div className="relative z-10 flex items-center gap-3 text-xs text-ink-faint">
              {references > 0 && (
                <Link
                  to={`/shoots/${shoot.id}?tab=moodboard`}
                  className="flex items-center gap-1 transition-colors duration-fast hover:text-ink"
                  title={pluralize(references, 'reference')}
                >
                  <Images size={12} aria-hidden />
                  <span className="tabular">{references}</span>
                </Link>
              )}
              {vitals.openTasks > 0 && (
                <span className="flex items-center gap-1" title={pluralize(vitals.openTasks, 'open task')}>
                  <Paperclip size={12} aria-hidden />
                  <span className="tabular">{vitals.openTasks}</span>
                </span>
              )}
              {owner && <span className="truncate">{owner.name.split(' ')[0]}</span>}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

/** Compact row used by the list view and by related-shoot sidebars. */
export function ShootRow({ shoot }: { shoot: Shoot }) {
  const company = useStore((s) => s.companies.find((c) => c.id === shoot.companyId))
  const team = useStore((s) => s.team)
  const vitals = useShootVitals(shoot.id)
  const members = team.filter((m) => shoot.memberIds.includes(m.id))

  return (
    <Card
      variant="raised"
      padding="none"
      radius="xl"
      className="group relative flex items-center gap-4 p-3 transition-shadow duration-base hover:shadow-md"
    >
      <Img
        src={shoot.coverUrl}
        seed={shoot.artSeed}
        alt=""
        ratio={1}
        className="w-14 shrink-0 rounded-lg sm:w-16"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-base font-medium">
            <Link to={`/shoots/${shoot.id}`} className="after:absolute after:inset-0 after:content-['']">
              {shoot.name}
            </Link>
          </h3>
          <span className="tabular shrink-0 text-xs text-ink-faint">{shoot.code}</span>
        </div>
        <p className="mt-0.5 truncate text-sm text-ink-muted">
          {company?.name}
          {vitals.openTasks > 0 && ` · ${pluralize(vitals.openTasks, 'open task')}`}
          {vitals.awaitingApproval > 0 && ` · ${vitals.awaitingApproval} awaiting review`}
        </p>
      </div>

      <div className="hidden shrink-0 items-center gap-2 md:flex">
        <StageBadge stageId={shoot.stageId} />
        {shoot.health !== 'on-track' && <HealthBadge health={shoot.health} />}
      </div>

      <div className="hidden w-28 shrink-0 lg:block">
        <Meter
          value={vitals.collected}
          tone={vitals.money.overdue.length > 0 ? 'critical' : 'ink'}
          label="Collected"
        />
        <p className="tabular mt-1 text-right text-2xs text-ink-faint">
          {formatCurrency(vitals.money.quoted, { compact: true })}
        </p>
      </div>

      <div className="hidden shrink-0 xl:block">
        <AvatarStack
          people={members.map((m) => ({ id: m.id, name: m.name, avatar: m.avatar }))}
          max={3}
          size="xs"
        />
      </div>

      <div className="shrink-0">
        <DueBadge date={vitals.nextShootDate ?? shoot.expectedCloseDate} prefix={vitals.nextShootDate ? 'Shoots' : undefined} />
      </div>
    </Card>
  )
}

/** Small card used on the board view, where vertical space is scarce. */
export function ShootBoardCard({ shoot }: { shoot: Shoot }) {
  const company = useStore((s) => s.companies.find((c) => c.id === shoot.companyId))
  const vitals = useShootVitals(shoot.id)

  return (
    <Card
      variant="raised"
      padding="none"
      radius="xl"
      className="group relative overflow-hidden transition-shadow duration-base hover:shadow-md"
    >
      <Img src={shoot.coverUrl} seed={shoot.artSeed} alt="" ratio={16 / 7} className="w-full" />
      <div className="flex flex-col gap-2 p-3.5">
        <h3 className="truncate text-base font-medium">
          <Link to={`/shoots/${shoot.id}`} className="after:absolute after:inset-0 after:content-['']">
            {shoot.name}
          </Link>
        </h3>
        <p className="truncate text-xs text-ink-muted">{company?.name}</p>
        <Meter value={vitals.progress} label="Progress" />
        <div className="flex items-center justify-between gap-2">
          <DueBadge date={vitals.nextShootDate ?? shoot.expectedCloseDate} />
          {vitals.overdueTasks > 0 && (
            <span className="flex items-center gap-1 text-2xs text-critical">
              <MessageSquare size={10} aria-hidden />
              {vitals.overdueTasks} overdue
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}
