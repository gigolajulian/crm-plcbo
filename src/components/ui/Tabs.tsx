import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface TabItem<T extends string> {
  value: T
  label: string
  /** Small trailing count, e.g. open tasks on a tab. */
  count?: number
  icon?: ReactNode
}

/**
 * Underlined tab bar for record detail pages. Scrolls horizontally on narrow
 * screens rather than wrapping, which keeps the header height stable.
 */
export function Tabs<T extends string>({
  value,
  onChange,
  items,
  label,
  className,
}: {
  value: T
  onChange: (value: T) => void
  items: Array<TabItem<T>>
  label: string
  className?: string
}) {
  const id = useId()

  function onKeyDown(event: React.KeyboardEvent) {
    const index = items.findIndex((i) => i.value === value)
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      onChange(items[(index + 1) % items.length].value)
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      onChange(items[(index - 1 + items.length) % items.length].value)
    }
    if (event.key === 'Home') {
      event.preventDefault()
      onChange(items[0].value)
    }
    if (event.key === 'End') {
      event.preventDefault()
      onChange(items[items.length - 1].value)
    }
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        'no-scrollbar -mb-px flex gap-1 overflow-x-auto border-b border-line',
        className,
      )}
    >
      {items.map((item) => {
        const selected = item.value === value
        return (
          <button
            key={item.value}
            role="tab"
            id={`${id}-${item.value}`}
            aria-selected={selected}
            aria-controls={`${id}-${item.value}-panel`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.value)}
            className={cn(
              'relative flex shrink-0 items-center gap-2 px-3.5 py-3 text-base font-medium whitespace-nowrap',
              'transition-colors duration-fast ease-out-soft',
              selected ? 'text-ink' : 'text-ink-muted hover:text-ink',
            )}
          >
            {item.icon}
            {item.label}
            {item.count !== undefined && item.count > 0 && (
              <span
                className={cn(
                  'tabular grid h-5 min-w-5 place-items-center rounded-pill px-1.5 text-2xs',
                  selected ? 'bg-inverse text-on-inverse' : 'bg-surface text-ink-muted',
                )}
              >
                {item.count}
              </span>
            )}
            <span
              aria-hidden
              className={cn(
                'absolute inset-x-2 -bottom-px h-0.5 rounded-pill transition-colors duration-base ease-out-soft',
                selected ? 'bg-ink' : 'bg-transparent',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

export function TabPanel({
  when,
  value,
  children,
}: {
  when: string
  value: string
  children: ReactNode
}) {
  if (when !== value) return null
  return (
    <div role="tabpanel" tabIndex={0} className="animate-in outline-none">
      {children}
    </div>
  )
}
