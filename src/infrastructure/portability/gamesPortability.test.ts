import { describe, expect, it } from 'vitest'
import { exportGames, importGames } from './gamesPortability'
import type { Game } from '../../domain/game/types'

const games: Game[] = [{
  id: 'game-1',
  name: 'Friday night',
  players: [{ id: 'p1', name: 'Alice', score: 12 }],
  history: [{ id: 'h1', playerId: 'p1', delta: 12, timestamp: 1 }],
  createdAt: 1,
  updatedAt: 2,
}]

describe('games portability', () => {
  it('round-trips exported games', () => {
    expect(importGames(exportGames(games))).toEqual(games)
  })

  it('rejects invalid exports', () => {
    expect(() => importGames('{')).toThrow('not valid JSON')
    expect(() => importGames(JSON.stringify({ format: 'other', version: 1, games: [] }))).toThrow('not a KeepScore export')
  })
})
