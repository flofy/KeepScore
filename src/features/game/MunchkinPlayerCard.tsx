import type { CSSProperties } from "react";
import type { MunchkinStats, Player } from "../../domain/game/types";
import "./munchkin-player-card.css";

const MAX_LEVEL = 10;

type Props = {
  player: Player;
  stats: MunchkinStats;
  rotation?: number;
  removeMode?: boolean;
  canRemove?: boolean;
  onRemove?: () => void;
  onRename: (name: string) => void;
  onChangeStats: (stats: MunchkinStats) => void;
  onFlip?: () => void;
  onCombat?: () => void;
};

function clampLevel(level: number): number {
  return Math.max(0, Math.min(MAX_LEVEL, Math.trunc(level)));
}

function clampEquipmentBonus(bonus: number): number {
  return Math.trunc(bonus);
}

export function MunchkinPlayerCard({
  player,
  stats,
  rotation = 0,
  removeMode = false,
  canRemove = true,
  onRemove,
  onRename,
  onChangeStats,
  onFlip,
  onCombat,
}: Props) {
  const level = Number.isFinite(stats.level) ? stats.level : 0;
  const equipmentBonus = Number.isFinite(stats.equipmentBonus)
    ? stats.equipmentBonus
    : 0;
  const force = level + equipmentBonus;

  const updateLevel = (delta: number) =>
    onChangeStats({
      ...stats,
      level: clampLevel(level + delta),
    });

  const updateEquipment = (delta: number) =>
    onChangeStats({
      ...stats,
      equipmentBonus: clampEquipmentBonus(equipmentBonus + delta),
    });

  return (
    <article
      className={
        removeMode ? "munchkin-player-card remove-mode" : "munchkin-player-card"
      }
      style={
        {
          "--player-color": player.color ?? "#d88a24",
          transform: rotation ? `rotate(${rotation}deg)` : undefined,
        } as CSSProperties
      }
    >
      <div className="munchkin-card-frame" aria-hidden="true" />
      <div className="munchkin-card-header">
        <input
          className="munchkin-player-name"
          value={player.name}
          onChange={(event) => onRename(event.target.value)}
          aria-label={`Nom du joueur — ${player.name}`}
        />
      </div>

      {removeMode && onRemove && (
        <button
          type="button"
          className="munchkin-remove-btn"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label={`Supprimer ${player.name}`}
        >
          ✕
        </button>
      )}
      {onFlip && !removeMode && (
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

      <div className="munchkin-counters">
        <div className="munchkin-counter">
          <span className="munchkin-counter-label">Niveau</span>
          <div className="munchkin-counter-controls">
            <button
              type="button"
              onClick={() => updateLevel(-1)}
              disabled={level <= 0}
              aria-label={`Retirer un niveau à ${player.name}`}
            >
              −
            </button>
            <strong aria-label={`Niveau ${level}`}>{level}</strong>
            <button
              type="button"
              onClick={() => updateLevel(1)}
              disabled={level >= MAX_LEVEL}
              aria-label={`Ajouter un niveau à ${player.name}`}
            >
              +
            </button>
          </div>
        </div>

        <div className="munchkin-counter">
          <span className="munchkin-counter-label">
            <span aria-hidden="true">🛡</span> Équipement
          </span>
          <div className="munchkin-equipment-value">
            <button
              type="button"
              onClick={() => updateEquipment(-1)}
              aria-label={`Retirer un bonus d'équipement à ${player.name}`}
            >
              −
            </button>
            <strong aria-label={`Bonus d'équipement ${equipmentBonus}`}>
              {equipmentBonus > 0 ? `+${equipmentBonus}` : equipmentBonus}
            </strong>
            <button
              type="button"
              onClick={() => updateEquipment(1)}
              aria-label={`Ajouter un bonus d'équipement à ${player.name}`}
            >
              +
            </button>
          </div>
        </div>

        <div className="munchkin-counter munchkin-force-counter">
          <span className="munchkin-counter-label">Force</span>
          <strong
            className="munchkin-force-value"
            aria-label={`Force ${force}`}
          >
            {force}
          </strong>
        </div>
      </div>

      {onCombat && (
        <button
          type="button"
          className="munchkin-combat-action"
          onClick={onCombat}
          aria-label={`Lancer un combat avec ${player.name}`}
          title="Lancer un combat"
        >
          <span aria-hidden="true">⚔</span>
          <span>Combat</span>
        </button>
      )}
    </article>
  );
}
