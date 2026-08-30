import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ActivityEvent,
  ActivityType,
  ApprovalStatus,
  Asset,
  AssetVersion,
  Comment,
  Company,
  Contact,
  Database,
  Deal,
  ID,
  Milestone,
  MoodItem,
  MoodSection,
  PipelineStage,
  Project,
  SavedView,
  Settings,
  Tag,
  Task,
  Workspace,
} from '@/data/types'
import { createEmptyDatabase, createSeedDatabase } from '@/data/seed'
import { arrayMove, toISODate, uid } from '@/lib/utils'
import { setMoneyFormat } from '@/lib/intl'

const STORAGE_KEY = 'crmo/v1'

/* ------------------------------------------------------------------------ */

type Actions = {
  /* projects */
  addProject: (draft: Partial<Project> & Pick<Project, 'name' | 'companyId' | 'clientContactId'>) => ID
  updateProject: (id: ID, patch: Partial<Project>) => void
  deleteProject: (id: ID) => void
  setProjectStage: (id: ID, stage: Project['stage']) => void

  /* milestones */
  addMilestone: (milestone: Omit<Milestone, 'id'>) => ID
  updateMilestone: (id: ID, patch: Partial<Milestone>) => void
  deleteMilestone: (id: ID) => void

  /* contacts & companies */
  addContact: (draft: Partial<Contact> & Pick<Contact, 'name' | 'companyId'>) => ID
  updateContact: (id: ID, patch: Partial<Contact>) => void
  deleteContact: (id: ID) => void
  addCompany: (draft: Partial<Company> & Pick<Company, 'name'>) => ID
  updateCompany: (id: ID, patch: Partial<Company>) => void
  deleteCompany: (id: ID) => void

  /* deals */
  addDeal: (draft: Partial<Deal> & Pick<Deal, 'name' | 'companyId' | 'contactId'>) => ID
  updateDeal: (id: ID, patch: Partial<Deal>) => void
  deleteDeal: (id: ID) => void
  moveDeal: (id: ID, stageId: ID) => void

  /* tasks */
  addTask: (draft: Partial<Task> & Pick<Task, 'title'>) => ID
  updateTask: (id: ID, patch: Partial<Task>) => void
  toggleTask: (id: ID) => void
  deleteTask: (id: ID) => void
  bulkUpdateTasks: (ids: ID[], patch: Partial<Task>) => void

  /* moodboards */
  addMoodItem: (item: Omit<MoodItem, 'id' | 'order' | 'createdAt'> & { order?: number }) => ID
  updateMoodItem: (id: ID, patch: Partial<MoodItem>) => void
  deleteMoodItem: (id: ID) => void
  toggleMoodPin: (id: ID) => void
  reorderMoodItems: (sectionId: ID, activeId: ID, overId: ID) => void
  moveMoodItemToSection: (itemId: ID, sectionId: ID, index?: number) => void
  addMoodSection: (boardId: ID, title: string) => ID
  updateMoodSection: (id: ID, patch: Partial<MoodSection>) => void
  deleteMoodSection: (id: ID) => void
  ensureMoodboard: (projectId: ID) => ID

  /* assets, versions, approvals */
  addAssetVersion: (assetId: ID, draft: Partial<AssetVersion>) => ID
  addAsset: (draft: Omit<Asset, 'id' | 'currentVersionId' | 'createdAt'> & { versionUrl?: string }) => ID
  setVersionStatus: (versionId: ID, status: ApprovalStatus, decision?: string) => void
  addComment: (draft: Omit<Comment, 'id' | 'createdAt' | 'resolved'>) => ID
  toggleCommentResolved: (id: ID) => void
  deleteComment: (id: ID) => void

  /* activity */
  logActivity: (draft: Omit<ActivityEvent, 'id' | 'at'> & { at?: string }) => ID
  completeFollowUp: (id: ID) => void
  deleteActivity: (id: ID) => void

  /* settings & meta */
  updateSettings: (patch: Partial<Settings>) => void
  addTag: (label: string, tone?: Tag['tone']) => ID
  updateTag: (id: ID, patch: Partial<Tag>) => void
  deleteTag: (id: ID) => void
  updatePipelineStage: (id: ID, patch: Partial<PipelineStage>) => void
  addPipelineStage: (name: string) => ID
  deletePipelineStage: (id: ID) => void
  reorderPipeline: (activeId: ID, overId: ID) => void
  updateTeamMember: (id: ID, patch: Partial<Database['team'][number]>) => void
  addTeamMember: (name: string, role: string, email: string) => ID
  removeTeamMember: (id: ID) => void
  saveView: (view: Omit<SavedView, 'id'>) => ID
  deleteView: (id: ID) => void

  /* workspace setup */
  updateWorkspace: (patch: Partial<Workspace>) => void
  applySetup: (result: { pipeline: PipelineStage[]; tags: Tag[]; start: 'demo' | 'empty' }) => void
  completeSetup: (workspace: Partial<Workspace>, start: 'demo' | 'empty') => void

  resetDemoData: () => void
}

