import type { CSSProperties } from "react";
import type { MunchkinStats, Player } from "../../domain/game/types";
import "./munchkin-player-card.css";

const MAX_LEVEL = 10;

type Props = {
  player: Player;
  stats: MunchkinStats;
  rotation?: number;
  onRename: (name: string) => void;
  onChangeStats: (stats: MunchkinStats) => void;
  onFlip?: () => void;
};

function clampLevel(level: number): number {
  return Math.max(0, Math.min(MAX_LEVEL, Math.trunc(level)));
}

function clampStrength(strength: number): number {
  return Math.trunc(strength);
}

export function MunchkinPlayerCard({
  player,
  stats,
  rotation = 0,
  onRename,
  onChangeStats,
  onFlip,
}: Props) {
  const updateLevel = (delta: number) =>
    onChangeStats({
      ...stats,
      level: clampLevel(stats.level + delta),
    });

  const updateStrength = (delta: number) =>
    onChangeStats({
      ...stats,
      strength: clampStrength(stats.strength + delta),
    });

  return (
    <article
      className={rotation ? "munchkin-player-card rotated" : "munchkin-player-card"}
      style={
        {
          "--player-color": player.color ?? "#38bdf8",
          transform: rotation ? `rotate(${rotation}deg)` : undefined,
        } as CSSProperties
      }
    >
      {onFlip && (
        <button
          type="button"
          className="munchkin-card-flip-btn"
          onClick={onFlip}
          aria-pressed={rotation > 0}
          aria-label={`Retourner ${player.name}`}
        >
          ↻
        </button>
      )}
      <input
        className="munchkin-player-name"
        value={player.name}
        onChange={(event) => onRename(event.target.value)}
        aria-label={`Nom du joueur — ${player.name}`}
      />
      <div className="munchkin-counters">
        <div className="munchkin-counter">
          <span className="munchkin-counter-label">Niveau</span>
          <div className="munchkin-counter-controls">
            <button
              type="button"
              onClick={() => updateLevel(-1)}
              disabled={stats.level <= 0}
              aria-label={`Retirer un niveau à ${player.name}`}
            >
              −
            </button>
            <strong aria-label={`Niveau ${stats.level}`}>{stats.level}</strong>
            <button
              type="button"
              onClick={() => updateLevel(1)}
              disabled={stats.level >= MAX_LEVEL}
              aria-label={`Ajouter un niveau à ${player.name}`}
            >
              +
            </button>
          </div>
        </div>
        <div className="munchkin-counter">
          <span className="munchkin-counter-label">Force</span>
          <div className="munchkin-counter-controls">
            <button
              type="button"
              onClick={() => updateStrength(-1)}
              aria-label={`Retirer un point de force à ${player.name}`}
            >
              −
            </button>
            <strong aria-label={`Force ${stats.strength}`}>
              {stats.strength}
            </strong>
            <button
              type="button"
              onClick={() => updateStrength(1)}
              aria-label={`Ajouter un point de force à ${player.name}`}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
