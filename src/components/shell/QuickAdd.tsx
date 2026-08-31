import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Camera,
  CheckSquare,
  MessageSquare,
  User,
  type LucideIcon,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useActiveTeam, useOpenStages } from '@/store/selectors'
import { cn, toISODate, addDays, startOfToday } from '@/lib/utils'
import { Button } from '@/components/ui/primitives'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { Sheet } from '@/components/ui/overlay'
import { toast } from '@/components/ui/feedback'
import type { ActivityType, ShootType, TaskPriority } from '@/data/types'
import { SHOOT_TYPES } from '@/data/types'
import type { QuickAddMode } from '@/store/useUI'

/* ============================================================================
   QUICK ADD
   The five highest-frequency actions in one sheet, opened with "C" from
   anywhere. Each form is deliberately short — anything optional is left to
   the record's own page.
   ========================================================================== */

type Mode = QuickAddMode

const MODES: Array<{ id: Mode; label: string; icon: LucideIcon }> = [
  { id: 'task', label: 'Task', icon: CheckSquare },
  { id: 'log', label: 'Log', icon: MessageSquare },
  { id: 'shoot', label: 'Shoot', icon: Camera },
  { id: 'contact', label: 'Client', icon: User },
]

export function QuickAdd({ mode: initialMode, onClose }: { mode: Mode | null; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>(initialMode ?? 'task')

  // Reopening with a different intent ("new project") should land on that form.
  useEffect(() => {
    if (initialMode) setMode(initialMode)
  }, [initialMode])

  return (
    <Sheet open={initialMode !== null} onClose={onClose} title="Quick add" description="Capture it now, tidy it later.">
      <div
        role="tablist"
        aria-label="What to add"
        className="mb-6 flex flex-wrap gap-1.5"
      >
        {MODES.map((item) => {
          const Icon = item.icon
          const selected = mode === item.id
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={selected}
              onClick={() => setMode(item.id)}
              className={cn(
                'inline-flex h-9 items-center gap-2 rounded-pill px-3.5 text-sm font-medium',
                'transition-colors duration-fast ease-out-soft',
                selected
                  ? 'bg-inverse text-on-inverse'
                  : 'bg-raised text-ink-muted shadow-xs hover:text-ink',
              )}
            >
              <Icon size={14} aria-hidden />
              {item.label}
            </button>
          )
        })}
      </div>

      {mode === 'task' && <TaskForm onDone={onClose} />}
      {mode === 'log' && <LogForm onDone={onClose} />}
      {mode === 'shoot' && <ShootForm onDone={onClose} />}
      {mode === 'contact' && <ContactForm onDone={onClose} />}
    </Sheet>
  )
}

/* ------------------------------------------------------------------ task -- */

function TaskForm({ onDone }: { onDone: () => void }) {
  const addTask = useStore((s) => s.addTask)
  const shoots = useStore((s) => s.shoots)
  const team = useActiveTeam()
  const currentUserId = useStore((s) => s.settings.currentUserId)

  const [title, setTitle] = useState('')
  const [shootId, setProjectId] = useState('')
  const [assigneeId, setAssigneeId] = useState(currentUserId)
  const [priority, setPriority] = useState<TaskPriority>('normal')
  const [due, setDue] = useState(toISODate(addDays(startOfToday(), 1)))

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!title.trim()) return
    addTask({
      title: title.trim(),
      shootId: shootId || undefined,
      assigneeId,
      priority,
      dueDate: due || undefined,
    })
    toast.success('Task added', { detail: title.trim() })
    onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Input
        label="What needs doing"
        placeholder="Chase the printer for a paper dummy"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        autoFocus
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Project"
          placeholder="No project"
          value={shootId}
          onChange={(e) => setProjectId(e.target.value)}
          options={shoots
            .filter((p) => !p.archived)
            .map((p) => ({ value: p.id, label: p.name }))}
        />
        <Select
          label="Assignee"
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          options={team.map((m) => ({ value: m.id, label: m.name }))}
        />
        <Select
          label="Priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          options={[
            { value: 'urgent', label: 'Urgent' },
            { value: 'high', label: 'High' },
            { value: 'normal', label: 'Normal' },
            { value: 'low', label: 'Low' },
          ]}
        />
        <Field label="Due" htmlFor="qa-due">
          <input
            id="qa-due"
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="h-11 w-full rounded-lg bg-raised px-3.5 text-base shadow-xs"
          />
        </Field>
      </div>
      <FormActions onCancel={onDone} label="Add task" disabled={!title.trim()} />
    </form>
  )
}

