import { useState, type ReactNode } from 'react'
import { Bookmark, BookmarkPlus, ListFilter, X } from 'lucide-react'
import { cn, pluralize } from '@/lib/utils'
import { Button, Chip, IconButton, Pill } from '@/components/ui/primitives'
import { SearchInput } from '@/components/ui/form'
import { Menu } from '@/components/ui/overlay'
import type { SavedView } from '@/data/types'

/* ============================================================================
   FILTER BAR
   One filtering, sorting and saved-view mechanism, shared by Projects, Deals,
   Contacts and Tasks — so the behaviour is identical everywhere.
   ========================================================================== */

export interface FilterGroup {
  id: string
  label: string
  options: Array<{ value: string; label: string; count?: number }>
}

export type FilterState = Record<string, string[]>

export function useFilterState(initial: FilterState = {}) {
  const [filters, setFilters] = useState<FilterState>(initial)
  const [query, setQuery] = useState('')

  function toggle(groupId: string, value: string) {
    setFilters((current) => {
      const existing = current[groupId] ?? []
      const next = existing.includes(value)
        ? existing.filter((v) => v !== value)
        : [...existing, value]
      const updated = { ...current, [groupId]: next }
      if (next.length === 0) delete updated[groupId]
      return updated
    })
  }

  function clear() {
    setFilters({})
    setQuery('')
  }

  const activeCount =
    Object.values(filters).reduce((total, values) => total + values.length, 0) + (query ? 1 : 0)

  return { filters, setFilters, query, setQuery, toggle, clear, activeCount }
}

/** True when the record passes every active filter group. */
export function passesFilters(
  filters: FilterState,
  values: Record<string, string | string[] | undefined>,
): boolean {
  return Object.entries(filters).every(([groupId, selected]) => {
    if (selected.length === 0) return true
    const value = values[groupId]
    if (value === undefined) return false
    return Array.isArray(value)
      ? value.some((v) => selected.includes(v))
      : selected.includes(value)
  })
}

export function FilterBar({
  query,
  onQuery,
  searchLabel,
  groups,
  filters,
  onToggle,
  onClear,
  activeCount,
  sort,
  onSort,
  sortOptions,
  savedViews,
  onApplyView,
  onSaveView,
  onDeleteView,
  resultCount,
  entity = 'result',
  children,
}: {
  query: string
  onQuery: (value: string) => void
  searchLabel: string
  groups: FilterGroup[]
  filters: FilterState
  onToggle: (groupId: string, value: string) => void
  onClear: () => void
  activeCount: number
  sort?: string
  onSort?: (value: string) => void
  sortOptions?: Array<{ value: string; label: string }>
  savedViews?: SavedView[]
  onApplyView?: (view: SavedView) => void
  onSaveView?: (name: string) => void
  onDeleteView?: (id: string) => void
  resultCount?: number
  entity?: string
  /** View switcher or other controls pinned to the right. */
  children?: ReactNode
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mb-5 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={query}
          onChange={onQuery}
          label={searchLabel}
          placeholder={searchLabel}
          className="min-w-0 flex-1 sm:max-w-xs"
        />

        <Button
          variant={expanded || activeCount > 0 ? 'primary' : 'secondary'}
          icon={<ListFilter size={15} />}
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          Filter
          {activeCount > 0 && (
            <span className="tabular ml-1 grid h-5 min-w-5 place-items-center rounded-pill bg-lime px-1.5 text-2xs text-[#0a0a0a]">
              {activeCount}
            </span>
          )}
        </Button>

        {sortOptions && onSort && (
          <Menu
            label="Sort by"
            items={sortOptions.map((option) => ({
              label: option.label,
              selected: option.value === sort,
              onSelect: () => onSort(option.value),
            }))}
            trigger={({ onClick, ...rest }) => (
              <Button variant="secondary" onClick={onClick} {...rest}>
                {sortOptions.find((o) => o.value === sort)?.label ?? 'Sort'}
              </Button>
            )}
          />
        )}

        {savedViews && savedViews.length > 0 && onApplyView && (
          <Menu
            label="Saved views"
            items={[
              ...savedViews.map((view) => ({
                label: view.name,
                icon: <Bookmark size={14} />,
                onSelect: () => onApplyView(view),
              })),
              ...(onDeleteView
                ? savedViews.map((view) => ({
                    label: `Delete “${view.name}”`,
                    destructive: true,
                    onSelect: () => onDeleteView(view.id),
                  }))
                : []),
            ]}
            trigger={({ onClick, ...rest }) => (
              <IconButton label="Saved views" onClick={onClick} {...rest}>
                <Bookmark size={16} />
              </IconButton>
            )}
          />
        )}

        {onSaveView && activeCount > 0 && (
          <IconButton
            label="Save this view"
            onClick={() => {
              const name = window.prompt('Name this view')
              if (name?.trim()) onSaveView(name.trim())
            }}
          >
            <BookmarkPlus size={16} />
          </IconButton>
        )}

        <div className="ml-auto flex items-center gap-2">{children}</div>
      </div>

      {expanded && (
        <div className="animate-in flex flex-col gap-3 rounded-2xl bg-surface p-4">
          {groups.map((group) => (
            <fieldset key={group.id}>
              <legend className="eyebrow mb-2">{group.label}</legend>
              <div className="flex flex-wrap gap-1.5">
                {group.options.map((option) => (
                  <Chip
                    key={option.value}
                    selected={(filters[group.id] ?? []).includes(option.value)}
                    onClick={() => onToggle(group.id, option.value)}
                  >
                    {option.label}
                    {option.count !== undefined && (
                      <span className="tabular text-ink-faint">{option.count}</span>
                    )}
                  </Chip>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      )}

      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {resultCount !== undefined && (
            <span className="text-sm text-ink-muted">
              {pluralize(resultCount, entity)}
            </span>
          )}
          <ul className="flex flex-wrap gap-1.5">
            {Object.entries(filters).flatMap(([groupId, values]) =>
              values.map((value) => {
                const group = groups.find((g) => g.id === groupId)
                const option = group?.options.find((o) => o.value === value)
                return (
                  <li key={`${groupId}-${value}`}>
                    <button
                      type="button"
                      onClick={() => onToggle(groupId, value)}
                      aria-label={`Remove filter ${option?.label ?? value}`}
                      className={cn(
                        'inline-flex h-7 items-center gap-1.5 rounded-pill bg-raised px-3 text-xs font-medium shadow-xs',
                        'transition-colors duration-fast hover:bg-surface-hover',
                      )}
                    >
                      {option?.label ?? value}
                      <X size={11} aria-hidden />
                    </button>
                  </li>
                )
              }),
            )}
            {query && (
              <li>
                <Pill tone="neutral">“{query}”</Pill>
              </li>
            )}
          </ul>
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}
