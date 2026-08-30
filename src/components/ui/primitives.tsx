import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

/* ============================================================================
   PRIMITIVES
   The reference language is built from pills: pill nav chips, circular icon
   buttons, pill toggles, softly-rounded panels. Everything here is a variation
   on that one shape idea.
   ========================================================================== */

/* --------------------------------------------------------------- Button -- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-inverse text-on-inverse hover:bg-inverse-soft active:scale-[.98] disabled:bg-line-strong disabled:text-ink-faint',
  secondary:
    'bg-raised text-ink shadow-sm hover:bg-surface-hover active:scale-[.98] disabled:text-ink-faint disabled:shadow-none',
  ghost: 'text-ink-muted hover:bg-surface hover:text-ink active:scale-[.98] disabled:text-ink-faint',
  // Lime is a background only, always with ink on top — never lime text.
  accent:
    'bg-lime text-[#0a0a0a] hover:bg-lime-deep active:scale-[.98] disabled:bg-lime-pale disabled:text-ink-faint',
  danger:
    'bg-critical-wash text-critical hover:brightness-95 active:scale-[.98] disabled:opacity-50',
}

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-base gap-2',
  lg: 'h-12 px-6 text-body gap-2.5',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Rendered before the label. */
  icon?: ReactNode
  iconAfter?: ReactNode
  block?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon, iconAfter, block, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-pill font-medium whitespace-nowrap',
        'transition-[background-color,color,box-shadow,transform] duration-fast ease-out-soft',
        'disabled:pointer-events-none',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
      {iconAfter}
    </button>
  )
})

/** Same shape as Button, but navigates. */
export function ButtonLink({
  to,
  variant = 'secondary',
  size = 'md',
  icon,
  iconAfter,
  className,
  children,
}: {
  to: string
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  iconAfter?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-pill font-medium whitespace-nowrap',
        'transition-[background-color,color,box-shadow,transform] duration-fast ease-out-soft',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
    >
      {icon}
      {children}
      {iconAfter}
    </Link>
  )
}

/* ----------------------------------------------------------- IconButton -- */

type IconButtonSize = 'sm' | 'md' | 'lg'

const ICON_SIZES: Record<IconButtonSize, string> = {
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-11',
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required — icon-only controls must still be announced. */
  label: string
  variant?: ButtonVariant
  size?: IconButtonSize
  active?: boolean
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = 'secondary', size = 'md', active, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full',
        'transition-[background-color,color,box-shadow,transform] duration-fast ease-out-soft',
        'disabled:pointer-events-none disabled:opacity-45',
        active ? BUTTON_VARIANTS.primary : BUTTON_VARIANTS[variant],
        ICON_SIZES[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
})

/* ------------------------------------------------------------- Pill/Chip -- */

type Tone = 'neutral' | 'lime' | 'positive' | 'caution' | 'critical' | 'info' | 'ink'

const TONES: Record<Tone, string> = {
  neutral: 'bg-surface text-ink-muted',
  lime: 'bg-lime-pale text-[#3d4a1c] dark:text-lime',
  positive: 'bg-positive-wash text-positive',
  caution: 'bg-caution-wash text-caution',
  critical: 'bg-critical-wash text-critical',
  info: 'bg-info-wash text-info',
  ink: 'bg-inverse text-on-inverse',
}

