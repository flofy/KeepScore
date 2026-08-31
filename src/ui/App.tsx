import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, TouchEvent } from 'react'
import type { Game } from '../domain/game/types'
import { GameSetup } from './GameSetup'
import { SavedGames } from './SavedGames'
import { localGameRepository } from '../infrastructure/persistence/gameRepository'
import { downloadGames, importGames } from '../infrastructure/portability/gamesPortability'
import { useGameHistory } from './useGameHistory'
import './saved-games.css'

function haptic() { if ('vibrate' in navigator) navigator.vibrate(8) }
type Screen = 'game' | 'saved'

function GameScreen({ initialGame, onNewGame, onSavedGames }: { initialGame: Game; onNewGame: () => void; onSavedGames: () => void }) {
  const { present: game, past, future, dispatch, undo, redo } = useGameHistory(initialGame)
  const touchStart = useRef<{ x: number; y: number; playerId: string } | null>(null)
  const [editingEntry, setEditingEntry] = useState<string | null>(null)
  const [draftDelta, setDraftDelta] = useState('')
  const onTouchStart = (event: TouchEvent<HTMLElement>, playerId: string) => { const touch = event.changedTouches[0]; touchStart.current = { x: touch.clientX, y: touch.clientY, playerId } }
  const onTouchEnd = (event: TouchEvent<HTMLElement>) => { const start = touchStart.current; if (!start) return; touchStart.current = null; const touch = event.changedTouches[0]; const dx = touch.clientX - start.x; const dy = touch.clientY - start.y; if (Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy) * 1.25) return; dispatch({ type: 'ADD_SCORE', playerId: start.playerId, delta: dx > 0 ? 1 : -1 }); haptic() }
  const beginEdit = (id: string, delta: number) => { setEditingEntry(id); setDraftDelta(String(delta)) }
  const saveEdit = () => { if (!editingEntry) return; const delta = Number(draftDelta); if (Number.isFinite(delta) && delta !== 0) dispatch({ type: 'EDIT_HISTORY_ENTRY', entryId: editingEntry, delta }); setEditingEntry(null) }
  return <main className="app-shell">
    <header className="app-header"><div><p className="eyebrow">SCORE KEEPER</p><h1>{game.name || 'KeepScore'}</h1></div><div className="toolbar"><button className="secondary-button" type="button" onClick={undo} disabled={!past.length}>Undo</button><button className="secondary-button" type="button" onClick={redo} disabled={!future.length}>Redo</button><button className="secondary-button" type="button" onClick={onSavedGames}>Saved games</button><button className="secondary-button" type="button" onClick={onNewGame}>New game</button></div></header>
    <section className="players" aria-label="Players">{game.players.map((player) => <article className="player-card" key={player.id} onTouchStart={(event) => onTouchStart(event, player.id)} onTouchEnd={onTouchEnd}><input className="player-name" value={player.name} onChange={(event) => dispatch({ type: 'RENAME_PLAYER', playerId: player.id, name: event.target.value })} aria-label={`${player.name} name`} /><strong>{player.score}</strong><div className="score-actions"><button type="button" onClick={() => { dispatch({ type: 'ADD_SCORE', playerId: player.id, delta: -1 }); haptic() }} aria-label={`Remove one point from ${player.name}`}>−</button><button type="button" onClick={() => { dispatch({ type: 'ADD_SCORE', playerId: player.id, delta: 1 }); haptic() }} aria-label={`Add one point to ${player.name}`}>+</button></div></article>)}</section>
    <section className="history" aria-label="Score history"><div className="section-heading"><h2>History</h2><span>{game.history.length} moves</span></div>{game.history.length === 0 ? <p className="empty-state">Score changes will appear here.</p> : <ol>{[...game.history].reverse().map((entry) => { const player = game.players.find((candidate) => candidate.id === entry.playerId); return <li key={entry.id}><span>{player?.name} <strong>{entry.delta > 0 ? '+' : ''}{entry.delta}</strong></span><span className="history-actions"><button type="button" className="secondary-button" onClick={() => beginEdit(entry.id, entry.delta)}>Edit</button><button type="button" className="secondary-button" onClick={() => dispatch({ type: 'DELETE_HISTORY_ENTRY', entryId: entry.id })}>Delete</button></span>{editingEntry === entry.id && <span className="history-editor"><input autoFocus type="number" value={draftDelta} onChange={(event) => setDraftDelta(event.target.value)} aria-label="New score delta"/><button type="button" className="secondary-button" onClick={saveEdit}>Save</button><button type="button" className="secondary-button" onClick={() => setEditingEntry(null)}>Cancel</button></span>}</li> })}</ol>}</section>
  </main>
}

export function App() {
  const [screen, setScreen] = useState<Screen>('game')
  const [game, setGame] = useState<Game | undefined>(() => localGameRepository.list()[0])
  const [games, setGames] = useState<Game[]>(() => localGameRepository.list())
  const [portabilityError, setPortabilityError] = useState('')
  const importInput = useRef<HTMLInputElement>(null)

  useEffect(() => { if (screen === 'saved') setGames(localGameRepository.list()) }, [screen, game])

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const imported = importGames(await file.text())
      imported.forEach((item) => localGameRepository.save(item))
      setGames(localGameRepository.list())
      setGame(imported[0] ?? game)
      setPortabilityError('')
    } catch (error) {
      setPortabilityError(error instanceof Error ? error.message : 'Unable to import this file.')
    }
  }

  if (screen === 'saved') return <main className="app-shell"><header className="app-header"><div><p className="eyebrow">SCORE KEEPER</p><h1>Saved games</h1></div><div className="toolbar"><button className="secondary-button" type="button" onClick={() => downloadGames(localGameRepository.list())}>Export</button><button className="secondary-button" type="button" onClick={() => importInput.current?.click()}>Import</button><button className="secondary-button" type="button" onClick={() => setScreen('game')}>Back</button></div></header><input ref={importInput} hidden type="file" accept="application/json,.json" onChange={handleImport}/>{portabilityError && <p role="alert" className="empty-state">{portabilityError}</p>}<SavedGames games={games} onResume={(selected) => { setGame(selected); setScreen('game') }} onDelete={(id) => { localGameRepository.remove(id); setGames(localGameRepository.list()) }} onNewGame={() => { setGame(undefined); setScreen('game') }} /></main>
  if (!game) return <GameSetup onCreate={setGame} />
  return <GameScreen initialGame={game} onNewGame={() => setGame(undefined)} onSavedGames={() => setScreen('saved')} />
}
