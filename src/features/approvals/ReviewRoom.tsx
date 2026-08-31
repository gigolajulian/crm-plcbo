import { useMemo, useState } from 'react'
import { Check, MessageSquare, Plus, Send, Undo2, Upload, X } from 'lucide-react'
import type { ApprovalStatus, ID } from '@/data/types'
import { APPROVAL_STATUS } from '@/data/types'
import { useStore } from '@/store/useStore'
import { fromSet, PHOTO_SETS, photo } from '@/data/images'
import { cn, formatRelativeTime, sortBy } from '@/lib/utils'
import { Button, Card, IconButton, Pill } from '@/components/ui/primitives'
import { Avatar } from '@/components/ui/Avatar'
import { Textarea } from '@/components/ui/form'
import { ConfirmDialog, Lightbox, Menu } from '@/components/ui/overlay'
import { EmptyState, toast } from '@/components/ui/feedback'
import { Img } from '@/components/common/Img'
import { ApprovalBadge, SectionHeading } from '@/components/common/records'
import { ImageDrop } from '@/components/common/ImageDrop'
import { canUpload } from '@/lib/uploads'

/* ============================================================================
   REVIEW ROOM
   An asset, its versions, the conversation on each, and the decision. The
   history is never overwritten — a superseded version keeps its verdict, so
   "why did we change this?" always has an answer.
   ========================================================================== */

