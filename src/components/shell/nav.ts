import {
  Activity,
  Camera,
  CheckSquare,
  Receipt,
  Scale,
  LayoutGrid,
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
  { to: '/shoots', label: 'Shoots', icon: Camera, key: 'p', group: 'work' },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare, key: 't', group: 'work' },
  { to: '/approvals', label: 'Approvals', icon: Stamp, key: 'r', group: 'work' },
  { to: '/billing', label: 'Billing', icon: Receipt, key: 'b', group: 'work' },
  { to: '/licences', label: 'Licences', icon: Scale, key: 'l', group: 'work' },
  { to: '/contacts', label: 'Clients', icon: Users, key: 'c', group: 'relationships' },
  { to: '/activity', label: 'Activity', icon: Activity, key: 'a', group: 'relationships' },
  { to: '/reports', label: 'Reports', icon: PieChart, key: 'e', group: 'studio' },
  { to: '/settings', label: 'Settings', icon: Settings, key: 's', group: 'studio' },
]

/**
 * The five that fit on a phone. Written as an ordered list rather than a
 * filter over NAV so the order is deliberate — and so a renamed route shows up
 * as an empty tab bar in review rather than silently dropping an item, which is
 * exactly what happened when projects and deals became shoots.
 */
const MOBILE_ROUTES = ['/', '/shoots', '/tasks', '/billing', '/contacts']

export const MOBILE_NAV = MOBILE_ROUTES.map(
  (route) => NAV.find((item) => item.to === route)!,
).filter(Boolean)
