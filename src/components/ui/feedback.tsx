import { create } from 'zustand'
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Check, Info, Undo2, X } from 'lucide-react'
import { cn, uid } from '@/lib/utils'
import { Button } from './primitives'

/* ============================================================================
   FEEDBACK STATES
   Toasts, empty, no-results, error and loading. Every screen is expected to
   handle all of them — these are the shared implementations.
   ========================================================================== */

/* --------------------------------------------------------------- Toasts -- */

export type ToastTone = 'default' | 'success' | 'warning' | 'critical'

export interface Toast {
  id: string
  message: string
  detail?: string
  tone: ToastTone
  /** An undo affordance turns a destructive action into a recoverable one. */
  action?: { label: string; onClick: () => void }
  duration: number
}

type ToastStore = {
  toasts: Toast[]
  push: (toast: Omit<Toast, 'id' | 'tone' | 'duration'> & { tone?: ToastTone; duration?: number }) => string
  dismiss: (id: string) => void
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = uid('toast')
    set((state) => ({
      toasts: [
        ...state.toasts,
        { ...toast, id, tone: toast.tone ?? 'default', duration: toast.duration ?? 4500 },
      ],
    }))
    return id
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

/** Fire a toast from anywhere, including outside React. */
export const toast = {
  show: (message: string, options: Partial<Omit<Toast, 'id' | 'message'>> = {}) =>
    useToastStore.getState().push({ message, ...options }),
  success: (message: string, options: Partial<Omit<Toast, 'id' | 'message' | 'tone'>> = {}) =>
    useToastStore.getState().push({ message, tone: 'success', ...options }),
  warning: (message: string, options: Partial<Omit<Toast, 'id' | 'message' | 'tone'>> = {}) =>
    useToastStore.getState().push({ message, tone: 'warning', ...options }),
  error: (message: string, options: Partial<Omit<Toast, 'id' | 'message' | 'tone'>> = {}) =>
    useToastStore.getState().push({ message, tone: 'critical', ...options }),
}

function ToastCard({ item }: { item: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss)

  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(item.id), item.duration)
    return () => window.clearTimeout(timer)
  }, [item.id, item.duration, dismiss])

  const icons: Record<ToastTone, ReactNode> = {
    default: <Info size={15} />,
    success: <Check size={15} />,
    warning: <AlertTriangle size={15} />,
    critical: <AlertTriangle size={15} />,
  }
  const tones: Record<ToastTone, string> = {
    default: 'text-ink-muted',
    success: 'text-positive',
    warning: 'text-caution',
    critical: 'text-critical',
  }

  return (
    <div className="animate-sheet pointer-events-auto flex w-full items-start gap-3 rounded-xl bg-raised p-3.5 pr-2.5 shadow-lg">
      <span className={cn('mt-0.5 shrink-0', tones[item.tone])} aria-hidden>
        {icons[item.tone]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-base leading-snug">{item.message}</p>
        {item.detail && <p className="mt-0.5 text-sm text-ink-muted">{item.detail}</p>}
      </div>
      {item.action && (
        <Button
          size="sm"
          variant="ghost"
          icon={<Undo2 size={13} />}
          onClick={() => {
            item.action!.onClick()
            dismiss(item.id)
          }}
        >
          {item.action.label}
        </Button>
      )}
      <button
        type="button"
        onClick={() => dismiss(item.id)}
        aria-label="Dismiss notification"
        className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-ink-faint transition-colors duration-fast hover:bg-surface hover:text-ink"
      >
        <X size={13} />
      </button>
    </div>
  )
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96 sm:p-0"
    >
      {toasts.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </div>,
    document.body,
  )
}

/* ---------------------------------------------------------- EmptyState -- */

export function EmptyState({
  icon,
  title,
  body,
  action,
  secondaryAction,
  size = 'md',
  className,
}: {
  icon?: ReactNode
  title: string
  body?: string
  action?: ReactNode
  secondaryAction?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-line text-center',
        size === 'sm' ? 'gap-2 px-6 py-8' : size === 'lg' ? 'gap-4 px-8 py-20' : 'gap-3 px-8 py-14',
        className,
      )}
    >
      {icon && (
        <span
          className="grid size-12 place-items-center rounded-full bg-surface text-ink-faint"
          aria-hidden
        >
          {icon}
        </span>
      )}
      <div className="max-w-sm">
        <p className={cn('font-medium tracking-tight', size === 'lg' ? 'text-xl' : 'text-lg')}>
          {title}
        </p>
        {body && <p className="mt-1.5 text-base text-balance text-ink-muted">{body}</p>}
      </div>
      {(action || secondaryAction) && (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------ ErrorState -- */

export function ErrorState({
  title = 'Something went wrong',
  body = 'The view could not be rendered. Reloading usually clears it.',
  onRetry,
}: {
  title?: string
  body?: string
  onRetry?: () => void
}) {
  return (
    <EmptyState
      icon={<AlertTriangle size={20} />}
      title={title}
      body={body}
      action={
        onRetry ? (
          <Button variant="primary" onClick={onRetry}>
            Try again
          </Button>
        ) : undefined
      }
    />
  )
}

/* ----------------------------------------------------------- NoResults -- */

export function NoResults({
  query,
  onClear,
  entity = 'results',
}: {
  query?: string
  onClear?: () => void
  entity?: string
}) {
  return (
    <EmptyState
      title={query ? `No ${entity} match “${query}”` : `No ${entity} match these filters`}
      body="Try a broader search, or clear the filters to see everything again."
      action={
        onClear ? (
          <Button variant="secondary" onClick={onClear}>
            Clear filters
          </Button>
        ) : undefined
      }
      size="sm"
    />
  )
}
