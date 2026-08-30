import { useMemo } from 'react'
import { useStore } from './useStore'
import type {
  ActivityEvent,
  ApprovalStatus,
  Company,
  Contact,
  Deal,
  ID,
  Milestone,
  PipelineStage,
  Project,
  Task,
  TeamMember,
} from '@/data/types'
import { daysFromToday, sortBy, sum } from '@/lib/utils'

/* ============================================================================
   Derived reads. Nothing here writes; every computed figure the UI shows
   (health, pipeline value, workload, buckets) is defined once, here.
   ========================================================================== */

/* -------------------------------------------------------------- lookups -- */

/**
 * Never returns undefined. The top bar and half the app read `.name` off this
 * without guarding, so an empty roster — or a currentUserId pointing at someone
 * who has been removed — used to crash the whole tree. Falls back to the
 * workspace owner, who always exists as an identity even if the team does not.
 */
export function useCurrentUser(): TeamMember {
  const team = useStore((s) => s.team)
  const id = useStore((s) => s.settings.currentUserId)
  const workspace = useStore((s) => s.settings.workspace)

  return useMemo(() => {
    const found = team.find((m) => m.id === id) ?? team[0]
    if (found) return found
    return {
      id: id || 'tm_owner',
      name: workspace?.ownerName || 'You',
      role: workspace?.ownerRole || '',
      permissionRole: 'owner',
      email: workspace?.ownerEmail || '',
      capacity: 40,
      active: true,
    }
  }, [team, id, workspace])
}

export function useMember(id?: ID): TeamMember | undefined {
  return useStore((s) => (id ? s.team.find((m) => m.id === id) : undefined))
}

/*
 * Derived lists must be memoised rather than filtered inline in a component's
 * `useStore` selector: a fresh array every render makes zustand's snapshot
 * comparison fail and React re-renders forever.
 */

export function useActiveTeam(): TeamMember[] {
  const team = useStore((s) => s.team)
  return useMemo(() => team.filter((m) => m.active), [team])
}

export function useOpenStages(): PipelineStage[] {
  const pipeline = useStore((s) => s.pipeline)
  return useMemo(
    () => sortBy(pipeline.filter((p) => p.kind === 'open'), (p) => p.order),
    [pipeline],
  )
}

export function useSortedPipeline(): PipelineStage[] {
  const pipeline = useStore((s) => s.pipeline)
  return useMemo(() => sortBy(pipeline, (p) => p.order), [pipeline])
}

export function useContact(id?: ID): Contact | undefined {
  return useStore((s) => (id ? s.contacts.find((c) => c.id === id) : undefined))
}

export function useCompany(id?: ID): Company | undefined {
  return useStore((s) => (id ? s.companies.find((c) => c.id === id) : undefined))
}

export function useProject(id?: ID): Project | undefined {
  return useStore((s) => (id ? s.projects.find((p) => p.id === id) : undefined))
}

export function useDeal(id?: ID): Deal | undefined {
  return useStore((s) => (id ? s.deals.find((d) => d.id === id) : undefined))
}

/* ---------------------------------------------------------------- tasks -- */

export type TaskBuckets = {
  overdue: Task[]
  today: Task[]
  upcoming: Task[]
  completed: Task[]
  someday: Task[]
}

/** Sorts every open task into the bucket the Tasks screen and dashboard use. */
export function bucketTasks(tasks: Task[]): TaskBuckets {
  const buckets: TaskBuckets = { overdue: [], today: [], upcoming: [], completed: [], someday: [] }

  for (const task of tasks) {
    if (task.status === 'done') {
      buckets.completed.push(task)
      continue
    }
    if (!task.dueDate) {
      buckets.someday.push(task)
      continue
    }
    const delta = daysFromToday(task.dueDate)
    if (delta < 0) buckets.overdue.push(task)
    else if (delta === 0) buckets.today.push(task)
    else buckets.upcoming.push(task)
  }

  const byDue = (list: Task[]) => sortBy(list, (t) => t.dueDate ?? '9999-12-31')
  return {
    overdue: byDue(buckets.overdue),
    today: byDue(buckets.today),
    upcoming: byDue(buckets.upcoming),
    someday: sortBy(buckets.someday, (t) => t.createdAt, -1),
    completed: sortBy(buckets.completed, (t) => t.completedAt ?? t.createdAt, -1),
  }
}

