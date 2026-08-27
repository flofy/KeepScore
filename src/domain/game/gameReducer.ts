import type { Game } from './types'

export type GameAction =
  | { type: 'ADD_SCORE'; playerId: string; delta: number }
  | { type: 'RENAME_PLAYER'; playerId: string; name: string }

export function gameReducer(game: Game, action: GameAction): Game {
  const updatedAt = Date.now()

  switch (action.type) {
    case 'ADD_SCORE': {
      const player = game.players.find((candidate) => candidate.id === action.playerId)
      if (!player) return game

      return {
        ...game,
        players: game.players.map((candidate) =>
          candidate.id === action.playerId
            ? { ...candidate, score: candidate.score + action.delta }
            : candidate,
        ),
        history: [
          ...game.history,
          {
            id: crypto.randomUUID(),
            playerId: action.playerId,
            delta: action.delta,
            timestamp: updatedAt,
          },
        ],
        updatedAt,
      }
    }
    case 'RENAME_PLAYER':
      return {
        ...game,
        players: game.players.map((player) =>
          player.id === action.playerId ? { ...player, name: action.name } : player,
        ),
        updatedAt,
      }
  }
}
