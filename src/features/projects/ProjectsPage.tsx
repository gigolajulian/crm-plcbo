import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarRange, Columns3, LayoutGrid, List, Plus } from 'lucide-react'
import type { Project, ProjectStage } from '@/data/types'
import { PROJECT_STAGES } from '@/data/types'
import { useStore } from '@/store/useStore'
import { useUI } from '@/store/useUI'
import { matches, sortBy } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import {
  FilterBar,
  passesFilters,
  useFilterState,
  type FilterGroup,
} from '@/components/common/FilterBar'
import { Button, SegmentedControl } from '@/components/ui/primitives'
import { EmptyState, NoResults, toast } from '@/components/ui/feedback'
import { Menu } from '@/components/ui/overlay'
import { ProjectBoardCard, ProjectCard, ProjectRow } from './ProjectCard'
import { ProjectTimeline } from './ProjectTimeline'

type View = 'gallery' | 'board' | 'timeline' | 'list'

const VIEWS = [
  { value: 'gallery' as const, label: 'Gallery', icon: <LayoutGrid size={14} /> },
  { value: 'board' as const, label: 'Board', icon: <Columns3 size={14} /> },
  { value: 'timeline' as const, label: 'Timeline', icon: <CalendarRange size={14} /> },
  { value: 'list' as const, label: 'List', icon: <List size={14} /> },
]

const SORTS = [
  { value: 'due-asc', label: 'Due soonest' },
  { value: 'due-desc', label: 'Due latest' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'budget-desc', label: 'Largest budget' },
  { value: 'recent', label: 'Recently added' },
]

export default function ProjectsPage() {
  const [params, setParams] = useSearchParams()
  const view = (params.get('view') as View) ?? 'gallery'
  const [sort, setSort] = useState('due-asc')

  const projects = useStore((s) => s.projects)
  const companies = useStore((s) => s.companies)
  const team = useStore((s) => s.team)
  const tags = useStore((s) => s.tags)
  const savedViews = useStore((s) => s.savedViews)
  const saveView = useStore((s) => s.saveView)
  const deleteView = useStore((s) => s.deleteView)

  const { filters, setFilters, query, setQuery, toggle, clear, activeCount } = useFilterState()

  const groups: FilterGroup[] = useMemo(
    () => [
      {
        id: 'stage',
        label: 'Stage',
        options: PROJECT_STAGES.map((stage) => ({
          value: stage.id,
          label: stage.label,
          count: projects.filter((p) => p.stage === stage.id).length,
        })),
      },
      {
        id: 'health',
        label: 'Health',
        options: [
          { value: 'on-track', label: 'On track' },
          { value: 'at-risk', label: 'At risk' },
          { value: 'blocked', label: 'Blocked' },
        ].map((option) => ({
          ...option,
          count: projects.filter((p) => p.health === option.value).length,
        })),
      },
      {
        id: 'company',
        label: 'Client',
        options: companies.map((company) => ({
          value: company.id,
          label: company.name,
          count: projects.filter((p) => p.companyId === company.id).length,
        })),
      },
      {
        id: 'lead',
        label: 'Lead',
        options: team
          .filter((m) => m.active)
          .map((member) => ({
            value: member.id,
            label: member.name,
            count: projects.filter((p) => p.leadId === member.id).length,
          })),
      },
      {
        id: 'tags',
        label: 'Tags',
        options: tags.map((tag) => ({
          value: tag.id,
          label: tag.label,
          count: projects.filter((p) => p.tags.includes(tag.id)).length,
        })),
      },
    ],
    [projects, companies, team, tags],
  )

  const filtered = useMemo(() => {
    const list = projects.filter((project) => {
      if (project.archived) return false
      if (
        query &&
        !matches(`${project.name} ${project.code} ${project.summary}`, query)
      ) {
        return false
      }
      return passesFilters(filters, {
        stage: project.stage,
        health: project.health,
        company: project.companyId,
        lead: project.leadId,
        tags: project.tags,
      })
    })

    switch (sort) {
      case 'due-desc':
        return sortBy(list, (p) => p.dueDate, -1)
      case 'name':
        return sortBy(list, (p) => p.name.toLowerCase())
      case 'budget-desc':
        return sortBy(list, (p) => p.budget, -1)
      case 'recent':
        return sortBy(list, (p) => p.createdAt, -1)
      default:
        // Finished work sinks to the bottom — a delivered project is not "due".
        return sortBy(list, (p) => `${p.stage === 'complete' ? 1 : 0}${p.dueDate}`)
    }
  }, [projects, query, filters, sort])

  function setView(next: View) {
    setParams((current) => {
      const updated = new URLSearchParams(current)
      updated.set('view', next)
      return updated
    })
  }

  const projectViews = savedViews.filter((v) => v.scope === 'projects')

  return (
    <div className="animate-in">
      <PageHeader
        eyebrow="Studio"
        title="Projects"
        description="Every piece of work the studio has in hand, from first conversation to final delivery."
        actions={
          <>
            <SegmentedControl
              value={view}
              onChange={setView}
              segments={VIEWS}
              label="Project view"
              size="sm"
              className="hidden sm:inline-flex"
            />
            <Menu
              label="Choose view"
              items={VIEWS.map((v) => ({
                label: v.label,
                selected: v.value === view,
                onSelect: () => setView(v.value),
              }))}
              trigger={({ onClick, ...rest }) => (
                <Button className="sm:hidden" onClick={onClick} {...rest}>
                  {VIEWS.find((v) => v.value === view)?.label}
                </Button>
              )}
            />
            <NewProjectButton />
          </>
        }
      />

      <FilterBar
        query={query}
        onQuery={setQuery}
        searchLabel="Search projects"
        groups={groups}
        filters={filters}
        onToggle={toggle}
        onClear={clear}
        activeCount={activeCount}
        sort={sort}
        onSort={setSort}
        sortOptions={SORTS}
        savedViews={projectViews}
        onApplyView={(v) => {
          setFilters(v.filters as Record<string, string[]>)
          if (v.sort) setSort(v.sort)
          if (v.layout) setView(v.layout as View)
          toast.show(`Applied “${v.name}”`)
        }}
        onSaveView={(name) => {
          saveView({ scope: 'projects', name, filters, sort, layout: view })
          toast.success(`Saved “${name}”`)
        }}
        onDeleteView={(id) => {
          deleteView(id)
          toast.show('View deleted')
        }}
        resultCount={filtered.length}
        entity="project"
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid size={20} />}
          title="No projects yet"
          body="Projects are where briefs, moodboards, tasks and approvals come together. Start with the client and the shape of the work."
          size="lg"
          action={<NewProjectButton />}
        />
      ) : filtered.length === 0 ? (
        <NoResults query={query} onClear={clear} entity="projects" />
      ) : view === 'gallery' ? (
        <GalleryView projects={filtered} />
      ) : view === 'board' ? (
        <BoardView projects={filtered} />
      ) : view === 'timeline' ? (
        <ProjectTimeline projects={filtered} />
      ) : (
        <ListView projects={filtered} />
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- views -- */

function GalleryView({ projects }: { projects: Project[] }) {
  return (
    <ul className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((project, index) => (
        <li key={project.id} style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}>
          <ProjectCard project={project} size="lg" />
        </li>
      ))}
    </ul>
  )
}

