import { useMemo, useState } from "react";
import type { Game } from "../../domain/game/types";

export const PLAYER_ROTATIONS = [0, 90, 180, 270] as const;
export type PlayerRotation = (typeof PLAYER_ROTATIONS)[number];

export function nextPlayerRotation(rotation: PlayerRotation): PlayerRotation {
  const index = PLAYER_ROTATIONS.indexOf(rotation);
  return PLAYER_ROTATIONS[(index + 1) % PLAYER_ROTATIONS.length];
}

export function useGamePlayerView(game: Game) {
  const [swapped, setSwapped] = useState(false);
  const [playerRotations, setPlayerRotations] = useState<
    Record<string, PlayerRotation>
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
