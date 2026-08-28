import { useState } from 'react'
import { createGame } from '../domain/game/gameFactory'
import type { Game } from '../domain/game/types'

type Props = { onCreate: (game: Game) => void }

export function GameSetup({ onCreate }: Props) {
  const [names, setNames] = useState(['Alice', 'Bob'])
  const [gameName, setGameName] = useState('')

  function updateName(index: number, value: string) {
    setNames((current) => current.map((name, i) => (i === index ? value : name)))
  }

  function addPlayer() {
    setNames((current) => [...current, `Player ${current.length + 1}`])
  }

  function removePlayer(index: number) {
    if (names.length <= 2) return
    setNames((current) => current.filter((_, i) => i !== index))
  }

  function startGame() {
    onCreate(createGame(names, gameName))
  }

  return (
    <main className="setup">
      <header>
        <p className="eyebrow">KeepScore</p>
        <h1>New game</h1>
        <p className="muted">Add the players and start scoring.</p>
      </header>

      <label>
        Game name <span className="optional">optional</span>
        <input value={gameName} onChange={(event) => setGameName(event.target.value)} placeholder="Friday night" />
      </label>

      <section>
        <div className="section-heading"><h2>Players</h2><span>{names.length}</span></div>
        <div className="player-list">
          {names.map((name, index) => (
            <div className="player-editor" key={index}>
              <input value={name} onChange={(event) => updateName(index, event.target.value)} aria-label={`Player ${index + 1} name`} />
              <button className="icon-button" onClick={() => removePlayer(index)} disabled={names.length <= 2} aria-label={`Remove player ${index + 1}`}>×</button>
            </div>
          ))}
        </div>
        <button className="secondary" onClick={addPlayer}>+ Add player</button>
      </section>

      <button className="primary" onClick={startGame}>Start game</button>
    </main>
  )
}
