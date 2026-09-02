import { describe, expect, it } from 'vitest'
import { createGame } from './gameFactory'
import { colorForIndex } from './colors'

describe('createGame', () => {
  it('starts every player at zero by default', () => {
    const game = createGame(['Alice', 'Bob'])
    expect(game.players.map((player) => player.score)).toEqual([0, 0])
  })

  it('starts every player at the given starting score', () => {
    const game = createGame(['Alice', 'Bob'], 'Star Realms', 20)
    expect(game.name).toBe('Star Realms')
    expect(game.players.map((player) => player.score)).toEqual([20, 20])
    expect(game.history).toEqual([])
  })

  it('assigns palette colors when none are provided', () => {
    const game = createGame(['Alice', 'Bob'])
    expect(game.players[0].color).toBe(colorForIndex(0))
    expect(game.players[1].color).toBe(colorForIndex(1))
  })

  it('uses provided colors', () => {
    const game = createGame(['Alice', 'Bob'], undefined, 0, ['#123456', '#654321'])
    expect(game.players.map((player) => player.color)).toEqual(['#123456', '#654321'])
  })

  it('allows a single player game', () => {
    const game = createGame(['Alice'], 'Solo', 20)
    expect(game.players).toHaveLength(1)
    expect(game.players[0].score).toBe(20)
  })

  it('throws when no players', () => {
    expect(() => createGame([], 'Empty', 0)).toThrow('A game requires at least one player')
  })
})
