import { useState } from 'react'
import {
  Bell,
  GripVertical,
  Monitor,
  Moon,
  Palette,
  Plus,
  RotateCcw,
  Sun,
  Tags,
  Trash2,
  Users,
  Workflow,
} from 'lucide-react'
import type { CustomFieldType, PermissionRole, Tag } from '@/data/types'
import { useStore } from '@/store/useStore'
import { useActiveTeam } from '@/store/selectors'
import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/brand'
import { PageHeader } from '@/components/common/PageHeader'
import { Button, Card, IconButton, Pill } from '@/components/ui/primitives'
import { Input, Select, Switch } from '@/components/ui/form'
import { Avatar } from '@/components/ui/Avatar'
import { ConfirmDialog, Menu } from '@/components/ui/overlay'
import { toast } from '@/components/ui/feedback'
import { SectionHeading } from '@/components/common/records'
import { Wordmark } from '@/components/shell/Logo'

/* ============================================================================
   SETTINGS
   Everything that changes how the workspace behaves, grouped by what a person
   would actually be looking for.
   ========================================================================== */

const SECTIONS = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'team', label: 'Team & roles', icon: Users },
  { id: 'pipeline', label: 'Pipeline', icon: Workflow },
  { id: 'tags', label: 'Tags & fields', icon: Tags },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'data', label: 'Demo data', icon: RotateCcw },
] as const

type Section = (typeof SECTIONS)[number]['id']

