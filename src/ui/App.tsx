import { useState } from 'react'
import type { Game } from '../domain/game/types'
import { GameSetup } from './GameSetup'
import { useGameHistory } from './useGameHistory'
import { localGameRepository } from '../infrastructure/persistence/gameRepository'

type Props = { initialGame?: Game }

function GameScreen({ initialGame, onNewGame }: { initialGame: Game; onNewGame: () => void }) {
  const { present: game, past, future, dispatch, undo, redo } = useGameHistory(initialGame)

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">SCORE KEEPER</p>
          <h1>{game.name || 'KeepScore'}</h1>
        </div>
        <div className="toolbar">
          <button className="secondary-button" type="button" onClick={undo} disabled={!past.length}>Undo</button>
          <button className="secondary-button" type="button" onClick={redo} disabled={!future.length}>Redo</button>
          <button className="secondary-button" type="button" onClick={onNewGame}>New game</button>
        </div>
      </header>

      <section className="players" aria-label="Players">
        {game.players.map((player) => (
          <article className="player-card" key={player.id}>
            <input className="player-name" value={player.name} onChange={(event) => dispatch({ type: 'RENAME_PLAYER', playerId: player.id, name: event.target.value })} aria-label={`${player.name} name`} />
            <strong>{player.score}</strong>
            <div className="score-actions">
              <button type="button" onClick={() => dispatch({ type: 'ADD_SCORE', playerId: player.id, delta: -1 })} aria-label={`Remove one point from ${player.name}`}>−</button>
              <button type="button" onClick={() => dispatch({ type: 'ADD_SCORE', playerId: player.id, delta: 1 })} aria-label={`Add one point to ${player.name}`}>+</button>
            </div>
          </article>
        ))}
      </section>

      <section className="history" aria-label="Score history">
        <div className="section-heading"><h2>History</h2><span>{game.history.length} moves</span></div>
        {game.history.length === 0 ? <p className="empty-state">Score changes will appear here.</p> : (
          <ol>{[...game.history].reverse().map((entry) => {
            const player = game.players.find((candidate) => candidate.id === entry.playerId)
            return <li key={entry.id}>{player?.name} <strong>{entry.delta > 0 ? '+' : ''}{entry.delta}</strong></li>
          })}</ol>
        )}
      </section>
    </main>
  )
}

export function App() {
  const [game, setGame] = useState<Game | undefined>(() => localGameRepository.list()[0])
  if (!game) return <GameSetup onCreate={(created) => setGame(created)} />
  return <GameScreen initialGame={game} onNewGame={() => setGame(undefined)} />
}
