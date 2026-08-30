import { useId, useRef, useState } from 'react'
import { ImageUp, Loader2, X } from 'lucide-react'
import {
  ACCEPTED_IMAGE_TYPES,
  canUpload,
  uploadImage,
  validateFile,
  type UploadResult,
} from '@/lib/uploads'
import { getWorkspaceId } from '@/store/sync'
import { cn } from '@/lib/utils'
import { Button, Pill } from '@/components/ui/primitives'

/* ============================================================================
   IMAGE DROP

   A real file input with drag-and-drop, used by the moodboard and the review
   room. In local mode there is nowhere to store a file, so it says so plainly
   and leaves the curated library as the way in — better than a control that
   looks like it works and silently doesn't.
   ========================================================================== */

export function ImageDrop({
  folder,
  onUploaded,
  label = 'Upload an image',
  className,
}: {
  /** Second path segment under the workspace, e.g. "moodboards". */
  folder: string
  onUploaded: (result: UploadResult) => void
  label?: string
  className?: string
}) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const workspaceId = getWorkspaceId()
  const available = canUpload() && Boolean(workspaceId)

  async function handle(file: File | undefined) {
    if (!file || !workspaceId) return
    const problem = validateFile(file)
    if (problem) {
      setError(problem)
      return
    }

    setError('')
    setBusy(true)
    // Show the local file immediately; the network can catch up.
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    try {
      const result = await uploadImage(file, workspaceId, folder)
      onUploaded(result)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Upload failed.')
      setPreview(null)
    } finally {
      setBusy(false)
      URL.revokeObjectURL(objectUrl)
    }
  }

  if (!available) {
    return (
      <div className={cn('rounded-xl bg-surface px-4 py-3', className)}>
        <p className="text-sm text-ink-muted">
          Uploads need a connected workspace. Pick from the library below instead.
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          void handle(event.dataTransfer.files?.[0])
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-8 text-center',
          'transition-colors duration-fast ease-out-soft',
          dragging
            ? 'border-ink bg-lime-wash'
            : 'border-line hover:border-ink-faint hover:bg-surface',
        )}
      >
        {preview ? (
          <img
            src={preview}
            alt=""
            className="max-h-32 rounded-lg object-contain"
          />
        ) : busy ? (
          <Loader2 size={20} className="animate-spin text-ink-muted" aria-hidden />
        ) : (
          <ImageUp size={20} className="text-ink-faint" aria-hidden />
        )}

        <span className="text-base font-medium">
          {busy ? 'Uploading…' : dragging ? 'Drop it' : label}
        </span>
        <span className="text-xs text-ink-muted">
          Drag one in, or click to choose. PNG, JPEG, WebP or AVIF up to 10MB.
        </span>

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          className="sr-only-focusable absolute"
          disabled={busy}
          onChange={(event) => {
            void handle(event.target.files?.[0])
            event.target.value = ''
          }}
        />
      </label>

      {error && (
        <p className="mt-2 flex items-start gap-2 text-sm text-critical" role="alert">
          <X size={14} className="mt-0.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      {preview && !busy && !error && (
        <div className="mt-2 flex items-center gap-2">
          <Pill tone="positive" size="sm">
            Uploaded
          </Pill>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setPreview(null)
              inputRef.current?.click()
            }}
          >
            Replace
          </Button>
        </div>
      )}
    </div>
  )
}
