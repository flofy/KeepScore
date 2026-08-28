import { useState } from 'react'
import type { Game } from '../domain/game/types'
import { gameReducer } from '../domain/game/gameReducer'
import { GameSetup } from './GameSetup'

export function App() {
  const [game, setGame] = useState<Game | null>(null)

  if (!game) {
    return <GameSetup onCreate={setGame} />
  }

  const changeScore = (playerId: string, delta: number) => {
    setGame((current) => current && gameReducer(current, { type: 'ADD_SCORE', playerId, delta }))
  }

  const renamePlayer = (playerId: string, name: string) => {
    setGame((current) => current && gameReducer(current, { type: 'RENAME_PLAYER', playerId, name }))
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">SCORE KEEPER</p>
          <h1>{game.name || 'KeepScore'}</h1>
        </div>
        <button className="secondary-button" type="button" onClick={() => setGame(null)}>New game</button>
      </header>

      <section className="players" aria-label="Players">
        {game.players.map((player) => (
          <article className="player-card" key={player.id}>
            <input className="player-name" value={player.name} onChange={(event) => renamePlayer(player.id, event.target.value)} aria-label="Player name" />
            <strong>{player.score}</strong>
            <div className="score-actions">
              <button type="button" onClick={() => changeScore(player.id, -1)} aria-label={`Remove one point from ${player.name}`}>−</button>
              <button type="button" onClick={() => changeScore(player.id, 1)} aria-label={`Add one point to ${player.name}`}>+</button>
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
