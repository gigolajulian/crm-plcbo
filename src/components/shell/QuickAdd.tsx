import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase,
  CheckSquare,
  Handshake,
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
import type { ActivityType, TaskPriority } from '@/data/types'
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
  { id: 'project', label: 'Project', icon: Briefcase },
  { id: 'contact', label: 'Client', icon: User },
  { id: 'deal', label: 'Deal', icon: Handshake },
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
      {mode === 'project' && <ProjectForm onDone={onClose} />}
      {mode === 'contact' && <ContactForm onDone={onClose} />}
      {mode === 'deal' && <DealForm onDone={onClose} />}
    </Sheet>
  )
}

/* ------------------------------------------------------------------ task -- */

function TaskForm({ onDone }: { onDone: () => void }) {
  const addTask = useStore((s) => s.addTask)
  const projects = useStore((s) => s.projects)
  const team = useActiveTeam()
  const currentUserId = useStore((s) => s.settings.currentUserId)

  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState('')
  const [assigneeId, setAssigneeId] = useState(currentUserId)
  const [priority, setPriority] = useState<TaskPriority>('normal')
  const [due, setDue] = useState(toISODate(addDays(startOfToday(), 1)))

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!title.trim()) return
    addTask({
      title: title.trim(),
      projectId: projectId || undefined,
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
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          options={projects
            .filter((p) => p.stage !== 'complete')
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
  const projects = useStore((s) => s.projects)
  const currentUserId = useStore((s) => s.settings.currentUserId)

  const [type, setType] = useState<ActivityType>('call')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [contactId, setContactId] = useState('')
  const [projectId, setProjectId] = useState('')
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
        projectId: projectId || undefined,
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
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          options={projects.map((p) => ({ value: p.id, label: p.name }))}
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

/* --------------------------------------------------------------- project -- */

function ProjectForm({ onDone }: { onDone: () => void }) {
  const addProject = useStore((s) => s.addProject)
  const companies = useStore((s) => s.companies)
  const contacts = useStore((s) => s.contacts)
  const team = useActiveTeam()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? '')
  const [contactId, setContactId] = useState('')
  const [leadId, setLeadId] = useState(team[0]?.id ?? '')
  const [budget, setBudget] = useState('')
  const [due, setDue] = useState(toISODate(addDays(startOfToday(), 45)))

  const companyContacts = contacts.filter((c) => c.companyId === companyId)

  useEffect(() => {
    setContactId(companyContacts[0]?.id ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId])

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim() || !companyId || !contactId) return
    const id = addProject({
      name: name.trim(),
      companyId,
      clientContactId: contactId,
      leadId,
      budget: Number(budget) || 0,
      dueDate: due,
      code: name.trim().slice(0, 2).toUpperCase() + '-' + String(Date.now()).slice(-2),
    })
    toast.success('Project created', {
      detail: 'A moodboard was created alongside it.',
      action: { label: 'Open', onClick: () => navigate(`/projects/${id}`) },
    })
    onDone()
    navigate(`/projects/${id}`)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Input
        label="Project name"
        placeholder="Spring campaign"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        autoFocus
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Company"
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
          options={companies.map((c) => ({ value: c.id, label: c.name }))}
          required
        />
        <Select
          label="Client contact"
          value={contactId}
          onChange={(e) => setContactId(e.target.value)}
          options={companyContacts.map((c) => ({ value: c.id, label: c.name }))}
          placeholder={companyContacts.length ? undefined : 'No contacts at this company'}
          required
        />
        <Select
          label="Project lead"
          value={leadId}
          onChange={(e) => setLeadId(e.target.value)}
          options={team.map((m) => ({ value: m.id, label: m.name }))}
        />
        <Input
          label="Budget"
          type="number"
          min={0}
          step={1000}
          placeholder="0"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
        />
      </div>
      <Field label="Due date" htmlFor="qa-pdue">
        <input
          id="qa-pdue"
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className="h-11 w-full rounded-lg bg-raised px-3.5 text-base shadow-xs"
        />
      </Field>
      <FormActions
        onCancel={onDone}
        label="Create project"
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

/* ------------------------------------------------------------------ deal -- */

function DealForm({ onDone }: { onDone: () => void }) {
  const addDeal = useStore((s) => s.addDeal)
  const companies = useStore((s) => s.companies)
  const contacts = useStore((s) => s.contacts)
  const pipeline = useOpenStages()
  const team = useActiveTeam()
  const currentUserId = useStore((s) => s.settings.currentUserId)
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? '')
  const [contactId, setContactId] = useState('')
  const [value, setValue] = useState('')
  const [stageId, setStageId] = useState(pipeline[0]?.id ?? '')
  const [ownerId, setOwnerId] = useState(currentUserId)
  const [close, setClose] = useState(toISODate(addDays(startOfToday(), 30)))

  const companyContacts = contacts.filter((c) => c.companyId === companyId)

  useEffect(() => {
    setContactId(companyContacts[0]?.id ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId])

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim() || !contactId) return
    const id = addDeal({
      name: name.trim(),
      companyId,
      contactId,
      stageId,
      ownerId,
      value: Number(value) || 0,
      expectedCloseDate: close,
    })
    toast.success('Deal added to the pipeline', {
      action: { label: 'Open', onClick: () => navigate(`/deals/${id}`) },
    })
    onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Input
        label="Deal name"
        placeholder="Rebrand — phase one"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        autoFocus
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Company"
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
          options={companies.map((c) => ({ value: c.id, label: c.name }))}
        />
        <Select
          label="Contact"
          value={contactId}
          onChange={(e) => setContactId(e.target.value)}
          options={companyContacts.map((c) => ({ value: c.id, label: c.name }))}
          placeholder={companyContacts.length ? undefined : 'No contacts at this company'}
        />
        <Input
          label="Value"
          type="number"
          min={0}
          step={1000}
          placeholder="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Select
          label="Stage"
          value={stageId}
          onChange={(e) => setStageId(e.target.value)}
          options={pipeline.map((p) => ({ value: p.id, label: p.name }))}
        />
        <Select
          label="Owner"
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
          options={team.map((m) => ({ value: m.id, label: m.name }))}
        />
        <Field label="Expected close" htmlFor="qa-close">
          <input
            id="qa-close"
            type="date"
            value={close}
            onChange={(e) => setClose(e.target.value)}
            className="h-11 w-full rounded-lg bg-raised px-3.5 text-base shadow-xs"
          />
        </Field>
      </div>
      <FormActions onCancel={onDone} label="Add deal" disabled={!name.trim() || !contactId} />
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
