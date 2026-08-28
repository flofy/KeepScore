import { useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { Game } from '../domain/game/types'
import { GameSetup } from './GameSetup'
import { localGameRepository } from '../infrastructure/persistence/gameRepository'
import { useGameHistory } from './useGameHistory'

function haptic() {
  if ('vibrate' in navigator) navigator.vibrate(8)
}

function GameScreen({ initialGame, onNewGame }: { initialGame: Game; onNewGame: () => void }) {
  const { present: game, past, future, dispatch, undo, redo } = useGameHistory(initialGame)
  const touchStart = useRef<{ x: number; y: number; playerId: string } | null>(null)

  const onTouchStart = (event: TouchEvent<HTMLElement>, playerId: string) => {
    const touch = event.changedTouches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY, playerId }
  }

  const onTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const start = touchStart.current
    if (!start) return
    touchStart.current = null
    const touch = event.changedTouches[0]
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    if (Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy) * 1.25) return
    dispatch({ type: 'ADD_SCORE', playerId: start.playerId, delta: dx > 0 ? 1 : -1 })
    haptic()
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div><p className="eyebrow">SCORE KEEPER</p><h1>{game.name || 'KeepScore'}</h1></div>
        <div className="toolbar">
          <button className="secondary-button" type="button" onClick={undo} disabled={!past.length}>Undo</button>
          <button className="secondary-button" type="button" onClick={redo} disabled={!future.length}>Redo</button>
          <button className="secondary-button" type="button" onClick={onNewGame}>New game</button>
        </div>
      </header>
      <section className="players" aria-label="Players">
        {game.players.map((player) => (
          <article className="player-card" key={player.id} onTouchStart={(event) => onTouchStart(event, player.id)} onTouchEnd={onTouchEnd}>
            <input className="player-name" value={player.name} onChange={(event) => dispatch({ type: 'RENAME_PLAYER', playerId: player.id, name: event.target.value })} aria-label={`${player.name} name`} />
            <strong>{player.score}</strong>
            <div className="score-actions">
              <button type="button" onClick={() => { dispatch({ type: 'ADD_SCORE', playerId: player.id, delta: -1 }); haptic() }} aria-label={`Remove one point from ${player.name}`}>−</button>
              <button type="button" onClick={() => { dispatch({ type: 'ADD_SCORE', playerId: player.id, delta: 1 }); haptic() }} aria-label={`Add one point to ${player.name}`}>+</button>
            </div>
          </article>
        ))}
      </section>
      <section className="history" aria-label="Score history">
        <div className="section-heading"><h2>History</h2><span>{game.history.length} moves</span></div>
        {game.history.length === 0 ? <p className="empty-state">Score changes will appear here.</p> : <ol>{[...game.history].reverse().map((entry) => {
          const player = game.players.find((candidate) => candidate.id === entry.playerId)
          return <li key={entry.id}>{player?.name} <strong>{entry.delta > 0 ? '+' : ''}{entry.delta}</strong></li>
        })}</ol>}
      </section>
    </main>
  )
}

export function App() {
  const [game, setGame] = useState<Game | undefined>(() => localGameRepository.list()[0])
  if (!game) return <GameSetup onCreate={setGame} />
  return <GameScreen initialGame={game} onNewGame={() => setGame(undefined)} />
}
