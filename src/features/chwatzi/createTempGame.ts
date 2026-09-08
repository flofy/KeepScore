import type { Game, Player } from '../../domain/game/types';
import { colorForIndex } from '../../domain/game/colors';

export function createTempGame(playerCount: number): Game {
  const now = Date.now();
  const players: Player[] = [];
  for (let i = 0; i < playerCount; i++) {
    players.push({
      id: `temp-player-${i}`,
      name: `Player ${i + 1}`,
      score: 0,
      color: colorForIndex(i),
    });
  }
  return {
    id: `temp-game-${now}`,
    name: 'Chwatzi Game',
    players,
    history: [],
    createdAt: now,
    updatedAt: now,
  };
}
