import { useState } from 'react'
import type { Game } from '../domain/game/types'
import { gameReducer } from '../domain/game/gameReducer'

const initialGame: Game = {
  id: crypto.randomUUID(),
  players: [
    { id: crypto.randomUUID(), name: 'Player 1', score: 0 },
    { id: crypto.randomUUID(), name: 'Player 2', score: 0 },
  ],
  history: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

export function App() {
  const [game, setGame] = useState(initialGame)

  const changeScore = (playerId: string, delta: number) => {
    setGame((current) => gameReducer(current, { type: 'ADD_SCORE', playerId, delta }))
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">SCORE KEEPER</p>
          <h1>KeepScore</h1>
        </div>
        <button className="secondary-button" type="button">New game</button>
      </header>

      <section className="players" aria-label="Players">
        {game.players.map((player) => (
          <article className="player-card" key={player.id}>
            <h2>{player.name}</h2>
            <strong>{player.score}</strong>
            <div className="score-actions">
              <button type="button" onClick={() => changeScore(player.id, -1)} aria-label={`Remove one point from ${player.name}`}>−</button>
              <button type="button" onClick={() => changeScore(player.id, 1)} aria-label={`Add one point to ${player.name}`}>+</button>
            </div>
          </article>
        ))}
      </section>

      <section className="history" aria-label="Score history">
        <div className="section-heading">
          <h2>History</h2>
          <span>{game.history.length} moves</span>
        </div>
        {game.history.length === 0 ? (
          <p className="empty-state">Score changes will appear here.</p>
        ) : (
          <ol>
            {[...game.history].reverse().map((entry) => {
              const player = game.players.find((candidate) => candidate.id === entry.playerId)
              return <li key={entry.id}>{player?.name} <strong>{entry.delta > 0 ? '+' : ''}{entry.delta}</strong></li>
            })}
          </ol>
        )}
      </section>
    </main>
  )
}
