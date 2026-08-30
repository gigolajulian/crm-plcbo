import { useMemo, useState } from 'react'
import { generateArt, type ArtProgram } from '@/lib/art'
import { cn } from '@/lib/utils'

/**
 * The single image component.
 *
 * Shows a skeleton while loading, the photograph when it arrives, and
 * deterministic generated artwork if the photograph never does — offline, a
 * dead URL, a blocked host. Nothing in the product renders a broken image box.
 */
export function Img({
  src,
  seed,
  alt,
  ratio,
  program,
  className,
  imgClassName,
  eager,
}: {
  src?: string
  /** Stable seed for the fallback artwork — a record id works well. */
  seed: string
  alt: string
  /** width / height. Reserves space so the layout does not jump. */
  ratio?: number
  program?: ArtProgram
  className?: string
  imgClassName?: string
  eager?: boolean
}) {
  const [state, setState] = useState<'loading' | 'loaded' | 'failed'>(src ? 'loading' : 'failed')
  const art = useMemo(() => generateArt(seed, ratio ?? 4 / 3, program), [seed, ratio, program])
  const resolved = state === 'failed' ? art : src

  return (
    <span
      className={cn('relative block overflow-hidden bg-surface', className)}
      style={ratio ? { aspectRatio: String(ratio) } : undefined}
    >
      {state === 'loading' && (
        <span
          aria-hidden
          className="animate-shimmer absolute inset-0 bg-[linear-gradient(90deg,var(--color-line-soft)_0%,var(--color-line)_50%,var(--color-line-soft)_100%)] bg-[length:200%_100%]"
        />
      )}
      <img
        src={resolved}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setState((s) => (s === 'failed' ? s : 'loaded'))}
        onError={() => setState('failed')}
        className={cn(
          'size-full object-cover transition-opacity duration-slow ease-out-soft',
          state === 'loading' ? 'opacity-0' : 'opacity-100',
          imgClassName,
        )}
      />
    </span>
  )
}

/** Square identity mark for a company with no logo. */
export function CompanyMark({
  name,
  seed,
  size = 40,
  className,
}: {
  name: string
  seed: string
  size?: number
  className?: string
}) {
  const art = useMemo(() => generateArt(seed, 1), [seed])
  return (
    <span
      className={cn('relative block shrink-0 overflow-hidden rounded-md', className)}
      style={{ width: size, height: size }}
      title={name}
    >
      <img src={art} alt="" aria-hidden className="size-full object-cover" />
    </span>
  )
}
