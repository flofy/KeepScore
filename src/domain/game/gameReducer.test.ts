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

  it('adds a player mid-game with next palette color and zero score', () => {
    const game = createGame(['Alice', 'Bob'], undefined, 20)
    const next = gameReducer(game, { type: 'ADD_PLAYER', name: 'Carol' })
    expect(next.players).toHaveLength(3)
    expect(next.players[2].name).toBe('Carol')
    expect(next.players[2].score).toBe(0)
    expect(next.players[2].color).toBeDefined()
    expect(game.players).toHaveLength(2)
  })

  it('falls back to Player N when adding a player without a name', () => {
    const game = createGame(['Alice', 'Bob'])
    const next = gameReducer(game, { type: 'ADD_PLAYER' })
    expect(next.players[2].name).toBe('Player 3')
  })

  it('removes a player and their history', () => {
    const game = createGame(['Alice', 'Bob'])
    const scored = gameReducer(game, { type: 'ADD_SCORE', playerId: game.players[0].id, delta: 3 })
    const next = gameReducer(scored, { type: 'REMOVE_PLAYER', playerId: game.players[0].id })
    expect(next.players.map(({ name }) => name)).toEqual(['Bob'])
    expect(next.history).toEqual([])
  })

  it('never removes the last remaining player', () => {
    const game = createGame(['Alice'])
    const next = gameReducer(game, { type: 'REMOVE_PLAYER', playerId: game.players[0].id })
    expect(next).toBe(game)
  })
})
