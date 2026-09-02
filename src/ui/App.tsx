import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import type { Game, Player } from '../domain/game/types'
import { GameSetup } from './GameSetup'
import { SavedGames } from './SavedGames'
import { localGameRepository } from '../infrastructure/persistence/gameRepository'
import { downloadGames, importGames } from '../infrastructure/portability/gamesPortability'
import { useGameHistory } from './useGameHistory'
import { InstallButton } from './InstallButton'
import './saved-games.css'

function haptic() { if ('vibrate' in navigator) navigator.vibrate(8) }
type Screen = 'game' | 'saved'

type PlayerCardProps = {
  player: Player
  flipped?: boolean
  lastDelta?: number
  onRename: (name: string) => void
  onDelta: (delta: number) => void
  onQuickDelta: (delta: number) => void
}

function PlayerCard({ player, flipped = false, lastDelta, onRename, onDelta, onQuickDelta }: PlayerCardProps) {
  const longPressTimer = useRef<number | null>(null)
  const longPressOrigin = useRef<{ x: number; y: number } | null>(null)
  const [quickOpen, setQuickOpen] = useState(false)
  const clearLongPress = () => { if (longPressTimer.current !== null) { clearTimeout(longPressTimer.current); longPressTimer.current = null } longPressOrigin.current = null }
  const startLongPress = (event: ReactPointerEvent<HTMLElement>) => {
    longPressOrigin.current = { x: event.clientX, y: event.clientY }
    longPressTimer.current = window.setTimeout(() => { setQuickOpen(true); haptic() }, 500)
  }
  const moveLongPress = (event: ReactPointerEvent<HTMLElement>) => {
    if (!longPressOrigin.current) return
    if (Math.hypot(event.clientX - longPressOrigin.current.x, event.clientY - longPressOrigin.current.y) > 10) clearLongPress()
  }
  const quick = (delta: number) => { onQuickDelta(delta); setQuickOpen(false) }
  const showPositive = lastDelta === undefined || lastDelta > 0
  const showNegative = lastDelta === undefined || lastDelta < 0
  const popupClass = 'score-popup' + (lastDelta === undefined ? '' : lastDelta > 0 ? ' positive' : ' negative')
  return (
    <article
      className={flipped ? 'player-card flipped' : 'player-card'}
      style={{ '--player-color': player.color ?? '#38bdf8' } as CSSProperties}
      onPointerDown={startLongPress}
      onPointerMove={moveLongPress}
      onPointerUp={clearLongPress}
      onPointerLeave={clearLongPress}
      onPointerCancel={clearLongPress}
      onContextMenu={(event) => { event.preventDefault(); clearLongPress() }}
    >
      <input className="player-name" value={player.name} onChange={(event) => onRename(event.target.value)} aria-label={`${player.name} name`} />
      <strong>{player.score}</strong>
      <div className="score-actions">
        <button type="button" onClick={() => onDelta(-1)} aria-label={`Remove one point from ${player.name}`}>−</button>
        <button type="button" onClick={() => onDelta(1)} aria-label={`Add one point to ${player.name}`}>+</button>
      </div>
      {quickOpen && (
        <div className={popupClass} role="menu" aria-label={`Quick score change for ${player.name}`}>
          {showNegative && <button type="button" role="menuitem" onClick={() => quick(-10)}>−10</button>}
          {showNegative && <button type="button" role="menuitem" onClick={() => quick(-5)}>−5</button>}
          {showPositive && <button type="button" role="menuitem" onClick={() => quick(5)}>+5</button>}
          {showPositive && <button type="button" role="menuitem" onClick={() => quick(10)}>+10</button>}
          <button type="button" className="score-cancel" role="menuitem" onClick={() => setQuickOpen(false)}>Cancel</button>
        </div>
      )}
    </article>
  )
}

