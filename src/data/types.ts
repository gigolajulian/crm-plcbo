/* ============================================================================
   CRMO — DOMAIN MODEL
   Records reference each other by id only. Every derived figure (health,
   pipeline totals, workload) is computed in store/selectors.ts, never stored.
   ========================================================================== */

export type ID = string
/** ISO date (YYYY-MM-DD) or full ISO datetime. */
export type ISODate = string

/* ------------------------------------------------------------- people --- */

export type PermissionRole = 'owner' | 'admin' | 'member' | 'guest'

export interface TeamMember {
  id: ID
  name: string
  role: string
  permissionRole: PermissionRole
  email: string
  avatar?: string
  /** Weekly capacity in hours — drives the workload report. */
  capacity: number
  active: boolean
}

export interface Contact {
  id: ID
  name: string
  role: string
  companyId: ID
  email: string
  phone: string
  avatar?: string
  tags: ID[]
  location?: string
  /** How this client likes to work — surfaced on the profile and in briefs. */
  creativePrefs: string
  notes: string
  lastTouchedAt: ISODate
  favourite: boolean
}

export interface Company {
  id: ID
  name: string
  industry: string
  website: string
  location: string
  size: string
  tags: ID[]
  notes: string
  /** Seed for the generated identity mark. */
  artSeed: string
  since: ISODate
}

/* ----------------------------------------------------------- projects --- */

export type ProjectStage =
  | 'discovery'
  | 'concept'
  | 'production'
  | 'review'
  | 'delivery'
  | 'complete'

export type ProjectHealth = 'on-track' | 'at-risk' | 'blocked'

export interface Brief {
  objective: string
  audience: string
  direction: string
  constraints: string
  successCriteria: string[]
}

export interface Deliverable {
  id: ID
  name: string
  quantity: string
  done: boolean
}

export interface Project {
  id: ID
  name: string
  /** Short code shown on cards and in search, e.g. "AUR-01". */
  code: string
  summary: string
  clientContactId: ID
  companyId: ID
  coverUrl?: string
  artSeed: string
  stage: ProjectStage
  health: ProjectHealth
  leadId: ID
  memberIds: ID[]
  startDate: ISODate
  dueDate: ISODate
  budget: number
  spent: number
  deliverables: Deliverable[]
  tags: ID[]
  brief: Brief
  dealId?: ID
  archived: boolean
  createdAt: ISODate
}

export type MilestoneStatus = 'upcoming' | 'in-progress' | 'done' | 'missed'

export interface Milestone {
  id: ID
  projectId: ID
  name: string
  date: ISODate
  status: MilestoneStatus
  note?: string
}

/* -------------------------------------------------------------- tasks --- */

export type TaskStatus = 'todo' | 'in-progress' | 'done'
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface Task {
  id: ID
  title: string
  detail?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: ISODate
  assigneeId?: ID
  projectId?: ID
  dealId?: ID
  contactId?: ID
  /** A reminder is a follow-up nudge, shown on the dashboard. */
  reminderAt?: ISODate
  createdAt: ISODate
  completedAt?: ISODate
}

/* -------------------------------------------------------------- deals --- */

export interface PipelineStage {
  id: ID
  name: string
  order: number
  /** Default win probability applied to deals entering this stage. */
  probability: number
  /** 'won' and 'lost' stages close a deal and are excluded from open pipeline. */
  kind: 'open' | 'won' | 'lost'
}

export interface Deal {
  id: ID
  name: string
  companyId: ID
  contactId: ID
  stageId: ID
  value: number
  probability: number
  expectedCloseDate: ISODate
  ownerId: ID
  projectId?: ID
  source: string
  notes: string
  tags: ID[]
  createdAt: ISODate
  /** Set when the deal enters a won/lost stage. */
  closedAt?: ISODate
}

/* --------------------------------------------------------- moodboards --- */

export type MoodItemKind = 'image' | 'shot' | 'link' | 'color' | 'type' | 'material' | 'note'

