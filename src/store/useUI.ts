import { create } from 'zustand'

export type QuickAddMode = 'task' | 'shoot' | 'contact' | 'log'

/**
 * Ephemeral UI state that several unrelated screens need to reach — the quick-
 * add sheet and the command palette. Kept out of the persisted data store on
 * purpose: none of it should survive a reload.
 */
type UIState = {
  quickAdd: QuickAddMode | null
  palette: boolean
  openQuickAdd: (mode?: QuickAddMode) => void
  closeQuickAdd: () => void
  openPalette: () => void
  closePalette: () => void
}

export const useUI = create<UIState>((set) => ({
  quickAdd: null,
  palette: false,
  openQuickAdd: (mode = 'task') => set({ quickAdd: mode }),
  closeQuickAdd: () => set({ quickAdd: null }),
  openPalette: () => set({ palette: true }),
  closePalette: () => set({ palette: false }),
}))

/** Convenience for event handlers outside React. */
export const openQuickAdd = (mode?: QuickAddMode) => useUI.getState().openQuickAdd(mode)
