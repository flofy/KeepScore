import { describe, expect, it } from 'vitest'
import { createGame } from './gameFactory'
import { addCombatHelper, createMunchkinWorkflow, playerPower, resolveCombat, startCombat, type CompanionPlayer } from './munchkin'
import { reduceWorkflow } from './workflow'

describe('munchkin-style workflow', () => {
  it('starts the first turn', () => {
    const game = createGame(['Alice', 'Bob'])
    const started = reduceWorkflow(createMunchkinWorkflow(), { type: 'START', playerId: game.players[0].id })
    expect(started).toMatchObject({ phase: 'turn', activePlayerId: game.players[0].id, turn: 1 })
  })

  it('calculates power from level and gear', () => {
    expect(playerPower({ level: 7, gear: 4 })).toBe(11)
  })

  it('opens combat and allows one helper', () => {
    const game = createGame(['Alice', 'Bob'])
    const started = reduceWorkflow(createMunchkinWorkflow(), { type: 'START', playerId: game.players[0].id })
    const assisted = addCombatHelper(startCombat(started, 12), game.players[1].id)
    expect(assisted.phase).toBe('event')
    expect(assisted.context.combat).toMatchObject({ monsterLevel: 12, helperIds: [game.players[1].id] })
  })

  it('resolves a winning combat and returns to the turn', () => {
    const game = createGame(['Alice', 'Bob'])
    const players: CompanionPlayer[] = game.players.map((player, index) => ({ ...player, level: index === 0 ? 7 : 4, gear: index === 0 ? 3 : 2 }))
    const started = reduceWorkflow(createMunchkinWorkflow(), { type: 'START', playerId: players[0].id })
    const combat = addCombatHelper(startCombat(started, 14), players[1].id)
    const result = resolveCombat(combat, players)
    expect(result).toMatchObject({ winner: true, totalPower: 16 })
    expect(result.workflow.phase).toBe('turn')
    expect(result.workflow.context.combat).toBeNull()
  })
})
