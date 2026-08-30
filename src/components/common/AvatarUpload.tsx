import { useId, useRef, useState } from 'react'
import { Camera, Loader2, Trash2 } from 'lucide-react'
import { AVATAR_ACCEPT, fileToAvatar } from '@/lib/avatar'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/primitives'

/**
 * Circular profile-picture control: click or drop an image on it. Falls back to
 * tinted initials when there is none, which is a deliberate default rather than
 * a stock photograph standing in for a real person.
 */
export function AvatarUpload({
  name,
  value,
  onChange,
  size = 'xl',
  hint = 'Drop an image here, or click to choose one.',
  className,
}: {
  name: string
  value?: string
  onChange: (avatar: string | undefined) => void
  size?: 'lg' | 'xl'
  hint?: string
  className?: string
}) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  async function handle(file: File | undefined) {
    if (!file) return
    setError('')
    setBusy(true)
    try {
      onChange(await fileToAvatar(file))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'That image could not be used.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center gap-4">
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
            'group relative cursor-pointer rounded-full transition-[box-shadow,transform] duration-fast ease-out-soft',
            dragging ? 'ring-2 ring-ink ring-offset-2 ring-offset-canvas' : 'hover:scale-[1.03]',
          )}
        >
          <Avatar name={name || 'You'} src={value} size={size} />

          <span
            className={cn(
              'absolute inset-0 grid place-items-center rounded-full bg-[#0a0a0a]/55 text-[#f2f2f0]',
              'opacity-0 transition-opacity duration-fast group-hover:opacity-100',
              (busy || dragging) && 'opacity-100',
            )}
            aria-hidden
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
          </span>

          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={AVATAR_ACCEPT}
            disabled={busy}
            className="sr-only-focusable absolute"
            onChange={(event) => {
              void handle(event.target.files?.[0])
              event.target.value = ''
            }}
          />
        </label>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
              {value ? 'Change picture' : 'Upload a picture'}
            </Button>
            {value && (
              <Button
                size="sm"
                variant="ghost"
                icon={<Trash2 size={13} />}
                onClick={() => {
                  onChange(undefined)
                  setError('')
                }}
              >
                Remove
              </Button>
            )}
          </div>
          <p className="mt-1.5 text-xs text-pretty text-ink-muted">
            {error || hint}
          </p>
        </div>
      </div>

      {error && (
        <p className="sr-only-focusable" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
