import { useState } from 'react'
import { avatarTint } from '@/lib/art'
import { cn, initials } from '@/lib/utils'

const SIZES = {
  xs: 'size-6 text-[9px]',
  sm: 'size-8 text-2xs',
  md: 'size-10 text-xs',
  lg: 'size-14 text-base',
  xl: 'size-20 text-xl',
}

export type AvatarSize = keyof typeof SIZES

/**
 * A photo when one loads, tinted initials when it does not. The tint is
 * derived from the name, so a person keeps the same colour everywhere.
 */
export function Avatar({
  name,
  src,
  size = 'md',
  ring,
  className,
}: {
  name: string
  src?: string
  size?: AvatarSize
  /** Draws a canvas-coloured ring — used when avatars overlap. */
  ring?: boolean
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const tint = avatarTint(name)
  const showPhoto = src && !failed

  return (
    <span
      className={cn(
        'relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-medium select-none',
        SIZES[size],
        ring && 'ring-2 ring-canvas',
        className,
      )}
      style={showPhoto ? undefined : { backgroundColor: tint.bg, color: tint.fg }}
      title={name}
    >
      {showPhoto ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <span aria-hidden>{initials(name)}</span>
      )}
    </span>
  )
}

/** Overlapping avatars with a "+n" cap — the team indicator from the references. */
export function AvatarStack({
  people,
  max = 4,
  size = 'sm',
  className,
}: {
  people: Array<{ id: string; name: string; avatar?: string }>
  max?: number
  size?: AvatarSize
  className?: string
}) {
  const shown = people.slice(0, max)
  const overflow = people.length - shown.length

  return (
    <div
      className={cn('flex items-center -space-x-2', className)}
      role="group"
      aria-label={`${people.length} people: ${people.map((p) => p.name).join(', ')}`}
    >
      {shown.map((person) => (
        <Avatar key={person.id} name={person.name} src={person.avatar} size={size} ring />
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            'inline-grid place-items-center rounded-full bg-inverse font-medium text-on-inverse ring-2 ring-canvas',
            SIZES[size],
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  )
}
