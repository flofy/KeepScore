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
import './saved-games.css'

function haptic() { if ('vibrate' in navigator) navigator.vibrate(8) }
type Screen = 'game' | 'saved'
const RECENT_DELTAS = 6

function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`
}

type PlayerCardProps = {
  player: Player
  deltas: number[]
  flipped?: boolean
  lastDelta?: number
  onRename: (name: string) => void
  onDelta: (delta: number) => void
  onQuickDelta: (delta: number) => void
}

function PlayerCard({ player, deltas, flipped = false, lastDelta, onRename, onDelta, onQuickDelta }: PlayerCardProps) {
  const { t } = useI18n()
  const longPressTimer = useRef<number | null>(null)
  const longPressOrigin = useRef<{ x: number; y: number } | null>(null)
  const [quickOpen, setQuickOpen] = useState(false)
  const [forcedSign, setForcedSign] = useState<'positive' | 'negative' | undefined>(undefined)
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
  const effectiveSign = forcedSign ?? (lastDelta === undefined ? undefined : lastDelta > 0 ? 'positive' : 'negative')
  const showPositive = effectiveSign === undefined || effectiveSign === 'positive'
  const showNegative = effectiveSign === undefined || effectiveSign === 'negative'
  const popupClass = 'score-popup' + (effectiveSign === undefined ? '' : effectiveSign === 'positive' ? ' positive' : ' negative')
  return (
    <article
      className={flipped ? 'player-card flipped' : 'player-card'}
      style={{ '--player-color': player.color ?? '#38bdf8' } as CSSProperties}
      onPointerDown={(event) => startLongPress(event)}
      onPointerMove={moveLongPress}
      onPointerUp={clearLongPress}
      onPointerLeave={clearLongPress}
      onPointerCancel={clearLongPress}
      onContextMenu={(event) => { event.preventDefault(); clearLongPress() }}
    >
      <input className="player-name" value={player.name} onChange={(event) => onRename(event.target.value)} aria-label={`${player.name} ${t('playerNameLabel')}`} />
      <strong>{player.score}</strong>
      {deltas.length > 0 && (
        <div className="player-deltas" aria-label={`${t('history')} — ${player.name}`}>
          {deltas.map((delta, index) => <span key={index} className={delta > 0 ? 'delta-plus' : 'delta-minus'}>{formatDelta(delta)}</span>)}
        </div>
      )}
      <div className="score-actions">
        <button type="button" onPointerDown={(event) => startLongPress(event, 'negative')} onPointerMove={moveLongPress} onPointerUp={clearLongPress} onPointerLeave={clearLongPress} onPointerCancel={clearLongPress} onClick={() => onDelta(-1)} aria-label={`${t('removePoint')} ${player.name}`}>−</button>
        <button type="button" onPointerDown={(event) => startLongPress(event, 'positive')} onPointerMove={moveLongPress} onPointerUp={clearLongPress} onPointerLeave={clearLongPress} onPointerCancel={clearLongPress} onClick={() => onDelta(1)} aria-label={`${t('addPoint')} ${player.name}`}>+</button>
      </div>
      {quickOpen && (
        <div className={popupClass} role="menu" aria-label={`${t('quickScoreChange')} ${player.name}`}>
          {showNegative && <button type="button" role="menuitem" onClick={() => quick(-10)}>−10</button>}
          {showNegative && <button type="button" role="menuitem" onClick={() => quick(-5)}>−5</button>}
          {showPositive && <button type="button" role="menuitem" onClick={() => quick(5)}>+5</button>}
          {showPositive && <button type="button" role="menuitem" onClick={() => quick(10)}>+10</button>}
          <button type="button" className="score-cancel" role="menuitem" onClick={closeQuick}>{t('cancel')}</button>
        </div>
      )}
    </article>
  )
}

function GameScreen({ initialGame, onNewGame, onSavedGames }: { initialGame: Game; onNewGame: () => void; onSavedGames: () => void }) {
  const { present: game, past, future, dispatch, undo, redo } = useGameHistory(initialGame)
  const { t, lang, setLang } = useI18n()
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
  const recentDeltasFor = (playerId: string): number[] => game.history.filter((entry) => entry.playerId === playerId).slice(-RECENT_DELTAS).map((entry) => entry.delta).reverse()
  const lastDeltaFor = (playerId: string) => { for (let i = game.history.length - 1; i >= 0; i -= 1) { if (game.history[i].playerId === playerId) return game.history[i].delta } return undefined }
  const historyContent = <section className="history" aria-label={t('history')}><div className="section-heading"><h2>{t('history')}</h2><span>{game.history.length} {t('moves')}</span></div>{game.history.length === 0 ? <p className="empty-state">{t('noMoves')}</p> : <ol>{[...game.history].reverse().map((entry) => { const player = game.players.find((candidate) => candidate.id === entry.playerId); return <li key={entry.id}><span>{player?.name} <strong className={entry.delta > 0 ? 'delta-plus' : 'delta-minus'}>{formatDelta(entry.delta)}</strong></span><span className="history-actions"><button type="button" className="secondary-button" onClick={() => beginEdit(entry.id, entry.delta)}>{t('edit')}</button><button type="button" className="secondary-button" onClick={() => dispatch({ type: 'DELETE_HISTORY_ENTRY', entryId: entry.id })} aria-label={t('removeHistoryEntry')}>{t('delete')}</button></span>{editingEntry === entry.id && <span className="history-editor"><input autoFocus type="number" value={draftDelta} onChange={(event) => setDraftDelta(event.target.value)} aria-label={t('editHistoryDelta')}/><button type="button" className="secondary-button" onClick={saveEdit}>{t('save')}</button><button type="button" className="secondary-button" onClick={() => setEditingEntry(null)}>{t('cancel')}</button></span>}</li> })}</ol>}</section>
  return <main className={fullscreen ? 'app-shell fullscreen' : 'app-shell'}>
    <header className="app-header"><div><p className="eyebrow">SCORE KEEPER</p><h1>{game.name || t('appName')}</h1></div><div className="toolbar"><InstallButton/><button className="secondary-button" type="button" onClick={undo} disabled={!past.length}>{t('undo')}</button><button className="secondary-button" type="button" onClick={redo} disabled={!future.length}>{t('redo')}</button><button className="secondary-button" type="button" onClick={onSavedGames}>{t('savedGames')}</button><button className="secondary-button" type="button" onClick={onNewGame}>{t('newGame')}</button></div></header>
    <button className="burger-button" type="button" onClick={() => setMenuOpen(true)} aria-label={t('menu')}>☰</button>
    {menuOpen && (
      <div className="drawer-backdrop" onClick={() => setMenuOpen(false)}>
        <nav className="menu-drawer" aria-label={t('menu')} onClick={(event) => event.stopPropagation()}>
          <button className="menu-item menu-close" type="button" onClick={() => setMenuOpen(false)}>{t('closeMenu')}</button>
          <button className="menu-item" type="button" onClick={() => { setHistoryOpen((current) => !current); setMenuOpen(false) }}>🕘 {t('history')}</button>
          <button className="menu-item" type="button" onClick={() => { setFullscreen((current) => !current); setMenuOpen(false) }}>{fullscreen ? t('exitFullscreen') : t('fullscreen')}</button>
          <button className="menu-item" type="button" onClick={() => { undo(); setMenuOpen(false) }} disabled={!past.length}>↩ {t('undo')}</button>
          <button className="menu-item" type="button" onClick={() => { redo(); setMenuOpen(false) }} disabled={!future.length}>↪ {t('redo')}</button>
          <button className="menu-item" type="button" onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}>{t('language')}</button>
          <button className="menu-item" type="button" onClick={() => { setMenuOpen(false); onSavedGames() }}>💾 {t('savedGames')}</button>
          <button className="menu-item" type="button" onClick={() => { setMenuOpen(false); onNewGame() }}>{t('newGameMenuItem')}</button>
        </nav>
      </div>
    )}
    <section className={isDuo ? 'players duo' : 'players'} aria-label={t('players')}>{game.players.map((player, index) => <PlayerCard key={player.id} player={{ ...player, color: player.color ?? colorForIndex(index) }} deltas={recentDeltasFor(player.id)} flipped={isDuo && index === 0 && topFlipped} lastDelta={lastDeltaFor(player.id)} onRename={(name) => dispatch({ type: 'RENAME_PLAYER', playerId: player.id, name })} onDelta={(delta) => { dispatch({ type: 'ADD_SCORE', playerId: player.id, delta }); haptic() }} onQuickDelta={(delta) => { dispatch({ type: 'ADD_SCORE', playerId: player.id, delta }); haptic() }} />)}{isDuo && <button className="rotate-toggle" type="button" onClick={() => setTopFlipped((current) => !current)} aria-pressed={topFlipped} aria-label={t('flippedToggle')}>⇅</button>}</section>
    {historyOpen && (
      <div className="drawer-backdrop" onClick={() => setHistoryOpen(false)}>
        <div className="history-drawer" role="dialog" aria-label={t('history')} onClick={(event) => event.stopPropagation()}>{historyContent}</div>
      </div>
    )}
  </main>
}

function SavedScreen({ onBack }: { onBack: () => void }) {
  const { t, lang, setLang } = useI18n()
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
  return <main className="app-shell"><header className="app-header"><div><p className="eyebrow">SCORE KEEPER</p><h1>{t('savedGames')}</h1></div><div className="toolbar"><InstallButton/><button className="secondary-button" type="button" onClick={() => downloadGames(localGameRepository.list())}>{t('export')}</button><button className="secondary-button" type="button" onClick={() => importInput.current?.click()}>{t('import')}</button><button className="secondary-button" type="button" onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}>{t('language')}</button><button className="secondary-button" type="button" onClick={onBack}>{t('back')}</button></div></header><input ref={importInput} hidden type="file" accept="application/json,.json" onChange={handleImport}/>{portabilityError && <p role="alert" className="empty-state">{portabilityError}</p>}<SavedGames games={games} onResume={onBack} onDelete={(id) => { localGameRepository.remove(id); setGames(localGameRepository.list()) }} /></main>
}

export function App() {
  const [screen, setScreen] = useState<Screen>('game')
  const [game, setGame] = useState<Game | undefined>(() => localGameRepository.list()[0])

  if (screen === 'saved') return <SavedScreen onBack={() => setScreen('game')} />
  if (!game) return <GameSetup onCreate={setGame} />
  return <GameScreen key={game.id} initialGame={game} onNewGame={() => setGame(undefined)} onSavedGames={() => setScreen('saved')} />
}