function ListView({ projects }: { projects: Project[] }) {
  return (
    <ul className="stagger flex flex-col gap-2">
      {projects.map((project, index) => (
        <li key={project.id} style={{ animationDelay: `${Math.min(index, 10) * 25}ms` }}>
          <ProjectRow project={project} />
        </li>
      ))}
    </ul>
  )
}

/**
 * Board view groups by stage. Stage changes here go through a menu rather than
 * drag: projects move stage rarely and deliberately, unlike deals.
 */
function BoardView({ projects }: { projects: Project[] }) {
  const setProjectStage = useStore((s) => s.setProjectStage)

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
      <div className="flex min-w-max gap-3">
        {PROJECT_STAGES.map((stage) => {
          const inStage = projects.filter((p) => p.stage === stage.id)
          return (
            <section key={stage.id} className="flex w-72 shrink-0 flex-col gap-3">
              <header className="flex items-baseline justify-between gap-2 px-1">
                <h2 className="text-base font-medium">
                  {stage.label}
                  <span className="tabular ml-2 text-sm text-ink-faint">{inStage.length}</span>
                </h2>
              </header>
              <p className="px-1 text-xs text-ink-faint">{stage.hint}</p>

              <ul className="flex flex-col gap-2.5">
                {inStage.map((project) => (
                  <li key={project.id} className="relative">
                    <ProjectBoardCard project={project} />
                    <div className="absolute top-2 right-2 z-10">
                      <Menu
                        label={`Move ${project.name} to another stage`}
                        items={PROJECT_STAGES.filter((s) => s.id !== stage.id).map((s) => ({
                          label: `Move to ${s.label}`,
                          onSelect: () => {
                            setProjectStage(project.id, s.id as ProjectStage)
                            toast.success(`${project.name} moved to ${s.label}`)
                          },
                        }))}
                        trigger={({ onClick, ...rest }) => (
                          <button
                            type="button"
                            onClick={onClick}
                            aria-label={`Move ${project.name} to another stage`}
                            className="grid size-7 place-items-center rounded-full bg-[#0a0a0a]/45 text-[#f2f2f0] backdrop-blur-sm transition-colors duration-fast hover:bg-[#0a0a0a]/70"
                            {...rest}
                          >
                            <span aria-hidden>⋯</span>
                          </button>
                        )}
                      />
                    </div>
                  </li>
                ))}
                {inStage.length === 0 && (
                  <li className="rounded-xl border border-dashed border-line px-3 py-8 text-center text-sm text-ink-faint">
                    Nothing in {stage.label.toLowerCase()}
                  </li>
                )}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ new button -- */

function NewProjectButton() {
  const openQuickAdd = useUI((s) => s.openQuickAdd)
  return (
    <Button variant="primary" icon={<Plus size={16} />} onClick={() => openQuickAdd('project')}>
      New project
    </Button>
  )
}
