import type { MunchkinContext, Player } from "./types";
import { createWorkflowState, type WorkflowState } from "./workflow";

export type CompanionPlayer = Player & {
  level: number;
  equipmentBonus: number;
};

export type MunchkinWorkflow = WorkflowState<MunchkinContext>;

export function createMunchkinWorkflow(): MunchkinWorkflow {
  return createWorkflowState<MunchkinContext>({ combat: null });
}

export function playerPower(
  player: Pick<CompanionPlayer, "level" | "equipmentBonus">,
): number {
  return player.level + player.equipmentBonus;
}

export function startCombat(
  workflow: MunchkinWorkflow,
  monsterLevel: number,
): MunchkinWorkflow {
  if (
    workflow.phase !== "turn" ||
    !Number.isFinite(monsterLevel) ||
    monsterLevel < 0
  )
    return workflow;
  return {
    ...workflow,
    phase: "event",
    context: {
      ...workflow.context,
      combat: {
        monsterLevel: Math.trunc(monsterLevel),
        helperIds: [],
        rewardLevels: 1,
        rewardTreasures: 1,
      },
    },
  };
}

export function addCombatHelper(
  workflow: MunchkinWorkflow,
  playerId: string,
): MunchkinWorkflow {
  const combat = workflow.context.combat;
  if (
    workflow.phase !== "event" ||
    !combat ||
    !playerId ||
    combat.helperIds.includes(playerId)
  )
    return workflow;
  return {
    ...workflow,
    context: {
      ...workflow.context,
      combat: { ...combat, helperIds: [...combat.helperIds, playerId] },
    },
  };
}

export function resolveCombat(
  workflow: MunchkinWorkflow,
  players: CompanionPlayer[],
) {
  const combat = workflow.context.combat;
  if (workflow.phase !== "event" || !combat || !workflow.activePlayerId)
    return { workflow, winner: false, totalPower: 0 };
  const ids = [workflow.activePlayerId, ...combat.helperIds];
  const totalPower = players
    .filter((player) => ids.includes(player.id))
    .reduce((total, player) => total + playerPower(player), 0);
  return {
    workflow: {
      ...workflow,
      phase: "turn" as const,
      context: { ...workflow.context, combat: null },
    },
    winner: totalPower > combat.monsterLevel,
    totalPower,
  };
}
