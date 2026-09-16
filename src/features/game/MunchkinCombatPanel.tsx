import { useMemo, useState } from "react";
import {
  addCombatHelper,
  createMunchkinWorkflow,
  playerPower,
  resolveCombat,
  startCombat,
  type CompanionPlayer,
  type MunchkinWorkflow,
} from "../../domain/game/munchkin";
import type { Game } from "../../domain/game/types";
import { useI18n } from "../../ui/i18n";

type Props = {
  game: Game;
  onUpdateLevel: (playerId: string, level: number) => void;
};

export function MunchkinCombatPanel({ game, onUpdateLevel }: Props) {
  const { lang } = useI18n();
  const labels =
    lang === "fr"
      ? {
          combat: "Combat",
          level: "Niveau",
          monsterLevel: "Niveau du monstre",
          combatForce: "Force totale",
          combatHelpers: "Allies",
          startCombat: "Lancer le combat",
          resolveCombat: "Resoudre le combat",
          combatWon: "Victoire ! +1 niveau",
          combatLost: "Defaite",
        }
      : {
          combat: "Combat",
          level: "Level",
          monsterLevel: "Monster level",
          combatForce: "Total power",
          combatHelpers: "Helpers",
          startCombat: "Start combat",
          resolveCombat: "Resolve combat",
          combatWon: "Victory! +1 level",
          combatLost: "Defeat",
        };
  const [workflow, setWorkflow] = useState<MunchkinWorkflow>(() => {
    const initial = createMunchkinWorkflow();
    const activePlayerId = game.startingPlayerId ?? game.players[0]?.id;
    return activePlayerId
      ? {
          ...initial,
          phase: "turn",
          activePlayerId,
          turn: 1,
        }
      : initial;
  });
  const [monsterLevel, setMonsterLevel] = useState("1");
  const [result, setResult] = useState<"won" | "lost" | null>(null);

  const activePlayer = game.players.find(
    (player) => player.id === workflow.activePlayerId,
  );
  const combat = workflow.context.combat;
  const helpers = useMemo(
    () =>
      game.players.filter((player) => combat?.helperIds.includes(player.id)),
    [combat?.helperIds, game.players],
  );
  const participants: CompanionPlayer[] = [activePlayer, ...helpers]
    .filter((player): player is NonNullable<typeof player> => Boolean(player))
    .map((player) => ({
      ...player,
      level: player.munchkin?.level ?? 0,
      equipmentBonus: player.munchkin?.equipmentBonus ?? 0,
    }));
  const totalPower = participants.reduce(
    (total, player) => total + playerPower(player),
    0,
  );

  if (game.presetId !== "munchkin" || game.players.length === 0) return null;

  const beginCombat = () => {
    const level = Math.max(0, Number(monsterLevel) || 0);
    const next = startCombat(workflow, level);
    setMonsterLevel(String(level));
    setWorkflow(next);
    setResult(null);
  };

  const toggleHelper = (playerId: string) => {
    if (!combat) return;
    setWorkflow((current) => {
      const currentCombat = current.context.combat;
      if (!currentCombat) return current;
      if (currentCombat.helperIds.includes(playerId)) {
        return {
          ...current,
          context: {
            ...current.context,
            combat: {
              ...currentCombat,
              helperIds: currentCombat.helperIds.filter(
                (id) => id !== playerId,
              ),
            },
          },
        };
      }
      return addCombatHelper(current, playerId);
    });
  };

  const finishCombat = () => {
    const resolved = resolveCombat(workflow, participants);
    setWorkflow(resolved.workflow);
    setResult(resolved.winner ? "won" : "lost");
    if (resolved.winner && activePlayer) {
      const level = activePlayer.munchkin?.level ?? 0;
      onUpdateLevel(activePlayer.id, Math.min(10, level + 1));
    }
  };

  return (
    <section className="munchkin-combat" aria-label={labels.combat}>
      <div className="munchkin-combat-header">
        <div>
          <span className="eyebrow">MUNCHKIN</span>
          <h2>{labels.combat}</h2>
        </div>
        {activePlayer && (
          <strong>
            {activePlayer.name} · {labels.level}{" "}
            {activePlayer.munchkin?.level ?? 0}
          </strong>
        )}
      </div>

      {workflow.phase !== "event" ? (
        <div className="munchkin-combat-start">
          <label>
            {labels.monsterLevel}
            <input
              type="number"
              min="0"
              value={monsterLevel}
              onFocus={(event) => event.currentTarget.select()}
              onChange={(event) => setMonsterLevel(event.target.value)}
            />
          </label>
          <button type="button" onClick={beginCombat}>
            {labels.startCombat}
          </button>
          {result && (
            <p role="status" className="munchkin-combat-result">
              {result === "won" ? labels.combatWon : labels.combatLost}
            </p>
          )}
        </div>
      ) : (
        <div className="munchkin-combat-body">
          <div className="munchkin-combat-summary">
            <span>
              {labels.monsterLevel}: <strong>{combat?.monsterLevel}</strong>
            </span>
            <span>
              {labels.combatForce}: <strong>{totalPower}</strong>
            </span>
          </div>
          <fieldset>
            <legend>{labels.combatHelpers}</legend>
            {game.players
              .filter((player) => player.id !== activePlayer?.id)
              .map((player) => (
                <label key={player.id}>
                  <input
                    type="checkbox"
                    checked={combat?.helperIds.includes(player.id) ?? false}
                    onChange={() => toggleHelper(player.id)}
                  />
                  <span>
                    {player.name} · {player.munchkin?.level ?? 0} +{" "}
                    {player.munchkin?.equipmentBonus ?? 0}
                  </span>
                </label>
              ))}
          </fieldset>
          <button type="button" onClick={finishCombat}>
            {labels.resolveCombat}
          </button>
        </div>
      )}
    </section>
  );
}
