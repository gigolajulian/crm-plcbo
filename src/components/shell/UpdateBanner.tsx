import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/primitives'

declare const __BUILD_ID__: string

/* ============================================================================
   UPDATE BANNER

   Static hosts cache index.html, and a cached index.html points at the previous
   build's hashed assets — so a browser can keep running old code indefinitely
   after a deploy, with no signal that anything is wrong. That is not a
   theoretical problem: it cost an afternoon of debugging a bug that was already
   fixed.

   The build stamps its own id and publishes version.json alongside. This checks
   the two match and offers a reload when they do not. It offers rather than
   forces, because a silent reload mid-edit would throw away unsaved input.
   ========================================================================== */

const CHECK_INTERVAL = 5 * 60 * 1000

export function UpdateBanner() {
  const [stale, setStale] = useState(false)

  useEffect(() => {
    // Dev serves modules straight from source; there is nothing to go stale.
    if (import.meta.env.DEV) return
    let cancelled = false

    async function check() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}version.json`, {
          cache: 'no-store',
        })
        if (!response.ok) return
        const { buildId } = (await response.json()) as { buildId?: string }
        if (!cancelled && buildId && buildId !== __BUILD_ID__) setStale(true)
      } catch {
        // Offline, or the file is not published yet. Nothing worth reporting.
      }
    }

    void check()
    const timer = window.setInterval(check, CHECK_INTERVAL)
    // Coming back to the tab is the moment a deploy is most likely to have
    // happened since you last looked.
    const onFocus = () => void check()
    window.addEventListener('focus', onFocus)

    return () => {
      cancelled = true
      window.clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  if (!stale) return null

  return (
    <div
      role="status"
      className="animate-sheet fixed inset-x-0 bottom-20 z-[65] flex justify-center px-4 lg:bottom-6"
    >
      <div className="flex items-center gap-3 rounded-pill bg-inverse py-2 pr-2 pl-4 text-on-inverse shadow-lg">
        <span className="text-sm">A newer version of CRMO is available.</span>
        <Button
          size="sm"
          variant="accent"
          icon={<RefreshCw size={13} />}
          onClick={() => window.location.reload()}
        >
          Reload
        </Button>
      </div>
    </div>
  )
}