export function useTaskBuckets(filterToUser = false): TaskBuckets {
  const tasks = useStore((s) => s.tasks)
  const userId = useStore((s) => s.settings.currentUserId)
  return useMemo(
    () => bucketTasks(filterToUser ? tasks.filter((t) => t.assigneeId === userId) : tasks),
    [tasks, filterToUser, userId],
  )
}

/* -------------------------------------------------------------- projects -- */

export type ProjectVitals = {
  /** 0–1 share of deliverables marked done. */
  progress: number
  /** 0–1 share of budget spent. */
  budgetUsed: number
  daysRemaining: number
  openTasks: number
  overdueTasks: number
  nextMilestone?: Milestone
  awaitingApproval: number
}

export function useProjectVitals(projectId: ID): ProjectVitals {
  const project = useProject(projectId)
  const tasks = useStore((s) => s.tasks)
  const milestones = useStore((s) => s.milestones)
  const assets = useStore((s) => s.assets)
  const versions = useStore((s) => s.assetVersions)

  return useMemo(() => {
    const projectTasks = tasks.filter((t) => t.projectId === projectId)
    const open = projectTasks.filter((t) => t.status !== 'done')
    const projectAssetIds = assets.filter((a) => a.projectId === projectId).map((a) => a.id)

    const upcoming = sortBy(
      milestones.filter(
        (m) => m.projectId === projectId && (m.status === 'upcoming' || m.status === 'in-progress'),
      ),
      (m) => m.date,
    )

    const done = project?.deliverables.filter((d) => d.done).length ?? 0
    const total = project?.deliverables.length ?? 0

    return {
      progress: total ? done / total : 0,
      budgetUsed: project?.budget ? (project.spent ?? 0) / project.budget : 0,
      daysRemaining: project ? daysFromToday(project.dueDate) : 0,
      openTasks: open.length,
      overdueTasks: open.filter((t) => t.dueDate && daysFromToday(t.dueDate) < 0).length,
      nextMilestone: upcoming[0],
      awaitingApproval: versions.filter(
        (v) => projectAssetIds.includes(v.assetId) && v.status === 'pending',
      ).length,
    }
  }, [project, projectId, tasks, milestones, assets, versions])
}

/** Projects that are actively being worked on, most urgent first. */
export function useActiveProjects(): Project[] {
  const projects = useStore((s) => s.projects)
  return useMemo(
    () =>
      sortBy(
        projects.filter((p) => !p.archived && p.stage !== 'complete'),
        (p) => p.dueDate,
      ),
    [projects],
  )
}

/* ----------------------------------------------------------- milestones -- */

export function useUpcomingMilestones(limit = 6): Array<Milestone & { project?: Project }> {
  const milestones = useStore((s) => s.milestones)
  const projects = useStore((s) => s.projects)
  return useMemo(() => {
    const relevant = milestones.filter((m) => m.status !== 'done')
    return sortBy(relevant, (m) => m.date)
      .slice(0, limit)
      .map((m) => ({ ...m, project: projects.find((p) => p.id === m.projectId) }))
  }, [milestones, projects, limit])
}

/* ---------------------------------------------------------------- deals -- */

export type PipelineSummary = {
  openValue: number
  weightedValue: number
  wonValue: number
  lostValue: number
  openCount: number
  winRate: number
  byStage: Array<{ id: ID; name: string; value: number; count: number; kind: string }>
}

export function usePipelineSummary(): PipelineSummary {
  const deals = useStore((s) => s.deals)
  const pipeline = useStore((s) => s.pipeline)

  return useMemo(() => {
    const stageKind = new Map(pipeline.map((p) => [p.id, p.kind]))
    const open = deals.filter((d) => stageKind.get(d.stageId) === 'open')
    const won = deals.filter((d) => stageKind.get(d.stageId) === 'won')
    const lost = deals.filter((d) => stageKind.get(d.stageId) === 'lost')
    const decided = won.length + lost.length

    return {
      openValue: sum(open.map((d) => d.value)),
      weightedValue: Math.round(sum(open.map((d) => (d.value * d.probability) / 100))),
      wonValue: sum(won.map((d) => d.value)),
      lostValue: sum(lost.map((d) => d.value)),
      openCount: open.length,
      winRate: decided ? (won.length / decided) * 100 : 0,
      byStage: sortBy(pipeline, (p) => p.order).map((stage) => {
        const stageDeals = deals.filter((d) => d.stageId === stage.id)
        return {
          id: stage.id,
          name: stage.name,
          value: sum(stageDeals.map((d) => d.value)),
          count: stageDeals.length,
          kind: stage.kind,
        }
      }),
    }
  }, [deals, pipeline])
}

