import { useMemo, useState } from "react";
import type { Game } from "../../domain/game/types";

const PLAYER_ROTATIONS = [0, 90, 180, 270] as const;

/**
 * Advance by one quarter turn without wrapping back to 0° at the end of a
 * cycle. Keeping the absolute angle makes the CSS transition continue from
 * 270° to 360° instead of taking the equivalent -90° path.
 */
export function nextPlayerRotation(rotation: number): number {
  const normalizedRotation = ((rotation % 360) + 360) % 360;
  const index = PLAYER_ROTATIONS.indexOf(
    normalizedRotation as (typeof PLAYER_ROTATIONS)[number],
  );
  return index === -1 ? 0 : rotation + 90;
}

export function useGamePlayerView(game: Game) {
  const [swapped, setSwapped] = useState(false);
  const [playerRotations, setPlayerRotations] = useState<
    Record<string, number>
  >({});

  const isDuo = game.players.length === 2;
  const orderedPlayers = useMemo(
    () =>
      isDuo && swapped ? [game.players[1], game.players[0]] : game.players,
    [game.players, isDuo, swapped],
  );

  const toggleSwap = () => setSwapped((current) => !current);

  const togglePlayerRotation = (playerId: string) => {
    setPlayerRotations((previous) => ({
      ...previous,
      [playerId]: nextPlayerRotation(previous[playerId] ?? 0),
    }));
  };

  return {
    swapped,
    orderedPlayers,
    playerRotations,
    toggleSwap,
    togglePlayerRotation,
  };
}
