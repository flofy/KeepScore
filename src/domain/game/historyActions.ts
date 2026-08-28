import type { Game, ScoreEntry } from './types'

export function getHistoryEntry(game: Game, entryId: string): ScoreEntry | undefined {
  return game.history.find((entry) => entry.id === entryId)
}

export function removeHistoryEntry(game: Game, entryId: string): Game {
  const entry = getHistoryEntry(game, entryId)
  if (!entry) return game
  return {
    ...game,
    players: game.players.map((player) => player.id === entry.playerId ? { ...player, score: player.score - entry.delta } : player),
    history: game.history.filter((candidate) => candidate.id !== entryId),
    updatedAt: Date.now(),
  }
}

export function updateHistoryEntry(game: Game, entryId: string, delta: number): Game {
  if (!Number.isFinite(delta) || delta === 0) return game
  const entry = getHistoryEntry(game, entryId)
  if (!entry) return game
  const difference = delta - entry.delta
  return {
    ...game,
    players: game.players.map((player) => player.id === entry.playerId ? { ...player, score: player.score + difference } : player),
    history: game.history.map((candidate) => candidate.id === entryId ? { ...candidate, delta } : candidate),
    updatedAt: Date.now(),
  }
}
