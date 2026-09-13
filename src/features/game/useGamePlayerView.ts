import { useMemo, useState } from "react";
import type { Game } from "../../domain/game/types";

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
      [playerId]: previous[playerId] ? 0 : 180,
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