/* ------------------------------------------------------------------- log -- */

function LogForm({ onDone }: { onDone: () => void }) {
  const logActivity = useStore((s) => s.logActivity)
  const contacts = useStore((s) => s.contacts)
  const shoots = useStore((s) => s.shoots)
  const currentUserId = useStore((s) => s.settings.currentUserId)

  const [type, setType] = useState<ActivityType>('call')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [contactId, setContactId] = useState('')
  const [shootId, setProjectId] = useState('')
  const [followUp, setFollowUp] = useState('')

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!subject.trim()) return
    const contact = contacts.find((c) => c.id === contactId)
    logActivity({
      type,
      subject: subject.trim(),
      body: body.trim() || undefined,
      actorId: currentUserId,
      actorKind: 'team',
      direction: type === 'email' || type === 'call' ? 'outbound' : undefined,
      links: {
        contactId: contactId || undefined,
        shootId: shootId || undefined,
        companyId: contact?.companyId,
      },
      followUpAt: followUp || undefined,
      followUpDone: false,
    })
    toast.success('Logged to the activity stream')
    onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Select
        label="Type"
        value={type}
        onChange={(e) => setType(e.target.value as ActivityType)}
        options={[
          { value: 'call', label: 'Call' },
          { value: 'email', label: 'Email' },
          { value: 'meeting', label: 'Meeting' },
          { value: 'note', label: 'Note' },
        ]}
      />
      <Input
        label="Subject"
        placeholder="Karin — retainer renewal"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        required
        autoFocus
      />
      <Textarea
        label="What happened"
        placeholder="What was said, what was decided, what happens next."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Client"
          placeholder="No client"
          value={contactId}
          onChange={(e) => setContactId(e.target.value)}
          options={contacts.map((c) => ({ value: c.id, label: c.name }))}
        />
        <Select
          label="Project"
          placeholder="No project"
          value={shootId}
          onChange={(e) => setProjectId(e.target.value)}
          options={shoots.map((p) => ({ value: p.id, label: p.name }))}
        />
      </div>
      <Field label="Follow up on" hint="Leave empty if nothing is owed." htmlFor="qa-follow">
        <input
          id="qa-follow"
          type="date"
          value={followUp}
          onChange={(e) => setFollowUp(e.target.value)}
          className="h-11 w-full rounded-lg bg-raised px-3.5 text-base shadow-xs"
        />
      </Field>
      <FormActions onCancel={onDone} label="Log it" disabled={!subject.trim()} />
    </form>
  )
}

/* ----------------------------------------------------------------- shoot -- */

/**
 * One form for the whole job. There is no separate "new deal" — an enquiry and
 * the shoot it becomes are the same record, so this is where both start.
 */
