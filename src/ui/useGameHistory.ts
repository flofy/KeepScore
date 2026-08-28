import { useEffect, useMemo, useState } from 'react'
import type { Game } from '../domain/game/types'
import { gameReducer, type GameAction } from '../domain/game/gameReducer'
import { applyHistory, createHistoryState, redoHistory, undoHistory, type HistoryState } from '../domain/game/history'
import { localGameRepository } from '../infrastructure/persistence/gameRepository'

export function useGameHistory(initialGame: Game) {
  const [state, setState] = useState<HistoryState>(() => createHistoryState(initialGame))
  useEffect(() => { localGameRepository.save(state.present) }, [state.present])
  const actions = useMemo(() => ({
    dispatch(action: GameAction) {
      setState((current) => {
        const next = gameReducer(current.present, action)
        return next === current.present ? current : applyHistory(current, next)
      })
    },
    undo: () => setState(undoHistory),
    redo: () => setState(redoHistory),
  }), [])
  return { ...state, ...actions }
}