export type Store = Database & Actions

/* ------------------------------------------------------------------ helpers */

const nowISO = () => new Date().toISOString()
const today = () => toISODate(new Date())

/** Patch one record inside a collection, leaving the rest untouched. */
function patchIn<T extends { id: ID }>(list: T[], id: ID, patch: Partial<T>): T[] {
  return list.map((item) => (item.id === id ? { ...item, ...patch } : item))
}

/* -------------------------------------------------------------------- store */

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...createSeedDatabase(),

      /* ---------------------------------------------------------- projects */

      addProject: (draft) => {
        const id = uid('pj')
        const project: Project = {
          id,
          name: draft.name,
          code: draft.code ?? `NEW-${get().projects.length + 1}`.padStart(5, '0'),
          summary: draft.summary ?? '',
          clientContactId: draft.clientContactId,
          companyId: draft.companyId,
          coverUrl: draft.coverUrl,
          artSeed: draft.artSeed ?? `${draft.name}-${id}`,
          stage: draft.stage ?? 'discovery',
          health: draft.health ?? 'on-track',
          leadId: draft.leadId ?? get().settings.currentUserId,
          memberIds: draft.memberIds ?? [get().settings.currentUserId],
          startDate: draft.startDate ?? today(),
          dueDate: draft.dueDate ?? today(),
          budget: draft.budget ?? 0,
          spent: draft.spent ?? 0,
          deliverables: draft.deliverables ?? [],
          tags: draft.tags ?? [],
          brief:
            draft.brief ??
            {
              objective: '',
              audience: '',
              direction: '',
              constraints: '',
              successCriteria: [],
            },
          dealId: draft.dealId,
          archived: false,
          createdAt: today(),
        }
        set((s) => ({ projects: [project, ...s.projects] }))
        get().ensureMoodboard(id)
        get().logActivity({
          type: 'update',
          subject: `Project created — ${project.name}`,
          actorId: get().settings.currentUserId,
          actorKind: 'team',
          links: { projectId: id, companyId: project.companyId, contactId: project.clientContactId },
        })
        return id
      },

      updateProject: (id, patch) => set((s) => ({ projects: patchIn(s.projects, id, patch) })),

      deleteProject: (id) =>
        set((s) => {
          const boardIds = s.moodboards.filter((b) => b.projectId === id).map((b) => b.id)
          const assetIds = s.assets.filter((a) => a.projectId === id).map((a) => a.id)
          return {
            projects: s.projects.filter((p) => p.id !== id),
            milestones: s.milestones.filter((m) => m.projectId !== id),
            tasks: s.tasks.filter((t) => t.projectId !== id),
            moodboards: s.moodboards.filter((b) => b.projectId !== id),
            moodSections: s.moodSections.filter((sec) => !boardIds.includes(sec.boardId)),
            moodItems: s.moodItems.filter((i) => !boardIds.includes(i.boardId)),
            assets: s.assets.filter((a) => a.projectId !== id),
            assetVersions: s.assetVersions.filter((v) => !assetIds.includes(v.assetId)),
            activity: s.activity.filter((a) => a.links.projectId !== id),
          }
        }),

      setProjectStage: (id, stage) => {
        const project = get().projects.find((p) => p.id === id)
        if (!project || project.stage === stage) return
        set((s) => ({ projects: patchIn(s.projects, id, { stage }) }))
        get().logActivity({
          type: 'status',
          subject: `${project.name} moved to ${stage}`,
          actorId: get().settings.currentUserId,
          actorKind: 'team',
          links: { projectId: id, companyId: project.companyId },
        })
      },

      /* -------------------------------------------------------- milestones */

      addMilestone: (milestone) => {
        const id = uid('ms')
        set((s) => ({ milestones: [...s.milestones, { ...milestone, id }] }))
        return id
      },
      updateMilestone: (id, patch) =>
        set((s) => ({ milestones: patchIn(s.milestones, id, patch) })),
      deleteMilestone: (id) =>
        set((s) => ({ milestones: s.milestones.filter((m) => m.id !== id) })),

      /* -------------------------------------------------- contacts & orgs */

      addContact: (draft) => {
        const id = uid('ct')
        const contact: Contact = {
          id,
          name: draft.name,
          role: draft.role ?? '',
          companyId: draft.companyId,
          email: draft.email ?? '',
          phone: draft.phone ?? '',
          avatar: draft.avatar,
          tags: draft.tags ?? [],
          location: draft.location,
          creativePrefs: draft.creativePrefs ?? '',
          notes: draft.notes ?? '',
          lastTouchedAt: today(),
          favourite: draft.favourite ?? false,
        }
        set((s) => ({ contacts: [contact, ...s.contacts] }))
        get().logActivity({
          type: 'note',
          subject: `Added ${contact.name}`,
          actorId: get().settings.currentUserId,
          actorKind: 'team',
          links: { contactId: id, companyId: contact.companyId },
        })
        return id
      },
      updateContact: (id, patch) => set((s) => ({ contacts: patchIn(s.contacts, id, patch) })),
      deleteContact: (id) =>
        set((s) => ({
          contacts: s.contacts.filter((c) => c.id !== id),
          tasks: s.tasks.map((t) => (t.contactId === id ? { ...t, contactId: undefined } : t)),
        })),

      addCompany: (draft) => {
        const id = uid('co')
        const company: Company = {
          id,
          name: draft.name,
          industry: draft.industry ?? '',
          website: draft.website ?? '',
          location: draft.location ?? '',
          size: draft.size ?? '',
          tags: draft.tags ?? [],
          notes: draft.notes ?? '',
          artSeed: draft.artSeed ?? `${draft.name}-${id}`,
          since: today(),
        }
        set((s) => ({ companies: [company, ...s.companies] }))
        return id
      },
      updateCompany: (id, patch) => set((s) => ({ companies: patchIn(s.companies, id, patch) })),
      deleteCompany: (id) =>
        set((s) => ({
          companies: s.companies.filter((c) => c.id !== id),
          contacts: s.contacts.filter((c) => c.companyId !== id),
        })),

      /* ------------------------------------------------------------ deals */

      addDeal: (draft) => {
        const id = uid('dl')
        const pipeline = get().pipeline
        const stageId = draft.stageId ?? pipeline[0]?.id
        const stage = pipeline.find((p) => p.id === stageId)
        const deal: Deal = {
          id,
          name: draft.name,
          companyId: draft.companyId,
          contactId: draft.contactId,
          stageId,
          value: draft.value ?? 0,
          probability: draft.probability ?? stage?.probability ?? 10,
          expectedCloseDate: draft.expectedCloseDate ?? today(),
          ownerId: draft.ownerId ?? get().settings.currentUserId,
          projectId: draft.projectId,
          source: draft.source ?? 'Inbound',
          notes: draft.notes ?? '',
          tags: draft.tags ?? [],
          createdAt: today(),
        }
        set((s) => ({ deals: [deal, ...s.deals] }))
        get().logActivity({
          type: 'deal',
          subject: `New deal — ${deal.name}`,
          actorId: deal.ownerId,
          actorKind: 'team',
          links: { dealId: id, companyId: deal.companyId, contactId: deal.contactId },
        })
        return id
      },
      updateDeal: (id, patch) => set((s) => ({ deals: patchIn(s.deals, id, patch) })),
      deleteDeal: (id) => set((s) => ({ deals: s.deals.filter((d) => d.id !== id) })),

      moveDeal: (id, stageId) => {
        const deal = get().deals.find((d) => d.id === id)
        const stage = get().pipeline.find((p) => p.id === stageId)
        if (!deal || !stage || deal.stageId === stageId) return
        set((s) => ({
          deals: patchIn(s.deals, id, {
            stageId,
            probability: stage.probability,
            closedAt: stage.kind === 'open' ? undefined : today(),
          }),
        }))
        get().logActivity({
          type: 'deal',
          subject: `${deal.name} moved to ${stage.name}`,
          actorId: get().settings.currentUserId,
          actorKind: 'team',
          links: { dealId: id, companyId: deal.companyId, contactId: deal.contactId },
        })
      },

      /* ------------------------------------------------------------ tasks */

      addTask: (draft) => {
        const id = uid('tk')
        const task: Task = {
          id,
          title: draft.title,
          detail: draft.detail,
          status: draft.status ?? 'todo',
          priority: draft.priority ?? 'normal',
          dueDate: draft.dueDate,
          assigneeId: draft.assigneeId ?? get().settings.currentUserId,
          projectId: draft.projectId,
          dealId: draft.dealId,
          contactId: draft.contactId,
          reminderAt: draft.reminderAt,
          createdAt: today(),
        }
        set((s) => ({ tasks: [task, ...s.tasks] }))
        return id
      },
      updateTask: (id, patch) => set((s) => ({ tasks: patchIn(s.tasks, id, patch) })),
      toggleTask: (id) => {
        const task = get().tasks.find((t) => t.id === id)
        if (!task) return
        const done = task.status !== 'done'
        set((s) => ({
          tasks: patchIn(s.tasks, id, {
            status: done ? 'done' : 'todo',
            completedAt: done ? nowISO() : undefined,
          }),
        }))
      },
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      bulkUpdateTasks: (ids, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (ids.includes(t.id) ? { ...t, ...patch } : t)),
        })),

      /* ------------------------------------------------------- moodboards */

      ensureMoodboard: (projectId) => {
        const existing = get().moodboards.find((b) => b.projectId === projectId)
        if (existing) return existing.id
        const boardId = uid('mb')
        const project = get().projects.find((p) => p.id === projectId)
        set((s) => ({
          moodboards: [
            ...s.moodboards,
            { id: boardId, projectId, title: project?.name ?? 'Moodboard', updatedAt: nowISO() },
          ],
          moodSections: [
            ...s.moodSections,
            { id: uid('sec'), boardId, title: 'References', order: 0 },
          ],
        }))
        return boardId
      },

      addMoodItem: (item) => {
        const id = uid('mi')
        const siblings = get().moodItems.filter((i) => i.sectionId === item.sectionId)
        set((s) => ({
          moodItems: [
            ...s.moodItems,
            {
              ...item,
              id,
              order: item.order ?? siblings.length,
              createdAt: nowISO(),
            } as MoodItem,
          ],
          moodboards: patchIn(s.moodboards, item.boardId, { updatedAt: nowISO() }),
        }))
        return id
      },
      updateMoodItem: (id, patch) =>
        set((s) => ({ moodItems: patchIn(s.moodItems, id, patch) })),
      deleteMoodItem: (id) => set((s) => ({ moodItems: s.moodItems.filter((i) => i.id !== id) })),
      toggleMoodPin: (id) => {
        const item = get().moodItems.find((i) => i.id === id)
        if (!item) return
        set((s) => ({ moodItems: patchIn(s.moodItems, id, { pinned: !item.pinned }) }))
      },

      reorderMoodItems: (sectionId, activeId, overId) =>
        set((s) => {
          const inSection = s.moodItems
            .filter((i) => i.sectionId === sectionId)
            .sort((a, b) => a.order - b.order)
          const from = inSection.findIndex((i) => i.id === activeId)
          const to = inSection.findIndex((i) => i.id === overId)
          if (from === -1 || to === -1) return {}
          const reordered = arrayMove(inSection, from, to)
          const orderById = new Map(reordered.map((item, index) => [item.id, index]))
          return {
            moodItems: s.moodItems.map((item) =>
              orderById.has(item.id) ? { ...item, order: orderById.get(item.id)! } : item,
            ),
          }
        }),

      moveMoodItemToSection: (itemId, sectionId, index) =>
        set((s) => {
          const item = s.moodItems.find((i) => i.id === itemId)
          if (!item || item.sectionId === sectionId) return {}
          const target = s.moodItems
            .filter((i) => i.sectionId === sectionId)
            .sort((a, b) => a.order - b.order)
          const at = index ?? target.length
          const moved = { ...item, sectionId, order: at }
          const shifted = s.moodItems.map((i) => {
            if (i.id === itemId) return moved
            if (i.sectionId === sectionId && i.order >= at) return { ...i, order: i.order + 1 }
            if (i.sectionId === item.sectionId && i.order > item.order)
              return { ...i, order: i.order - 1 }
            return i
          })
          return { moodItems: shifted }
        }),

      addMoodSection: (boardId, title) => {
        const id = uid('sec')
        const count = get().moodSections.filter((s) => s.boardId === boardId).length
        set((s) => ({
          moodSections: [...s.moodSections, { id, boardId, title, order: count }],
        }))
        return id
      },
      updateMoodSection: (id, patch) =>
        set((s) => ({ moodSections: patchIn(s.moodSections, id, patch) })),
      deleteMoodSection: (id) =>
        set((s) => ({
          moodSections: s.moodSections.filter((sec) => sec.id !== id),
          moodItems: s.moodItems.filter((i) => i.sectionId !== id),
        })),

      /* ------------------------------------------- assets and approvals */

      addAsset: (draft) => {
        const assetId = uid('as')
        const versionId = uid('av')
        set((s) => ({
          assets: [
            {
              id: assetId,
              projectId: draft.projectId,
              name: draft.name,
              kind: draft.kind,
              currentVersionId: versionId,
              createdAt: today(),
            },
            ...s.assets,
          ],
          assetVersions: [
            ...s.assetVersions,
            {
              id: versionId,
              assetId,
              label: 'v1',
              url: draft.versionUrl,
              artSeed: `${draft.name}-1`,
              ratio: 4 / 3,
              uploadedById: get().settings.currentUserId,
              createdAt: nowISO(),
              status: 'draft',
            },
          ],
        }))
        return assetId
      },

      addAssetVersion: (assetId, draft) => {
        const id = uid('av')
        const count = get().assetVersions.filter((v) => v.assetId === assetId).length
        const version: AssetVersion = {
          id,
          assetId,
          label: draft.label ?? `v${count + 1}`,
          url: draft.url,
          artSeed: draft.artSeed ?? `${assetId}-${count + 1}`,
          ratio: draft.ratio ?? 4 / 3,
          uploadedById: draft.uploadedById ?? get().settings.currentUserId,
          createdAt: nowISO(),
          status: draft.status ?? 'draft',
          notes: draft.notes,
        }
        set((s) => ({
          assetVersions: [...s.assetVersions, version],
          assets: patchIn(s.assets, assetId, { currentVersionId: id }),
        }))
        return id
      },

      setVersionStatus: (versionId, status, decision) => {
        const version = get().assetVersions.find((v) => v.id === versionId)
        if (!version) return
        const asset = get().assets.find((a) => a.id === version.assetId)
        const decided = status === 'approved' || status === 'changes-requested'
        set((s) => ({
          assetVersions: patchIn(s.assetVersions, versionId, {
            status,
            decision: decision ?? version.decision,
            decidedById: decided ? s.settings.currentUserId : undefined,
            decidedAt: decided ? nowISO() : undefined,
          }),
        }))
        const label =
          status === 'approved'
            ? 'approved'
            : status === 'changes-requested'
              ? 'changes requested on'
              : status === 'pending'
                ? 'sent for review —'
                : 'returned to draft —'
        get().logActivity({
          type: 'approval',
          subject: `${asset?.name ?? 'Asset'} ${version.label} ${label}`,
          body: decision,
          actorId: get().settings.currentUserId,
          actorKind: 'team',
          links: { projectId: asset?.projectId, assetVersionId: versionId },
        })
      },

      addComment: (draft) => {
        const id = uid('cm')
        set((s) => ({
          comments: [...s.comments, { ...draft, id, createdAt: nowISO(), resolved: false }],
        }))
        return id
      },
      toggleCommentResolved: (id) => {
        const comment = get().comments.find((c) => c.id === id)
        if (!comment) return
        set((s) => ({ comments: patchIn(s.comments, id, { resolved: !comment.resolved }) }))
      },
      deleteComment: (id) => set((s) => ({ comments: s.comments.filter((c) => c.id !== id) })),

      /* --------------------------------------------------------- activity */

      logActivity: (draft) => {
        const id = uid('ac')
        const event: ActivityEvent = {
          id,
          at: draft.at ?? nowISO(),
          type: draft.type as ActivityType,
          subject: draft.subject,
          body: draft.body,
          actorId: draft.actorId,
          actorKind: draft.actorKind,
          direction: draft.direction,
          links: draft.links,
          followUpAt: draft.followUpAt,
          followUpDone: draft.followUpDone,
        }
        set((s) => ({ activity: [event, ...s.activity] }))

        // Logging a touch against a contact keeps "last contacted" honest.
        if (draft.links.contactId) {
          set((s) => ({
            contacts: patchIn(s.contacts, draft.links.contactId!, { lastTouchedAt: today() }),
          }))
        }
        return id
      },
      completeFollowUp: (id) =>
        set((s) => ({ activity: patchIn(s.activity, id, { followUpDone: true }) })),
      deleteActivity: (id) => set((s) => ({ activity: s.activity.filter((a) => a.id !== id) })),

      /* --------------------------------------------------------- settings */

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      addTag: (label, tone = 'neutral') => {
        const id = uid('tag')
        set((s) => ({ tags: [...s.tags, { id, label, tone }] }))
        return id
      },
      updateTag: (id, patch) => set((s) => ({ tags: patchIn(s.tags, id, patch) })),
      deleteTag: (id) =>
        set((s) => ({
          tags: s.tags.filter((t) => t.id !== id),
          projects: s.projects.map((p) => ({ ...p, tags: p.tags.filter((t) => t !== id) })),
          contacts: s.contacts.map((c) => ({ ...c, tags: c.tags.filter((t) => t !== id) })),
          companies: s.companies.map((c) => ({ ...c, tags: c.tags.filter((t) => t !== id) })),
          deals: s.deals.map((d) => ({ ...d, tags: d.tags.filter((t) => t !== id) })),
        })),

      updatePipelineStage: (id, patch) =>
        set((s) => ({ pipeline: patchIn(s.pipeline, id, patch) })),
      addPipelineStage: (name) => {
        const id = uid('ps')
        const openStages = get().pipeline.filter((p) => p.kind === 'open')
        const order = openStages.length
        set((s) => ({
          pipeline: [
            ...s.pipeline.filter((p) => p.kind === 'open'),
            { id, name, order, probability: 50, kind: 'open' as const },
            ...s.pipeline.filter((p) => p.kind !== 'open').map((p) => ({ ...p, order: p.order + 1 })),
          ],
        }))
        return id
      },
      deletePipelineStage: (id) => {
        const remaining = get().pipeline.filter((p) => p.id !== id && p.kind === 'open')
        const fallback = remaining[0]?.id
        if (!fallback) return
        set((s) => ({
          pipeline: s.pipeline.filter((p) => p.id !== id),
          deals: s.deals.map((d) => (d.stageId === id ? { ...d, stageId: fallback } : d)),
        }))
      },
      reorderPipeline: (activeId, overId) =>
        set((s) => {
          const open = s.pipeline.filter((p) => p.kind === 'open').sort((a, b) => a.order - b.order)
          const from = open.findIndex((p) => p.id === activeId)
          const to = open.findIndex((p) => p.id === overId)
          if (from === -1 || to === -1) return {}
          const reordered = arrayMove(open, from, to).map((p, index) => ({ ...p, order: index }))
          const closed = s.pipeline
            .filter((p) => p.kind !== 'open')
            .map((p, index) => ({ ...p, order: reordered.length + index }))
          return { pipeline: [...reordered, ...closed] }
        }),

      updateTeamMember: (id, patch) => set((s) => ({ team: patchIn(s.team, id, patch) })),
      addTeamMember: (name, role, email) => {
        const id = uid('tm')
        set((s) => ({
          team: [
            ...s.team,
            { id, name, role, email, permissionRole: 'member', capacity: 40, active: true },
          ],
        }))
        return id
      },
      removeTeamMember: (id) =>
        set((s) => ({ team: s.team.map((m) => (m.id === id ? { ...m, active: false } : m)) })),

      saveView: (view) => {
        const id = uid('sv')
        set((s) => ({ savedViews: [...s.savedViews, { ...view, id }] }))
        return id
      },
      deleteView: (id) => set((s) => ({ savedViews: s.savedViews.filter((v) => v.id !== id) })),

      /* -------------------------------------------------------- workspace */

      updateWorkspace: (patch) =>
        set((s) => ({
          settings: { ...s.settings, workspace: { ...s.settings.workspace, ...patch } },
        })),

      completeSetup: (patch, start) => {
        const workspace = { ...get().settings.workspace, ...patch, onboarded: true }

        if (start === 'empty') {
          set(createEmptyDatabase(workspace))
          return
        }

        /*
         * Asking for the demo studio when the store has been emptied — by a
         * failed first sign-in, or a reset — has to rebuild it. Renaming the
         * owner inside an empty roster would otherwise produce a workspace
         * with nothing in it and no team member to be.
         */
        const base = get().team.length === 0 ? createSeedDatabase() : null

        set((s) => {
          const team = base?.team ?? s.team
          const currentUserId = base ? base.settings.currentUserId : s.settings.currentUserId

          return {
            ...(base ?? {}),
            // Rename the owner's own record so the studio reads as theirs
            // rather than as somebody else's.
            team: team.map((m) =>
              m.id === currentUserId
                ? {
                    ...m,
                    name: workspace.ownerName || m.name,
                    role: workspace.ownerRole || m.role,
                    email: workspace.ownerEmail || m.email,
                  }
                : m,
            ),
            settings: { ...s.settings, currentUserId, workspace },
          }
        })
      },


      /**
       * Apply the structural answers from setup: the pipeline the studio
       * actually sells through, and the services it sells. Starting empty means
       * these replace the defaults outright; starting from the demo keeps the
       * seeded stages, because the demo deals are already sitting in them.
       */
      applySetup: (result) =>
        set((s) => {
          if (result.start === 'demo') {
            // Merge the chosen services in without dropping the demo's own tags.
            const existing = new Set(s.tags.map((t) => t.label.toLowerCase()))
            const added = result.tags.filter((t) => !existing.has(t.label.toLowerCase()))
            return { tags: [...s.tags, ...added] }
          }
          return {
            pipeline: result.pipeline,
            tags: result.tags.length > 0 ? result.tags : s.tags,
          }
        }),

      resetDemoData: () => {
        const fresh = createSeedDatabase()
        // Theme and workspace identity are preferences, not demo data.
        const { theme, workspace } = get().settings
        set({
          ...fresh,
          settings: { ...fresh.settings, theme, workspace },
        })
      },
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      // Actions are recreated on every load; only the data is persisted.
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([, value]) => typeof value !== 'function'),
        ) as Database,

      /*
       * The default merge is shallow, so a `settings` object saved before a
       * field existed replaces the whole thing and silently drops it — which
       * blanked the app when settings.workspace went missing. Nested objects
       * are merged over their current defaults so an old snapshot can only ever
       * be missing values, never structure.
       */
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<Database>
        const savedSettings = saved.settings as Partial<Settings> | undefined

        return {
          ...current,
          ...saved,
          settings: {
            ...current.settings,
            ...savedSettings,
            notifications: {
              ...current.settings.notifications,
              ...(savedSettings?.notifications ?? {}),
            },
            workspace: {
              ...current.settings.workspace,
              ...(savedSettings?.workspace ?? {}),
            },
          },
        }
      },

      // `merge` repairs any shape, so migrating is just a version bump.
      migrate: (persisted) => persisted as Database,
    },
  ),
)

/* ----------------------------------------------------------------- intl -- */

// Currency and locale are read from render paths all over the app, so the
// formatters keep a module-level copy rather than every call site taking a hook.
function syncMoneyFormat(state: Store) {
  // Runs at module scope, where a throw is unrecoverable and blanks the page.
  // Optional chaining keeps a malformed store a formatting problem, not a crash.
  setMoneyFormat(state.settings?.workspace?.currency, state.settings?.workspace?.locale)
}
syncMoneyFormat(useStore.getState())
useStore.subscribe(syncMoneyFormat)
