import { useCallback, useEffect, useRef, useState } from 'react'
import type { ID } from '@/data/types'
import { useStore } from '@/store/useStore'
import { measurePastedUrls, urlsFromTransfer } from '@/lib/imageUrl'
import { toast } from '@/components/ui/feedback'

/* ============================================================================
   BRINGING REFERENCES IN

   The board should accept what the browser already knows how to give it:
   drag a picture in from another tab, or copy its address and press ⌘V. That
   is the whole Cosmos workflow — their site has no API and their terms rule
   out fetching from it, but a person dragging an image between two tabs is
   just using a browser, and that is the one mechanism their terms name as
   allowed.

   The form in "Add reference" still exists for a considered addition. This is
   for moving twenty at once.
   ========================================================================== */

export interface BoardIntake {
  /** True while something draggable is over the board. */
  dropping: boolean
  /** True while pasted or dropped images are being loaded. */
  busy: boolean
  handlers: {
    onDragEnter: (event: React.DragEvent) => void
    onDragOver: (event: React.DragEvent) => void
    onDragLeave: (event: React.DragEvent) => void
    onDrop: (event: React.DragEvent) => void
  }
}

export function useBoardIntake({
  boardId,
  sectionId,
  sourceUrl,
  enabled = true,
}: {
  boardId: ID
  /** Where dropped references land. */
  sectionId: ID | undefined
  /** The linked Cosmos board, recorded on whatever comes in. */
  sourceUrl?: string
  enabled?: boolean
}): BoardIntake {
  const addMoodItem = useStore((s) => s.addMoodItem)
  const currentUserId = useStore((s) => s.settings.currentUserId)
  const [dropping, setDropping] = useState(false)
  const [busy, setBusy] = useState(false)

  // dragenter/dragleave fire for every child element the pointer crosses, so a
  // plain boolean flickers. Counting entries and exits does not.
  const depth = useRef(0)

  const take = useCallback(
    async (urls: string[]) => {
      if (!sectionId || urls.length === 0) return
      setBusy(true)
      try {
        const { ok, failed } = await measurePastedUrls(urls.join('\n'))

        for (const image of ok) {
          addMoodItem({
            boardId,
            sectionId,
            kind: 'image',
            payload: { kind: 'image', url: image.url, artSeed: image.url, ratio: image.ratio, sourceUrl },
            caption: '',
            tags: [],
            pinned: false,
            addedBy: currentUserId,
          })
        }

        if (ok.length === 0) {
          toast.error('Nothing there could be loaded as an image')
          return
        }
        toast.success(`${ok.length} reference${ok.length === 1 ? '' : 's'} added`, {
          detail: failed.length > 0 ? `${failed.length} could not be loaded` : undefined,
        })
      } finally {
        setBusy(false)
      }
    },
    [addMoodItem, boardId, sectionId, sourceUrl, currentUserId],
  )

  /* ------------------------------------------------------------- pasting */

  useEffect(() => {
    if (!enabled) return

    function onPaste(event: ClipboardEvent) {
      // Never steal a paste from a field someone is typing in.
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }
      if (!event.clipboardData) return

      const urls = urlsFromTransfer(event.clipboardData).filter((u) => u.startsWith('https://'))
      if (urls.length === 0) return
      event.preventDefault()
      void take(urls)
    }

    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [enabled, take])

  /* ------------------------------------------------------------ dropping */

  const onDragEnter = useCallback((event: React.DragEvent) => {
    if (!event.dataTransfer.types.length) return
    event.preventDefault()
    depth.current += 1
    setDropping(true)
  }, [])

  const onDragOver = useCallback((event: React.DragEvent) => {
    if (!event.dataTransfer.types.length) return
    // Without this the browser refuses the drop and navigates to the image.
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }, [])

  const onDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    depth.current = Math.max(0, depth.current - 1)
    if (depth.current === 0) setDropping(false)
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      depth.current = 0
      setDropping(false)
      void take(urlsFromTransfer(event.dataTransfer))
    },
    [take],
  )

  return {
    dropping: dropping && enabled,
    busy,
    handlers: { onDragEnter, onDragOver, onDragLeave, onDrop },
  }
}