export function Pill({
  tone = 'neutral',
  size = 'md',
  icon,
  className,
  children,
}: {
  tone?: Tone
  size?: 'sm' | 'md'
  icon?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill font-medium whitespace-nowrap',
        size === 'sm' ? 'h-5 px-2 text-2xs' : 'h-7 px-3 text-xs',
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}

/** A pill that can be toggled or dismissed — used by filters and tag pickers. */
export function Chip({
  selected,
  onClick,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-pill px-3 text-sm font-medium whitespace-nowrap',
        'transition-[background-color,color,box-shadow] duration-fast ease-out-soft',
        selected
          ? 'bg-inverse text-on-inverse'
          : 'bg-raised text-ink-muted shadow-xs hover:text-ink hover:shadow-sm',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

/* ----------------------------------------------------- SegmentedControl -- */

export interface Segment<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

/**
 * The pill toggle from the references: a soft track with an ink-filled thumb
 * on the active segment. Rendered as a radiogroup so arrow keys work.
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  segments,
  label,
  size = 'md',
  className,
}: {
  value: T
  onChange: (value: T) => void
  segments: Array<Segment<T>>
  label: string
  size?: 'sm' | 'md'
  className?: string
}) {
  function onKeyDown(event: React.KeyboardEvent) {
    const index = segments.findIndex((s) => s.value === value)
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      onChange(segments[(index + 1) % segments.length].value)
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      onChange(segments[(index - 1 + segments.length) % segments.length].value)
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        'inline-flex items-center gap-1 rounded-pill bg-surface p-1',
        size === 'sm' ? 'h-9' : 'h-11',
        className,
      )}
    >
      {segments.map((segment) => {
        const selected = segment.value === value
        return (
          <button
            key={segment.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(segment.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-pill font-medium whitespace-nowrap',
              'transition-[background-color,color,box-shadow] duration-base ease-out-soft',
              size === 'sm' ? 'h-7 px-3 text-sm' : 'h-9 px-4 text-base',
              selected
                ? 'bg-inverse text-on-inverse shadow-sm'
                : 'text-ink-muted hover:bg-raised hover:text-ink',
            )}
          >
            {segment.icon}
            {segment.label}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------ Card/Panel -- */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** `surface` is the default soft panel; `raised` lifts it to white. */
  variant?: 'surface' | 'raised' | 'inverse' | 'accent' | 'outline'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  radius?: 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  interactive?: boolean
}

const CARD_VARIANTS = {
  surface: 'bg-surface',
  raised: 'bg-raised shadow-sm',
  inverse: 'bg-inverse text-on-inverse',
  accent: 'bg-lime text-[#0a0a0a]',
  outline: 'border border-line bg-transparent',
}

const CARD_PADDING = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-7' }
const CARD_RADIUS = {
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'surface', padding = 'md', radius = '2xl', interactive, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        CARD_VARIANTS[variant],
        CARD_PADDING[padding],
        CARD_RADIUS[radius],
        interactive &&
          'transition-[box-shadow,transform] duration-base ease-out-soft hover:-translate-y-0.5 hover:shadow-lift',
        className,
      )}
      {...rest}
    />
  )
})

/** Card header with a title on the left and controls on the right. */
export function CardHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h3 className="text-lg font-medium tracking-tight">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </div>
  )
}

/* -------------------------------------------------------------- Progress -- */

/** The circular completion dial used on project cards and vitals. */
export function ProgressRing({
  value,
  size = 40,
  strokeWidth = 3,
  label,
  showValue = true,
}: {
  value: number
  size?: number
  strokeWidth?: number
  label?: string
  showValue?: boolean
}) {
  const clamped = Math.max(0, Math.min(1, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const percent = Math.round(clamped * 100)

  return (
    <div
      className="relative inline-grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `${percent}% complete`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          className="transition-[stroke-dashoffset] duration-slow ease-out-soft"
        />
      </svg>
      {showValue && (
        <span className="tabular absolute text-2xs font-medium">{percent}</span>
      )}
    </div>
  )
}

/** Horizontal meter — budget, capacity, load. */
export function Meter({
  value,
  tone = 'ink',
  className,
  label,
}: {
  value: number
  tone?: 'ink' | 'lime' | 'caution' | 'critical'
  className?: string
  label?: string
}) {
  const clamped = Math.max(0, Math.min(1, value))
  const fill = {
    ink: 'bg-ink',
    lime: 'bg-lime',
    caution: 'bg-caution',
    critical: 'bg-critical',
  }[tone]

  return (
    <div
      className={cn('h-1.5 w-full overflow-hidden rounded-pill bg-line', className)}
      role="progressbar"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn('h-full rounded-pill transition-[width] duration-slow ease-out-soft', fill)}
        style={{ width: `${clamped * 100}%` }}
      />
    </div>
  )
}

/* ---------------------------------------------------------------- Misc -- */

export function StatusDot({ tone = 'neutral' }: { tone?: Tone }) {
  const colors: Record<Tone, string> = {
    neutral: 'bg-ink-faint',
    lime: 'bg-lime',
    positive: 'bg-positive',
    caution: 'bg-caution',
    critical: 'bg-critical',
    info: 'bg-info',
    ink: 'bg-ink',
  }
  return <span className={cn('size-1.5 shrink-0 rounded-full', colors[tone])} aria-hidden />
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="tabular inline-flex h-5 min-w-5 items-center justify-center rounded-xs border border-line bg-raised px-1.5 font-sans text-2xs font-medium text-ink-muted">
      {children}
    </kbd>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded-md bg-line-soft',
        'bg-[linear-gradient(90deg,var(--color-line-soft)_0%,var(--color-line)_50%,var(--color-line-soft)_100%)] bg-[length:200%_100%]',
        className,
      )}
      aria-hidden
    />
  )
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-line-soft', className)} />
}

/** Section label used above groups of content. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('eyebrow', className)}>{children}</p>
}
