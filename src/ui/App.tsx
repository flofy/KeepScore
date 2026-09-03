import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import type { Game, Player } from '../domain/game/types'
import { colorForIndex } from '../domain/game/colors'
import { GameSetup } from './GameSetup'
import { SavedGames } from './SavedGames'
import { localGameRepository } from '../infrastructure/persistence/gameRepository'
import { downloadGames, importGames } from '../infrastructure/portability/gamesPortability'
import { useGameHistory } from './useGameHistory'
import { InstallButton } from './InstallButton'
import { I18nProvider, useI18n } from './i18n'
import { LangFlags } from './LangFlags'
import './saved-games.css'

function haptic() { if ('vibrate' in navigator) navigator.vibrate(8) }
type Screen = 'game' | 'saved'
const RECENT_DELTAS = 6

function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`
}

// Shrinks an element's font-size so its content always fits its available width.
function useFitText<T extends HTMLElement>(content: unknown) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const apply = () => {
      const avail = el.clientWidth
      const natural = el.scrollWidth
      if (natural > avail && avail > 0) {
        const current = parseFloat(window.getComputedStyle(el).fontSize)
        el.style.fontSize = `${Math.max(12, current * (avail / natural))}px`
      }
    }
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(el)
    return () => observer.disconnect()
  }, [content])
  return ref
}

type PlayerCardProps = {
  player: Player
  deltas: number[]
  flipped?: boolean
  lastDelta?: number
  onRename: (name: string) => void
  onDelta: (delta: number) => void
  onQuickDelta: (delta: number) => void
  onSetScore: (value: number) => void
}

function PlayerCard({ player, deltas, flipped = false, lastDelta, onRename, onDelta, onQuickDelta, onSetScore }: PlayerCardProps) {
  const { t } = useI18n()
  const longPressTimer = useRef<number | null>(null)
  const longPressOrigin = useRef<{ x: number; y: number } | null>(null)
  const longPressFired = useRef(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [forcedSign, setForcedSign] = useState<'positive' | 'negative' | undefined>(undefined)
  const [scoreEditOpen, setScoreEditOpen] = useState(false)
  const [scoreDraft, setScoreDraft] = useState(String(player.score))
  const clearLongPress = () => { if (longPressTimer.current !== null) { clearTimeout(longPressTimer.current); longPressTimer.current = null } longPressOrigin.current = null }
  const startLongPress = (event: ReactPointerEvent<HTMLElement>, sign?: 'positive' | 'negative') => {
    event.stopPropagation()
    longPressOrigin.current = { x: event.clientX, y: event.clientY }
    longPressTimer.current = window.setTimeout(() => { setForcedSign(sign); setQuickOpen(true); haptic() }, 500)
  }
  const moveLongPress = (event: ReactPointerEvent<HTMLElement>) => {
    if (!longPressOrigin.current) return
    if (Math.hypot(event.clientX - longPressOrigin.current.x, event.clientY - longPressOrigin.current.y) > 10) clearLongPress()
  }
  const quick = (delta: number) => { onQuickDelta(delta); setQuickOpen(false); setForcedSign(undefined) }
  const closeQuick = () => { setQuickOpen(false); setForcedSign(undefined) }
  const openScoreEditor = () => { setScoreDraft(String(player.score)); setScoreEditOpen(true) }
  const saveScore = () => { const value = Number(scoreDraft); if (Number.isFinite(value)) onSetScore(Math.trunc(value)); setScoreEditOpen(false) }
  const scoreValueRef = useFitText<HTMLButtonElement>(JSON.stringify(player.score))
  const startScoreLongPress = (event: ReactPointerEvent<HTMLElement>) => {
    event.stopPropagation()
    longPressOrigin.current = { x: event.clientX, y: event.clientY }
    longPressTimer.current = window.setTimeout(() => { longPressFired.current = true; openScoreEditor(); haptic() }, 500)
  }
  const onScoreClick = () => { if (longPressFired.current) { longPressFired.current = false; return } openScoreEditor() }
  const effectiveSign = forcedSign ?? (lastDelta === undefined ? undefined : lastDelta > 0 ? 'positive' : 'negative')
  const showPositive = effectiveSign === undefined || effectiveSign === 'positive'
  const showNegative = effectiveSign === undefined || effectiveSign === 'negative'
  const popupClass = 'score-popup' + (effectiveSign === undefined ? '' : effectiveSign === 'positive' ? ' positive' : ' negative')
  return (
    <article
      className={flipped ? 'player-card flipped' : 'player-card'}
      style={{ '--player-color': player.color ?? '#38bdf8', '--digits': String(Math.abs(player.score)).length } as CSSProperties}
      onPointerDown={(event) => startLongPress(event)}
      onPointerMove={moveLongPress}
      onPointerUp={clearLongPress}
      onPointerLeave={clearLongPress}
      onPointerCancel={clearLongPress}
      onContextMenu={(event) => { event.preventDefault(); clearLongPress() }}
    >
      <input className="player-name" value={player.name} onChange={(event) => onRename(event.target.value)} aria-label={`${player.name} ${t('playerNameLabel')}`} />
      <div className="score-row">
        <button type="button" className="inline-step" onPointerDown={(event) => startLongPress(event, 'negative')} onPointerMove={moveLongPress} onPointerUp={clearLongPress} onPointerLeave={clearLongPress} onPointerCancel={clearLongPress} onClick={() => onDelta(-1)} aria-label={`${t('removePoint')} ${player.name}`}><svg className="step-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none"/></svg></button>
        <button
          type="button"
          ref={scoreValueRef}
          className="score-value"
          onPointerDown={startScoreLongPress}
          onPointerMove={moveLongPress}
          onPointerUp={clearLongPress}
          onPointerCancel={clearLongPress}
          onClick={onScoreClick}
          aria-label={`${t('setScore')} — ${player.name}`}
        >{player.score}</button>
        <button type="button" className="inline-step" onPointerDown={(event) => startLongPress(event, 'positive')} onPointerMove={moveLongPress} onPointerUp={clearLongPress} onPointerLeave={clearLongPress} onPointerCancel={clearLongPress} onClick={() => onDelta(1)} aria-label={`${t('addPoint')} ${player.name}`}><svg className="step-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5v14" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none"/></svg></button>
      </div>
      <div className="quick-steps" aria-label={t('quickScoreChange')}>
        <button type="button" className="quick-step neg" onPointerDown={(event) => { event.stopPropagation(); startLongPress(event, 'negative') }} onPointerMove={moveLongPress} onPointerUp={clearLongPress} onPointerLeave={clearLongPress} onPointerCancel={clearLongPress} onClick={() => onQuickDelta(-10)} aria-label={`${t('removePoint')} 10 — ${player.name}`}>−10</button>
        <button type="button" className="quick-step neg" onPointerDown={(event) => { event.stopPropagation(); startLongPress(event, 'negative') }} onPointerMove={moveLongPress} onPointerUp={clearLongPress} onPointerLeave={clearLongPress} onPointerCancel={clearLongPress} onClick={() => onQuickDelta(-5)} aria-label={`${t('removePoint')} 5 — ${player.name}`}>−5</button>
        <button type="button" className="quick-step pos" onPointerDown={(event) => { event.stopPropagation(); startLongPress(event, 'positive') }} onPointerMove={moveLongPress} onPointerUp={clearLongPress} onPointerLeave={clearLongPress} onPointerCancel={clearLongPress} onClick={() => onQuickDelta(5)} aria-label={`${t('addPoint')} 5 — ${player.name}`}>+5</button>
        <button type="button" className="quick-step pos" onPointerDown={(event) => { event.stopPropagation(); startLongPress(event, 'positive') }} onPointerMove={moveLongPress} onPointerUp={clearLongPress} onPointerLeave={clearLongPress} onPointerCancel={clearLongPress} onClick={() => onQuickDelta(10)} aria-label={`${t('addPoint')} 10 — ${player.name}`}>+10</button>
      </div>
      {deltas.length > 0 && (
        <div className="player-deltas" aria-label={`${t('history')} — ${player.name}`}>
          {deltas.map((delta, index) => <span key={index} className={delta > 0 ? 'delta-plus' : 'delta-minus'}>{formatDelta(delta)}</span>)}
        </div>
      )}
      {scoreEditOpen && (
        <div className="score-popup score-editor" role="dialog" aria-label={`${t('setScore')} — ${player.name}`}>
          <input autoFocus type="number" inputMode="numeric" value={scoreDraft} onChange={(event) => setScoreDraft(event.target.value)} aria-label={t('setScore')} onKeyDown={(event) => { if (event.key === 'Enter') saveScore(); if (event.key === 'Escape') setScoreEditOpen(false) }} />
          <button type="button" className="editor-save" onClick={saveScore}>{t('save')}</button>
          <button type="button" className="score-cancel" onClick={() => setScoreEditOpen(false)}>{t('cancel')}</button>
        </div>
      )}
      {quickOpen && (
        <div className={popupClass} role="menu" aria-label={`${t('quickScoreChange')} ${player.name}`}>
          {showNegative && <button type="button" className="delta-neg" role="menuitem" onClick={() => quick(-10)}>−10</button>}
          {showNegative && <button type="button" className="delta-neg" role="menuitem" onClick={() => quick(-5)}>−5</button>}
          {showPositive && <button type="button" className="delta-pos" role="menuitem" onClick={() => quick(5)}>+5</button>}
          {showPositive && <button type="button" className="delta-pos" role="menuitem" onClick={() => quick(10)}>+10</button>}
          <button type="button" className="score-cancel" role="menuitem" onClick={closeQuick}>{t('cancel')}</button>
        </div>
      )}
    </article>
  )
}

function GameScreen({ initialGame, onNewGame, onSavedGames }: { initialGame: Game; onNewGame: () => void; onSavedGames: () => void }) {
  const { present: game, past, future, dispatch, undo, redo } = useGameHistory(initialGame)
  const { t } = useI18n()
  const [editingEntry, setEditingEntry] = useState<string | null>(null)
  const [draftDelta, setDraftDelta] = useState('')
  const [topFlipped, setTopFlipped] = useState(true)
  const [swapped, setSwapped] = useState(false)
  const [fullscreen, setFullscreen] = useState(() => localStorage.getItem('keepscore-fullscreen') === '1')
  const [menuOpen, setMenuOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const isDuo = game.players.length === 2
  const orderedPlayers = isDuo && swapped ? [game.players[1], game.players[0]] : game.players
  useEffect(() => { localStorage.setItem('keepscore-fullscreen', fullscreen ? '1' : '0') }, [fullscreen])
  const beginEdit = (id: string, delta: number) => { setEditingEntry(id); setDraftDelta(String(delta)) }
  const saveEdit = () => { if (!editingEntry) return; const delta = Number(draftDelta); if (Number.isFinite(delta) && delta !== 0) dispatch({ type: 'EDIT_HISTORY_ENTRY', entryId: editingEntry, delta }); setEditingEntry(null) }
  const recentDeltasFor = (playerId: string): number[] => game.history.filter((entry) => entry.playerId === playerId).slice(-RECENT_DELTAS).map((entry) => entry.delta).reverse()
  const lastDeltaFor = (playerId: string) => { for (let i = game.history.length - 1; i >= 0; i -= 1) { if (game.history[i].playerId === playerId) return game.history[i].delta } return undefined }
  const historyContent = <section className="history" aria-label={t('history')}><div className="section-heading"><h2>{t('history')}</h2><span>{game.history.length} {t('moves')}</span></div>{game.history.length === 0 ? <p className="empty-state">{t('noMoves')}</p> : <ol>{[...game.history].reverse().map((entry) => { const player = game.players.find((candidate) => candidate.id === entry.playerId); return <li key={entry.id}><span>{player?.name} <strong className={entry.delta > 0 ? 'delta-plus' : 'delta-minus'}>{formatDelta(entry.delta)}</strong></span><span className="history-actions"><button type="button" className="secondary-button" onClick={() => beginEdit(entry.id, entry.delta)}>{t('edit')}</button><button type="button" className="secondary-button" onClick={() => dispatch({ type: 'DELETE_HISTORY_ENTRY', entryId: entry.id })} aria-label={t('removeHistoryEntry')}>{t('delete')}</button></span>{editingEntry === entry.id && <span className="history-editor"><input autoFocus type="number" value={draftDelta} onChange={(event) => setDraftDelta(event.target.value)} aria-label={t('editHistoryDelta')}/><button type="button" className="secondary-button" onClick={saveEdit}>{t('save')}</button><button type="button" className="secondary-button" onClick={() => setEditingEntry(null)}>{t('cancel')}</button></span>}</li> })}</ol>}</section>
  return <main className={fullscreen ? 'app-shell fullscreen' : 'app-shell'}>
    <header className="app-header"><div><p className="eyebrow">SCORE KEEPER</p><h1>{game.name || t('appName')}</h1></div><div className="toolbar"><InstallButton/><button className="secondary-button" type="button" onClick={onSavedGames}>{t('savedGames')}</button><button className="secondary-button" type="button" onClick={onNewGame}>{t('newGame')}</button></div></header>
    <div className="quick-actions">
      {isDuo && <button className="icon-fab" type="button" onClick={() => setSwapped((current) => !current)} aria-pressed={swapped} aria-label={t('swapPlayers')}>⇅</button>}
      {isDuo && <button className="icon-fab" type="button" onClick={() => setTopFlipped((current) => !current)} aria-pressed={topFlipped} aria-label={t('flippedToggle')}>↻</button>}
      <button className="icon-fab" type="button" onClick={() => setFullscreen((current) => !current)} aria-pressed={fullscreen} aria-label={fullscreen ? t('exitFullscreen') : t('fullscreen')}>
        {fullscreen
          ? <svg className="fab-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
          : <svg className="fab-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
      </button>
      <LangFlags />
      <button className="burger-button" type="button" onClick={() => setMenuOpen(true)} aria-label={t('menu')}>☰</button>
    </div>
    {menuOpen && (
      <div className="drawer-backdrop" onClick={() => setMenuOpen(false)}>
        <nav className="menu-drawer" aria-label={t('menu')} onClick={(event) => event.stopPropagation()}>
          <button className="menu-item menu-close" type="button" onClick={() => setMenuOpen(false)}>{t('closeMenu')}</button>
          <button className="menu-item" type="button" onClick={() => { setHistoryOpen((current) => !current); setMenuOpen(false) }}>🕘 {t('history')}</button>
          <button className="menu-item" type="button" onClick={() => { undo(); setMenuOpen(false) }} disabled={!past.length}>↩ {t('undo')}</button>
          <button className="menu-item" type="button" onClick={() => { redo(); setMenuOpen(false) }} disabled={!future.length}>↪ {t('redo')}</button>
          <button className="menu-item" type="button" onClick={() => { dispatch({ type: 'ADD_PLAYER' }); haptic(); setMenuOpen(false) }}>{t('addPlayerMenuItem')}</button>
          <button className="menu-item" type="button" onClick={() => { setMenuOpen(false); onSavedGames() }}>💾 {t('savedGames')}</button>
          <button className="menu-item" type="button" onClick={() => { setMenuOpen(false); onNewGame() }}>{t('newGameMenuItem')}</button>
        </nav>
      </div>
    )}
    <section className={isDuo ? 'players duo' : 'players'} aria-label={t('players')}>{orderedPlayers.map((player, index) => <PlayerCard key={player.id} player={{ ...player, color: player.color ?? colorForIndex(game.players.indexOf(player)) }} deltas={recentDeltasFor(player.id)} flipped={isDuo && index === 0 && topFlipped} lastDelta={lastDeltaFor(player.id)} onRename={(name) => dispatch({ type: 'RENAME_PLAYER', playerId: player.id, name })} onDelta={(delta) => { dispatch({ type: 'ADD_SCORE', playerId: player.id, delta }); haptic() }} onQuickDelta={(delta) => { dispatch({ type: 'ADD_SCORE', playerId: player.id, delta }); haptic() }} onSetScore={(value) => { dispatch({ type: 'ADD_SCORE', playerId: player.id, delta: value - player.score }); haptic() }} />)}</section>
    {historyOpen && (
      <div className="drawer-backdrop" onClick={() => setHistoryOpen(false)}>
        <div className="history-drawer" role="dialog" aria-label={t('history')} onClick={(event) => event.stopPropagation()}>{historyContent}</div>
      </div>
    )}
  </main>
}

function SavedScreen({ onResume, onBack }: { onResume: (game: Game) => void; onBack: () => void }) {
  const { t } = useI18n()
  const [games, setGames] = useState<Game[]>(() => localGameRepository.list())
  const [portabilityError, setPortabilityError] = useState('')
  const importInput = useRef<HTMLInputElement>(null)
  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const imported = importGames(await file.text())
      imported.forEach((item) => localGameRepository.save(item))
      setGames(localGameRepository.list())
      setPortabilityError('')
    } catch {
      setPortabilityError(t('importError'))
    }
  }
  return <main className="app-shell"><header className="app-header"><div><p className="eyebrow">SCORE KEEPER</p><h1>{t('savedGames')}</h1></div><div className="toolbar"><InstallButton/><button className="secondary-button" type="button" onClick={() => downloadGames(localGameRepository.list())}>{t('export')}</button><button className="secondary-button" type="button" onClick={() => importInput.current?.click()}>{t('import')}</button><LangFlags /><button className="secondary-button" type="button" onClick={onBack}>{t('back')}</button></div></header><input ref={importInput} hidden type="file" accept="application/json,.json" onChange={handleImport}/>{portabilityError && <p role="alert" className="empty-state">{portabilityError}</p>}<SavedGames games={games} onResume={onResume} onDelete={(id) => { localGameRepository.remove(id); setGames(localGameRepository.list()) }} /></main>
}

export function App() {
  const [screen, setScreen] = useState<Screen>('game')
  const [game, setGame] = useState<Game | undefined>(() => localGameRepository.list()[0])

  if (screen === 'saved') return <SavedScreen onResume={(selected) => { setGame(selected); setScreen('game') }} onBack={() => setScreen('game')} />
  if (!game) return <GameSetup onCreate={setGame} />
  return <GameScreen key={game.id} initialGame={game} onNewGame={() => setGame(undefined)} onSavedGames={() => setScreen('saved')} />
}