function GameScreen({ initialGame, onNewGame, onSavedGames }: { initialGame: Game; onNewGame: () => void; onSavedGames: () => void }) {
  const { present: game, past, future, dispatch, undo, redo } = useGameHistory(initialGame)
  const [editingEntry, setEditingEntry] = useState<string | null>(null)
  const [draftDelta, setDraftDelta] = useState('')
  const [topFlipped, setTopFlipped] = useState(true)
  const [fullscreen, setFullscreen] = useState(() => localStorage.getItem('keepscore-fullscreen') === '1')
  const [menuOpen, setMenuOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const isDuo = game.players.length === 2
  useEffect(() => { localStorage.setItem('keepscore-fullscreen', fullscreen ? '1' : '0') }, [fullscreen])
  const beginEdit = (id: string, delta: number) => { setEditingEntry(id); setDraftDelta(String(delta)) }
  const saveEdit = () => { if (!editingEntry) return; const delta = Number(draftDelta); if (Number.isFinite(delta) && delta !== 0) dispatch({ type: 'EDIT_HISTORY_ENTRY', entryId: editingEntry, delta }); setEditingEntry(null) }
  const lastDeltaFor = (playerId: string) => { for (let i = game.history.length - 1; i >= 0; i -= 1) { if (game.history[i].playerId === playerId) return game.history[i].delta } return undefined }
  const historyContent = <section className="history" aria-label="Score history"><div className="section-heading"><h2>History</h2><span>{game.history.length} moves</span></div>{game.history.length === 0 ? <p className="empty-state">Score changes will appear here.</p> : <ol>{[...game.history].reverse().map((entry) => { const player = game.players.find((candidate) => candidate.id === entry.playerId); return <li key={entry.id}><span>{player?.name} <strong>{entry.delta > 0 ? '+' : ''}{entry.delta}</strong></span><span className="history-actions"><button type="button" className="secondary-button" onClick={() => beginEdit(entry.id, entry.delta)}>Edit</button><button type="button" className="secondary-button" onClick={() => dispatch({ type: 'DELETE_HISTORY_ENTRY', entryId: entry.id })}>Delete</button></span>{editingEntry === entry.id && <span className="history-editor"><input autoFocus type="number" value={draftDelta} onChange={(event) => setDraftDelta(event.target.value)} aria-label="New score delta"/><button type="button" className="secondary-button" onClick={saveEdit}>Save</button><button type="button" className="secondary-button" onClick={() => setEditingEntry(null)}>Cancel</button></span>}</li> })}</ol>}</section>
  return <main className={fullscreen ? 'app-shell fullscreen' : 'app-shell'}>
    <header className="app-header"><div><p className="eyebrow">SCORE KEEPER</p><h1>{game.name || 'KeepScore'}</h1></div><div className="toolbar"><InstallButton/><button className="secondary-button" type="button" onClick={undo} disabled={!past.length}>Undo</button><button className="secondary-button" type="button" onClick={redo} disabled={!future.length}>Redo</button><button className="secondary-button" type="button" onClick={onSavedGames}>Saved games</button><button className="secondary-button" type="button" onClick={onNewGame}>New game</button></div></header>
    <button className="burger-button" type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu">☰</button>
    {menuOpen && (
      <div className="drawer-backdrop" onClick={() => setMenuOpen(false)}>
        <nav className="menu-drawer" aria-label="Main menu" onClick={(event) => event.stopPropagation()}>
          <button className="menu-item menu-close" type="button" onClick={() => setMenuOpen(false)}>✕ Close</button>
          <button className="menu-item" type="button" onClick={() => { setFullscreen((current) => !current); setMenuOpen(false) }}>{fullscreen ? '⤢ Exit fullscreen' : '⤢ Fullscreen'}</button>
          <button className="menu-item" type="button" onClick={() => { setHistoryOpen((current) => !current); setMenuOpen(false) }}>🕘 History</button>
          <button className="menu-item" type="button" onClick={() => { undo(); setMenuOpen(false) }} disabled={!past.length}>↩ Undo</button>
          <button className="menu-item" type="button" onClick={() => { redo(); setMenuOpen(false) }} disabled={!future.length}>↪ Redo</button>
          <button className="menu-item" type="button" onClick={() => { setMenuOpen(false); onSavedGames() }}>💾 Saved games</button>
          <button className="menu-item" type="button" onClick={() => { setMenuOpen(false); onNewGame() }}>➕ New game</button>
        </nav>
      </div>
    )}
    <section className={isDuo ? 'players duo' : 'players'} aria-label="Players">{game.players.map((player, index) => <PlayerCard key={player.id} player={player} flipped={isDuo && index === 0 && topFlipped} lastDelta={lastDeltaFor(player.id)} onRename={(name) => dispatch({ type: 'RENAME_PLAYER', playerId: player.id, name })} onDelta={(delta) => { dispatch({ type: 'ADD_SCORE', playerId: player.id, delta }); haptic() }} onQuickDelta={(delta) => { dispatch({ type: 'ADD_SCORE', playerId: player.id, delta }); haptic() }} />)}{isDuo && <button className="rotate-toggle" type="button" onClick={() => setTopFlipped((current) => !current)} aria-pressed={topFlipped} aria-label="Toggle flipped score for the top player">⇅</button>}</section>
    {!fullscreen && historyContent}
    {fullscreen && historyOpen && (
      <div className="drawer-backdrop" onClick={() => setHistoryOpen(false)}>
        <div className="history-drawer" role="dialog" aria-label="Score history" onClick={(event) => event.stopPropagation()}>{historyContent}</div>
      </div>
    )}
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

  if (screen === 'saved') return <main className="app-shell"><header className="app-header"><div><p className="eyebrow">SCORE KEEPER</p><h1>Saved games</h1></div><div className="toolbar"><InstallButton/><button className="secondary-button" type="button" onClick={() => downloadGames(localGameRepository.list())}>Export</button><button className="secondary-button" type="button" onClick={() => importInput.current?.click()}>Import</button><button className="secondary-button" type="button" onClick={() => setScreen('game')}>Back</button></div></header><input ref={importInput} hidden type="file" accept="application/json,.json" onChange={handleImport}/>{portabilityError && <p role="alert" className="empty-state">{portabilityError}</p>}<SavedGames games={games} onResume={(selected) => { setGame(selected); setScreen('game') }} onDelete={(id) => { localGameRepository.remove(id); setGames(localGameRepository.list()) }} /></main>
  if (!game) return <GameSetup onCreate={setGame} />
  return <GameScreen initialGame={game} onNewGame={() => setGame(undefined)} onSavedGames={() => setScreen('saved')} />
}
