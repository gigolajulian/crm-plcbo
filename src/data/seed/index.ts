import type { Database } from '../types'
import {
  companies,
  contacts,
  CURRENT_USER_ID,
  customFields,
  notifications,
  pipeline,
  tags,
  team,
} from './core'
import { milestones, projects } from './projects'
import { moodboards, moodItems, moodSections } from './moodboards'
import { activity, assets, assetVersions, comments, deals, tasks } from './work'

/**
 * Builds a fresh copy of the demo database.
 *
 * Called on first run and whenever the user resets demo data from Settings.
 * Returns a deep clone so nothing in the store can mutate the module-level
 * seed arrays and quietly corrupt the next reset.
 */
export function createSeedDatabase(): Database {
  const db: Database = {
    team,
    companies,
    contacts,
    projects,
    milestones,
    tasks,
    deals,
    pipeline,
    moodboards,
    moodSections,
    moodItems,
    assets,
    assetVersions,
    comments,
    activity,
    tags,
    customFields,
    savedViews: [
      {
        id: 'sv_at_risk',
        scope: 'projects',
        name: 'Needs attention',
        filters: { health: ['at-risk', 'blocked'] },
        sort: 'due-asc',
        layout: 'list',
      },
      {
        id: 'sv_in_flight',
        scope: 'projects',
        name: 'In production',
        filters: { stage: ['production', 'review'] },
        sort: 'due-asc',
        layout: 'gallery',
      },
      {
        id: 'sv_closing',
        scope: 'deals',
        name: 'Closing this quarter',
        filters: { stage: ['ps_proposal', 'ps_negotiation'] },
        sort: 'value-desc',
        layout: 'list',
      },
      {
        id: 'sv_my_week',
        scope: 'tasks',
        name: 'My week',
        filters: { assignee: [CURRENT_USER_ID] },
        sort: 'due-asc',
      },
    ],
    settings: {
      theme: 'light',
      density: 'comfortable',
      notifications,
      currentUserId: CURRENT_USER_ID,
    },
  }

  return structuredClone(db)
}

export { CURRENT_USER_ID }
