import type { Game } from '../domain/game/types'
import { gameReducer, type GameAction } from '../domain/game/gameReducer'
import { applyHistory, createHistoryState, redoHistory, undoHistory, type HistoryState } from '../domain/game/history'
import { localGameRepository } from '../infrastructure/persistence/gameRepository'

export type GameStore = HistoryState & {
  dispatch(action: GameAction): void
  undo(): void
  redo(): void
  persist(): void
}

export function createGameStore(game: Game): GameStore {
  let state = createHistoryState(game)
  return {
    get past() { return state.past },
    get present() { return state.present },
    get future() { return state.future },
    dispatch(action) {
      const next = gameReducer(state.present, action)
      if (next !== state.present) state = applyHistory(state, next)
      localGameRepository.save(state.present)
    },
    undo() { state = undoHistory(state); localGameRepository.save(state.present) },
    redo() { state = redoHistory(state); localGameRepository.save(state.present) },
    persist() { localGameRepository.save(state.present) },
  }
}

export function restoreLatestGame(): Game | undefined {
  return localGameRepository.list()[0]
}
