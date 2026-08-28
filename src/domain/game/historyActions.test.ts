import { describe, expect, it } from 'vitest'
import { removeHistoryEntry, updateHistoryEntry } from './historyActions'
import type { Game } from './types'

const game: Game = { id: 'game-1', name: 'Test', players: [{ id: 'p1', name: 'Alice', score: 5 }], history: [{ id: 'h1', playerId: 'p1', delta: 5, timestamp: 1 }], createdAt: 1, updatedAt: 1 }

describe('history actions', () => {
  it('updates an entry and adjusts the score by the difference', () => {
    const result = updateHistoryEntry(game, 'h1', 8)
    expect(result.players[0].score).toBe(8)
    expect(result.history[0].delta).toBe(8)
  })
  it('removes an entry and reverses its contribution', () => {
    const result = removeHistoryEntry(game, 'h1')
    expect(result.players[0].score).toBe(0)
    expect(result.history).toHaveLength(0)
  })
})
