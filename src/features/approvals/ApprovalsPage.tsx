import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Stamp } from 'lucide-react'
import type { ApprovalStatus } from '@/data/types'
import { APPROVAL_STATUS } from '@/data/types'
import { useReviewQueue } from '@/store/selectors'
import { cn, formatRelativeTime, pluralize } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, Chip, Pill } from '@/components/ui/primitives'
import { EmptyState } from '@/components/ui/feedback'
import { Img } from '@/components/common/Img'
import { ApprovalBadge, SectionHeading } from '@/components/common/records'
import { ReviewRoom } from './ReviewRoom'

/* ============================================================================
   APPROVALS
   The cross-project review queue. Picking anything here drops into the same
   review room used inside a project, so the interaction is learned once.
   ========================================================================== */

const FILTERS: Array<{ id: ApprovalStatus; label: string }> = [
  { id: 'pending', label: 'Awaiting review' },
  { id: 'changes-requested', label: 'Changes requested' },
  { id: 'approved', label: 'Approved' },
  { id: 'draft', label: 'Draft' },
]

export default function ApprovalsPage() {
  const [params, setParams] = useSearchParams()
  const [statuses, setStatuses] = useState<ApprovalStatus[]>(['pending', 'changes-requested'])

  const all = useReviewQueue()
  const focusedAsset = params.get('asset')

  const queue = useMemo(
    () => (statuses.length === 0 ? all : all.filter((item) => statuses.includes(item.status))),
    [all, statuses],
  )

  const pendingCount = all.filter((i) => i.status === 'pending').length

  return (
    <div className="animate-in">
      <PageHeader
        eyebrow="Creative review"
        title="Approvals"
        description="Work waiting on a decision, and the record of every decision already made."
        meta={
          <>
            <Pill tone={pendingCount > 0 ? 'lime' : 'positive'} size="md">
              {pendingCount > 0
                ? `${pluralize(pendingCount, 'version')} awaiting review`
                : 'Nothing waiting'}
            </Pill>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap gap-1.5">
        {FILTERS.map((filter) => (
          <Chip
            key={filter.id}
            selected={statuses.includes(filter.id)}
            onClick={() =>
              setStatuses((current) =>
                current.includes(filter.id)
                  ? current.filter((s) => s !== filter.id)
                  : [...current, filter.id],
              )
            }
          >
            {filter.label}
            <span className="tabular text-ink-faint">
              {all.filter((i) => i.status === filter.id).length}
            </span>
          </Chip>
        ))}
      </div>

      {all.length === 0 ? (
        <EmptyState
          icon={<Stamp size={20} />}
          title="Nothing to review"
          body="Once a version of the work is sent for review, it lands here with its comments and its history."
          size="lg"
        />
      ) : (
        <div className="flex flex-col gap-6">
          <section>
            <SectionHeading title="Queue" count={queue.length} />
            {queue.length === 0 ? (
              <p className="rounded-2xl bg-surface px-4 py-8 text-center text-sm text-ink-muted">
                Nothing matches those filters.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {queue.map((item) => (
                  <li key={item.versionId}>
                    <button
                      type="button"
                      onClick={() =>
                        setParams((current) => {
                          const updated = new URLSearchParams(current)
                          updated.set('asset', item.assetId)
                          return updated
                        })
                      }
                      aria-pressed={focusedAsset === item.assetId}
                      className="block w-full text-left"
                    >
                      <Card
                        variant="raised"
                        padding="none"
                        radius="2xl"
                        interactive
                        className={cn(
                          'overflow-hidden',
                          focusedAsset === item.assetId && 'ring-2 ring-ink',
                        )}
                      >
                        <Img
                          src={item.url}
                          seed={item.artSeed}
                          alt=""
                          ratio={16 / 10}
                          className="w-full"
                        />
                        <div className="flex flex-col gap-2 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-base font-medium">{item.assetName}</p>
                              <p className="truncate text-sm text-ink-muted">{item.projectName}</p>
                            </div>
                            <Pill tone="neutral" size="sm">
                              {item.label}
                            </Pill>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <ApprovalBadge status={item.status} />
                            {item.openComments > 0 && (
                              <Pill tone="info" size="sm">
                                {pluralize(item.openComments, 'open note')}
                              </Pill>
                            )}
                            <span className="ml-auto text-xs text-ink-faint">
                              {formatRelativeTime(item.createdAt)}
                            </span>
                          </div>
                        </div>
                      </Card>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <SectionHeading
              title="Review room"
              description={
                focusedAsset
                  ? 'Comment, approve, or ask for changes — every decision is kept.'
                  : 'Pick something from the queue above to review it.'
              }
            />
            <ReviewRoom assetIds={focusedAsset ? [focusedAsset] : queue.map((q) => q.assetId)} />
          </section>
        </div>
      )}

      {/* Legend clarifies what each status actually commits you to. */}
      <Card variant="surface" padding="md" radius="2xl" className="mt-6">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(APPROVAL_STATUS) as ApprovalStatus[]).map((status) => (
            <div key={status}>
              <dt className="mb-1.5">
                <ApprovalBadge status={status} />
              </dt>
              <dd className="text-xs text-pretty text-ink-muted">{STATUS_MEANING[status]}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  )
}

const STATUS_MEANING: Record<ApprovalStatus, string> = {
  draft: 'Internal only. The client cannot see it and no decision is recorded.',
  pending: 'Sent for review. Someone owes a decision on this exact version.',
  approved: 'Signed off, with a name and a timestamp against this version.',
  'changes-requested': 'Rejected with reasons. The next version starts from draft.',
}
