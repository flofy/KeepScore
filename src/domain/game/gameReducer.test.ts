import { describe, expect, it } from 'vitest'
import { createGame } from './gameFactory'
import { gameReducer } from './gameReducer'

describe('gameReducer', () => {
  it('creates a game with zeroed players', () => {
    const game = createGame(['Alice', 'Bob'])
    expect(game.players.map(({ name, score }) => ({ name, score }))).toEqual([
      { name: 'Alice', score: 0 },
      { name: 'Bob', score: 0 },
    ])
  })

  it('adds score and records history', () => {
    const game = createGame(['Alice', 'Bob'])
    const next = gameReducer(game, { type: 'ADD_SCORE', playerId: game.players[0].id, delta: 5 })

    expect(next.players[0].score).toBe(5)
    expect(next.history).toHaveLength(1)
    expect(next.history[0].delta).toBe(5)
  })

  it('renames a player', () => {
    const game = createGame(['Alice', 'Bob'])
    const next = gameReducer(game, { type: 'RENAME_PLAYER', playerId: game.players[0].id, name: 'A' })
    expect(next.players[0].name).toBe('A')
  })
})