export function ReviewRoom({
  shootId,
  assetIds,
}: {
  shootId?: ID
  /** Restrict to these assets; omit to review everything. */
  assetIds?: ID[]
}) {
  const allAssets = useStore((s) => s.assets)
  const versions = useStore((s) => s.assetVersions)
  const comments = useStore((s) => s.comments)
  const team = useStore((s) => s.team)
  const contacts = useStore((s) => s.contacts)
  const projects = useStore((s) => s.shoots)

  const setVersionStatus = useStore((s) => s.setVersionStatus)
  const addComment = useStore((s) => s.addComment)
  const toggleCommentResolved = useStore((s) => s.toggleCommentResolved)
  const addAssetVersion = useStore((s) => s.addAssetVersion)
  const currentUserId = useStore((s) => s.settings.currentUserId)

  const assets = useMemo(() => {
    const list = assetIds
      ? allAssets.filter((a) => assetIds.includes(a.id))
      : shootId
        ? allAssets.filter((a) => a.shootId === shootId)
        : allAssets
    return sortBy(list, (a) => a.createdAt, -1)
  }, [allAssets, assetIds, shootId])

  const [selectedAssetId, setSelectedAssetId] = useState<ID | null>(assets[0]?.id ?? null)
  const [selectedVersionId, setSelectedVersionId] = useState<ID | null>(null)
  const [draft, setDraft] = useState('')
  const [lightbox, setLightbox] = useState(false)
  const [confirming, setConfirming] = useState<null | { status: ApprovalStatus; label: string }>(null)
  const [uploading, setUploading] = useState(false)

  const asset = assets.find((a) => a.id === selectedAssetId) ?? assets[0]
  const assetVersions = useMemo(
    () => (asset ? sortBy(versions.filter((v) => v.assetId === asset.id), (v) => v.createdAt, -1) : []),
    [versions, asset],
  )
  const version =
    assetVersions.find((v) => v.id === selectedVersionId) ??
    assetVersions.find((v) => v.id === asset?.currentVersionId) ??
    assetVersions[0]

  const versionComments = useMemo(
    () =>
      version
        ? sortBy(
            comments.filter((c) => c.targetType === 'assetVersion' && c.targetId === version.id),
            (c) => c.createdAt,
          )
        : [],
    [comments, version],
  )

  function nameOf(id: string, kind: 'team' | 'client') {
    return kind === 'team'
      ? (team.find((m) => m.id === id)?.name ?? 'Studio')
      : (contacts.find((c) => c.id === id)?.name ?? 'Client')
  }

  function avatarOf(id: string, kind: 'team' | 'client') {
    return kind === 'team'
      ? team.find((m) => m.id === id)?.avatar
      : contacts.find((c) => c.id === id)?.avatar
  }

  if (assets.length === 0 || !asset || !version) {
    return (
      <EmptyState
        icon={<Upload size={20} />}
        title="Nothing to review yet"
        body="Upload a version of the work and the client can comment, approve, or ask for changes — with the whole history kept."
        action={
          shootId ? (
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => {
                useStore.getState().addAsset({
                  shootId,
                  name: 'New deliverable',
                  kind: 'photo',
                  versionUrl: fromSet('studio', 0, 'card'),
                })
                toast.success('Draft version created')
              }}
            >
              Add the first version
            </Button>
          ) : undefined
        }
        size="lg"
      />
    )
  }

  function submitComment(event: React.FormEvent) {
    event.preventDefault()
    if (!draft.trim() || !version) return
    addComment({
      targetType: 'assetVersion',
      targetId: version.id,
      authorId: currentUserId,
      authorKind: 'team',
      body: draft.trim(),
    })
    setDraft('')
    toast.success('Comment posted')
  }

  function decide(status: ApprovalStatus, decision?: string) {
    if (!version) return
    setVersionStatus(version.id, status, decision)
    toast.success(
      status === 'approved'
        ? 'Approved'
        : status === 'changes-requested'
          ? 'Changes requested'
          : status === 'pending'
            ? 'Sent for review'
            : 'Returned to draft',
      { detail: `${asset.name} ${version.label}` },
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_1fr]">
      {/* ------------------------------------------------------- asset list */}
      <aside className="lg:order-first">
        <SectionHeading title="Deliverables" count={assets.length} />
        <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {assets.map((item) => {
            const current = versions.find((v) => v.id === item.currentVersionId)
            const active = item.id === asset.id
            return (
              <li key={item.id} className="w-56 shrink-0 lg:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAssetId(item.id)
                    setSelectedVersionId(null)
                  }}
                  aria-current={active}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors duration-fast',
                    active ? 'bg-raised shadow-sm' : 'hover:bg-surface',
                  )}
                >
                  <Img
                    src={current?.url}
                    seed={current?.artSeed ?? item.id}
                    alt=""
                    ratio={1}
                    className="w-11 shrink-0 rounded-lg"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{item.name}</span>
                    <span className="mt-1 flex items-center gap-1.5">
                      {current && <ApprovalBadge status={current.status} />}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        {shootId && (
          <Button
            block
            className="mt-3"
            icon={<Plus size={15} />}
            onClick={() => {
              useStore.getState().addAsset({
                shootId,
                name: 'New deliverable',
                kind: 'photo',
                versionUrl: photo(PHOTO_SETS.studio[3], 'card'),
              })
              toast.success('Deliverable added')
            }}
          >
            New deliverable
          </Button>
        )}
      </aside>

      {/* ---------------------------------------------------------- review */}
      <div className="flex flex-col gap-4">
        <Card variant="raised" padding="none" radius="2xl" className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft p-4">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-medium tracking-tight">{asset.name}</h3>
              <p className="text-sm text-ink-muted">
                {projects.find((p) => p.id === asset.shootId)?.name}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ApprovalBadge status={version.status} size="md" />
              <Menu
                label="Choose version"
                items={assetVersions.map((v) => ({
                  label: `${v.label} — ${APPROVAL_STATUS[v.status].label}`,
                  selected: v.id === version.id,
                  onSelect: () => setSelectedVersionId(v.id),
                }))}
                trigger={({ onClick, ...rest }) => (
                  <Button size="sm" onClick={onClick} {...rest}>
                    {version.label}
                  </Button>
                )}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setLightbox(true)}
            className="block w-full cursor-zoom-in bg-canvas-sunk"
            aria-label={`Open ${asset.name} ${version.label} full size`}
          >
            <Img
              src={version.url}
              seed={version.artSeed}
              alt={`${asset.name} ${version.label}`}
              ratio={version.ratio}
              eager
              className="mx-auto max-h-[52vh] w-full"
              imgClassName="object-contain"
            />
          </button>

          {/* ------------------------------------------------- decisions */}
          <div className="flex flex-wrap items-center gap-2 border-t border-line-soft p-4">
            {version.status === 'draft' && (
              <Button variant="primary" icon={<Send size={15} />} onClick={() => decide('pending')}>
                Send for review
              </Button>
            )}
            {version.status === 'pending' && (
              <>
                <Button
                  variant="accent"
                  icon={<Check size={16} />}
                  onClick={() => setConfirming({ status: 'approved', label: 'Approve' })}
                >
                  Approve
                </Button>
                <Button
                  icon={<X size={15} />}
                  onClick={() => setConfirming({ status: 'changes-requested', label: 'Request changes' })}
                >
                  Request changes
                </Button>
              </>
            )}
            {(version.status === 'approved' || version.status === 'changes-requested') && (
              <Button icon={<Undo2 size={15} />} onClick={() => decide('pending')}>
                Reopen review
              </Button>
            )}

            <Button
              className="ml-auto"
              icon={<Upload size={15} />}
              onClick={() => setUploading((v) => !v)}
              aria-expanded={uploading}
            >
              Upload new version
            </Button>
          </div>

          {uploading && (
            <div className="animate-in border-t border-line-soft p-4">
              {canUpload() ? (
                <ImageDrop
                  folder={`assets/${asset.id}`}
                  label="Upload the next version"
                  onUploaded={(result) => {
                    addAssetVersion(asset.id, {
                      url: result.url,
                      artSeed: result.path,
                      ratio: result.ratio,
                      status: 'draft',
                    })
                    setSelectedVersionId(null)
                    setUploading(false)
                    toast.success('New version uploaded', { detail: 'Saved as a draft.' })
                  }}
                />
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-ink-muted">
                    Real uploads need a connected workspace. Add a stand-in version instead?
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const next = assetVersions.length
                      addAssetVersion(asset.id, {
                        url: photo(PHOTO_SETS.studio[next % PHOTO_SETS.studio.length], 'card'),
                        ratio: version.ratio,
                        status: 'draft',
                      })
                      setSelectedVersionId(null)
                      setUploading(false)
                      toast.success('New version added', { detail: 'Saved as a draft.' })
                    }}
                  >
                    Add stand-in
                  </Button>
                </div>
              )}
            </div>
          )}

          {version.notes && (
            <p className="border-t border-line-soft px-4 py-3 text-sm text-pretty text-ink-muted">
              {version.notes}
            </p>
          )}
        </Card>

        {/* -------------------------------------------------- conversation */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
          <Card variant="raised" padding="md" radius="2xl">
            <SectionHeading title="Feedback" count={versionComments.length} />

            {versionComments.length === 0 ? (
              <p className="py-4 text-center text-sm text-ink-muted">
                No comments on {version.label} yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-4">
                {versionComments.map((comment) => (
                  <li key={comment.id} className="flex items-start gap-3">
                    <Avatar
                      name={nameOf(comment.authorId, comment.authorKind)}
                      src={avatarOf(comment.authorId, comment.authorKind)}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-sm font-medium">
                          {nameOf(comment.authorId, comment.authorKind)}
                        </span>
                        {comment.authorKind === 'client' && (
                          <Pill tone="info" size="sm">
                            Client
                          </Pill>
                        )}
                        <span className="text-xs text-ink-faint">
                          {formatRelativeTime(comment.createdAt)}
                        </span>
                      </p>
                      <p
                        className={cn(
                          'mt-1 text-base leading-relaxed text-pretty',
                          comment.resolved && 'text-ink-faint line-through',
                        )}
                      >
                        {comment.body}
                      </p>
                    </div>
                    <IconButton
                      label={comment.resolved ? 'Reopen comment' : 'Mark comment resolved'}
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleCommentResolved(comment.id)}
                    >
                      <Check size={14} className={comment.resolved ? 'text-positive' : undefined} />
                    </IconButton>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={submitComment} className="mt-4 flex flex-col gap-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add a note for the team or the client…"
                aria-label="Add a comment"
                rows={3}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  icon={<MessageSquare size={14} />}
                  disabled={!draft.trim()}
                >
                  Post
                </Button>
              </div>
            </form>
          </Card>

          {/* ------------------------------------------------------ history */}
          <Card variant="surface" padding="md" radius="2xl">
            <SectionHeading title="Decision history" count={assetVersions.length} />
            <ol className="flex flex-col">
              {assetVersions.map((v, index) => (
                <li
                  key={v.id}
                  className={cn('flex flex-col gap-1.5 py-3', index > 0 && 'border-t border-line-soft')}
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedVersionId(v.id)}
                      className={cn(
                        'text-sm font-medium underline-offset-2 hover:underline',
                        v.id === version.id && 'text-ink',
                      )}
                    >
                      {v.label}
                    </button>
                    <ApprovalBadge status={v.status} />
                  </div>
                  <p className="text-xs text-ink-faint">
                    Uploaded by {nameOf(v.uploadedById, 'team')} · {formatRelativeTime(v.createdAt)}
                  </p>
                  {v.decision && (
                    <p className="rounded-lg bg-raised p-2.5 text-sm leading-relaxed text-pretty text-ink-muted">
                      “{v.decision}”
                      {v.decidedById && (
                        <span className="mt-1 block text-xs text-ink-faint">
                          —{' '}
                          {team.find((m) => m.id === v.decidedById)?.name ??
                            contacts.find((c) => c.id === v.decidedById)?.name ??
                            'Reviewer'}
                          {v.decidedAt && `, ${formatRelativeTime(v.decidedAt)}`}
                        </span>
                      )}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>

      <Lightbox
        open={lightbox}
        onClose={() => setLightbox(false)}
        caption={`${asset.name} — ${version.label}`}
        meta={<span className="text-sm">{APPROVAL_STATUS[version.status].label}</span>}
      >
        <Img
          src={version.url}
          seed={version.artSeed}
          alt={`${asset.name} ${version.label}`}
          eager
          className="max-h-[76vh] rounded-lg"
          imgClassName="max-h-[76vh] w-auto object-contain"
        />
      </Lightbox>

      <ConfirmDialog
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        title={`${confirming?.label} ${version.label}?`}
        body={
          confirming?.status === 'approved'
            ? 'This records an approval against this exact version, with your name and the time. Later versions start again from draft.'
            : 'This records a change request against this version. Add what needs to change in the comments so the trail is complete.'
        }
        confirmLabel={confirming?.label ?? 'Confirm'}
        destructive={confirming?.status === 'changes-requested'}
        onConfirm={() => {
          if (!confirming) return
          decide(
            confirming.status,
            confirming.status === 'approved'
              ? 'Approved from the review room.'
              : 'Changes requested — see the comments.',
          )
        }}
      />
    </div>
  )
}
