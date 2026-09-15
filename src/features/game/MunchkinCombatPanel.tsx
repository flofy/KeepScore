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
  const { t } = useI18n();
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
  const [monsterLevel, setMonsterLevel] = useState(1);
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
    const next = startCombat(workflow, monsterLevel);
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
    <section className="munchkin-combat" aria-label={t("combat")}>
      <div className="munchkin-combat-header">
        <div>
          <span className="eyebrow">MUNCHKIN</span>
          <h2>{t("combat")}</h2>
        </div>
        {activePlayer && (
          <strong>
            {activePlayer.name} · {t("level")} {activePlayer.munchkin?.level ?? 0}
          </strong>
        )}
      </div>

      {workflow.phase !== "event" ? (
        <div className="munchkin-combat-start">
          <label>
            {t("monsterLevel")}
            <input
              type="number"
              min="0"
              value={monsterLevel}
              onChange={(event) =>
                setMonsterLevel(Math.max(0, Number(event.target.value) || 0))
              }
            />
          </label>
          <button type="button" onClick={beginCombat}>
            {t("startCombat")}
          </button>
          {result && (
            <p role="status" className="munchkin-combat-result">
              {result === "won" ? t("combatWon") : t("combatLost")}
            </p>
          )}
        </div>
      ) : (
        <div className="munchkin-combat-body">
          <div className="munchkin-combat-summary">
            <span>
              {t("monsterLevel")}: <strong>{combat?.monsterLevel}</strong>
            </span>
            <span>
              {t("combatForce")}: <strong>{totalPower}</strong>
            </span>
          </div>
          <fieldset>
            <legend>{t("combatHelpers")}</legend>
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
            {t("resolveCombat")}
          </button>
        </div>
      )}
    </section>
  );
}
