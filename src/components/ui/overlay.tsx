import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconButton } from './primitives'

/* ============================================================================
   OVERLAYS
   All of them trap focus, restore it on close, close on Escape, and lock
   background scroll. That behaviour lives in one hook so no overlay forgets.
   ========================================================================== */

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'

function useOverlayBehaviour(
  open: boolean,
  onClose: () => void,
  ref: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null

    // Lock scroll without the layout jump from a disappearing scrollbar.
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    const { overflow, paddingRight } = document.body.style
    document.body.style.overflow = 'hidden'
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`

    const focusTimer = window.setTimeout(() => {
      const first = ref.current?.querySelector<HTMLElement>(FOCUSABLE)
      ;(first ?? ref.current)?.focus()
    }, 20)

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !ref.current) return
      const nodes = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (node) => node.offsetParent !== null,
      )
      if (nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      window.clearTimeout(focusTimer)
      document.body.style.overflow = overflow
      document.body.style.paddingRight = paddingRight
      previouslyFocused?.focus?.()
    }
  }, [open, onClose, ref])
}

/* ---------------------------------------------------------------- Modal -- */

export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  footer,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: ReactNode
  children: ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descId = useId()
  useOverlayBehaviour(open, onClose, panelRef)

  if (!open) return null

  const widths = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="animate-scrim absolute inset-0 cursor-default bg-[#0a0a0a]/35 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'animate-sheet relative flex max-h-[92dvh] w-full flex-col overflow-hidden bg-canvas',
          'rounded-t-3xl shadow-xl sm:rounded-3xl',
          widths[size],
          'sm:mx-4',
        )}
      >
        <header className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 sm:px-7">
          <div className="min-w-0">
            <h2 id={titleId} className="text-xl font-medium tracking-title">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-base text-ink-muted">
                {description}
              </p>
            )}
          </div>
          <IconButton label="Close" variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </IconButton>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 sm:px-7">{children}</div>

        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-line-soft bg-surface/60 px-6 py-4 sm:px-7">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  )
}

/* ---------------------------------------------------------------- Sheet -- */

/** Right-hand drawer for detail and quick-add flows. Becomes a bottom sheet on mobile. */
export function Sheet({
  open,
  onClose,
  title,
  description,
  width = 'md',
  footer,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  width?: 'sm' | 'md' | 'lg'
  footer?: ReactNode
  children: ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useOverlayBehaviour(open, onClose, panelRef)

  if (!open) return null

  const widths = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end">
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className="animate-scrim absolute inset-0 cursor-default bg-[#0a0a0a]/35 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'animate-sheet relative flex max-h-[92dvh] w-full flex-col overflow-hidden bg-canvas shadow-xl',
          'rounded-t-3xl sm:h-full sm:max-h-none sm:rounded-none sm:rounded-l-3xl',
          widths[width],
        )}
      >
        <header className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-xl font-medium tracking-title">
              {title}
            </h2>
            {description && <p className="mt-1 text-base text-ink-muted">{description}</p>}
          </div>
          <IconButton label="Close" variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </IconButton>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">{children}</div>

        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-line-soft bg-surface/60 px-6 py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  )
}

/* ----------------------------------------------------------------- Menu -- */

export type MenuItem = {
  label: string
  icon?: ReactNode
  onSelect: () => void
  destructive?: boolean
  disabled?: boolean
  /** Renders a check — used for single-select menus like "move to stage". */
  selected?: boolean
}

/**
 * Dropdown menu. Also the keyboard-accessible fallback for every drag
 * interaction ("Move to stage…", "Move to section…").
 */
export function Menu({
  trigger,
  items,
  align = 'end',
  label,
}: {
  trigger: (props: { onClick: () => void; 'aria-expanded': boolean; ref: never }) => ReactNode
  items: MenuItem[]
  align?: 'start' | 'end'
  label: string
}) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) close()
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        close()
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex((i) => (i + 1) % items.length)
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex((i) => (i - 1 + items.length) % items.length)
      }
      if (event.key === 'Enter' || event.key === ' ') {
        const item = items[activeIndex]
        if (item && !item.disabled) {
          event.preventDefault()
          item.onSelect()
          close()
        }
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, close, items, activeIndex])

  return (
    <div ref={containerRef} className="relative">
      {trigger({
        onClick: () => {
          setOpen((v) => !v)
          setActiveIndex(0)
        },
        'aria-expanded': open,
        ref: undefined as never,
      })}

      {open && (
        <div
          role="menu"
          aria-label={label}
          className={cn(
            'animate-pop absolute top-[calc(100%+6px)] z-40 min-w-52 origin-top overflow-hidden rounded-xl bg-raised p-1.5 shadow-lg',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item, index) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => {
                item.onSelect()
                close()
              }}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-base transition-colors duration-fast',
                'disabled:pointer-events-none disabled:text-ink-faint',
                item.destructive ? 'text-critical' : 'text-ink',
                index === activeIndex && !item.disabled && 'bg-surface',
              )}
            >
              {item.icon && <span className="shrink-0 text-ink-muted">{item.icon}</span>}
              <span className="flex-1 truncate">{item.label}</span>
              {item.selected && <span className="text-ink-muted">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------- Tooltip -- */

export function Tooltip({
  label,
  side = 'right',
  children,
}: {
  label: string
  side?: 'top' | 'right' | 'bottom'
  children: ReactNode
}) {
  const positions = {
    top: 'bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2',
    right: 'left-[calc(100%+10px)] top-1/2 -translate-y-1/2',
    bottom: 'top-[calc(100%+8px)] left-1/2 -translate-x-1/2',
  }
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 rounded-md bg-inverse px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-on-inverse',
          'opacity-0 transition-opacity duration-fast ease-out-soft',
          'group-hover/tip:opacity-100 group-focus-within/tip:opacity-100',
          positions[side],
        )}
      >
        {label}
      </span>
    </span>
  )
}

/* ------------------------------------------------------------ Lightbox -- */

export function Lightbox({
  open,
  onClose,
  onPrev,
  onNext,
  caption,
  meta,
  children,
}: {
  open: boolean
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
  caption?: string
  meta?: ReactNode
  children: ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  useOverlayBehaviour(open, onClose, panelRef)

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft') onPrev?.()
      if (event.key === 'ArrowRight') onNext?.()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onPrev, onNext])

  if (!open) return null

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={caption ?? 'Reference preview'}
      tabIndex={-1}
      className="animate-scrim fixed inset-0 z-50 flex flex-col bg-[#0a0a0a]/92 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-4 p-4">
        <div className="min-w-0 text-[#f2f2f0]">{meta}</div>
        <IconButton
          label="Close preview"
          onClick={onClose}
          className="bg-[#ffffff1a] text-[#f2f2f0] hover:bg-[#ffffff2e] shadow-none"
        >
          <X size={18} />
        </IconButton>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4">
        {onPrev && (
          <IconButton
            label="Previous reference"
            onClick={onPrev}
            className="absolute left-2 z-10 bg-[#ffffff1a] text-[#f2f2f0] hover:bg-[#ffffff2e] shadow-none sm:left-6"
          >
            <span aria-hidden>‹</span>
          </IconButton>
        )}
        <div className="animate-pop flex max-h-full max-w-5xl items-center justify-center">
          {children}
        </div>
        {onNext && (
          <IconButton
            label="Next reference"
            onClick={onNext}
            className="absolute right-2 z-10 bg-[#ffffff1a] text-[#f2f2f0] hover:bg-[#ffffff2e] shadow-none sm:right-6"
          >
            <span aria-hidden>›</span>
          </IconButton>
        )}
      </div>

      {caption && (
        <p className="mx-auto max-w-2xl px-6 pb-8 text-center text-base text-[#c9c9c4]">
          {caption}
        </p>
      )}
    </div>,
    document.body,
  )
}

/* ----------------------------------------------------- Confirm dialogue -- */

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = 'Confirm',
  destructive,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  body: string
  confirmLabel?: string
  destructive?: boolean
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-pill px-4 text-base font-medium text-ink-muted transition-colors duration-fast hover:bg-surface hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={cn(
              'h-10 rounded-pill px-4 text-base font-medium transition-[background-color,transform] duration-fast active:scale-[.98]',
              destructive
                ? 'bg-critical-wash text-critical hover:brightness-95'
                : 'bg-inverse text-on-inverse hover:bg-inverse-soft',
            )}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-body text-ink-muted">{body}</p>
    </Modal>
  )
}
