import { useEffect, useRef, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Plus, Search } from 'lucide-react'
import { BRAND } from '@/lib/brand'
import { cn } from '@/lib/utils'
import { useHotkey, isTypingTarget, modKey } from '@/lib/hotkeys'
import { useStore } from '@/store/useStore'
import { useUI } from '@/store/useUI'
import {
  useActiveTeam,
  useCurrentUser,
  useOpenFollowUps,
  useTaskBuckets,
} from '@/store/selectors'
import { Avatar } from '@/components/ui/Avatar'
import { IconButton, Kbd } from '@/components/ui/primitives'
import { Tooltip } from '@/components/ui/overlay'
import { Toaster } from '@/components/ui/feedback'
import { MOBILE_NAV, NAV } from './nav'
import { CommandPalette } from './CommandPalette'
import { QuickAdd } from './QuickAdd'
import { Logo } from './Logo'
import { Onboarding } from '@/features/onboarding/Onboarding'

/* ============================================================================
   APP SHELL
   Desktop: a slim icon rail plus a top bar.
   Tablet:  the same rail, condensed top bar.
   Mobile:  the rail becomes a bottom tab bar and the top bar compacts.
   ========================================================================== */

export function AppShell({ children }: { children: ReactNode }) {
  const paletteOpen = useUI((s) => s.palette)
  const openPalette = useUI((s) => s.openPalette)
  const closePalette = useUI((s) => s.closePalette)
  const quickAddMode = useUI((s) => s.quickAdd)
  const openQuickAdd = useUI((s) => s.openQuickAdd)
  const closeQuickAdd = useUI((s) => s.closeQuickAdd)
  const location = useLocation()
  const navigate = useNavigate()
  const theme = useStore((s) => s.settings.theme)
  const accent = useStore((s) => s.settings.workspace.accent)
  const onboarded = useStore((s) => s.settings.workspace.onboarded)
  const studioName = useStore((s) => s.settings.workspace.name)

  /* Theme is a class on <html> so every token swap is a single repaint. */
  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    function apply() {
      const dark = theme === 'dark' || (theme === 'system' && media.matches)
      root.classList.toggle('dark', dark)
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', dark ? '#111110' : '#E7E7E5')
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])

  /* The accent is a data attribute so its light and dark values stay in CSS. */
  useEffect(() => {
    document.documentElement.dataset.accent = accent
  }, [accent])

  /* The document title follows the studio's own name. */
  useEffect(() => {
    document.title = studioName ? `${studioName} — ${BRAND.product}` : BRAND.full
  }, [studioName])

  useHotkey('mod+k', () => openPalette(), { allowInInput: true })
  useHotkey('c', () => openQuickAdd('task'))
  useHotkey('/', () => openPalette())

  /* "g" then a letter jumps to a section — the standard power-user chord. */
  useEffect(() => {
    let armed = false
    let timer = 0
    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return
      if (armed) {
        const match = NAV.find((item) => item.key === event.key.toLowerCase())
        armed = false
        window.clearTimeout(timer)
        if (match) {
          event.preventDefault()
          navigate(match.to)
        }
        return
      }
      if (event.key.toLowerCase() === 'g') {
        armed = true
        timer = window.setTimeout(() => {
          armed = false
        }, 1400)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.clearTimeout(timer)
    }
  }, [navigate])

  /*
   * Move focus to the main region when the route changes, so a keyboard user
   * lands in the new content rather than back at the top of the rail. Skipped
   * on the very first render — otherwise the skip link, which should be the
   * first thing Tab reaches, becomes unreachable.
   */
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    document.getElementById('main')?.focus({ preventScroll: true })
  }, [location.pathname])

  /* Setup owns the whole screen until it has been completed once. */
  if (!onboarded) return <Onboarding />

  return (
    <div className="min-h-dvh bg-canvas">
      <a
        href="#main"
        className="sr-only-focusable fixed top-3 left-3 z-[70] rounded-pill bg-inverse px-4 py-2 text-base font-medium text-on-inverse"
      >
        Skip to content
      </a>

      <IconRail />
      <TopBar onSearch={openPalette} onQuickAdd={() => openQuickAdd()} />

      <main
        id="main"
        tabIndex={-1}
        className={cn(
          'mx-auto max-w-[1600px] outline-none',
          'px-4 pt-4 pb-28 sm:px-6 lg:px-8 lg:pt-6 lg:pb-16 lg:pl-[100px]',
        )}
      >
        {children}
      </main>

      <MobileTabBar onQuickAdd={() => openQuickAdd()} />

      <CommandPalette open={paletteOpen} onClose={closePalette} />
      <QuickAdd mode={quickAddMode} onClose={closeQuickAdd} />
      <Toaster />
    </div>
  )
}

/* ------------------------------------------------------------- IconRail -- */

function IconRail() {
  const groups: Array<NavItemGroup> = [
    { id: 'work', items: NAV.filter((i) => i.group === 'work') },
    { id: 'relationships', items: NAV.filter((i) => i.group === 'relationships') },
    { id: 'studio', items: NAV.filter((i) => i.group === 'studio') },
  ]

  return (
    <nav
      aria-label="Sections"
      className="fixed top-0 bottom-0 left-0 z-30 hidden w-[76px] flex-col items-center gap-6 py-5 lg:flex"
    >
      <Link
        to="/"
        aria-label={`${BRAND.full} home`}
        className="transition-transform duration-base ease-out-soft hover:scale-105"
      >
        <Logo size={40} />
      </Link>

      <div className="flex flex-1 flex-col items-center gap-5 overflow-y-auto no-scrollbar">
        {groups.map((group, index) => (
          <div key={group.id} className="flex flex-col items-center gap-1.5">
            {index > 0 && <span className="mb-2 h-px w-6 bg-line" aria-hidden />}
            {group.items.map((item) => (
              <RailLink key={item.to} item={item} />
            ))}
          </div>
        ))}
      </div>
    </nav>
  )
}

