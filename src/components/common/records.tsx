import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  Camera,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  FileText,
  Scale,
  User,
} from 'lucide-react'
import type {
  ActivityEvent,
  ApprovalStatus,
  ID,
  PaperworkStatus,
  ShootHealth,
  Tag,
  TaskPriority,
} from '@/data/types'
import { APPROVAL_STATUS, PAPERWORK_STATUS, SHOOT_HEALTH } from '@/data/types'
import { useStore } from '@/store/useStore'
import { cn, daysFromToday, formatRelativeDay } from '@/lib/utils'
import { Pill, StatusDot } from '@/components/ui/primitives'
import { Avatar } from '@/components/ui/Avatar'
import { CompanyMark } from './Img'

/* ============================================================================
   RECORD PRIMITIVES
   One implementation each for the things that appear on many screens: a link
   to another record, a tag list, a due date, a stage, a person.
   ========================================================================== */

/* --------------------------------------------------------- LinkedRecord -- */

const RECORD_ICONS = {
  shoot: Camera,
  contact: User,
  company: Building2,
  invoice: FileText,
  licence: Scale,
}

/**
 * The single way one record links to another. Consistent shape everywhere
 * means cross-navigation is learnable rather than surprising.
 */
export function LinkedRecord({
  kind,
  id,
  size = 'md',
  showKind,
  className,
}: {
  kind: 'shoot' | 'contact' | 'company' | 'invoice' | 'licence'
  id?: ID
  size?: 'sm' | 'md'
  showKind?: boolean
  className?: string
}) {
  const record = useStore((s) => {
    if (!id) return undefined
    if (kind === 'shoot') return s.shoots.find((p) => p.id === id)
    if (kind === 'contact') return s.contacts.find((c) => c.id === id)
    if (kind === 'company') return s.companies.find((c) => c.id === id)
    if (kind === 'invoice') return s.invoices.find((i) => i.id === id)
    return s.licenses.find((l) => l.id === id)
  })

  if (!record) return null
  const Icon = RECORD_ICONS[kind]
  const to =
    kind === 'shoot'
      ? `/shoots/${id}`
      : kind === 'contact'
        ? `/contacts/${id}`
        : kind === 'company'
          ? `/companies/${id}`
          : kind === 'invoice'
            ? `/billing?invoice=${id}`
            : `/licences?licence=${id}`

  return (
    <Link
      to={to}
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-pill text-ink-muted',
        'transition-colors duration-fast ease-out-soft hover:text-ink',
        size === 'sm' ? 'text-xs' : 'text-sm',
        className,
      )}
    >
      <Icon size={size === 'sm' ? 12 : 14} className="shrink-0" aria-hidden />
      <span className="truncate">
        {showKind && <span className="text-ink-faint">{kind} · </span>}
        {'name' in record ? record.name : ''}
      </span>
    </Link>
  )
}

/* -------------------------------------------------------------- TagList -- */

export function TagList({
  ids,
  max,
  size = 'sm',
  className,
}: {
  ids: ID[]
  max?: number
  size?: 'sm' | 'md'
  className?: string
}) {
  const tags = useStore((s) => s.tags)
  const resolved = ids
    .map((id) => tags.find((t) => t.id === id))
    .filter((t): t is Tag => Boolean(t))

  if (resolved.length === 0) return null
  const shown = max ? resolved.slice(0, max) : resolved
  const overflow = resolved.length - shown.length

  return (
    <ul className={cn('flex flex-wrap items-center gap-1', className)}>
      {shown.map((tag) => (
        <li key={tag.id}>
          <Pill tone={tag.tone} size={size}>
            {tag.label}
          </Pill>
        </li>
      ))}
      {overflow > 0 && (
        <li>
          <Pill tone="neutral" size={size}>
            +{overflow}
          </Pill>
        </li>
      )}
    </ul>
  )
}

/* ------------------------------------------------------------- DueBadge -- */

/** A date rendered as urgency, not as a number. */
export function DueBadge({
  date,
  done,
  size = 'sm',
  prefix,
}: {
  date?: string
  done?: boolean
  size?: 'sm' | 'md'
  prefix?: string
}) {
  if (!date) return null
  const delta = daysFromToday(date)
  const tone = done ? 'positive' : delta < 0 ? 'critical' : delta === 0 ? 'lime' : 'neutral'

  return (
    <Pill tone={tone} size={size} icon={<CalendarClock size={size === 'sm' ? 10 : 12} />}>
      {prefix ? `${prefix} ` : ''}
      {formatRelativeDay(date)}
    </Pill>
  )
}

/* ----------------------------------------------------------- StageBadge -- */

export function StageBadge({ stageId, size = 'sm' }: { stageId: ID; size?: 'sm' | 'md' }) {
  const stage = useStore((s) => s.pipeline.find((p) => p.id === stageId))
  if (!stage) return null
  const tone =
    stage.kind === 'won' ? 'positive' : stage.kind === 'lost' ? 'critical' : 'neutral'
  return (
    <Pill tone={tone} size={size}>
      {stage.name}
    </Pill>
  )
}