export interface MoodPayloadImage {
  url?: string
  artSeed: string
  /** Aspect ratio, drives the masonry row span. */
  ratio: number
  credit?: string
}
export interface MoodPayloadLink {
  url: string
  title: string
  site: string
}
export interface MoodPayloadColor {
  hex: string
  name: string
}
export interface MoodPayloadType {
  family: string
  /** CSS font stack used to actually render the specimen. */
  stack: string
  weight: number
  sample: string
  usage: string
}
export interface MoodPayloadNote {
  body: string
}

export type MoodPayload =
  | ({ kind: 'image' | 'shot' | 'material' } & MoodPayloadImage)
  | ({ kind: 'link' } & MoodPayloadLink)
  | ({ kind: 'color' } & MoodPayloadColor)
  | ({ kind: 'type' } & MoodPayloadType)
  | ({ kind: 'note' } & MoodPayloadNote)

export interface MoodItem {
  id: ID
  boardId: ID
  sectionId: ID
  order: number
  kind: MoodItemKind
  payload: MoodPayload
  caption: string
  tags: ID[]
  note?: string
  pinned: boolean
  addedBy: ID
  createdAt: ISODate
}

export interface MoodSection {
  id: ID
  boardId: ID
  title: string
  description?: string
  order: number
}

export interface Moodboard {
  id: ID
  projectId: ID
  title: string
  updatedAt: ISODate
}

/* ------------------------------------------------ assets & approvals --- */

export type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'changes-requested'

export interface AssetVersion {
  id: ID
  assetId: ID
  label: string
  url?: string
  artSeed: string
  ratio: number
  uploadedById: ID
  createdAt: ISODate
  status: ApprovalStatus
  /** Free-text summary of the decision, shown in the audit trail. */
  decision?: string
  decidedById?: ID
  decidedAt?: ISODate
  notes?: string
}

export interface Asset {
  id: ID
  projectId: ID
  name: string
  kind: 'design' | 'video' | 'copy' | 'document' | 'photo'
  currentVersionId: ID
  createdAt: ISODate
}

export type CommentTarget = 'assetVersion' | 'project' | 'moodItem'

export interface Comment {
  id: ID
  targetType: CommentTarget
  targetId: ID
  authorId: ID
  /** Client-side reviewers are contacts; internal reviewers are team members. */
  authorKind: 'team' | 'client'
  body: string
  createdAt: ISODate
  resolved: boolean
  /** Normalised 0–1 position, for a pin dropped on the artwork. */
  pin?: { x: number; y: number }
}

/* ----------------------------------------------------------- activity --- */

export type ActivityType =
  | 'call'
  | 'email'
  | 'meeting'
  | 'note'
  | 'status'
  | 'update'
  | 'approval'
  | 'task'
  | 'deal'

export interface ActivityEvent {
  id: ID
  type: ActivityType
  subject: string
  body?: string
  actorId: ID
  actorKind: 'team' | 'client' | 'system'
  at: ISODate
  /** Direction for communication types. */
  direction?: 'inbound' | 'outbound'
  links: {
    projectId?: ID
    contactId?: ID
    companyId?: ID
    dealId?: ID
    taskId?: ID
    assetVersionId?: ID
  }
  /** Follow-ups appear on the dashboard until cleared. */
  followUpAt?: ISODate
  followUpDone?: boolean
}

/* ----------------------------------------------------------- settings --- */

export interface Tag {
  id: ID
  label: string
  /** One of the named swatch keys, so tags stay inside the palette. */
  tone: 'neutral' | 'lime' | 'positive' | 'caution' | 'critical' | 'info'
}

export type CustomFieldType = 'text' | 'number' | 'select' | 'date' | 'checkbox'

export interface CustomField {
  id: ID
  label: string
  type: CustomFieldType
  entity: 'project' | 'contact' | 'company' | 'deal'
  options?: string[]
  required: boolean
}

export interface NotificationPrefs {
  approvalRequests: boolean
  taskAssignments: boolean
  dealStageChanges: boolean
  milestoneReminders: boolean
  clientReplies: boolean
  weeklyDigest: boolean
  channel: 'email' | 'in-app' | 'both'
}

