import type { CSSProperties } from "react";
import type { Game, MunchkinStats } from "../../domain/game/types";
import { colorForIndex } from "../../domain/game/colors";
import { useI18n } from "../../ui/i18n";
import { MunchkinPlayerCard } from "./MunchkinPlayerCard";
import { PlayerCard } from "./PlayerCard";

type Props = {
  game: Game;
  orderedPlayers: Game["players"];
  removeMode: boolean;
  playerRotations: Record<string, number>;
  onRemovePlayer: (playerId: string) => void;
  onRenamePlayer: (playerId: string, name: string) => void;
  onAddScore: (playerId: string, delta: number) => void;
  onSetScore: (playerId: string, value: number) => void;
  onUpdateMunchkinStats: (playerId: string, stats: MunchkinStats) => void;
  onFlipPlayer: (playerId: string) => void;
};

const RECENT_DELTAS = 6;

function haptic() {
  if ("vibrate" in navigator) navigator.vibrate(8);
}

function defaultMunchkinStats(score: number): MunchkinStats {
  return {
    level: Math.max(0, Math.min(10, Math.trunc(score))),
    strength: 0,
  };
}

export function GamePlayerArea({
  game,
  orderedPlayers,
  removeMode,
  playerRotations,
  onRemovePlayer,
  onRenamePlayer,
  onAddScore,
  onSetScore,
  onUpdateMunchkinStats,
  onFlipPlayer,
}: Props) {
  const { t } = useI18n();
  const isDuo = game.players.length === 2;
  const isMunchkin = game.presetId === "munchkin";

  const recentDeltasFor = (playerId: string): number[] =>
    game.history
      .filter((entry) => entry.playerId === playerId)
      .slice(-RECENT_DELTAS)
      .map((entry) => entry.delta)
      .reverse();

  const lastDeltaFor = (playerId: string) => {
    for (let i = game.history.length - 1; i >= 0; i -= 1) {
      if (game.history[i].playerId === playerId) return game.history[i].delta;
    }
    return undefined;
  };

  return (
    <section
      className={
        removeMode
          ? "players remove-mode"
          : isDuo
            ? "players duo"
            : game.players.length >= 4
              ? "players crowded"
              : "players"
      }
      style={
        (!isDuo &&
          game.players.length > 2 &&
          ({
            "--cols": String(
              Math.max(2, Math.min(4, Math.ceil(game.players.length / 2))),
            ),
          } as CSSProperties)) ||
        undefined
      }
      aria-label={t("players")}
    >
      {orderedPlayers.map((player, index) => {
        const rotation = playerRotations[player.id] ?? 0;
        const color =
          player.color ?? colorForIndex(game.players.indexOf(player));

        if (isMunchkin) {
          return (
            <MunchkinPlayerCard
              key={player.id}
              player={{ ...player, color }}
              stats={player.munchkin ?? defaultMunchkinStats(player.score)}
              rotation={rotation}
              removeMode={removeMode}
              canRemove={game.players.length > 1}
              onRemove={() => {
                onRemovePlayer(player.id);
                haptic();
              }}
              onRename={(name) => onRenamePlayer(player.id, name)}
              onChangeStats={(stats) =>
                onUpdateMunchkinStats(player.id, stats)
              }
              onFlip={() => onFlipPlayer(player.id)}
            />
          );
        }

        return (
          <PlayerCard
            key={player.id}
            player={{ ...player, color }}
            deltas={recentDeltasFor(player.id)}
            rotation={rotation}
            lastDelta={lastDeltaFor(player.id)}
            removeMode={removeMode}
            canRemove={game.players.length > 1}
            tilt={removeMode ? (index % 2 === 0 ? "a" : "b") : undefined}
            onRemove={() => {
              onRemovePlayer(player.id);
              haptic();
            }}
            onRename={(name) => onRenamePlayer(player.id, name)}
            onDelta={(delta) => {
              onAddScore(player.id, delta);
              haptic();
            }}
            onQuickDelta={(delta) => {
              onAddScore(player.id, delta);
              haptic();
            }}
            onSetScore={(value) => onSetScore(player.id, value)}
            onFlip={() => onFlipPlayer(player.id)}
          />
        );
      })}
    </section>
  );
}