/** Contract and model-release state. Unsigned paperwork is a red flag, not a note. */
export function PaperworkBadge({
  status,
  label,
  size = 'sm',
}: {
  status: PaperworkStatus
  label: string
  size?: 'sm' | 'md'
}) {
  if (status === 'not-required') return null
  const meta = PAPERWORK_STATUS[status]
  return (
    <Pill tone={meta.tone as never} size={size}>
      {label} · {meta.label}
    </Pill>
  )
}

export function HealthBadge({ health, size = 'sm' }: { health: ShootHealth; size?: 'sm' | 'md' }) {
  const meta = SHOOT_HEALTH[health]
  return (
    <Pill tone={meta.tone as 'positive' | 'caution' | 'critical'} size={size} icon={<StatusDot tone={meta.tone as never} />}>
      {meta.label}
    </Pill>
  )
}

export function ApprovalBadge({ status, size = 'sm' }: { status: ApprovalStatus; size?: 'sm' | 'md' }) {
  const meta = APPROVAL_STATUS[status]
  return (
    <Pill tone={meta.tone as never} size={size}>
      {meta.label}
    </Pill>
  )
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  if (priority === 'normal' || priority === 'low') return null
  return (
    <Pill tone={priority === 'urgent' ? 'critical' : 'caution'} size="sm">
      {priority === 'urgent' ? 'Urgent' : 'High'}
    </Pill>
  )
}

/* ----------------------------------------------------------- PersonCell -- */

export function PersonCell({
  id,
  kind = 'team',
  size = 'sm',
  subtitle,
  className,
}: {
  id?: ID
  kind?: 'team' | 'contact'
  size?: 'xs' | 'sm' | 'md'
  subtitle?: string
  className?: string
}) {
  const person = useStore((s) =>
    kind === 'team' ? s.team.find((m) => m.id === id) : s.contacts.find((c) => c.id === id),
  )
  if (!person) return null

  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2', className)}>
      <Avatar name={person.name} src={person.avatar} size={size} />
      <span className="min-w-0">
        <span className="block truncate text-sm leading-tight">{person.name}</span>
        {subtitle !== undefined ? (
          subtitle && <span className="block truncate text-xs text-ink-muted">{subtitle}</span>
        ) : (
          <span className="block truncate text-xs text-ink-muted">{person.role}</span>
        )}
      </span>
    </span>
  )
}

/* --------------------------------------------------------- CompanyCell -- */

export function CompanyCell({ id, size = 32 }: { id?: ID; size?: number }) {
  const company = useStore((s) => s.companies.find((c) => c.id === id))
  if (!company) return null
  return (
    <Link
      to={`/companies/${company.id}`}
      className="inline-flex min-w-0 items-center gap-2.5 transition-opacity duration-fast hover:opacity-70"
    >
      <CompanyMark name={company.name} seed={company.artSeed} size={size} />
      <span className="min-w-0">
        <span className="block truncate text-sm leading-tight font-medium">{company.name}</span>
        <span className="block truncate text-xs text-ink-muted">{company.industry}</span>
      </span>
    </Link>
  )
}

/* -------------------------------------------------------- ActivityEntry -- */

const ACTIVITY_TONE: Record<string, string> = {
  call: 'bg-info-wash text-info',
  email: 'bg-surface text-ink-muted',
  meeting: 'bg-lime-pale text-[#3d4a1c] dark:text-lime',
  note: 'bg-surface text-ink-muted',
  status: 'bg-caution-wash text-caution',
  update: 'bg-surface text-ink-muted',
  approval: 'bg-positive-wash text-positive',
  task: 'bg-surface text-ink-muted',
  deal: 'bg-lime-pale text-[#3d4a1c] dark:text-lime',
}

export function ActivityDot({ type }: { type: ActivityEvent['type'] }) {
  const glyph: Record<string, string> = {
    call: '☎',
    email: '✉',
    meeting: '◎',
    note: '✎',
    status: '⇄',
    update: '↑',
    approval: '✓',
    task: '□',
    deal: '◇',
  }
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-8 shrink-0 place-items-center rounded-full text-sm',
        ACTIVITY_TONE[type] ?? 'bg-surface text-ink-muted',
      )}
    >
      {glyph[type] ?? '·'}
    </span>
  )
}

/* -------------------------------------------------------- Section header -- */

export function SectionHeading({
  title,
  count,
  action,
  description,
  className,
}: {
  title: string
  count?: number
  action?: ReactNode
  description?: string
  className?: string
}) {
  return (
    <div className={cn('mb-3 flex items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        <h2 className="flex items-baseline gap-2 text-lg font-medium tracking-tight">
          {title}
          {count !== undefined && (
            <span className="tabular text-base font-normal text-ink-faint">{count}</span>
          )}
        </h2>
        {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}

/* -------------------------------------------------------------- Checkbox -- */

/** The one-tap complete control used in every task list. */
export function TaskCheck({
  done,
  onToggle,
  label,
}: {
  done: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={done}
      aria-label={done ? `Mark "${label}" as not done` : `Mark "${label}" as done`}
      className={cn(
        'grid size-5 shrink-0 place-items-center rounded-full transition-[color,transform] duration-fast ease-out-soft',
        'hover:scale-110 active:scale-95',
        done ? 'text-positive' : 'text-line-strong hover:text-ink-muted',
      )}
    >
      {done ? <CheckCircle2 size={20} /> : <CircleDashed size={20} />}
    </button>
  )
}
