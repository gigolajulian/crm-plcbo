import { useMemo } from 'react'
import { useStore } from './useStore'
import type {
  ActivityEvent,
  ApprovalStatus,
  Company,
  Contact,
  ID,
  Invoice,
  LeadSource,
  License,
  LineItem,
  LineItemKind,
  Milestone,
  PipelineStage,
  Shoot,
  StageKind,
  Task,
  TeamMember,
} from '@/data/types'
import { isClosed, isCommitted } from '@/data/pipeline'
import { daysFromToday, sortBy, sum } from '@/lib/utils'

/* ============================================================================
   Derived reads. Nothing here writes; every computed figure the UI shows
   (health, quoted value, balance due, workload, buckets) is defined once, here.
   ========================================================================== */

/** The one place money is turned into a number. */
export function lineItemsTotal(items: LineItem[]): number {
  return Math.round(sum(items.map((li) => li.qty * li.rate)) * 100) / 100
}

/**
 * A shoot's span on a timeline: from the enquiry landing to the date the job
 * is expected to close. The shoot days themselves sit inside that, which is
 * why they are drawn as marks rather than as the bar.
 */
export function shootStart(shoot: Shoot): string {
  const dates = [shoot.inquiredAt, ...shoot.shootDates.map((sd) => sd.date)].filter(Boolean)
  return dates.sort()[0] ?? shoot.createdAt
}

export function shootEnd(shoot: Shoot): string {
  const dates = [
    shoot.expectedCloseDate,
    shoot.deliveredAt,
    ...shoot.shootDates.map((sd) => sd.date),
  ].filter(Boolean) as string[]
  return dates.sort().at(-1) ?? shoot.expectedCloseDate
}

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