function ShootForm({ onDone }: { onDone: () => void }) {
  const addShoot = useStore((s) => s.addShoot)
  const companies = useStore((s) => s.companies)
  const contacts = useStore((s) => s.contacts)
  const leadSources = useStore((s) => s.leadSources)
  const pipeline = useOpenStages()
  const team = useActiveTeam()
  const currentUserId = useStore((s) => s.settings.currentUserId)
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? '')
  const [contactId, setContactId] = useState('')
  const [ownerId, setOwnerId] = useState(currentUserId)
  const [shootType, setShootType] = useState<ShootType>('commercial')
  const [stageId, setStageId] = useState(pipeline[0]?.id ?? '')
  const [leadSourceId, setLeadSourceId] = useState('')
  const [fee, setFee] = useState('')
  const [close, setClose] = useState(toISODate(addDays(startOfToday(), 30)))

  const companyContacts = contacts.filter((c) => c.companyId === companyId)

  useEffect(() => {
    setContactId(companyContacts[0]?.id ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId])

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim() || !companyId || !contactId) return
    const amount = Number(fee) || 0
    const id = addShoot({
      name: name.trim(),
      companyId,
      contactId,
      ownerId,
      shootType,
      stageId,
      leadSourceId: leadSourceId || undefined,
      expectedCloseDate: close,
      code: name.trim().slice(0, 2).toUpperCase() + '-' + String(Date.now()).slice(-2),
      // A single starting line, broken out properly when the quote is built.
      lineItems: amount
        ? [{ id: `li_${Date.now()}`, kind: 'shoot-fee', desc: 'Shoot fee', qty: 1, rate: amount }]
        : [],
    })
    toast.success('Shoot created', {
      detail: 'A moodboard was created alongside it.',
      action: { label: 'Open', onClick: () => navigate(`/shoots/${id}`) },
    })
    onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Input
        label="Name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Autumn campaign"
        autoFocus
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Client"
          required
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
          options={companies.map((company) => ({ value: company.id, label: company.name }))}
        />
        <Select
          label="Contact"
          required
          placeholder={companyContacts.length === 0 ? 'No one at this client yet' : undefined}
          value={contactId}
          onChange={(e) => setContactId(e.target.value)}
          options={companyContacts.map((contact) => ({ value: contact.id, label: contact.name }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Type"
          value={shootType}
          onChange={(e) => setShootType(e.target.value as ShootType)}
          options={SHOOT_TYPES.map((type) => ({ value: type.id, label: type.label }))}
        />
        <Select
          label="Stage"
          value={stageId}
          onChange={(e) => setStageId(e.target.value)}
          options={pipeline.map((stage) => ({ value: stage.id, label: stage.name }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="How did they find you?"
          hint="Drives the lead source report"
          placeholder="Not recorded"
          value={leadSourceId}
          onChange={(e) => setLeadSourceId(e.target.value)}
          options={leadSources
            .filter((source) => source.active)
            .map((source) => ({ value: source.id, label: source.label }))}
        />
        <Select
          label="Owner"
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
          options={team.map((member) => ({ value: member.id, label: member.name }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Opening fee"
          hint="Break it into line items later"
          type="number"
          min="0"
          step="100"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          placeholder="0"
        />
        <Input
          label="Expected close"
          type="date"
          value={close}
          onChange={(e) => setClose(e.target.value)}
        />
      </div>

      <FormActions
        onCancel={onDone}
        label="Create shoot"
        disabled={!name.trim() || !contactId}
      />
    </form>
  )
}

/* --------------------------------------------------------------- contact -- */

function ContactForm({ onDone }: { onDone: () => void }) {
  const addContact = useStore((s) => s.addContact)
  const addCompany = useStore((s) => s.addCompany)
  const companies = useStore((s) => s.companies)
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [email, setEmail] = useState('')
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? '')
  const [newCompany, setNewCompany] = useState('')

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    let targetCompany = companyId
    if (companyId === '__new' && newCompany.trim()) {
      targetCompany = addCompany({ name: newCompany.trim() })
    }
    const id = addContact({ name: name.trim(), role, email, companyId: targetCompany })
    toast.success(`${name.trim()} added`, {
      action: { label: 'Open', onClick: () => navigate(`/contacts/${id}`) },
    })
    onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Input
        label="Name"
        placeholder="Alex Moreau"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        autoFocus
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Role" placeholder="Brand Director" value={role} onChange={(e) => setRole(e.target.value)} />
        <Input
          label="Email"
          type="email"
          placeholder="alex@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <Select
        label="Company"
        value={companyId}
        onChange={(e) => setCompanyId(e.target.value)}
        options={[
          ...companies.map((c) => ({ value: c.id, label: c.name })),
          { value: '__new', label: '+ New company…' },
        ]}
      />
      {companyId === '__new' && (
        <Input
          label="New company name"
          placeholder="Company name"
          value={newCompany}
          onChange={(e) => setNewCompany(e.target.value)}
          required
        />
      )}
      <FormActions onCancel={onDone} label="Add client" disabled={!name.trim()} />
    </form>
  )
}

/* --------------------------------------------------------------- shared -- */

function FormActions({
  onCancel,
  label,
  disabled,
}: {
  onCancel: () => void
  label: string
  disabled?: boolean
}) {
  return (
    <div className="mt-2 flex items-center justify-end gap-2">
      <Button type="button" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" variant="primary" disabled={disabled}>
        {label}
      </Button>
    </div>
  )
}
