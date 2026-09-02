import { useState } from 'react'
import { createGame } from '../domain/game/gameFactory'
import { PLAYER_COLORS, colorForIndex } from '../domain/game/colors'
import type { Game } from '../domain/game/types'

type Props = { onCreate: (game: Game) => void }

export function GameSetup({ onCreate }: Props) {
  const [names, setNames] = useState(['Alice', 'Bob'])
  const [colors, setColors] = useState<string[]>(() => names.map((_, index) => colorForIndex(index)))
  const [gameName, setGameName] = useState('')
  const [startingScore, setStartingScore] = useState('0')

  function updateName(index: number, value: string) {
    setNames((current) => current.map((name, i) => (i === index ? value : name)))
  }
  function addPlayer() {
    setNames((current) => [...current, 'Player ' + (current.length + 1)])
    setColors((current) => [...current, colorForIndex(current.length)])
  }
  function removePlayer(index: number) {
    if (names.length <= 1) return
    setNames((current) => current.filter((_, i) => i !== index))
    setColors((current) => current.filter((_, i) => i !== index))
  }
  function setColor(index: number, color: string) {
    setColors((current) => current.map((current_color, i) => (i === index ? color : current_color)))
  }
  function startGame() {
    const parsedStartingScore = Number(startingScore)
    const safeStartingScore = Number.isFinite(parsedStartingScore) ? Math.trunc(parsedStartingScore) : 0
    const playerNames = names.map((name) => name.trim()).filter(Boolean)
    const playerColors = names.map((name, index) => (name.trim() ? colors[index] : undefined)).filter((color): color is string => Boolean(color))
    onCreate(createGame(playerNames, gameName.trim(), safeStartingScore, playerColors))
  }

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
          <label className="field-label" htmlFor="starting-score"><span>Starting score</span><span className="optional">Default 0</span></label>
          <input id="starting-score" className="setup-input" type="number" inputMode="numeric" value={startingScore} onChange={(event) => setStartingScore(event.target.value)} placeholder="0" />
        </section>
        <section className="setup-section">
          <div className="section-heading"><div><p className="field-kicker">PLAYERS</p><h2>Who's playing?</h2></div><span className="player-count">{names.length}</span></div>
          <div className="player-list">
            {names.map((name, index) => (
              <div className="player-editor" key={index}>
                <span className="player-number">{index + 1}</span>
                <input value={name} onChange={(event) => updateName(index, event.target.value)} aria-label={'Player ' + (index + 1) + ' name'} />
                <button className="icon-button" type="button" onClick={() => removePlayer(index)} disabled={names.length <= 1} aria-label={'Remove player ' + (index + 1)}>×</button>
                <div className="color-row" role="radiogroup" aria-label={'Color for player ' + (index + 1)}>
                  {PLAYER_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      role="radio"
                      aria-checked={colors[index] === color}
                      className={colors[index] === color ? 'color-dot selected' : 'color-dot'}
                      style={{ background: color }}
                      onClick={() => setColor(index, color)}
                      aria-label={'Set color ' + color + ' for player ' + (index + 1)}
                    />
                  ))}
                </div>
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
