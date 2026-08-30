import {
  Activity,
  Briefcase,
  CheckSquare,
  Handshake,
  LayoutGrid,
  Images,
  PieChart,
  Settings,
  Stamp,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Shortcut shown in the tooltip and honoured by the "g" chord. */
  key: string
  group: 'work' | 'relationships' | 'studio'
}

/**
 * One nav definition, consumed by the desktop rail, the mobile tab bar and
 * the command palette — so a new section appears in all three at once.
 */
export const NAV: NavItem[] = [
  { to: '/', label: 'Today', icon: LayoutGrid, key: 'h', group: 'work' },
  { to: '/projects', label: 'Projects', icon: Briefcase, key: 'p', group: 'work' },
  { to: '/moodboards', label: 'Moodboards', icon: Images, key: 'm', group: 'work' },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare, key: 't', group: 'work' },
  { to: '/approvals', label: 'Approvals', icon: Stamp, key: 'r', group: 'work' },
  { to: '/deals', label: 'Pipeline', icon: Handshake, key: 'd', group: 'relationships' },
  { to: '/contacts', label: 'Clients', icon: Users, key: 'c', group: 'relationships' },
  { to: '/activity', label: 'Activity', icon: Activity, key: 'a', group: 'relationships' },
  { to: '/reports', label: 'Reports', icon: PieChart, key: 'e', group: 'studio' },
  { to: '/settings', label: 'Settings', icon: Settings, key: 's', group: 'studio' },
]

/** The five that fit on a phone. */
export const MOBILE_NAV = NAV.filter((item) =>
  ['/', '/projects', '/tasks', '/deals', '/contacts'].includes(item.to),
)
