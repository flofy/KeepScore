import type { Game, Player } from './types'

export function createGame(playerNames: string[], name?: string): Game {
  if (playerNames.length < 2) throw new Error('A game requires at least two players')
  const now = Date.now()
  const players: Player[] = playerNames.map((rawName, index) => ({
    id: crypto.randomUUID(),
    name: rawName.trim() || `Player ${index + 1}`,
    score: 0,
  }))
  return {
    id: crypto.randomUUID(),
    name: name?.trim() || undefined,
    players,
    history: [],
    createdAt: now,
    updatedAt: now,
  }
}