export default function SettingsPage() {
  const [section, setSection] = useState<Section>('appearance')

  return (
    <div className="animate-in">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description={`How ${BRAND.full} behaves for you and the rest of the studio.`}
      />

      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Settings sections">
          <ul className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 lg:flex-col lg:gap-0.5 lg:overflow-visible">
            {SECTIONS.map((item) => {
              const Icon = item.icon
              const active = section === item.id
              return (
                <li key={item.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setSection(item.id)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-pill px-3.5 py-2.5 text-left text-base whitespace-nowrap',
                      'transition-colors duration-fast ease-out-soft',
                      active ? 'bg-inverse text-on-inverse' : 'text-ink-muted hover:bg-surface hover:text-ink',
                    )}
                  >
                    <Icon size={16} aria-hidden />
                    {item.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="min-w-0">
          {section === 'appearance' && <Appearance />}
          {section === 'team' && <TeamSettings />}
          {section === 'pipeline' && <PipelineSettings />}
          {section === 'tags' && <TagSettings />}
          {section === 'notifications' && <NotificationSettings />}
          {section === 'data' && <DataSettings />}
        </div>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------- appearance -- */

function Appearance() {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)

  const themes = [
    { id: 'light' as const, label: 'Light', icon: Sun, hint: 'The studio default' },
    { id: 'dark' as const, label: 'Dark', icon: Moon, hint: 'For late edits' },
    { id: 'system' as const, label: 'System', icon: Monitor, hint: 'Follow the OS' },
  ]

  return (
    <div className="flex flex-col gap-5">
      <Card variant="raised" padding="lg" radius="3xl">
        <Wordmark className="mb-6" />
        <SectionHeading title="Theme" description="Applies immediately, and is remembered." />
        <div className="grid gap-3 sm:grid-cols-3">
          {themes.map((theme) => {
            const Icon = theme.icon
            const active = settings.theme === theme.id
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => {
                  updateSettings({ theme: theme.id })
                  toast.success(`${theme.label} theme`)
                }}
                aria-pressed={active}
                className={cn(
                  'flex flex-col items-start gap-2 rounded-2xl p-4 text-left transition-[background-color,box-shadow] duration-base',
                  active ? 'bg-inverse text-on-inverse' : 'bg-surface hover:bg-surface-hover',
                )}
              >
                <Icon size={18} aria-hidden />
                <span className="text-base font-medium">{theme.label}</span>
                <span className={cn('text-xs', active ? 'text-on-inverse-muted' : 'text-ink-muted')}>
                  {theme.hint}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      <Card variant="surface" padding="lg" radius="2xl">
        <SectionHeading title="Density" description="How much breathing room lists get." />
        <div className="grid gap-3 sm:grid-cols-2">
          {(['comfortable', 'compact'] as const).map((density) => (
            <button
              key={density}
              type="button"
              onClick={() => updateSettings({ density })}
              aria-pressed={settings.density === density}
              className={cn(
                'rounded-2xl p-4 text-left transition-colors duration-base',
                settings.density === density
                  ? 'bg-inverse text-on-inverse'
                  : 'bg-raised hover:bg-surface-hover',
              )}
            >
              <span className="text-base font-medium capitalize">{density}</span>
              <span
                className={cn(
                  'mt-1 block text-xs',
                  settings.density === density ? 'text-on-inverse-muted' : 'text-ink-muted',
                )}
              >
                {density === 'comfortable'
                  ? 'Generous spacing, easier to scan'
                  : 'More rows on screen at once'}
              </span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}

/* ----------------------------------------------------------------- team -- */

const ROLES: PermissionRole[] = ['owner', 'admin', 'member', 'guest']

const ROLE_MEANING: Record<PermissionRole, string> = {
  owner: 'Everything, including billing and deleting the workspace.',
  admin: 'Everything except billing. Can manage people and pipelines.',
  member: 'Create and edit work. Cannot change workspace settings.',
  guest: 'Read-only, and only on projects they are added to.',
}

function TeamSettings() {
  const team = useActiveTeam()
  const updateTeamMember = useStore((s) => s.updateTeamMember)
  const addTeamMember = useStore((s) => s.addTeamMember)
  const removeTeamMember = useStore((s) => s.removeTeamMember)
  const currentUserId = useStore((s) => s.settings.currentUserId)
  const updateSettings = useStore((s) => s.updateSettings)

  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [email, setEmail] = useState('')
  const [removing, setRemoving] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-5">
      <Card variant="raised" padding="lg" radius="3xl">
        <SectionHeading
          title="Team"
          count={team.length}
          description="Who is in the studio, and what they can change."
        />
        <ul className="flex flex-col">
          {team.map((member, index) => (
            <li
              key={member.id}
              className={cn(
                'flex flex-wrap items-center gap-3 py-3.5',
                index > 0 && 'border-t border-line-soft',
              )}
            >
              <Avatar name={member.name} src={member.avatar} size="md" />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-base">
                  {member.name}
                  {member.id === currentUserId && (
                    <Pill tone="lime" size="sm">
                      You
                    </Pill>
                  )}
                </p>
                <p className="truncate text-sm text-ink-muted">
                  {member.role} · {member.email}
                </p>
              </div>

              <Menu
                label={`Change role for ${member.name}`}
                items={ROLES.map((r) => ({
                  label: r.charAt(0).toUpperCase() + r.slice(1),
                  selected: r === member.permissionRole,
                  onSelect: () => {
                    updateTeamMember(member.id, { permissionRole: r })
                    toast.success(`${member.name} is now ${r}`)
                  },
                }))}
                trigger={({ onClick, ...rest }) => (
                  <Button size="sm" onClick={onClick} {...rest}>
                    {member.permissionRole}
                  </Button>
                )}
              />

              {member.id !== currentUserId && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => updateSettings({ currentUserId: member.id })}>
                    View as
                  </Button>
                  <IconButton
                    label={`Remove ${member.name}`}
                    size="sm"
                    variant="ghost"
                    onClick={() => setRemoving(member.id)}
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card variant="surface" padding="lg" radius="2xl">
        <SectionHeading title="Invite someone" />
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (!name.trim()) return
            addTeamMember(name.trim(), role.trim() || 'Designer', email.trim() || `${name.split(' ')[0].toLowerCase()}@plcbo.studio`)
            toast.success(`${name.trim()} added to the studio`)
            setName('')
            setRole('')
            setEmail('')
          }}
          className="grid gap-3 sm:grid-cols-3"
        >
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Role" placeholder="Designer" value={role} onChange={(e) => setRole(e.target.value)} />
          <Input
            label="Email"
            type="email"
            placeholder="name@plcbo.studio"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="sm:col-span-3">
            <Button type="submit" variant="primary" icon={<Plus size={15} />} disabled={!name.trim()}>
              Add to studio
            </Button>
          </div>
        </form>
      </Card>

      <Card variant="surface" padding="lg" radius="2xl">
        <SectionHeading title="What each role can do" />
        <dl className="flex flex-col gap-3">
          {ROLES.map((r) => (
            <div key={r} className="flex flex-wrap gap-x-4 gap-y-1">
              <dt className="w-20 shrink-0 text-sm font-medium capitalize">{r}</dt>
              <dd className="flex-1 text-sm text-ink-muted">{ROLE_MEANING[r]}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Remove from the studio?"
        body="They lose access immediately. Their past work and comments stay attributed to them."
        confirmLabel="Remove"
        destructive
        onConfirm={() => {
          if (removing) {
            removeTeamMember(removing)
            toast.show('Removed from the studio')
          }
        }}
      />
    </div>
  )
}

/* ------------------------------------------------------------- pipeline -- */

function PipelineSettings() {
  const pipeline = useStore((s) => s.pipeline)
  const updatePipelineStage = useStore((s) => s.updatePipelineStage)
  const addPipelineStage = useStore((s) => s.addPipelineStage)
  const deletePipelineStage = useStore((s) => s.deletePipelineStage)
  const reorderPipeline = useStore((s) => s.reorderPipeline)
  const deals = useStore((s) => s.deals)

  const [newStage, setNewStage] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const sorted = [...pipeline].sort((a, b) => a.order - b.order)
  const openStages = sorted.filter((s) => s.kind === 'open')

  return (
    <div className="flex flex-col gap-5">
      <Card variant="raised" padding="lg" radius="3xl">
        <SectionHeading
          title="Deal stages"
          description="Rename, reorder, or add stages. Deals in a deleted stage move to the first one."
        />
        <ul className="flex flex-col gap-2">
          {sorted.map((stage, index) => {
            const count = deals.filter((d) => d.stageId === stage.id).length
            const canMoveUp = stage.kind === 'open' && index > 0 && sorted[index - 1].kind === 'open'
            const canMoveDown =
              stage.kind === 'open' && index < sorted.length - 1 && sorted[index + 1].kind === 'open'

            return (
              <li
                key={stage.id}
                className="flex flex-wrap items-center gap-2 rounded-xl bg-surface p-3"
              >
                <span className="text-ink-faint" aria-hidden>
                  <GripVertical size={15} />
                </span>

                <input
                  value={stage.name}
                  onChange={(e) => updatePipelineStage(stage.id, { name: e.target.value })}
                  aria-label={`Stage name: ${stage.name}`}
                  className="h-9 min-w-32 flex-1 rounded-lg bg-raised px-3 text-base shadow-xs"
                />

                <label className="flex items-center gap-2 text-sm text-ink-muted">
                  <span className="sr-only-focusable absolute">
                    Default probability for {stage.name}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={stage.probability}
                    disabled={stage.kind !== 'open'}
                    onChange={(e) =>
                      updatePipelineStage(stage.id, { probability: Number(e.target.value) })
                    }
                    aria-label={`Default probability for ${stage.name}`}
                    className="tabular h-9 w-20 rounded-lg bg-raised px-3 text-base shadow-xs disabled:text-ink-faint"
                  />
                  %
                </label>

                <Pill tone={stage.kind === 'open' ? 'neutral' : stage.kind === 'won' ? 'positive' : 'critical'} size="sm">
                  {count} {count === 1 ? 'deal' : 'deals'}
                </Pill>

                <div className="flex items-center gap-1">
                  <IconButton
                    label={`Move ${stage.name} earlier`}
                    size="sm"
                    variant="ghost"
                    disabled={!canMoveUp}
                    onClick={() => reorderPipeline(stage.id, sorted[index - 1].id)}
                  >
                    <span aria-hidden>↑</span>
                  </IconButton>
                  <IconButton
                    label={`Move ${stage.name} later`}
                    size="sm"
                    variant="ghost"
                    disabled={!canMoveDown}
                    onClick={() => reorderPipeline(stage.id, sorted[index + 1].id)}
                  >
                    <span aria-hidden>↓</span>
                  </IconButton>
                  <IconButton
                    label={`Delete ${stage.name}`}
                    size="sm"
                    variant="ghost"
                    disabled={stage.kind !== 'open' || openStages.length <= 1}
                    onClick={() => setDeleting(stage.id)}
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </div>
              </li>
            )
          })}
        </ul>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (!newStage.trim()) return
            addPipelineStage(newStage.trim())
            toast.success(`Added “${newStage.trim()}”`)
            setNewStage('')
          }}
          className="mt-4 flex items-end gap-2"
        >
          <Input
            label="New stage"
            placeholder="Contract out"
            value={newStage}
            onChange={(e) => setNewStage(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="primary" icon={<Plus size={15} />} disabled={!newStage.trim()}>
            Add
          </Button>
        </form>
      </Card>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete this stage?"
        body="Any deals in it move to the first open stage. This cannot be undone."
        confirmLabel="Delete stage"
        destructive
        onConfirm={() => {
          if (deleting) {
            deletePipelineStage(deleting)
            toast.show('Stage deleted')
          }
        }}
      />
    </div>
  )
}

/* ----------------------------------------------------------------- tags -- */

const TONES: Tag['tone'][] = ['neutral', 'lime', 'positive', 'caution', 'critical', 'info']

function TagSettings() {
  const tags = useStore((s) => s.tags)
  const addTag = useStore((s) => s.addTag)
  const updateTag = useStore((s) => s.updateTag)
  const deleteTag = useStore((s) => s.deleteTag)
  const customFields = useStore((s) => s.customFields)

  const [label, setLabel] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-5">
      <Card variant="raised" padding="lg" radius="3xl">
        <SectionHeading
          title="Tags"
          count={tags.length}
          description="Shared across projects, clients, companies and deals."
        />
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag.id} className="flex items-center gap-1 rounded-pill bg-surface p-1 pl-1">
              <Menu
                label={`Change colour of ${tag.label}`}
                items={TONES.map((tone) => ({
                  label: tone.charAt(0).toUpperCase() + tone.slice(1),
                  selected: tone === tag.tone,
                  onSelect: () => updateTag(tag.id, { tone }),
                }))}
                trigger={({ onClick, ...rest }) => (
                  <button type="button" onClick={onClick} {...rest}>
                    <Pill tone={tag.tone}>{tag.label}</Pill>
                  </button>
                )}
              />
              <IconButton
                label={`Delete tag ${tag.label}`}
                size="sm"
                variant="ghost"
                onClick={() => setDeleting(tag.id)}
              >
                <Trash2 size={12} />
              </IconButton>
            </li>
          ))}
        </ul>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (!label.trim()) return
            addTag(label.trim())
            toast.success(`Tag “${label.trim()}” added`)
            setLabel('')
          }}
          className="mt-5 flex items-end gap-2"
        >
          <Input
            label="New tag"
            placeholder="Sustainability"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="primary" icon={<Plus size={15} />} disabled={!label.trim()}>
            Add
          </Button>
        </form>
      </Card>

      <Card variant="surface" padding="lg" radius="2xl">
        <SectionHeading
          title="Custom fields"
          count={customFields.length}
          description="Extra fields the studio tracks on its records."
        />
        <ul className="flex flex-col">
          {customFields.map((field, index) => (
            <li
              key={field.id}
              className={cn(
                'flex flex-wrap items-center gap-3 py-3',
                index > 0 && 'border-t border-line-soft',
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="text-base">{field.label}</p>
                <p className="text-xs text-ink-muted">
                  on {field.entity}
                  {field.options && ` · ${field.options.join(', ')}`}
                </p>
              </div>
              <Pill tone="neutral" size="sm">
                {FIELD_LABELS[field.type]}
              </Pill>
              {field.required && (
                <Pill tone="caution" size="sm">
                  Required
                </Pill>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete this tag?"
        body="It is removed from every record that uses it. This cannot be undone."
        confirmLabel="Delete tag"
        destructive
        onConfirm={() => {
          if (deleting) {
            deleteTag(deleting)
            toast.show('Tag deleted')
          }
        }}
      />
    </div>
  )
}

const FIELD_LABELS: Record<CustomFieldType, string> = {
  text: 'Text',
  number: 'Number',
  select: 'Choice',
  date: 'Date',
  checkbox: 'Yes / no',
}

/* -------------------------------------------------------- notifications -- */

function NotificationSettings() {
  const notifications = useStore((s) => s.settings.notifications)
  const updateSettings = useStore((s) => s.updateSettings)

  function set(key: keyof typeof notifications, value: boolean | string) {
    updateSettings({ notifications: { ...notifications, [key]: value } })
  }

  const toggles: Array<{ key: keyof typeof notifications; label: string; description: string }> = [
    {
      key: 'approvalRequests',
      label: 'Approval requests',
      description: 'When a version is sent for review, or a client makes a decision.',
    },
    {
      key: 'taskAssignments',
      label: 'Task assignments',
      description: 'When someone assigns work to you.',
    },
    {
      key: 'dealStageChanges',
      label: 'Deal stage changes',
      description: 'When a deal you own moves forward or is lost.',
    },
    {
      key: 'milestoneReminders',
      label: 'Milestone reminders',
      description: 'Two days before a milestone on your projects.',
    },
    {
      key: 'clientReplies',
      label: 'Client replies',
      description: 'When a client comments on work or answers a follow-up.',
    },
    {
      key: 'weeklyDigest',
      label: 'Weekly digest',
      description: 'A Monday summary of the week ahead.',
    },
  ]

  return (
    <Card variant="raised" padding="lg" radius="3xl">
      <SectionHeading
        title="Notifications"
        description="Only the things worth interrupting you for."
      />

      <div className="mb-6">
        <Select
          label="Where to send them"
          value={notifications.channel}
          onChange={(e) => set('channel', e.target.value)}
          options={[
            { value: 'both', label: 'Email and in-app' },
            { value: 'email', label: 'Email only' },
            { value: 'in-app', label: 'In-app only' },
          ]}
        />
      </div>

      <ul className="flex flex-col">
        {toggles.map((item, index) => (
          <li key={item.key} className={cn('py-4', index > 0 && 'border-t border-line-soft')}>
            <Switch
              checked={notifications[item.key] as boolean}
              onChange={(value) => set(item.key, value)}
              label={item.label}
              description={item.description}
            />
          </li>
        ))}
      </ul>
    </Card>
  )
}

/* ----------------------------------------------------------------- data -- */

function DataSettings() {
  const resetDemoData = useStore((s) => s.resetDemoData)
  // Each count is selected as a primitive: returning an object from a zustand
  // selector creates a new reference every render and loops forever.
  const counts = {
    projects: useStore((s) => s.projects.length),
    contacts: useStore((s) => s.contacts.length),
    deals: useStore((s) => s.deals.length),
    tasks: useStore((s) => s.tasks.length),
    references: useStore((s) => s.moodItems.length),
    activity: useStore((s) => s.activity.length),
  }
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="flex flex-col gap-5">
      <Card variant="raised" padding="lg" radius="3xl">
        <SectionHeading
          title="What is in this workspace"
          description="Everything is stored in your browser — nothing is sent anywhere."
        />
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Object.entries(counts).map(([key, value]) => (
            <div key={key} className="rounded-xl bg-surface p-4">
              <dt className="text-xs text-ink-muted capitalize">{key}</dt>
              <dd className="tabular mt-1 text-title font-medium tracking-title">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card variant="surface" padding="lg" radius="2xl">
        <SectionHeading
          title="Reset demo data"
          description="Restores the original studio, its clients, projects and moodboards. Your theme is kept."
        />
        <p className="mb-4 max-w-prose text-sm text-pretty text-ink-muted">
          Everything you have created, edited or deleted in this workspace will be replaced with the
          original demo dataset. This cannot be undone.
        </p>
        <Button variant="danger" icon={<RotateCcw size={15} />} onClick={() => setConfirming(true)}>
          Reset to the demo studio
        </Button>
      </Card>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Reset everything?"
        body="All of your changes are discarded and the original demo studio is restored. This cannot be undone."
        confirmLabel="Reset workspace"
        destructive
        onConfirm={() => {
          resetDemoData()
          toast.success('Workspace reset', { detail: 'The demo studio is back to its original state.' })
        }}
      />
    </div>
  )
}
