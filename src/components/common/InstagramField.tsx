import { useState } from 'react'
import { Check, Instagram, Pencil, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ============================================================================
   INSTAGRAM HANDLE

   For a photographer this is not a social link, it is the client's portfolio —
   the fastest way to see what they have been putting out and what they will
   expect back. So it sits on the profile next to the email and the phone
   number, and it opens.

   Whatever gets pasted is reduced to a handle: a full URL, a URL with tracking
   on the end, an @ prefix, or the bare name all end up the same. Storing the
   handle rather than the URL means the link can never rot into someone's
   mobile share link with a session id in it.
   ========================================================================== */

/** Instagram's own rule: letters, digits, underscore and full stop, max 30. */
const HANDLE = /^[A-Za-z0-9._]{1,30}$/

/**
 * Pulls the handle out of anything a client is likely to send you. Returns
 * undefined for input that could not be one, so a typo is not stored as a
 * link that goes nowhere.
 */
export function parseHandle(input: string): string | undefined {
  let value = input.trim()
  if (!value) return undefined

  // A pasted profile URL, with or without protocol, query string or trailing /.
  const url = value.match(/(?:^|\.|\/\/)instagram\.com\/([^/?#\s]+)/i)
  if (url) value = url[1]

  value = value.replace(/^@+/, '').replace(/\/+$/, '')
  return HANDLE.test(value) ? value : undefined
}

export const instagramUrl = (handle: string) => `https://instagram.com/${handle}`

export function InstagramField({
  value,
  onChange,
  className,
}: {
  value?: string
  onChange: (handle: string | undefined) => void
  className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const [error, setError] = useState(false)

  function open() {
    setDraft(value ?? '')
    setError(false)
    setEditing(true)
  }

  function commit() {
    const trimmed = draft.trim()
    if (!trimmed) {
      onChange(undefined)
      setEditing(false)
      return
    }
    const handle = parseHandle(trimmed)
    if (!handle) {
      setError(true)
      return
    }
    onChange(handle)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Instagram size={15} className="shrink-0 text-ink-faint" aria-hidden />
        <input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            setError(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') setEditing(false)
          }}
          aria-label="Instagram handle"
          aria-invalid={error || undefined}
          placeholder="@handle or profile link"
          autoFocus
          className={cn(
            'h-8 min-w-0 flex-1 rounded-lg bg-raised px-2.5 text-sm shadow-xs outline-none',
            error && 'ring-1 ring-critical',
          )}
        />
        <button
          type="button"
          onClick={commit}
          aria-label="Save Instagram handle"
          className="grid size-7 shrink-0 place-items-center rounded-lg text-ink-muted transition-colors duration-fast hover:bg-raised hover:text-ink"
        >
          <Check size={14} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          aria-label="Cancel"
          className="grid size-7 shrink-0 place-items-center rounded-lg text-ink-muted transition-colors duration-fast hover:bg-raised hover:text-ink"
        >
          <X size={14} aria-hidden />
        </button>
      </div>
    )
  }

  if (!value) {
    return (
      <button
        type="button"
        onClick={open}
        className={cn(
          'flex items-center gap-2.5 text-sm text-ink-faint',
          'transition-colors duration-fast hover:text-ink-muted',
          className,
        )}
      >
        <Instagram size={15} className="shrink-0" aria-hidden />
        Add Instagram
      </button>
    )
  }

  return (
    <div className={cn('group flex items-center gap-2.5', className)}>
      <Instagram size={15} className="shrink-0 text-ink-faint" aria-hidden />
      <a
        href={instagramUrl(value)}
        target="_blank"
        rel="noreferrer noopener"
        className="min-w-0 truncate text-sm underline-offset-2 hover:underline"
      >
        @{value}
      </a>
      <button
        type="button"
        onClick={open}
        aria-label="Edit Instagram handle"
        className="grid size-6 shrink-0 place-items-center rounded-md text-ink-faint opacity-0 transition-opacity duration-fast group-hover:opacity-100 focus-visible:opacity-100 hover:text-ink"
      >
        <Pencil size={12} aria-hidden />
      </button>
    </div>
  )
}
