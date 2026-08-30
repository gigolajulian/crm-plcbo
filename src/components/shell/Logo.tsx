import { BRAND } from '@/lib/brand'
import { cn } from '@/lib/utils'

/**
 * The mark: a capsule, tilted. The whole interface is built from pills, so the
 * identity is the same shape as the components rather than sitting outside them.
 */
export function Logo({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn('relative inline-grid shrink-0 place-items-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={BRAND.full}
    >
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
        <rect width="64" height="64" rx="16" className="fill-ink" />
        <g transform="rotate(-38 32 32)">
          <rect x="20" y="12" width="24" height="40" rx="12" fill="var(--color-lime)" />
          <path
            d="M20 32h24v8a12 12 0 0 1-12 12 12 12 0 0 1-12-12z"
            fill="#0a0a0a"
            opacity=".22"
          />
        </g>
      </svg>
    </span>
  )
}

/** Full lockup for the settings header and the command palette footer. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <Logo size={30} />
      <span className="leading-none">
        <span className="block text-lg font-medium tracking-title">{BRAND.full}</span>
        <span className="mt-0.5 block text-xs text-ink-muted">{BRAND.tagline}</span>
      </span>
    </span>
  )
}
