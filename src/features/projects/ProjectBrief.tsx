import { useState } from 'react'
import { Check, Pencil, Target } from 'lucide-react'
import type { Project } from '@/data/types'
import { useStore } from '@/store/useStore'
import { cn, formatCurrency } from '@/lib/utils'
import { Button, Card, Pill } from '@/components/ui/primitives'
import { Textarea } from '@/components/ui/form'
import { SectionHeading, TaskCheck } from '@/components/common/records'
import { PersonCell } from '@/components/common/records'
import { toast } from '@/components/ui/feedback'

/* ============================================================================
   CREATIVE BRIEF
   Set as an editorial document rather than a form: long measure, generous
   leading, one idea per block. Each field edits in place.
   ========================================================================== */

const FIELDS = [
  {
    key: 'objective' as const,
    label: 'Objective',
    hint: 'What has to be true when this is finished.',
  },
  { key: 'audience' as const, label: 'Audience', hint: 'Who it is for, and what they already think.' },
  {
    key: 'direction' as const,
    label: 'Creative direction',
    hint: 'The feel, the references, the rules of the look.',
  },
  {
    key: 'constraints' as const,
    label: 'Constraints',
    hint: 'The real ones — budget, physics, legal, politics.',
  },
]

export function ProjectBrief({ project }: { project: Project }) {
  const updateProject = useStore((s) => s.updateProject)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  function startEdit(key: string, value: string) {
    setEditing(key)
    setDraft(value)
  }

  function commit(key: keyof Project['brief']) {
    updateProject(project.id, { brief: { ...project.brief, [key]: draft } })
    setEditing(null)
    toast.success('Brief updated')
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
      <Card variant="raised" padding="lg" radius="3xl">
        <article className="flex flex-col gap-8">
          {FIELDS.map((field) => {
            const value = project.brief[field.key]
            const isEditing = editing === field.key
            return (
              <section key={field.key}>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <h3 className="text-lg font-medium tracking-tight">{field.label}</h3>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => startEdit(field.key, value)}
                      className="flex items-center gap-1.5 text-xs text-ink-muted transition-colors duration-fast hover:text-ink"
                    >
                      <Pencil size={12} aria-hidden />
                      Edit
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <Textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={5}
                      aria-label={field.label}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                        Cancel
                      </Button>
                      <Button size="sm" variant="primary" onClick={() => commit(field.key)}>
                        Save
                      </Button>
                    </div>
                  </div>
                ) : value ? (
                  <p className="max-w-prose text-body leading-relaxed text-pretty text-ink-muted">
                    {value}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(field.key, '')}
                    className="w-full rounded-xl border border-dashed border-line px-4 py-6 text-left text-sm text-ink-faint transition-colors duration-fast hover:border-ink-faint hover:text-ink-muted"
                  >
                    {field.hint}
                  </button>
                )}
              </section>
            )
          })}

          {/* -------------------------------------------- success criteria */}
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-medium tracking-tight">
              <Target size={16} aria-hidden />
              What good looks like
            </h3>
            {project.brief.successCriteria.length === 0 ? (
              <p className="text-sm text-ink-faint">No success criteria set.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {project.brief.successCriteria.map((criterion, index) => (
                  <li key={index} className="flex items-start gap-2.5">
                    <span
                      className="mt-1 grid size-4 shrink-0 place-items-center rounded-full bg-lime text-[#0a0a0a]"
                      aria-hidden
                    >
                      <Check size={10} strokeWidth={3} />
                    </span>
                    <span className="text-body text-pretty text-ink-muted">{criterion}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </article>
      </Card>

      {/* ----------------------------------------------------- side rail */}
      <div className="flex flex-col gap-5">
        <Deliverables project={project} />
        <ClientContext project={project} />
      </div>
    </div>
  )
}

/* --------------------------------------------------------- deliverables -- */

function Deliverables({ project }: { project: Project }) {
  const updateProject = useStore((s) => s.updateProject)
  const done = project.deliverables.filter((d) => d.done).length

  function toggle(id: string) {
    updateProject(project.id, {
      deliverables: project.deliverables.map((d) =>
        d.id === id ? { ...d, done: !d.done } : d,
      ),
    })
  }

  return (
    <Card variant="surface" padding="md" radius="2xl">
      <SectionHeading
        title="Deliverables"
        count={project.deliverables.length}
        description={`${done} of ${project.deliverables.length} complete`}
      />
      {project.deliverables.length === 0 ? (
        <p className="py-3 text-sm text-ink-muted">Nothing listed yet.</p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {project.deliverables.map((deliverable) => (
            <li key={deliverable.id} className="flex items-start gap-2.5 py-2">
              <TaskCheck
                done={deliverable.done}
                label={deliverable.name}
                onToggle={() => toggle(deliverable.id)}
              />
              <div className="min-w-0 flex-1">
                <p className={cn('text-base leading-snug', deliverable.done && 'text-ink-muted line-through')}>
                  {deliverable.name}
                </p>
                <p className="mt-0.5 text-xs text-ink-faint">{deliverable.quantity}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

/* ------------------------------------------------------- client context -- */

function ClientContext({ project }: { project: Project }) {
  const contact = useStore((s) => s.contacts.find((c) => c.id === project.clientContactId))
  const company = useStore((s) => s.companies.find((c) => c.id === project.companyId))

  return (
    <Card variant="raised" padding="md" radius="2xl">
      <SectionHeading title="Working with" />

      {contact && (
        <>
          <PersonCell id={contact.id} kind="contact" size="md" />
          {contact.creativePrefs && (
            <div className="mt-4 rounded-xl bg-lime-wash p-3.5">
              <p className="eyebrow mb-1.5">How they like to work</p>
              <p className="text-sm leading-relaxed text-pretty text-ink">
                {contact.creativePrefs}
              </p>
            </div>
          )}
        </>
      )}

      {company && (
        <dl className="mt-4 flex flex-col gap-2.5 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-ink-muted">Company</dt>
            <dd className="truncate text-right">{company.name}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-muted">Industry</dt>
            <dd className="truncate text-right">{company.industry}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-muted">Fee</dt>
            <dd className="tabular text-right">{formatCurrency(project.budget)}</dd>
          </div>
        </dl>
      )}

      {project.dealId && (
        <div className="mt-4">
          <Pill tone="lime">Came from a won deal</Pill>
        </div>
      )}
    </Card>
  )
}
