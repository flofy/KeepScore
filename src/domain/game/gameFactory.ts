import type { Game, Player } from './types'
import { colorForIndex } from './colors'

export function createGame(playerNames: string[], name?: string, startingScore = 0, colors?: string[]): Game {
  const now = Date.now()
  const players: Player[] = playerNames.map((rawName, index) => ({
    id: crypto.randomUUID(),
    name: rawName.trim() || `Player ${index + 1}`,
    score: startingScore,
    color: colors?.[index] ?? colorForIndex(index),
  }))

  if (players.length < 1) {
    throw new Error('A game requires at least one player')
  }

  return {
    id: crypto.randomUUID(),
    name: name?.trim() || undefined,
    players,
    history: [],
    createdAt: now,
    updatedAt: now,
  }
}
