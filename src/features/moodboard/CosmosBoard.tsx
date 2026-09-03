import { useEffect, useRef, useState } from 'react'
import { ExternalLink, Loader2, Maximize2, Minimize2, Sparkle, Unlink } from 'lucide-react'
import type { Moodboard } from '@/data/types'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/primitives'
import { toast } from '@/components/ui/feedback'

/* ============================================================================
   THE COSMOS BOARD, AS THE BOARD

   For a studio that builds every board on cosmos.so, a small embed above the
   real moodboard has it backwards. This is the moodboard: it takes the whole
   pane, fills the window, and goes properly fullscreen when you want to look
   at it rather than work around it.

   It stays their page, rendered by them, which is the only way this can work —
   there is no API and their terms rule out fetching from it.

   The theme inside the frame is therefore Cosmos's, not ours. A cross-origin
   document cannot be restyled from out here and `color-scheme: dark` on the
   frame does not reach it; what does is Cosmos's own setting, which they store
   per browser (next-themes, key `csms_theme`, system-aware). Set dark in
   Cosmos and the embed is dark. So the surround is dark, the seam is a real
   border, and the frame is left alone to be whichever theme its owner chose.
   ========================================================================== */

export function CosmosBoard({ board }: { board: Moodboard }) {
  const updateMoodboard = useStore((s) => s.updateMoodboard)
  const [ready, setReady] = useState(false)
  const [full, setFull] = useState(false)
  const shell = useRef<HTMLDivElement>(null)

  // Real fullscreen, not a CSS overlay: the iframe keeps its scroll position
  // and its session, and Escape does what everyone expects.
  useEffect(() => {
    function onChange() {
      setFull(document.fullscreenElement === shell.current)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  async function toggleFull() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await shell.current?.requestFullscreen()
    } catch {
      // Denied by the browser, or unsupported. The inline view still works.
      toast.warning('This browser would not go fullscreen')
    }
  }

  if (!board.cosmosUrl) return null

  return (
    <div
      ref={shell}
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl bg-surface',
        // Inline it fills what is left of the window; fullscreen it fills the
        // screen. Either way the board is the thing on the page, not a strip.
        full ? 'h-screen rounded-none' : 'h-[calc(100dvh-19rem)] min-h-[30rem]',
      )}
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5">
        <Sparkle size={14} className="shrink-0 text-ink-faint" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{board.cosmosTitle}</p>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={toggleFull}
          icon={full ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        >
          {full ? 'Exit' : 'Fullscreen'}
        </Button>
        <a
          href={board.cosmosUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex h-8 items-center gap-1.5 rounded-pill px-3 text-sm font-medium text-ink-muted transition-colors duration-fast hover:bg-raised hover:text-ink"
        >
          <ExternalLink size={14} aria-hidden />
          Open in Cosmos
        </a>
        <button
          type="button"
          onClick={() => {
            updateMoodboard(board.id, { cosmosUrl: undefined, cosmosTitle: undefined })
            toast.show('Cosmos board unlinked')
          }}
          aria-label="Unlink this Cosmos board"
          className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-faint transition-colors duration-fast hover:bg-raised hover:text-ink"
        >
          <Unlink size={14} aria-hidden />
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        {!ready && (
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
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
          onLoad={() => setReady(true)}
          className="size-full border-0 bg-canvas-sunk"
        />
      </div>
    </div>
  )
}
