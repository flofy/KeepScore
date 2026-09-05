import { describe, expect, it } from 'vitest'
import { createGame } from './gameFactory'
import {
  addCombatHelper,
  createMunchkinWorkflow,
  playerPower,
  resolveCombat,
  startCombat,
  type CompanionPlayer,
} from './munchkin'
import { reduceWorkflow } from './workflow'

describe('munchkin-style workflow', () => {
  it('starts with setup state and enters the first turn', () => {
    const game = createGame(['Alice', 'Bob'])
    const initial = createMunchkinWorkflow()
    const started = reduceWorkflow(initial, { type: 'START', playerId: game.players[0].id })

    expect(started.phase).toBe('turn')
    expect(started.activePlayerId).toBe(game.players[0].id)
    expect(started.turn).toBe(1)
  })

  it('calculates power from level and gear', () => {
    expect(playerPower({ level: 7, gear: 4 })).toBe(11)
  })

  it('opens combat and allows another player to help', () => {
    const game = createGame(['Alice', 'Bob'])
    const started = reduceWorkflow(createMunchkinWorkflow(), { type: 'START', playerId: game.players[0].id })
    const combat = startCombat(started, 12)
    const assisted = addCombatHelper(combat, game.players[1].id)

    expect(assisted.phase).toBe('event')
    expect(assisted.context.combat?.monsterLevel).toBe(12)
    expect(assisted.context.combat?.helperIds).toEqual([game.players[1].id])
  })

  it('resolves a winning combat and returns to the turn', () => {
    const game = createGame(['Alice', 'Bob'])
    const players: CompanionPlayer[] = game.players.map((player, index) => ({
      ...player,
      level: index === 0 ? 7 : 4,
      gear: index === 0 ? 3 : 2,
    }))
    const started = reduceWorkflow(createMunchkinWorkflow(), { type: 'START', playerId: players[0].id })
    const combat = addCombatHelper(startCombat(started, 14), players[1].id)
    const result = resolveCombat(combat, players)

    expect(result.winner).toBe(true)
    expect(result.totalPower).toBe(16)
    expect(result.workflow.phase).toBe('turn')
    expect(result.workflow.context.combat).toBeNull()
  })

  it('does not resolve a combat while no combat is active', () => {
    const game = createGame(['Alice'])
    const result = resolveCombat(createMunchkinWorkflow(), game.players.map((player) => ({ ...player, level: 1, gear: 0 })))
    expect(result.winner).toBe(false)
    expect(result.totalPower).toBe(0)
  })
})
