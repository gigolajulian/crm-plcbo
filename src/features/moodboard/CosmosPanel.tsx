import { useState } from 'react'
import { ChevronDown, ExternalLink, Loader2, Sparkle, X } from 'lucide-react'
import type { ID, Moodboard } from '@/data/types'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { Button, Card } from '@/components/ui/primitives'
import { toast } from '@/components/ui/feedback'

/* ============================================================================
   COSMOS

   The board often gets built on cosmos.so first. This puts it on the shoot
   rather than in another tab: one link, opened or embedded in place.

   What it deliberately does not do is import the cluster. Cosmos has no public
   API, and their terms forbid downloading content from the service with any
   tool other than a browser — so the references come across by hand, pasted
   into "Add reference", and this panel is the way back to the source.
   ========================================================================== */

/**
 * Only ever a cosmos.so page.
 *
 * The stored value goes straight into an iframe `src`, so this is a security
 * boundary, not a convenience: anything else — another host, a `javascript:`
 * URL, a redirector — is refused rather than normalised into something that
 * renders. Returns the canonical URL, or undefined.
 */
export function parseClusterUrl(input: string): string | undefined {
  const value = input.trim()
  if (!value) return undefined

  let url: URL
  try {
    url = new URL(value.includes('://') ? value : `https://${value}`)
  } catch {
    return undefined
  }

  if (url.protocol !== 'https:') return undefined
  if (url.hostname !== 'cosmos.so' && url.hostname !== 'www.cosmos.so') return undefined
  // A bare profile or the site root is not a board.
  if (url.pathname === '/' || url.pathname === '') return undefined

  return `https://www.cosmos.so${url.pathname.replace(/\/+$/, '')}`
}

/** The slug, title-cased, as a first guess at what to call it. */
function nameFrom(url: string): string {
  const slug = url.split('/').pop() ?? ''
  return slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function CosmosPanel({ board }: { board: Moodboard }) {
  const updateMoodboard = useStore((s) => s.updateMoodboard)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(board.cosmosUrl ?? '')
  const [error, setError] = useState('')
  const [embedded, setEmbedded] = useState(false)
  const [frameReady, setFrameReady] = useState(false)

  function link() {
    const url = parseClusterUrl(draft)
    if (!url) {
      setError('That is not a cosmos.so board link.')
      return
    }
    updateMoodboard(board.id, { cosmosUrl: url, cosmosTitle: board.cosmosTitle ?? nameFrom(url) })
    setEditing(false)
    setError('')
    toast.success('Cosmos board linked')
  }

  function unlink() {
    updateMoodboard(board.id, { cosmosUrl: undefined, cosmosTitle: undefined })
    setEmbedded(false)
    setDraft('')
    toast.show('Cosmos board unlinked')
  }

  /* ------------------------------------------------------------ unlinked */

  if (!board.cosmosUrl) {
    if (!editing) {
      return (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={cn(
            'mb-4 flex w-full items-center gap-2 rounded-xl border border-dashed border-line px-4 py-2.5',
            'text-sm text-ink-faint transition-colors duration-fast',
            'hover:border-ink-faint hover:text-ink-muted',
          )}
        >
          <Sparkle size={14} aria-hidden />
          Link a Cosmos board
        </button>
      )
    }

    return (
      <Card variant="surface" padding="md" radius="2xl" className="mb-4">
        <label htmlFor="cosmos-url" className="eyebrow mb-2 block">
          Cosmos board link
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id="cosmos-url"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              setError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') link()
              if (e.key === 'Escape') setEditing(false)
            }}
            placeholder="https://www.cosmos.so/you/the-board"
            autoFocus
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'cosmos-error' : undefined}
            className={cn(
              'h-10 min-w-0 flex-1 rounded-lg bg-raised px-3 text-sm shadow-xs outline-none',
              error && 'ring-1 ring-critical',
            )}
          />
          <Button size="sm" variant="primary" onClick={link} disabled={!draft.trim()}>
            Link
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
        {error && (
          <p id="cosmos-error" className="mt-2 text-xs text-critical">
            {error}
          </p>
        )}
      </Card>
    )
  }

  /* -------------------------------------------------------------- linked */

  return (
    <Card variant="surface" padding="none" radius="2xl" className="mb-4 overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <Sparkle size={14} className="shrink-0 text-ink-faint" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-medium">{board.cosmosTitle}</p>
          <p className="truncate text-xs text-ink-faint">
            {board.cosmosUrl.replace('https://www.', '')}
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setFrameReady(false)
            setEmbedded((open) => !open)
          }}
          icon={
            <ChevronDown
              size={14}
              className={cn('transition-transform duration-fast', embedded && 'rotate-180')}
            />
          }
        >
          {embedded ? 'Hide' : 'Embed'}
        </Button>
        <a
          href={board.cosmosUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex h-9 items-center gap-1.5 rounded-pill bg-inverse px-3.5 text-sm font-medium text-on-inverse transition-opacity duration-fast hover:opacity-90"
        >
          <ExternalLink size={14} aria-hidden />
          Open
        </a>
        <button
          type="button"
          onClick={unlink}
          aria-label="Unlink this Cosmos board"
          className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-faint transition-colors duration-fast hover:bg-raised hover:text-ink"
        >
          <X size={14} aria-hidden />
        </button>
      </div>

      {/*
        Collapsed by default. The board is already a page full of images; a
        second full application loading underneath it on every visit is not a
        cost worth paying until it is asked for.
      */}
      {embedded && (
        <div className="border-t border-line">
          {/*
            Cosmos is a heavy application and takes a few seconds to paint.
            Without this the panel is a grey rectangle for long enough to read
            as broken.
          */}
          <div className="relative">
            {!frameReady && (
              <div className="absolute inset-0 grid place-items-center bg-canvas-sunk">
                <span className="flex items-center gap-2 text-sm text-ink-muted">
                  <Loader2 size={15} className="animate-spin" aria-hidden />
                  Loading the board from Cosmos…
                </span>
              </div>
            )}
            <iframe
              src={board.cosmosUrl}
              title={`${board.cosmosTitle} on Cosmos`}
              loading="lazy"
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
              onLoad={() => setFrameReady(true)}
              className="h-[32rem] w-full border-0 bg-canvas-sunk"
            />
          </div>
          <p className="px-4 py-2 text-2xs text-ink-faint">
            Shown straight from cosmos.so. A private board will ask you to sign in here.
          </p>
        </div>
      )}
    </Card>
  )
}

/** The linked cluster for a board, for prefilling a reference's source. */
export function useClusterUrl(boardId: ID | undefined): string | undefined {
  const boards = useStore((s) => s.moodboards)
  return boardId ? boards.find((b) => b.id === boardId)?.cosmosUrl : undefined
}
