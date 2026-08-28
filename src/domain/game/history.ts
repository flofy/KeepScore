import type { Game } from './types'

export type HistoryState = { past: Game[]; present: Game; future: Game[] }

export function createHistoryState(game: Game): HistoryState {
  return { past: [], present: game, future: [] }
}

export function applyHistory(state: HistoryState, next: Game): HistoryState {
  return { past: [...state.past, state.present], present: next, future: [] }
}

export function undoHistory(state: HistoryState): HistoryState {
  if (!state.past.length) return state
  const previous = state.past[state.past.length - 1]
  return { past: state.past.slice(0, -1), present: previous, future: [state.present, ...state.future] }
}

export function redoHistory(state: HistoryState): HistoryState {
  if (!state.future.length) return state
  const next = state.future[0]
  return { past: [...state.past, state.present], present: next, future: state.future.slice(1) }
}