export interface SavedView {
  id: ID
  scope: 'projects' | 'deals' | 'contacts' | 'tasks'
  name: string
  filters: Record<string, string[] | string>
  sort?: string
  layout?: string
}

/** The five accent presets. Each is a background colour that carries ink text. */
export type Accent = 'lime' | 'amber' | 'coral' | 'sky' | 'iris'

/**
 * The workspace's own identity, set during setup and editable in Settings.
 * This is a local profile, not an authenticated account — there is no server
 * and no password; see the README.
 */
export interface Workspace {
  /** Studio name, shown in the nav, settings and page copy. */
  name: string
  tagline: string
  /** The person using the app. Maps onto their TeamMember record. */
  ownerName: string
  ownerRole: string
  ownerEmail: string
  accent: Accent
  currency: string
  locale: string
  /** False until setup has been completed once. */
  onboarded: boolean
}

export interface Settings {
  theme: 'light' | 'dark' | 'system'
  density: 'comfortable' | 'compact'
  notifications: NotificationPrefs
  currentUserId: ID
  workspace: Workspace
}

/* ------------------------------------------------------- ui view state --- */

export type ProjectView = 'gallery' | 'board' | 'timeline' | 'list'
export type DealView = 'board' | 'list'
export type TaskBucket = 'today' | 'upcoming' | 'overdue' | 'completed'

/** Shape of the whole persisted database. */
export interface Database {
  team: TeamMember[]
  companies: Company[]
  contacts: Contact[]
  projects: Project[]
  milestones: Milestone[]
  tasks: Task[]
  deals: Deal[]
  pipeline: PipelineStage[]
  moodboards: Moodboard[]
  moodSections: MoodSection[]
  moodItems: MoodItem[]
  assets: Asset[]
  assetVersions: AssetVersion[]
  comments: Comment[]
  activity: ActivityEvent[]
  tags: Tag[]
  customFields: CustomField[]
  savedViews: SavedView[]
  settings: Settings
}

/* --------------------------------------------------------- label maps --- */

export const PROJECT_STAGES: Array<{ id: ProjectStage; label: string; hint: string }> = [
  { id: 'discovery', label: 'Discovery', hint: 'Understanding the problem' },
  { id: 'concept', label: 'Concept', hint: 'Exploring directions' },
  { id: 'production', label: 'Production', hint: 'Making the work' },
  { id: 'review', label: 'Review', hint: 'With the client' },
  { id: 'delivery', label: 'Delivery', hint: 'Handing over' },
  { id: 'complete', label: 'Complete', hint: 'Wrapped and archived' },
]

export const PROJECT_HEALTH: Record<ProjectHealth, { label: string; tone: string }> = {
  'on-track': { label: 'On track', tone: 'positive' },
  'at-risk': { label: 'At risk', tone: 'caution' },
  blocked: { label: 'Blocked', tone: 'critical' },
}

export const TASK_PRIORITIES: Array<{ id: TaskPriority; label: string }> = [
  { id: 'urgent', label: 'Urgent' },
  { id: 'high', label: 'High' },
  { id: 'normal', label: 'Normal' },
  { id: 'low', label: 'Low' },
]

export const APPROVAL_STATUS: Record<ApprovalStatus, { label: string; tone: string }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  pending: { label: 'Awaiting review', tone: 'caution' },
  approved: { label: 'Approved', tone: 'positive' },
  'changes-requested': { label: 'Changes requested', tone: 'critical' },
}

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  call: 'Call',
  email: 'Email',
  meeting: 'Meeting',
  note: 'Note',
  status: 'Status change',
  update: 'Project update',
  approval: 'Approval',
  task: 'Task',
  deal: 'Deal',
}

export const MOOD_KIND_LABELS: Record<MoodItemKind, string> = {
  image: 'Image',
  shot: 'Shot',
  link: 'Link',
  color: 'Colour',
  type: 'Typography',
  material: 'Material',
  note: 'Note',
}