/** Stages still in play — everything that has not closed won or lost. */
export function useOpenStages(): PipelineStage[] {
  const pipeline = useStore((s) => s.pipeline)
  return useMemo(
    () => sortBy(pipeline.filter((p) => !isClosed(p.kind)), (p) => p.order),
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

export function useShoot(id?: ID): Shoot | undefined {
  return useStore((s) => (id ? s.shoots.find((p) => p.id === id) : undefined))
}

export function useInvoice(id?: ID): Invoice | undefined {
  return useStore((s) => (id ? s.invoices.find((i) => i.id === id) : undefined))
}

export function useLicense(id?: ID): License | undefined {
  return useStore((s) => (id ? s.licenses.find((l) => l.id === id) : undefined))
}

export function useStage(id?: ID): PipelineStage | undefined {
  return useStore((s) => (id ? s.pipeline.find((p) => p.id === id) : undefined))
}

export function useLeadSource(id?: ID): LeadSource | undefined {
  return useStore((s) => (id ? s.leadSources.find((l) => l.id === id) : undefined))
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

/* ---------------------------------------------------------------- money -- */

/**
 * Everything the deposit tracker needs, in one shape.
 *
 * `quoted` comes from the shoot's live line items; everything else comes from
 * the invoices, which each carry their own frozen copy. That separation is the
 * point: revising a quote changes what is still to bill, never what was billed.
 */
export type ShootMoney = {
  quoted: number
  depositTarget: number
  depositInvoiced: number
  depositReceived: number
  invoiced: number
  received: number
  /** Raised but not yet paid. */
  outstanding: number
  /** Agreed but not yet raised. */
  unbilled: number
  /** Everything still owed on the job, billed or not. */
  balanceDue: number
  overdue: Invoice[]
}

export function computeShootMoney(shoot: Shoot | undefined, invoices: Invoice[]): ShootMoney {
  const quoted = lineItemsTotal(shoot?.lineItems ?? [])
  const live = invoices.filter((inv) => inv.status !== 'void')
  const total = (list: Invoice[]) => sum(list.map((inv) => lineItemsTotal(inv.lineItems)))

  const invoiced = total(live)
  const received = total(live.filter((inv) => inv.status === 'paid'))
  const deposits = live.filter((inv) => inv.kind === 'deposit')

  return {
    quoted,
    depositTarget: Math.round(quoted * ((shoot?.depositPct ?? 0) / 100) * 100) / 100,
    depositInvoiced: total(deposits),
    depositReceived: total(deposits.filter((inv) => inv.status === 'paid')),
    invoiced,
    received,
    outstanding: Math.round((invoiced - received) * 100) / 100,
    unbilled: Math.round(Math.max(0, quoted - invoiced) * 100) / 100,
    balanceDue: Math.round(Math.max(0, quoted - received) * 100) / 100,
    overdue: live.filter(
      (inv) => inv.status === 'sent' && inv.dueAt && daysFromToday(inv.dueAt) < 0,
    ),
  }
}

export function useShootMoney(shootId: ID): ShootMoney {
  const shoot = useShoot(shootId)
  const invoices = useStore((s) => s.invoices)
  return useMemo(
    () => computeShootMoney(shoot, invoices.filter((inv) => inv.shootId === shootId)),
    [shoot, invoices, shootId],
  )
}

export function useShootInvoices(shootId: ID): Invoice[] {
  const invoices = useStore((s) => s.invoices)
  return useMemo(
    () => sortBy(invoices.filter((inv) => inv.shootId === shootId), (inv) => inv.issuedAt ?? inv.createdAt, -1),
    [invoices, shootId],
  )
}

/** Every invoice raised and not settled, oldest due date first. */
export function useOutstandingInvoices(): Invoice[] {
  const invoices = useStore((s) => s.invoices)
  return useMemo(
    () => sortBy(invoices.filter((inv) => inv.status === 'sent'), (inv) => inv.dueAt ?? '9999-12-31'),
    [invoices],
  )
}

/* --------------------------------------------------------------- shoots -- */

export type ShootVitals = {
  /** 0–1 share of contracted deliverables actually delivered. */
  progress: number
  /** 0–1 share of the quote already received. */
  collected: number
  daysRemaining: number
  openTasks: number
  overdueTasks: number
  nextMilestone?: Milestone
  nextShootDate?: string
  awaitingApproval: number
  money: ShootMoney
  /** True once every included revision round has been used up. */
  revisionsExhausted: boolean
}

export function useShootVitals(shootId: ID): ShootVitals {
  const shoot = useShoot(shootId)
  const tasks = useStore((s) => s.tasks)
  const milestones = useStore((s) => s.milestones)
  const assets = useStore((s) => s.assets)
  const versions = useStore((s) => s.assetVersions)
  const invoices = useStore((s) => s.invoices)

  return useMemo(() => {
    const shootTasks = tasks.filter((t) => t.shootId === shootId)
    const open = shootTasks.filter((t) => t.status !== 'done')
    const shootAssetIds = assets.filter((a) => a.shootId === shootId).map((a) => a.id)

    const upcoming = sortBy(
      milestones.filter(
        (m) => m.shootId === shootId && (m.status === 'upcoming' || m.status === 'in-progress'),
      ),
      (m) => m.date,
    )

    const contracted = sum((shoot?.deliverables ?? []).map((dv) => dv.contracted))
    const delivered = sum((shoot?.deliverables ?? []).map((dv) => dv.delivered))
    const money = computeShootMoney(shoot, invoices.filter((inv) => inv.shootId === shootId))

    const nextDate = sortBy(
      (shoot?.shootDates ?? []).filter((sd) => daysFromToday(sd.date) >= 0),
      (sd) => sd.date,
    )[0]

    return {
      progress: contracted ? delivered / contracted : 0,
      collected: money.quoted ? money.received / money.quoted : 0,
      daysRemaining: shoot ? daysFromToday(shoot.expectedCloseDate) : 0,
      openTasks: open.length,
      overdueTasks: open.filter((t) => t.dueDate && daysFromToday(t.dueDate) < 0).length,
      nextMilestone: upcoming[0],
      nextShootDate: nextDate?.date,
      awaitingApproval: versions.filter(
        (v) => shootAssetIds.includes(v.assetId) && v.status === 'pending',
      ).length,
      money,
      revisionsExhausted: (shoot?.deliverables ?? []).some(
        (dv) => dv.revisionsIncluded > 0 && dv.revisionsUsed >= dv.revisionsIncluded,
      ),
    }
  }, [shoot, shootId, tasks, milestones, assets, versions, invoices])
}

/** Shoots still in play, most urgent first. */
export function useActiveShoots(): Shoot[] {
  const shoots = useStore((s) => s.shoots)
  const pipeline = useStore((s) => s.pipeline)
  return useMemo(() => {
    const closed = new Set(pipeline.filter((p) => isClosed(p.kind)).map((p) => p.id))
    return sortBy(
      shoots.filter((p) => !p.archived && !closed.has(p.stageId)),
      (p) => p.expectedCloseDate,
    )
  }, [shoots, pipeline])
}

/** Shoot days coming up, so the calendar and dashboard agree on what is next. */
export function useUpcomingShootDates(limit = 6): Array<{
  shoot: Shoot
  date: string
  callTime?: string
  tentative: boolean
  outdoor: boolean
}> {
  const shoots = useStore((s) => s.shoots)
  return useMemo(() => {
    const rows = shoots.flatMap((shoot) =>
      shoot.shootDates
        .filter((sd) => daysFromToday(sd.date) >= 0)
        .map((sd) => ({
          shoot,
          date: sd.date,
          callTime: sd.callTime,
          tentative: sd.tentative,
          outdoor: sd.outdoor,
        })),
    )
    return sortBy(rows, (r) => r.date).slice(0, limit)
  }, [shoots, limit])
}

/* ----------------------------------------------------------- milestones -- */

export function useUpcomingMilestones(limit = 6): Array<Milestone & { shoot?: Shoot }> {
  const milestones = useStore((s) => s.milestones)
  const shoots = useStore((s) => s.shoots)
  return useMemo(() => {
    const relevant = milestones.filter((m) => m.status !== 'done')
    return sortBy(relevant, (m) => m.date)
      .slice(0, limit)
      .map((m) => ({ ...m, shoot: shoots.find((p) => p.id === m.shootId) }))
  }, [milestones, shoots, limit])
}

/* ------------------------------------------------------------- lifecycle -- */

export type PipelineSummary = {
  /** Quoted but not yet committed — the forecast. */
  openValue: number
  weightedValue: number
  /** Deposit taken or beyond: money the studio can count on. */
  committedValue: number
  wonValue: number
  lostValue: number
  openCount: number
  winRate: number
  byStage: Array<{ id: ID; name: string; value: number; count: number; kind: StageKind }>
}

export function usePipelineSummary(): PipelineSummary {
  const shoots = useStore((s) => s.shoots)
  const pipeline = useStore((s) => s.pipeline)

  return useMemo(() => {
    const kindOf = new Map(pipeline.map((p) => [p.id, p.kind]))
    const valueOf = (shoot: Shoot) => lineItemsTotal(shoot.lineItems)
    const inKind = (...kinds: StageKind[]) =>
      shoots.filter((shoot) => {
        const kind = kindOf.get(shoot.stageId)
        return kind !== undefined && kinds.includes(kind)
      })

    const open = inKind('lead', 'quoted')
    const committed = shoots.filter((shoot) => {
      const kind = kindOf.get(shoot.stageId)
      return kind !== undefined && isCommitted(kind)
    })
    const won = inKind('won')
    const lost = inKind('lost')
    const decided = committed.length + lost.length

    return {
      openValue: sum(open.map(valueOf)),
      weightedValue: Math.round(sum(open.map((s) => (valueOf(s) * s.probability) / 100))),
      committedValue: sum(committed.map(valueOf)),
      wonValue: sum(won.map(valueOf)),
      lostValue: sum(lost.map(valueOf)),
      openCount: open.length,
      winRate: decided ? (committed.length / decided) * 100 : 0,
      byStage: sortBy(pipeline, (p) => p.order).map((stage) => {
        const stageShoots = shoots.filter((shoot) => shoot.stageId === stage.id)
        return {
          id: stage.id,
          name: stage.name,
          value: sum(stageShoots.map(valueOf)),
          count: stageShoots.length,
          kind: stage.kind,
        }
      }),
    }
  }, [shoots, pipeline])
}

/* ------------------------------------------------------- quote follow-ups -- */

/** The nudge schedule. Three days, a week, a fortnight — then stop. */
const FOLLOW_UP_STEPS = [3, 7, 14]

export type StaleQuote = {
  shoot: Shoot
  /** Days since the quote went out. */
  age: number
  /** Which nudge is due: 1, 2 or 3. */
  step: number
  /** True once the last scheduled nudge has passed with no reply. */
  exhausted: boolean
}

/**
 * Quotes that have gone quiet.
 *
 * A shoot qualifies when it is sitting in a `quoted` stage, the quote went out
 * at least three days ago, and nothing has come back from the client since.
 * The result is a prompt to write a follow-up — never a sent message.
 */
export function useStaleQuotes(): StaleQuote[] {
  const shoots = useStore((s) => s.shoots)
  const pipeline = useStore((s) => s.pipeline)
  const activity = useStore((s) => s.activity)

  return useMemo(() => {
    const quotedStages = new Set(
      pipeline.filter((p) => p.kind === 'quoted').map((p) => p.id),
    )

    const rows: StaleQuote[] = []
    for (const shoot of shoots) {
      if (!quotedStages.has(shoot.stageId) || !shoot.quotedAt) continue

      const age = -daysFromToday(shoot.quotedAt)
      if (age < FOLLOW_UP_STEPS[0]) continue

      // Anything inbound since the quote means the ball is back with us.
      const replied = activity.some(
        (event) =>
          event.links.shootId === shoot.id &&
          event.direction === 'inbound' &&
          event.at >= shoot.quotedAt!,
      )
      if (replied) continue

      const passed = FOLLOW_UP_STEPS.filter((step) => age >= step)
      rows.push({
        shoot,
        age,
        step: passed.length,
        exhausted: passed.length >= FOLLOW_UP_STEPS.length,
      })
    }
    return sortBy(rows, (r) => -r.age)
  }, [shoots, pipeline, activity])
}

/* --------------------------------------------------------------- licences -- */

export type ExpiringLicense = {
  license: License
  shoot?: Shoot
  /** Days until it lapses; negative once it already has. */
  daysLeft: number
}

/**
 * Licences inside the renewal window, soonest first.
 *
 * Sixty days is the default because that is roughly how long a renewal
 * conversation takes to have — long enough to be a conversation rather than a
 * scramble.
 */
export function useExpiringLicenses(withinDays = 60): ExpiringLicense[] {
  const licenses = useStore((s) => s.licenses)
  const shoots = useStore((s) => s.shoots)

  return useMemo(() => {
    const rows = licenses
      .filter((license) => license.status === 'active' || license.status === 'expiring')
      .map((license) => ({
        license,
        shoot: shoots.find((s) => s.id === license.shootId),
        daysLeft: daysFromToday(license.endDate),
      }))
      .filter((row) => row.daysLeft <= withinDays)
    return sortBy(rows, (row) => row.daysLeft)
  }, [licenses, shoots, withinDays])
}

/** Client galleries about to disappear — worth a warning before they do. */
export function useExpiringGalleries(withinDays = 14): Array<{ shoot: Shoot; daysLeft: number }> {
  const shoots = useStore((s) => s.shoots)
  return useMemo(() => {
    const rows = shoots
      .filter((shoot) => shoot.galleryUrl && shoot.galleryExpiresAt)
      .map((shoot) => ({ shoot, daysLeft: daysFromToday(shoot.galleryExpiresAt!) }))
      .filter((row) => row.daysLeft <= withinDays && row.daysLeft >= -7)
    return sortBy(rows, (row) => row.daysLeft)
  }, [shoots, withinDays])
}

/* ------------------------------------------------------------- reporting -- */

/** Revenue split by what was actually sold — licensing is the number to watch. */
export function useRevenueByKind(): Array<{ kind: LineItemKind; value: number; share: number }> {
  const shoots = useStore((s) => s.shoots)
  const pipeline = useStore((s) => s.pipeline)

  return useMemo(() => {
    const kindOf = new Map(pipeline.map((p) => [p.id, p.kind]))
    const counted = shoots.filter((shoot) => {
      const kind = kindOf.get(shoot.stageId)
      return kind !== undefined && isCommitted(kind)
    })

    const totals = new Map<LineItemKind, number>()
    for (const shoot of counted) {
      for (const item of shoot.lineItems) {
        totals.set(item.kind, (totals.get(item.kind) ?? 0) + item.qty * item.rate)
      }
    }
    const grand = sum([...totals.values()])
    return (['shoot-fee', 'post', 'licensing', 'studio'] as LineItemKind[]).map((kind) => {
      const value = totals.get(kind) ?? 0
      return { kind, value, share: grand ? value / grand : 0 }
    })
  }, [shoots, pipeline])
}

/** Which sources actually turn into work, rather than which produce noise. */
export function useLeadSourcePerformance(): Array<{
  source: LeadSource
  enquiries: number
  booked: number
  lost: number
  conversion: number
  value: number
}> {
  const shoots = useStore((s) => s.shoots)
  const pipeline = useStore((s) => s.pipeline)
  const leadSources = useStore((s) => s.leadSources)

  return useMemo(() => {
    const kindOf = new Map(pipeline.map((p) => [p.id, p.kind]))
    return sortBy(
      leadSources.map((source) => {
        const mine = shoots.filter((shoot) => shoot.leadSourceId === source.id)
        const booked = mine.filter((shoot) => {
          const kind = kindOf.get(shoot.stageId)
          return kind !== undefined && isCommitted(kind)
        })
        const lost = mine.filter((shoot) => kindOf.get(shoot.stageId) === 'lost')
        const decided = booked.length + lost.length
        return {
          source,
          enquiries: mine.length,
          booked: booked.length,
          lost: lost.length,
          conversion: decided ? (booked.length / decided) * 100 : 0,
          value: sum(booked.map((shoot) => lineItemsTotal(shoot.lineItems))),
        }
      }),
      (row) => -row.value,
    )
  }, [shoots, pipeline, leadSources])
}

/** Promised turnaround against what actually happened, by shoot type. */
export function useTurnaround(): Array<{
  shoot: Shoot
  promised: number
  actual: number
  delta: number
}> {
  const shoots = useStore((s) => s.shoots)
  return useMemo(() => {
    const rows = shoots
      .filter((shoot) => shoot.deliveredAt && shoot.promisedTurnaroundDays && shoot.shootDates.length)
      .map((shoot) => {
        const last = sortBy(shoot.shootDates, (sd) => sd.date, -1)[0]
        const actual = Math.round(
          (new Date(shoot.deliveredAt!).getTime() - new Date(last.date).getTime()) / 86400000,
        )
        const promised = shoot.promisedTurnaroundDays!
        return { shoot, promised, actual, delta: actual - promised }
      })
    return sortBy(rows, (row) => -row.delta)
  }, [shoots])
}

/* ------------------------------------------------------------- approvals -- */

export type ReviewItem = {
  versionId: ID
  assetId: ID
  assetName: string
  shootId: ID
  shootName: string
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
  const shoots = useStore((s) => s.shoots)
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
      const shoot = shoots.find((p) => p.id === asset.shootId)
      items.push({
        versionId: version.id,
        assetId: asset.id,
        assetName: asset.name,
        shootId: asset.shootId,
        shootName: shoot?.name ?? 'Unknown shoot',
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
  }, [assets, versions, shoots, comments, status?.join(',')])
}

/* -------------------------------------------------------------- activity -- */

export function useActivityFeed(
  filter: { shootId?: ID; contactId?: ID; companyId?: ID } = {},
  limit?: number,
): ActivityEvent[] {
  const activity = useStore((s) => s.activity)
  const contacts = useStore((s) => s.contacts)

  return useMemo(() => {
    let list = activity
    if (filter.shootId) list = list.filter((a) => a.links.shootId === filter.shootId)
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
  }, [activity, contacts, filter.shootId, filter.contactId, filter.companyId, limit])
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
  shoots: number
  /** Open tasks as a share of a nominal one-task-per-two-hours capacity. */
  load: number
}

export function useWorkload(): Workload[] {
  const team = useStore((s) => s.team)
  const tasks = useStore((s) => s.tasks)
  const shoots = useStore((s) => s.shoots)
  const pipeline = useStore((s) => s.pipeline)

  return useMemo(() => {
    const closed = new Set(pipeline.filter((p) => isClosed(p.kind)).map((p) => p.id))
    return team
      .filter((m) => m.active)
      .map((member) => {
        const open = tasks.filter((t) => t.assigneeId === member.id && t.status !== 'done')
        const nominal = Math.max(1, Math.round(member.capacity / 5))
        return {
          member,
          open: open.length,
          overdue: open.filter((t) => t.dueDate && daysFromToday(t.dueDate) < 0).length,
          shoots: shoots.filter(
            (p) => !p.archived && !closed.has(p.stageId) && p.memberIds.includes(member.id),
          ).length,
          load: open.length / nominal,
        }
      })
      .sort((a, b) => b.load - a.load)
  }, [team, tasks, shoots, pipeline])
}

/* --------------------------------------------------------------- clients -- */

/**
 * Clients who have gone quiet.
 *
 * Six months is the photography default rather than three weeks: a client who
 * books once a year is not neglected at day 22, but at six months of silence a
 * relationship is genuinely cooling and a rebooking note is worth writing.
 */
export function useStaleContacts(days = 180): Contact[] {
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
  kind: 'task' | 'approval' | 'follow-up' | 'milestone' | 'quote' | 'licence' | 'invoice' | 'gallery'
  title: string
  context: string
  href: string
  urgency: 'overdue' | 'today' | 'soon'
}

/**
 * The dashboard's "do this next" list — pulled from every corner of the
 * workspace and ranked so the top of the list is genuinely the top priority.
 *
 * The money items sort first among equals: an unpaid deposit on a shoot that
 * is eight days out is a more expensive problem than an unread comment.
 */
export function usePriorityActions(limit = 6): PriorityAction[] {
  const buckets = useTaskBuckets(true)
  const reviews = useReviewQueue(['pending'])
  const followUps = useOpenFollowUps()
  const milestones = useUpcomingMilestones(12)
  const staleQuotes = useStaleQuotes()
  const expiring = useExpiringLicenses(60)
  const galleries = useExpiringGalleries(14)
  const outstanding = useOutstandingInvoices()
  const shoots = useStore((s) => s.shoots)

  return useMemo(() => {
    const actions: PriorityAction[] = []
    const shootName = (id?: ID) => shoots.find((p) => p.id === id)?.name ?? 'No shoot'

    for (const invoice of outstanding) {
      if (!invoice.dueAt) continue
      const delta = daysFromToday(invoice.dueAt)
      if (delta > 7) continue
      actions.push({
        id: `inv-${invoice.id}`,
        kind: 'invoice',
        title:
          delta < 0
            ? `Invoice ${invoice.number} is ${-delta} ${-delta === 1 ? 'day' : 'days'} overdue`
            : `Invoice ${invoice.number} due in ${delta} ${delta === 1 ? 'day' : 'days'}`,
        context: shootName(invoice.shootId),
        href: `/billing?invoice=${invoice.id}`,
        urgency: delta < 0 ? 'overdue' : delta === 0 ? 'today' : 'soon',
      })
    }

    for (const row of expiring) {
      actions.push({
        id: `lic-${row.license.id}`,
        kind: 'licence',
        title:
          row.daysLeft < 0
            ? `Licence lapsed — ${row.license.name}`
            : `Licence ends in ${row.daysLeft} ${row.daysLeft === 1 ? 'day' : 'days'}`,
        context: row.shoot?.name ?? row.license.name,
        href: `/licences?licence=${row.license.id}`,
        urgency: row.daysLeft < 0 ? 'overdue' : row.daysLeft <= 14 ? 'today' : 'soon',
      })
    }

    for (const quote of staleQuotes) {
      actions.push({
        id: `quote-${quote.shoot.id}`,
        kind: 'quote',
        title: `Quote unanswered for ${quote.age} days`,
        context: quote.shoot.name,
        href: `/shoots/${quote.shoot.id}`,
        urgency: quote.exhausted ? 'overdue' : 'today',
      })
    }

    for (const task of buckets.overdue) {
      actions.push({
        id: `task-${task.id}`,
        kind: 'task',
        title: task.title,
        context: task.shootId ? shootName(task.shootId) : 'Personal',
        href: '/tasks',
        urgency: 'overdue',
      })
    }
    for (const task of buckets.today) {
      actions.push({
        id: `task-${task.id}`,
        kind: 'task',
        title: task.title,
        context: task.shootId ? shootName(task.shootId) : 'Personal',
        href: '/tasks',
        urgency: 'today',
      })
    }

    for (const row of galleries) {
      actions.push({
        id: `gal-${row.shoot.id}`,
        kind: 'gallery',
        title:
          row.daysLeft < 0
            ? `Gallery expired — ${row.shoot.name}`
            : `Gallery expires in ${row.daysLeft} ${row.daysLeft === 1 ? 'day' : 'days'}`,
        context: row.shoot.name,
        href: `/shoots/${row.shoot.id}`,
        urgency: row.daysLeft < 0 ? 'overdue' : 'soon',
      })
    }

    for (const review of reviews) {
      actions.push({
        id: `review-${review.versionId}`,
        kind: 'approval',
        title: `Review ${review.assetName} ${review.label}`,
        context: review.shootName,
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
        context: milestone.shoot?.name ?? 'Shoot',
        href: `/shoots/${milestone.shootId}`,
        urgency: delta < 0 ? 'overdue' : delta === 0 ? 'today' : 'soon',
      })
    }

    const rank = { overdue: 0, today: 1, soon: 2 }
    // Money first when two items are equally urgent — it is the more expensive
    // thing to have forgotten.
    const kindRank: Record<PriorityAction['kind'], number> = {
      invoice: 0,
      licence: 1,
      quote: 2,
      task: 3,
      milestone: 4,
      gallery: 5,
      approval: 6,
      'follow-up': 7,
    }
    return actions
      .sort((a, b) => rank[a.urgency] - rank[b.urgency] || kindRank[a.kind] - kindRank[b.kind])
      .slice(0, limit)
  }, [buckets, reviews, followUps, milestones, staleQuotes, expiring, galleries, outstanding, shoots, limit])
}
