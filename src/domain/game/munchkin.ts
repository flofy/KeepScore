import type { Player } from './types'
import { createWorkflowState, type WorkflowState } from './workflow'

export type CompanionPlayer = Player & { level: number; gear: number }

export type CombatState = {
  monsterLevel: number
  helperIds: string[]
  rewardLevels: number
  rewardTreasures: number
}

export type MunchkinContext = { combat: CombatState | null }
export type MunchkinWorkflow = WorkflowState<MunchkinContext>

export const MUNCHKIN_TEMPLATE = {
  id: 'munchkin',
  name: 'Munchkin-style',
  description: 'Levels, gear, turns and optional combat resolution for dungeon-style card games.',
  victoryLevel: 10,
} as const

export function createMunchkinWorkflow(): MunchkinWorkflow {
  return createWorkflowState<MunchkinContext>({ combat: null })
}

export function playerPower(player: Pick<CompanionPlayer, 'level' | 'gear'>): number {
  return player.level + player.gear
}

export function startCombat(workflow: MunchkinWorkflow, monsterLevel: number): MunchkinWorkflow {
  if (workflow.phase !== 'turn' || !Number.isFinite(monsterLevel) || monsterLevel < 0) return workflow
  return {
    ...workflow,
    phase: 'event',
    context: { ...workflow.context, combat: { monsterLevel: Math.trunc(monsterLevel), helperIds: [], rewardLevels: 1, rewardTreasures: 1 } },
  }
}

export function addCombatHelper(workflow: MunchkinWorkflow, playerId: string): MunchkinWorkflow {
  const combat = workflow.context.combat
  if (workflow.phase !== 'event' || !combat || !playerId || combat.helperIds.includes(playerId)) return workflow
  return { ...workflow, context: { ...workflow.context, combat: { ...combat, helperIds: [...combat.helperIds, playerId] } } }
}

export function resolveCombat(workflow: MunchkinWorkflow, players: CompanionPlayer[]) {
  const combat = workflow.context.combat
  if (workflow.phase !== 'event' || !combat || !workflow.activePlayerId) return { workflow, winner: false, totalPower: 0 }
  const ids = [workflow.activePlayerId, ...combat.helperIds]
  const totalPower = players.filter((player) => ids.includes(player.id)).reduce((total, player) => total + playerPower(player), 0)
  return {
    workflow: { ...workflow, phase: 'turn' as const, context: { ...workflow.context, combat: null } },
    winner: totalPower > combat.monsterLevel,
    totalPower,
  }
}
