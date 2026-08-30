import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Crumb {
  label: string
  to?: string
}

/**
 * The page header from the references: a small breadcrumb line, an oversized
 * display title, and a row of pill controls floated to the right.
 */
export function PageHeader({
  title,
  eyebrow,
  crumbs,
  description,
  actions,
  meta,
  className,
}: {
  title: ReactNode
  eyebrow?: string
  crumbs?: Crumb[]
  description?: ReactNode
  /** Pill controls — view switchers, filters, primary action. */
  actions?: ReactNode
  /** Secondary line under the title: counts, owner, dates. */
  meta?: ReactNode
  className?: string
}) {
  return (
    <header className={cn('mb-6 lg:mb-8', className)}>
      {crumbs && crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-3">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-ink-muted">
            {crumbs.map((crumb, index) => (
              <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                {index > 0 && (
                  <ChevronRight size={13} className="text-ink-faint" aria-hidden />
                )}
                {crumb.to ? (
                  <Link
                    to={crumb.to}
                    className="rounded-xs transition-colors duration-fast hover:text-ink"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-ink">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {eyebrow && !crumbs && <p className="eyebrow mb-2">{eyebrow}</p>}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-title font-medium tracking-display text-balance sm:text-display">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-body text-pretty text-ink-muted">{description}</p>
          )}
          {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>

        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">{actions}</div>
        )}
      </div>
    </header>
  )
}
