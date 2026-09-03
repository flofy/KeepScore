import type { Game } from './types'
import { removeHistoryEntry, updateHistoryEntry } from './historyActions'
import { colorForIndex } from './colors'

export type GameAction =
  | { type: 'ADD_SCORE'; playerId: string; delta: number }
  | { type: 'RENAME_PLAYER'; playerId: string; name: string }
  | { type: 'RENAME_GAME'; name: string }
  | { type: 'RESET_SCORE'; playerId: string }
  | { type: 'ADD_PLAYER'; name?: string }
  | { type: 'EDIT_HISTORY_ENTRY'; entryId: string; delta: number }
  | { type: 'DELETE_HISTORY_ENTRY'; entryId: string }

export function gameReducer(game: Game, action: GameAction): Game {
  const updatedAt = Date.now()
  switch (action.type) {
    case 'ADD_SCORE': {
      const player = game.players.find((candidate) => candidate.id === action.playerId)
      if (!player || !Number.isFinite(action.delta) || action.delta === 0) return game
      return { ...game, players: game.players.map((candidate) => candidate.id === action.playerId ? { ...candidate, score: candidate.score + action.delta } : candidate), history: [...game.history, { id: crypto.randomUUID(), playerId: action.playerId, delta: action.delta, timestamp: updatedAt }], updatedAt }
    }
    case 'RENAME_PLAYER':
      return { ...game, players: game.players.map((player) => player.id === action.playerId && action.name.trim() ? { ...player, name: action.name.trim() } : player), updatedAt }
    case 'RENAME_GAME':
      return { ...game, name: action.name.trim() || undefined, updatedAt }
    case 'RESET_SCORE': {
      const player = game.players.find((candidate) => candidate.id === action.playerId)
      if (!player || player.score === 0) return game
      return { ...game, players: game.players.map((candidate) => candidate.id === action.playerId ? { ...candidate, score: 0 } : candidate), updatedAt }
    }
    case 'ADD_PLAYER': {
      const name = action.name?.trim() || `Player ${game.players.length + 1}`
      const player = { id: crypto.randomUUID(), name, score: 0, color: colorForIndex(game.players.length) }
      return { ...game, players: [...game.players, player], updatedAt }
    }
    case 'EDIT_HISTORY_ENTRY': return updateHistoryEntry(game, action.entryId, action.delta)
    case 'DELETE_HISTORY_ENTRY': return removeHistoryEntry(game, action.entryId)
  }
}
