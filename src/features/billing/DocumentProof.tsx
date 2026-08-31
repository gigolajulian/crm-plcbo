import { useEffect, useRef, useState } from 'react'
import { Download, FileImage, Loader2 } from 'lucide-react'
import {
  documentDate,
  documentFilename,
  renderPDF,
  renderProof,
  type DocumentRequest,
  type Paper,
} from '@/lib/pdf'
import { Button, Card, SegmentedControl } from '@/components/ui/primitives'
import { ErrorState, toast } from '@/components/ui/feedback'

/* ============================================================================
   THE PROOF

   What the client will actually receive, drawn from the same layout the PDF
   writer uses. Showing it rather than describing it is the point: nobody sends
   a document they have not looked at.
   ========================================================================== */

/** The request carries an ISO date; the document wants it formatted. */
export interface ProofRequest extends Omit<DocumentRequest, 'date'> {
  date: string
}

export function DocumentProof({
  request,
  onPaperChange,
}: {
  request: ProofRequest
  onPaperChange?: (paper: Paper) => void
}) {
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Object URLs stay alive as long as a button points at them, so they are
  // revoked only when superseded — never on a timer, which would break a click.
  const liveUrl = useRef<string | null>(null)

  const resolved: DocumentRequest = { ...request, date: documentDate(request.date) }
  const key = JSON.stringify(resolved)

  useEffect(() => {
    let cancelled = false
    setError(null)

    renderProof(resolved)
      .then((result) => {
        if (!cancelled) setSvg(result.svg)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(
    () => () => {
      if (liveUrl.current) URL.revokeObjectURL(liveUrl.current)
    },
    [],
  )

  function offer(blob: Blob, filename: string) {
    if (liveUrl.current) URL.revokeObjectURL(liveUrl.current)
    liveUrl.current = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = liveUrl.current
    anchor.download = filename
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  }

  async function downloadPDF() {
    setBusy(true)
    try {
      const blob = await renderPDF(resolved)
      offer(blob, documentFilename(resolved))
      toast.success(`PDF ready · ${(blob.size / 1024).toFixed(0)} KB`)
    } catch (err) {
      toast.error('Could not write the PDF', { detail: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  function downloadSVG() {
    if (!svg) return
    offer(
      new Blob([svg], { type: 'image/svg+xml' }),
      documentFilename(resolved).replace(/\.pdf$/, '.svg'),
    )
    toast.success('SVG ready')
  }

  if (error) {
    return (
      <ErrorState
        title="The document could not be drawn"
        body={error}
        onRetry={() => setSvg(null)}
      />
    )
  }

  return (
    <Card variant="surface" padding="none" radius="2xl" className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <span className="eyebrow">Proof · A4</span>

        <div className="flex flex-wrap items-center gap-2">
          {onPaperChange && (
            <SegmentedControl<Paper>
              value={request.paper}
              onChange={onPaperChange}
              label="Paper"
              size="sm"
              segments={[
                { value: 'light', label: 'Light' },
                { value: 'inverted', label: 'Dark' },
              ]}
            />
          )}
          <Button size="sm" icon={<FileImage size={14} />} onClick={downloadSVG} disabled={!svg}>
            SVG
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={busy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            onClick={downloadPDF}
            disabled={busy || !svg}
          >
            {busy ? 'Writing…' : 'Download PDF'}
          </Button>
        </div>
      </div>

      <div className="bg-canvas-sunk p-4 sm:p-6">
        {svg ? (
          <div
            // The SVG is generated here from our own data, never from anything
            // a client supplied, and every text node is escaped on the way in.
            dangerouslySetInnerHTML={{ __html: svg }}
            className="mx-auto w-full max-w-[560px] overflow-hidden rounded-lg shadow-lg [&>svg]:h-auto [&>svg]:w-full"
          />
        ) : (
          <div className="mx-auto grid aspect-[210/297] w-full max-w-[560px] place-items-center rounded-lg bg-surface-raised">
            <span className="flex items-center gap-2 text-sm text-ink-muted">
              <Loader2 size={16} className="animate-spin" aria-hidden />
              Loading the typeface…
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}
