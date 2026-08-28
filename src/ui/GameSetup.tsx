import { useState } from 'react'
import { createGame } from '../domain/game/gameFactory'
import type { Game } from '../domain/game/types'

type Props = { onCreate: (game: Game) => void }

export function GameSetup({ onCreate }: Props) {
  const [names, setNames] = useState(['Alice', 'Bob'])
  const [gameName, setGameName] = useState('')

  return (
    <main className="setup">
      <header>
        <p className="eyebrow">KeepScore</p>
        <h1>New game</h1>
        <p className="muted">Add the players and start scoring.</p>
      </header>
      <label>Game name <span className="optional">optional</span>
        <input value={gameName} onChange={(event) => setGameName(event.target.value)} placeholder="Friday night" />
      </label>
      <section>
        <div className="section-heading"><h2>Players</h2><span>{names.length}</span></div>
        <div className="player-list">
          {names.map((name, index) => (
            <div className="player-editor" key={index}>
              <input value={name} onChange={(event) => setNames((current) => current.map((n, i) => i === index ? event.target.value : n))} aria-label={`Player ${index + 1} name`} />
              <button className="icon-button" type="button" onClick={() => setNames((current) => current.filter((_, i) => i !== index))} disabled={names.length <= 2} aria-label={`Remove player ${index + 1}`}>×</button>
            </div>
          ))}
        </div>
        <button className="secondary" type="button" onClick={() => setNames((current) => [...current, `Player ${current.length + 1}`])}>+ Add player</button>
      </section>
      <button className="primary" type="button" onClick={() => onCreate(createGame(names, gameName))}>Start game</button>
    </main>
  )
}
