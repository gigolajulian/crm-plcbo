import { useEffect, useRef } from 'react'

/** True when focus is somewhere the user is typing — suppresses bare-key shortcuts. */
export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable ||
    el.getAttribute('role') === 'textbox'
  )
}

type HotkeyOptions = {
  /** Fire even while the user is typing (for Escape, ⌘K and similar). */
  allowInInput?: boolean
  enabled?: boolean
}

/**
 * Bind a keyboard shortcut. Combos are written like "mod+k", "shift+?", "g p".
 * "mod" resolves to ⌘ on Apple platforms and Ctrl elsewhere.
 */
export function useHotkey(
  combo: string | string[],
  handler: (event: KeyboardEvent) => void,
  options: HotkeyOptions = {},
): void {
  const { allowInInput = false, enabled = true } = options
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!enabled) return
    const combos = (Array.isArray(combo) ? combo : [combo]).map((c) => c.toLowerCase())

    function onKeyDown(event: KeyboardEvent) {
      if (!allowInInput && isTypingTarget(event.target)) return
      const key = event.key.toLowerCase()
      const isMac = /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent)
      const mod = isMac ? event.metaKey : event.ctrlKey

      for (const c of combos) {
        const parts = c.split('+')
        const needsMod = parts.includes('mod')
        const needsShift = parts.includes('shift')
        const needsAlt = parts.includes('alt')
        const target = parts[parts.length - 1]

        if (needsMod !== mod) continue
        if (needsShift !== event.shiftKey) continue
        if (needsAlt !== event.altKey) continue
        if (key !== target) continue

        event.preventDefault()
        handlerRef.current(event)
        return
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [Array.isArray(combo) ? combo.join('|') : combo, allowInInput, enabled])
}

/** Human-readable modifier symbol for rendering shortcut hints. */
export function modKey(): string {
  if (typeof navigator === 'undefined') return 'Ctrl'
  return /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent) ? '⌘' : 'Ctrl'
}