/* ------------------------------------------------------------- approvals -- */

export type ReviewItem = {
  versionId: ID
  assetId: ID
  assetName: string
  projectId: ID
  projectName: string
  label: string
  status: ApprovalStatus
  createdAt: string
  ratio: number
  url?: string
  artSeed: string
  openComments: number
}

/** Every asset's latest version, newest first — the review queue. */
export function useReviewQueue(status?: ApprovalStatus[]): ReviewItem[] {
  const assets = useStore((s) => s.assets)
  const versions = useStore((s) => s.assetVersions)
  const projects = useStore((s) => s.projects)
  const comments = useStore((s) => s.comments)

  return useMemo(() => {
    const items: ReviewItem[] = []

    for (const asset of assets) {
      const version =
        versions.find((v) => v.id === asset.currentVersionId) ??
        sortBy(
          versions.filter((v) => v.assetId === asset.id),
          (v) => v.createdAt,
          -1,
        )[0]
      if (!version) continue
      const project = projects.find((p) => p.id === asset.projectId)
      items.push({
        versionId: version.id,
        assetId: asset.id,
        assetName: asset.name,
        projectId: asset.projectId,
        projectName: project?.name ?? 'Unknown project',
        label: version.label,
        status: version.status,
        createdAt: version.createdAt,
        ratio: version.ratio,
        url: version.url,
        artSeed: version.artSeed,
        openComments: comments.filter(
          (c) => c.targetType === 'assetVersion' && c.targetId === version.id && !c.resolved,
        ).length,
      })
    }

    const filtered = status ? items.filter((i) => status.includes(i.status)) : items
    return sortBy(filtered, (i) => i.createdAt, -1)
  }, [assets, versions, projects, comments, status?.join(',')])
}

/* -------------------------------------------------------------- activity -- */

export function useActivityFeed(
  filter: { projectId?: ID; contactId?: ID; companyId?: ID; dealId?: ID } = {},
  limit?: number,
): ActivityEvent[] {
  const activity = useStore((s) => s.activity)
  const contacts = useStore((s) => s.contacts)

  return useMemo(() => {
    let list = activity
    if (filter.projectId) list = list.filter((a) => a.links.projectId === filter.projectId)
    if (filter.dealId) list = list.filter((a) => a.links.dealId === filter.dealId)
    if (filter.contactId) list = list.filter((a) => a.links.contactId === filter.contactId)
    if (filter.companyId) {
      // A company's timeline includes anything touching one of its people.
      const peopleIds = contacts.filter((c) => c.companyId === filter.companyId).map((c) => c.id)
      list = list.filter(
        (a) =>
          a.links.companyId === filter.companyId ||
          (a.links.contactId && peopleIds.includes(a.links.contactId)),
      )
    }
    const sorted = sortBy(list, (a) => a.at, -1)
    return limit ? sorted.slice(0, limit) : sorted
  }, [activity, contacts, filter.projectId, filter.contactId, filter.companyId, filter.dealId, limit])
}

/** Communication that asked for something back and has not been cleared. */
export function useOpenFollowUps(): ActivityEvent[] {
  const activity = useStore((s) => s.activity)
  return useMemo(
    () =>
      sortBy(
        activity.filter((a) => a.followUpAt && !a.followUpDone),
        (a) => a.followUpAt!,
      ),
    [activity],
  )
}

/* -------------------------------------------------------------- workload -- */

export type Workload = {
  member: TeamMember
  open: number
  overdue: number
  projects: number
  /** Open tasks as a share of a nominal one-task-per-two-hours capacity. */
  load: number
}

export function useWorkload(): Workload[] {
  const team = useStore((s) => s.team)
  const tasks = useStore((s) => s.tasks)
  const projects = useStore((s) => s.projects)

  return useMemo(
    () =>
      team
        .filter((m) => m.active)
        .map((member) => {
          const open = tasks.filter((t) => t.assigneeId === member.id && t.status !== 'done')
          const nominal = Math.max(1, Math.round(member.capacity / 5))
          return {
            member,
            open: open.length,
            overdue: open.filter((t) => t.dueDate && daysFromToday(t.dueDate) < 0).length,
            projects: projects.filter(
              (p) => !p.archived && p.stage !== 'complete' && p.memberIds.includes(member.id),
            ).length,
            load: open.length / nominal,
          }
        })
        .sort((a, b) => b.load - a.load),
    [team, tasks, projects],
  )
}

