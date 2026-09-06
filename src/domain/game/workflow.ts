export type WorkflowPhase = 'setup' | 'turn' | 'event' | 'finished'

export type WorkflowState<TContext> = {
  phase: WorkflowPhase
  activePlayerId: string | null
  turn: number
  context: TContext
}

export type WorkflowAction =
  | { type: 'START'; playerId: string }
  | { type: 'NEXT_PLAYER'; playerId: string }
  | { type: 'OPEN_EVENT' }
  | { type: 'CLOSE_EVENT' }
  | { type: 'FINISH' }

export function createWorkflowState<TContext>(context: TContext): WorkflowState<TContext> {
  return { phase: 'setup', activePlayerId: null, turn: 0, context }
}

export function reduceWorkflow<TContext>(state: WorkflowState<TContext>, action: WorkflowAction): WorkflowState<TContext> {
  switch (action.type) {
    case 'START':
      if (state.phase !== 'setup' || !action.playerId) return state
      return { ...state, phase: 'turn', activePlayerId: action.playerId, turn: 1 }
    case 'NEXT_PLAYER':
      if (state.phase !== 'turn' || !action.playerId) return state
      return { ...state, activePlayerId: action.playerId, turn: state.turn + 1 }
    case 'OPEN_EVENT':
      if (state.phase !== 'turn') return state
      return { ...state, phase: 'event' }
    case 'CLOSE_EVENT':
      if (state.phase !== 'event') return state
      return { ...state, phase: 'turn' }
    case 'FINISH':
      return { ...state, phase: 'finished' }
  }
}