type NavItemGroup = { id: string; items: typeof NAV }

function RailLink({ item }: { item: (typeof NAV)[number] }) {
  const Icon = item.icon
  return (
    <Tooltip label={`${item.label}  ·  G then ${item.key.toUpperCase()}`} side="right">
      <NavLink
        to={item.to}
        end={item.to === '/'}
        className={({ isActive }) =>
          cn(
            'grid size-11 place-items-center rounded-full',
            'transition-[background-color,color,box-shadow] duration-base ease-out-soft',
            isActive
              ? 'bg-inverse text-on-inverse shadow-sm'
              : 'text-ink-muted hover:bg-raised hover:text-ink hover:shadow-xs',
          )
        }
      >
        <Icon size={19} strokeWidth={1.6} aria-hidden />
        <span className="sr-only-focusable absolute">{item.label}</span>
      </NavLink>
    </Tooltip>
  )
}

/* --------------------------------------------------------------- TopBar -- */

function TopBar({ onSearch, onQuickAdd }: { onSearch: () => void; onQuickAdd: () => void }) {
  const user = useCurrentUser()
  const team = useActiveTeam()
  const buckets = useTaskBuckets(true)
  const followUps = useOpenFollowUps()
  const alerts = buckets.overdue.length + followUps.length

  return (
    <header className="sticky top-0 z-20 bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8 lg:pl-[100px]">
        <Link to="/" className="lg:hidden" aria-label={`${BRAND.full} home`}>
          <Logo size={34} />
        </Link>

        <button
          type="button"
          onClick={onSearch}
          className={cn(
            // min-w-0 lets the button shrink below its label's min-content
            // width, which is what keeps the bar inside a 375px viewport.
            'group flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-pill bg-raised pr-2 pl-4 text-left shadow-xs',
            'transition-shadow duration-fast ease-out-soft hover:shadow-sm sm:max-w-md',
          )}
        >
          <Search size={16} className="shrink-0 text-ink-faint" aria-hidden />
          <span className="flex-1 truncate text-base text-ink-faint">
            Search shoots, clients, invoices…
          </span>
          <span className="hidden shrink-0 sm:block">
            <Kbd>{modKey()}K</Kbd>
          </span>
        </button>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center xl:flex">
            <div className="flex -space-x-2">
              {team.slice(0, 4).map((member) => (
                <Avatar key={member.id} name={member.name} src={member.avatar} size="sm" ring />
              ))}
              {team.length > 4 && (
                <span className="grid size-8 place-items-center rounded-full bg-inverse text-2xs font-medium text-on-inverse ring-2 ring-canvas">
                  +{team.length - 4}
                </span>
              )}
            </div>
          </div>

          <Link
            to="/tasks"
            className="relative grid size-10 shrink-0 place-items-center rounded-full bg-raised text-ink shadow-sm transition-colors duration-fast hover:bg-surface-hover"
            aria-label={
              alerts > 0
                ? `Notifications, ${alerts} needing attention`
                : 'Notifications, nothing needs attention'
            }
          >
            <Bell size={17} strokeWidth={1.7} aria-hidden />
            {alerts > 0 && (
              <span
                className="absolute top-1.5 right-1.5 size-2 rounded-full bg-lime ring-2 ring-raised"
                aria-hidden
              />
            )}
          </Link>

          <IconButton label="Quick add" variant="primary" onClick={onQuickAdd}>
            <Plus size={18} />
          </IconButton>

          <Link to="/settings" aria-label="Your profile and settings" className="ml-0.5">
            <Avatar name={user.name} src={user.avatar} size="md" />
          </Link>
        </div>
      </div>
    </header>
  )
}

/* -------------------------------------------------------- MobileTabBar -- */

function MobileTabBar({ onQuickAdd }: { onQuickAdd: () => void }) {
  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line-soft bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="flex items-stretch justify-around px-1">
        {MOBILE_NAV.slice(0, 2).map((item) => (
          <MobileTab key={item.to} item={item} />
        ))}

        <li className="flex items-center px-1">
          <IconButton label="Quick add" variant="primary" onClick={onQuickAdd} className="-mt-4 shadow-lg">
            <Plus size={20} />
          </IconButton>
        </li>

        {MOBILE_NAV.slice(2).map((item) => (
          <MobileTab key={item.to} item={item} />
        ))}
      </ul>
    </nav>
  )
}

function MobileTab({ item }: { item: (typeof NAV)[number] }) {
  const Icon = item.icon
  return (
    <li className="min-w-0 flex-1">
      <NavLink
        to={item.to}
        end={item.to === '/'}
        className={({ isActive }) =>
          cn(
            'flex flex-col items-center gap-1 px-1 py-2.5 text-2xs font-medium transition-colors duration-fast',
            isActive ? 'text-ink' : 'text-ink-faint',
          )
        }
      >
        {({ isActive }) => (
          <>
            <Icon size={20} strokeWidth={isActive ? 2 : 1.6} aria-hidden />
            <span className="w-full truncate text-center">{item.label}</span>
          </>
        )}
      </NavLink>
    </li>
  )
}
