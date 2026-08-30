import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CornerDownLeft, Search } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { cn, formatCurrency, matches } from '@/lib/utils'
import { Kbd } from '@/components/ui/primitives'
import { EmptyState } from '@/components/ui/feedback'
import { NAV } from './nav'

/* ============================================================================
   GLOBAL SEARCH / COMMAND PALETTE
   One index over every record type plus navigation and actions. Results are
   grouped, arrow-navigable, and reachable with ⌘K or "/".
   ========================================================================== */

type Result = {
  id: string
  group: 'Jump to' | 'Projects' | 'Clients' | 'Companies' | 'Deals' | 'Tasks'
  title: string
  subtitle?: string
  meta?: string
  to: string
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const navigate = useNavigate()
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const projects = useStore((s) => s.projects)
  const contacts = useStore((s) => s.contacts)
  const companies = useStore((s) => s.companies)
  const deals = useStore((s) => s.deals)
  const tasks = useStore((s) => s.tasks)

  const results = useMemo<Result[]>(() => {
    const q = query.trim()
    const out: Result[] = []

    for (const item of NAV) {
      if (!q || matches(item.label, q)) {
        out.push({ id: `nav-${item.to}`, group: 'Jump to', title: item.label, to: item.to })
      }
    }
    if (!q) return out.slice(0, 8)

    for (const project of projects) {
      if (matches(`${project.name} ${project.code} ${project.summary}`, q)) {
        const company = companies.find((c) => c.id === project.companyId)
        out.push({
          id: project.id,
          group: 'Projects',
          title: project.name,
          subtitle: company?.name,
          meta: project.code,
          to: `/projects/${project.id}`,
        })
      }
    }
    for (const contact of contacts) {
      if (matches(`${contact.name} ${contact.role} ${contact.email}`, q)) {
        const company = companies.find((c) => c.id === contact.companyId)
        out.push({
          id: contact.id,
          group: 'Clients',
          title: contact.name,
          subtitle: `${contact.role}${company ? ` · ${company.name}` : ''}`,
          to: `/contacts/${contact.id}`,
        })
      }
    }
    for (const company of companies) {
      if (matches(`${company.name} ${company.industry}`, q)) {
        out.push({
          id: company.id,
          group: 'Companies',
          title: company.name,
          subtitle: company.industry,
          to: `/companies/${company.id}`,
        })
      }
    }
    for (const deal of deals) {
      if (matches(deal.name, q)) {
        out.push({
          id: deal.id,
          group: 'Deals',
          title: deal.name,
          subtitle: companies.find((c) => c.id === deal.companyId)?.name,
          meta: formatCurrency(deal.value, { compact: true }),
          to: `/deals/${deal.id}`,
        })
      }
    }
    for (const task of tasks) {
      if (task.status !== 'done' && matches(task.title, q)) {
        out.push({
          id: task.id,
          group: 'Tasks',
          title: task.title,
          subtitle: projects.find((p) => p.id === task.projectId)?.name,
          to: '/tasks',
        })
      }
    }
    return out.slice(0, 24)
  }, [query, projects, contacts, companies, deals, tasks])

  useEffect(() => setActive(0), [query])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActive(0)
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20)
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      window.clearTimeout(timer)
      document.body.style.overflow = overflow
    }
  }, [open])

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!open) return null

  function go(result?: Result) {
    if (!result) return
    navigate(result.to)
    onClose()
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((i) => Math.min(i + 1, results.length - 1))
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      go(results[active])
    }
  }

  let lastGroup = ''

  return createPortal(
    <div className="fixed inset-0 z-[55] flex items-start justify-center px-4 pt-[12vh]">
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className="animate-scrim absolute inset-0 cursor-default bg-[#0a0a0a]/35 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search and jump to"
        onKeyDown={onKeyDown}
        className="animate-sheet relative flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-canvas shadow-xl"
      >
        <div className="flex items-center gap-3 px-5 py-4">
          <Search size={18} className="shrink-0 text-ink-faint" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects, clients, deals, tasks…"
            aria-label="Search"
            aria-controls="palette-results"
            className="w-full bg-transparent text-body outline-none placeholder:text-ink-faint"
          />
          <Kbd>Esc</Kbd>
        </div>

        <div className="h-px bg-line-soft" />

        <div id="palette-results" ref={listRef} role="listbox" className="min-h-0 flex-1 overflow-y-auto p-2">
          {results.length === 0 ? (
            <EmptyState
              title={`Nothing matches “${query}”`}
              body="Try a client name, a project code like FF-04, or a section such as Pipeline."
              size="sm"
              className="border-0"
            />
          ) : (
            results.map((result, index) => {
              const showGroup = result.group !== lastGroup
              lastGroup = result.group
              return (
                <div key={`${result.group}-${result.id}`}>
                  {showGroup && (
                    <p className="eyebrow px-3 pt-3 pb-1.5">{result.group}</p>
                  )}
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === active}
                    data-index={index}
                    onMouseMove={() => setActive(index)}
                    onClick={() => go(result)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-fast',
                      index === active ? 'bg-raised shadow-xs' : 'hover:bg-surface',
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base">{result.title}</span>
                      {result.subtitle && (
                        <span className="block truncate text-sm text-ink-muted">
                          {result.subtitle}
                        </span>
                      )}
                    </span>
                    {result.meta && (
                      <span className="tabular shrink-0 text-sm text-ink-faint">{result.meta}</span>
                    )}
                    {index === active ? (
                      <CornerDownLeft size={14} className="shrink-0 text-ink-faint" aria-hidden />
                    ) : (
                      <ArrowRight size={14} className="shrink-0 text-transparent" aria-hidden />
                    )}
                  </button>
                </div>
              )
            })
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-line-soft px-5 py-2.5 text-xs text-ink-faint">
          <span className="flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> navigate
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>↵</Kbd> open
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            <Kbd>G</Kbd> then a letter jumps
          </span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