/* --------------------------------------------------------------- clients -- */

/** Contacts we have not spoken to in a while — the nudge list. */
export function useStaleContacts(days = 21): Contact[] {
  const contacts = useStore((s) => s.contacts)
  return useMemo(
    () =>
      sortBy(
        contacts.filter((c) => daysFromToday(c.lastTouchedAt) < -days),
        (c) => c.lastTouchedAt,
      ),
    [contacts, days],
  )
}

/* ------------------------------------------------------------ dashboard -- */

export type PriorityAction = {
  id: string
  kind: 'task' | 'approval' | 'follow-up' | 'milestone' | 'deal'
  title: string
  context: string
  href: string
  urgency: 'overdue' | 'today' | 'soon'
}

/**
 * The dashboard's "do this next" list — pulled from every corner of the
 * workspace and ranked so the top of the list is genuinely the top priority.
 */
export function usePriorityActions(limit = 6): PriorityAction[] {
  const buckets = useTaskBuckets(true)
  const reviews = useReviewQueue(['pending'])
  const followUps = useOpenFollowUps()
  const milestones = useUpcomingMilestones(12)
  const projects = useStore((s) => s.projects)
  const deals = useStore((s) => s.deals)
  const pipeline = useStore((s) => s.pipeline)

  return useMemo(() => {
    const actions: PriorityAction[] = []
    const projectName = (id?: ID) => projects.find((p) => p.id === id)?.name ?? 'No project'

    for (const task of buckets.overdue) {
      actions.push({
        id: `task-${task.id}`,
        kind: 'task',
        title: task.title,
        context: task.projectId ? projectName(task.projectId) : 'Personal',
        href: '/tasks',
        urgency: 'overdue',
      })
    }
    for (const task of buckets.today) {
      actions.push({
        id: `task-${task.id}`,
        kind: 'task',
        title: task.title,
        context: task.projectId ? projectName(task.projectId) : 'Personal',
        href: '/tasks',
        urgency: 'today',
      })
    }
    for (const review of reviews) {
      actions.push({
        id: `review-${review.versionId}`,
        kind: 'approval',
        title: `Review ${review.assetName} ${review.label}`,
        context: review.projectName,
        href: `/approvals?asset=${review.assetId}`,
        urgency: 'today',
      })
    }
    for (const followUp of followUps) {
      const delta = daysFromToday(followUp.followUpAt!)
      actions.push({
        id: `follow-${followUp.id}`,
        kind: 'follow-up',
        title: `Follow up — ${followUp.subject}`,
        context: 'Communication',
        href: '/activity',
        urgency: delta < 0 ? 'overdue' : delta === 0 ? 'today' : 'soon',
      })
    }
    for (const milestone of milestones) {
      const delta = daysFromToday(milestone.date)
      if (delta > 3) continue
      actions.push({
        id: `ms-${milestone.id}`,
        kind: 'milestone',
        title: milestone.name,
        context: milestone.project?.name ?? 'Project',
        href: `/projects/${milestone.projectId}`,
        urgency: delta < 0 ? 'overdue' : delta === 0 ? 'today' : 'soon',
      })
    }
    const openStages = new Set(pipeline.filter((p) => p.kind === 'open').map((p) => p.id))
    for (const deal of deals) {
      if (!openStages.has(deal.stageId)) continue
      const delta = daysFromToday(deal.expectedCloseDate)
      if (delta > 7 || delta < -60) continue
      actions.push({
        id: `deal-${deal.id}`,
        kind: 'deal',
        title: `${deal.name} closes ${delta < 0 ? 'overdue' : 'soon'}`,
        context: 'Pipeline',
        href: `/deals/${deal.id}`,
        urgency: delta < 0 ? 'overdue' : 'soon',
      })
    }

    const rank = { overdue: 0, today: 1, soon: 2 }
    return actions.sort((a, b) => rank[a.urgency] - rank[b.urgency]).slice(0, limit)
  }, [buckets, reviews, followUps, milestones, projects, deals, pipeline, limit])
}
