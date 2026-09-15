import type { CSSProperties } from "react";
import type {
  MunchkinGender,
  MunchkinStats,
  Player,
} from "../../domain/game/types";
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

function nextGender(gender: MunchkinGender): MunchkinGender {
  return gender === "female" ? "male" : "female";
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
  const gender = stats.gender ?? "male";
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

  const toggleGender = () =>
    onChangeStats({
      ...stats,
      gender: nextGender(gender),
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
        <div className="munchkin-counter munchkin-level-counter">
          <button
            type="button"
            className="munchkin-gender-toggle"
            onClick={toggleGender}
            aria-pressed={gender === "female"}
            aria-label={`Personnage ${gender === "female" ? "femme" : "homme"}. Changer de personnage`}
            title="Changer de personnage"
          >
            <svg
              className="munchkin-player-icon"
              viewBox="0 0 24 24"
              role="img"
              aria-hidden="true"
            >
              {gender === "female" ? (
                <path d="M12 2.75a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5M7.5 11.75h9l1.5 8.25h-3.25v2.5h-2v-2.5h-1.5V22h-2v-2h-3.25z" />
              ) : (
                <path d="M12 2.75a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5M7.25 11.75h9.5l1.25 8.25h-3.25l-.75-4.5-.75 6.5h-2.5l-.75-6.5-.75 4.5H6z" />
              )}
            </svg>
          </button>
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

        <div className="munchkin-counter munchkin-equipment-counter">
          <span
            className="munchkin-counter-label munchkin-equipment-label"
            aria-label="Équipement"
          >
            <span aria-hidden="true">🛡</span>
          </span>
          <div className="munchkin-equipment-value">
            <strong aria-label={`Bonus d'équipement ${equipmentBonus}`}>
              {equipmentBonus > 0 ? `+${equipmentBonus}` : equipmentBonus}
            </strong>
            <button
              type="button"
              onClick={() => updateEquipment(-1)}
              aria-label={`Retirer un bonus d'équipement à ${player.name}`}
            >
              −
            </button>
            <button
              type="button"
              onClick={() => updateEquipment(1)}
              aria-label={`Ajouter un bonus d'équipement à ${player.name}`}
            >
              +
            </button>
          </div>
        </div>

        <div className="munchkin-force-column">
          <div className="munchkin-counter munchkin-force-counter">
            <span className="munchkin-counter-label">Force</span>
            <strong
              className="munchkin-force-value"
              aria-label={`Force ${force}`}
            >
              {force}
            </strong>
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
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
