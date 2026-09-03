import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Images, Pencil, Target } from 'lucide-react'
import type { Shoot } from '@/data/types'
import { useStore } from '@/store/useStore'
import { cn, formatCurrency, sortBy, sum } from '@/lib/utils'
import { lineItemsTotal } from '@/store/selectors'
import { Button, Card, Pill } from '@/components/ui/primitives'
import { Textarea } from '@/components/ui/form'
import { Img } from '@/components/common/Img'
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

export function ShootBrief({ shoot }: { shoot: Shoot }) {
  const updateShoot = useStore((s) => s.updateShoot)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  function startEdit(key: string, value: string) {
    setEditing(key)
    setDraft(value)
  }

  function commit(key: keyof Shoot['brief']) {
    updateShoot(shoot.id, { brief: { ...shoot.brief, [key]: draft } })
    setEditing(null)
    toast.success('Brief updated')
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.7fr_1fr]">
      <Card variant="raised" padding="lg" radius="3xl">
        <article className="flex flex-col gap-8">
          {FIELDS.map((field) => {
            const value = shoot.brief[field.key]
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
            {shoot.brief.successCriteria.length === 0 ? (
              <p className="text-sm text-ink-faint">No success criteria set.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {shoot.brief.successCriteria.map((criterion, index) => (
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
        <BoardStrip shoot={shoot} />
        <Deliverables shoot={shoot} />
        <ClientContext shoot={shoot} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- board -- */

/**
 * The references, next to the direction they illustrate. The full board is a
 * tab of its own, but a brief that describes a look with no picture of it is
 * half a brief — so the first few sit here, in the reading column's rail.
 */
function BoardStrip({ shoot }: { shoot: Shoot }) {
  const boards = useStore((s) => s.moodboards)
  const items = useStore((s) => s.moodItems)
  const board = boards.find((b) => b.shootId === shoot.id)
  const all = board ? items.filter((i) => i.boardId === board.id) : []
  const visual = sortBy(
    all.filter((i) => i.kind === 'image' || i.kind === 'shot' || i.kind === 'material'),
    (i) => (i.pinned ? 0 : 1),
  ).slice(0, 6)

  return (
    <Card variant="surface" padding="md" radius="2xl">
      <SectionHeading
        title="References"
        count={all.length}
        action={
          <Link
            to={`/shoots/${shoot.id}?tab=moodboard`}
            className="flex items-center gap-1.5 text-xs font-medium text-ink-muted transition-colors duration-fast hover:text-ink"
          >
            <Images size={12} aria-hidden />
            {all.length === 0 ? 'Start the board' : 'Open board'}
          </Link>
        }
      />

      {visual.length === 0 ? (
        <p className="py-3 text-sm text-ink-muted">
          Nothing pinned yet. The board holds images, colours, type and materials.
        </p>
      ) : (
        <ul className="mt-1 grid grid-cols-3 gap-1.5">
          {visual.map((item) => (
            <li key={item.id}>
              <Link
                to={`/shoots/${shoot.id}?tab=moodboard`}
                className="block overflow-hidden rounded-lg"
                aria-label={item.caption || 'Open the moodboard'}
              >
                <Img
                  src={item.payload.kind === 'image' || item.payload.kind === 'shot' || item.payload.kind === 'material' ? item.payload.url : undefined}
                  seed={`${shoot.id}-${item.id}`}
                  alt=""
                  ratio={1}
                  className="w-full transition-transform duration-slow ease-out-soft hover:scale-[1.06]"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

/* --------------------------------------------------------- deliverables -- */

function Deliverables({ shoot }: { shoot: Shoot }) {
  const updateShoot = useStore((s) => s.updateShoot)
  const contracted = sum(shoot.deliverables.map((d) => d.contracted))
  const delivered = sum(shoot.deliverables.map((d) => d.delivered))

  /** Marking a line complete means every contracted file has gone out. */
  function toggle(id: string) {
    updateShoot(shoot.id, {
      deliverables: shoot.deliverables.map((d) =>
        d.id === id
          ? { ...d, delivered: d.delivered >= d.contracted ? 0 : d.contracted }
          : d,
      ),
    })
  }

  return (
    <Card variant="surface" padding="md" radius="2xl">
      <SectionHeading
        title="Deliverables"
        count={shoot.deliverables.length}
        description={`${delivered} of ${contracted} files delivered`}
      />
      {shoot.deliverables.length === 0 ? (
        <p className="py-3 text-sm text-ink-muted">Nothing listed yet.</p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {shoot.deliverables.map((deliverable) => {
            const complete = deliverable.delivered >= deliverable.contracted
            const spent = deliverable.revisionsUsed >= deliverable.revisionsIncluded
            return (
              <li key={deliverable.id} className="flex items-start gap-2.5 py-2">
                <TaskCheck
                  done={complete}
                  label={deliverable.name}
                  onToggle={() => toggle(deliverable.id)}
                />
                <div className="min-w-0 flex-1">
                  <p className={cn('text-base leading-snug', complete && 'text-ink-muted line-through')}>
                    {deliverable.name}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-faint">
                    <span className="tabular">
                      {deliverable.delivered} / {deliverable.contracted} delivered
                    </span>
                    {deliverable.revisionsIncluded > 0 && (
                      <span className={cn('tabular', spent && 'text-critical')}>
                        · {deliverable.revisionsUsed} / {deliverable.revisionsIncluded} revisions
                        {spent ? ' — further rounds are chargeable' : ''}
                      </span>
                    )}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

/* ------------------------------------------------------- client context -- */

function ClientContext({ shoot }: { shoot: Shoot }) {
  const contact = useStore((s) => s.contacts.find((c) => c.id === shoot.contactId))
  const company = useStore((s) => s.companies.find((c) => c.id === shoot.companyId))

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
            <dt className="text-ink-muted">Quoted</dt>
            <dd className="tabular text-right">{formatCurrency(lineItemsTotal(shoot.lineItems))}</dd>
          </div>
        </dl>
      )}

      {shoot.referredByContactId && (
        <div className="mt-4">
          <Pill tone="lime">Referred by a client</Pill>
        </div>
      )}
    </Card>
  )
}
