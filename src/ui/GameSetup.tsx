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
  function addPlayer() { setNames((current) => [...current, 'Player ' + (current.length + 1)]) }
  function removePlayer(index: number) {
    if (names.length <= 2) return
    setNames((current) => current.filter((_, i) => i !== index))
  }
  function startGame() { onCreate(createGame(names.map((name) => name.trim()).filter(Boolean), gameName.trim())) }

  return (
    <main className="setup">
      <div className="setup-card">
        <header className="setup-header">
          <p className="eyebrow">KEEP SCORE</p>
          <h1>New game</h1>
          <p className="muted">Set up your players, then let the score battle begin.</p>
        </header>
        <section className="setup-section">
          <label className="field-label" htmlFor="game-name"><span>Game name</span><span className="optional">Optional</span></label>
          <input id="game-name" className="setup-input" value={gameName} onChange={(event) => setGameName(event.target.value)} placeholder="Friday night" />
        </section>
        <section className="setup-section">
          <div className="section-heading"><div><p className="field-kicker">PLAYERS</p><h2>Who's playing?</h2></div><span className="player-count">{names.length}</span></div>
          <div className="player-list">
            {names.map((name, index) => (
              <div className="player-editor" key={index}>
                <span className="player-number">{index + 1}</span>
                <input value={name} onChange={(event) => updateName(index, event.target.value)} aria-label={'Player ' + (index + 1) + ' name'} />
                <button className="icon-button" type="button" onClick={() => removePlayer(index)} disabled={names.length <= 2} aria-label={'Remove player ' + (index + 1)}>×</button>
              </div>
            ))}
          </div>
          <button className="add-player-button" type="button" onClick={addPlayer}>+ Add player</button>
        </section>
        <button className="primary-button" type="button" onClick={startGame}>Start game <span>→</span></button>
      </div>
    </main>
  )
}
