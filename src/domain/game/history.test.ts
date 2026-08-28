import { describe, expect, it } from 'vitest'
import { createGame } from './gameFactory'
import { applyHistory, createHistoryState, redoHistory, undoHistory } from './history'
import { gameReducer } from './gameReducer'

describe('game history', () => {
  it('undoes and redoes a score change', () => {
    const game = createGame(['Alice', 'Bob'])
    const changed = gameReducer(game, { type: 'ADD_SCORE', playerId: game.players[0].id, delta: 5 })
    const state = applyHistory(createHistoryState(game), changed)

    expect(undoHistory(state).present.players[0].score).toBe(0)
    expect(redoHistory(undoHistory(state)).present.players[0].score).toBe(5)
  })

  it('clears redo history after a new change', () => {
    const game = createGame(['Alice', 'Bob'])
    const one = gameReducer(game, { type: 'ADD_SCORE', playerId: game.players[0].id, delta: 1 })
    const two = gameReducer(one, { type: 'ADD_SCORE', playerId: game.players[0].id, delta: 1 })
    const state = applyHistory(applyHistory(createHistoryState(game), one), two)
    const undone = undoHistory(state)
    const replacement = gameReducer(undone.present, { type: 'ADD_SCORE', playerId: game.players[1].id, delta: 3 })

    expect(applyHistory(undone, replacement).future).toEqual([])
  })
})
