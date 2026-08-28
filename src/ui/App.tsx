import { useEffect, useState } from 'react'
import type { Game } from '../domain/game/types'
import { GameSetup } from './GameSetup'
import { gameReducer } from '../domain/game/gameReducer'
import { applyHistory, createHistoryState, redoHistory, undoHistory, type HistoryState } from '../domain/game/history'
import { localGameRepository } from '../infrastructure/persistence/gameRepository'

export function App() {
  const [state, setState] = useState<HistoryState | null>(() => {
    const saved = localGameRepository.list()[0]
    return saved ? createHistoryState(saved) : null
  })

  useEffect(() => {
    if (state) localGameRepository.save(state.present)
  }, [state])

  if (!state) return <GameSetup onCreate={(game) => setState(createHistoryState(game))} />

  const dispatch = (action: Parameters<typeof gameReducer>[1]) => {
    setState((current) => {
      if (!current) return current
      const next = gameReducer(current.present, action)
      return next === current.present ? current : applyHistory(current, next)
    })
  }

  const undo = () => setState((current) => current ? undoHistory(current) : current)
  const redo = () => setState((current) => current ? redoHistory(current) : current)
  const newGame = () => setState(null)

  return (
    <main className="app-shell">
      <header className="app-header">
        <div><p className="eyebrow">SCORE KEEPER</p><h1>{state.present.name || 'KeepScore'}</h1></div>
        <div className="toolbar">
          <button className="secondary-button" type="button" onClick={undo} disabled={!state.past.length}>Undo</button>
          <button className="secondary-button" type="button" onClick={redo} disabled={!state.future.length}>Redo</button>
          <button className="secondary-button" type="button" onClick={newGame}>New game</button>
        </div>
      </header>
      <section className="players" aria-label="Players">
        {state.present.players.map((player) => (
          <article className="player-card" key={player.id}>
            <input className="player-name" value={player.name} onChange={(event) => dispatch({ type: 'RENAME_PLAYER', playerId: player.id, name: event.target.value })} aria-label="Player name" />
            <strong>{player.score}</strong>
            <div className="score-actions">
              <button type="button" onClick={() => dispatch({ type: 'ADD_SCORE', playerId: player.id, delta: -1 })}>−</button>
              <button type="button" onClick={() => dispatch({ type: 'ADD_SCORE', playerId: player.id, delta: 1 })}>+</button>
            </div>
          </article>
        ))}
      </section>
      <section className="history" aria-label="Score history">
        <div className="section-heading"><h2>History</h2><span>{state.present.history.length} moves</span></div>
        {state.present.history.length === 0 ? <p className="empty-state">Score changes will appear here.</p> : <ol>{[...state.present.history].reverse().map((entry) => { const player = state.present.players.find((candidate) => candidate.id === entry.playerId); return <li key={entry.id}>{player?.name} <strong>{entry.delta > 0 ? '+' : ''}{entry.delta}</strong></li> })}</ol>}
      </section>
    </main>
  )
}
