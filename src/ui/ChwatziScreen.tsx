import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import type { Game, Player } from '../domain/game/types'
import { colorForIndex } from '../domain/game/colors'
import { useI18n } from './i18n'

type Props = { game: Game; onSelect: (startingPlayerId: string) => void; onBack?: () => void }
type ChwatziMode = 'roulette' | 'multitouch'
type CountdownState = 'idle' | 'counting' | 'selected'
type FingerSlot = { pointerId: number; x: number; y: number }
type ColoredPlayer = Player & { color: string }

export function ChwatziScreen({ game, onSelect, onBack }: Props) {
  const { t } = useI18n()
  const players = game.players.map((player, index) => ({ ...player, color: player.color ?? colorForIndex(index) })) as ColoredPlayer[]
  const [mode, setMode] = useState<ChwatziMode>('roulette')
  const [displayPlayers, setDisplayPlayers] = useState<ColoredPlayer[]>(players)
  const [selectedPlayer, setSelectedPlayer] = useState<ColoredPlayer | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const spinTimerRef = useRef<number | null>(null)
  const [fingers, setFingers] = useState<FingerSlot[]>([])
  const [countdown, setCountdown] = useState<CountdownState>('idle')
  const [countdownValue, setCountdownValue] = useState(3)
  const [selectedFingerIndex, setSelectedFingerIndex] = useState<number | null>(null)
  const [showBackButton, setShowBackButton] = useState(false)
  const holdTimerRef = useRef<number | null>(null)
  const countdownTimerRef = useRef<number | null>(null)
  const blinkTimerRef = useRef<number | null>(null)
  const noTouchTimerRef = useRef<number | null>(null)

  useEffect(() => setDisplayPlayers(players), [game.id, game.players.length])
  const clearTimers = useCallback(() => {
    if (spinTimerRef.current !== null) window.clearInterval(spinTimerRef.current)
    if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current)
    if (countdownTimerRef.current !== null) window.clearInterval(countdownTimerRef.current)
    if (blinkTimerRef.current !== null) window.clearTimeout(blinkTimerRef.current)
    if (noTouchTimerRef.current !== null) window.clearTimeout(noTouchTimerRef.current)
  }, [])
  useEffect(() => () => clearTimers(), [clearTimers])

  const confirmSelection = useCallback(() => {
    const player = selectedPlayer ?? players[0]
    if (player) onSelect(player.id)
  }, [onSelect, players, selectedPlayer])

  const startRoulette = useCallback(() => {
    if (isSpinning || players.length === 0) return
    setIsSpinning(true)
    setSelectedPlayer(null)
    let iterations = 0
    const maxIterations = 30
    spinTimerRef.current = window.setInterval(() => {
      iterations += 1
      setDisplayPlayers(current => current.length < 2 ? current : [current[current.length - 1], ...current.slice(0, -1)])
      if (iterations >= maxIterations) {
        if (spinTimerRef.current !== null) window.clearInterval(spinTimerRef.current)
        const winner = players[Math.floor(Math.random() * players.length)]
        setSelectedPlayer(winner)
        setDisplayPlayers([winner, ...players.filter(player => player.id !== winner.id)])
        setIsSpinning(false)
      }
    }, 100)
  }, [isSpinning, players])

  const selectManually = useCallback((player: ColoredPlayer) => {
    if (isSpinning) return
    setSelectedPlayer(player)
    setDisplayPlayers([player, ...players.filter(candidate => candidate.id !== player.id)])
  }, [isSpinning, players])

  const resetMultiTouch = useCallback(() => {
    setFingers([])
    setCountdown('idle')
    setCountdownValue(3)
    setSelectedFingerIndex(null)
    setSelectedPlayer(null)
    setShowBackButton(false)
    if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current)
    if (countdownTimerRef.current !== null) window.clearInterval(countdownTimerRef.current)
    if (blinkTimerRef.current !== null) window.clearTimeout(blinkTimerRef.current)
  }, [])

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (mode !== 'multitouch' || countdown !== 'idle') return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setFingers(current => current.some(f => f.pointerId === event.pointerId) ? current : [...current, { pointerId: event.pointerId, x: event.clientX, y: event.clientY }])
    setShowBackButton(false)
    if (noTouchTimerRef.current !== null) window.clearTimeout(noTouchTimerRef.current)
    if ('vibrate' in navigator) navigator.vibrate(25)
  }, [countdown, mode])

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (mode !== 'multitouch' || countdown !== 'idle') return
    setFingers(current => current.map(f => f.pointerId === event.pointerId ? { ...f, x: event.clientX, y: event.clientY } : f))
  }, [countdown, mode])

  const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (mode !== 'multitouch' || countdown !== 'idle') return
    setFingers(current => current.filter(f => f.pointerId !== event.pointerId))
  }, [countdown, mode])

  const startSelection = useCallback(() => {
    if (countdown !== 'idle' || fingers.length < players.length || players.length === 0) return
    setCountdown('counting')
    setCountdownValue(3)
    let count = 3
    countdownTimerRef.current = window.setInterval(() => {
      count -= 1
      setCountdownValue(count)
      if (count <= 0) {
        if (countdownTimerRef.current !== null) window.clearInterval(countdownTimerRef.current)
        const winnerIndex = Math.floor(Math.random() * Math.min(fingers.length, players.length))
        setSelectedFingerIndex(winnerIndex)
        setCountdown('selected')
        setSelectedPlayer(players[winnerIndex])
        if ('vibrate' in navigator) navigator.vibrate(100)
        blinkTimerRef.current = window.setTimeout(() => {
          setSelectedFingerIndex(null)
          if ('vibrate' in navigator) navigator.vibrate([100, 60, 180])
        }, 900)
      }
    }, 800)
  }, [countdown, fingers, players])

  useEffect(() => {
    if (mode !== 'multitouch' || countdown !== 'idle' || fingers.length < players.length || fingers.length === 0) {
      if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current)
      return
    }
    holdTimerRef.current = window.setTimeout(startSelection, 450)
  }, [countdown, fingers.length, mode, players.length, startSelection])

  useEffect(() => {
    if (mode !== 'multitouch' || fingers.length > 0) return
    noTouchTimerRef.current = window.setTimeout(() => setShowBackButton(true), 3000)
    return () => { if (noTouchTimerRef.current !== null) window.clearTimeout(noTouchTimerRef.current) }
  }, [fingers.length, mode])

  const selectedColor = selectedPlayer?.color ?? '#0f172a'
  const backgroundStyle = countdown === 'selected' ? ({ background: `radial-gradient(circle at center, ${selectedColor} 0%, ${selectedColor}cc 35%, #050505 100%)` } as CSSProperties) : undefined

  return (
    <main className="chwatzi-screen" style={backgroundStyle}>
      {mode === 'multitouch' ? (
        <div className="multitouch-overlay" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
          {showBackButton && onBack && <button className="multitouch-back-btn" type="button" onPointerDown={e => e.stopPropagation()} onClick={onBack}>← {t('back')}</button>}
          {countdown === 'counting' && <span className="countdown-number">{countdownValue}</span>}
          {(countdown === 'idle' || countdown === 'selected') && fingers.map((finger, index) => {
            const player = players[index]
            const selected = index === selectedFingerIndex
            return <div key={finger.pointerId} className={`finger-dot ${countdown === 'selected' && selected ? 'selected-blinking' : countdown === 'selected' ? 'selected-static' : ''}`} style={{ left: finger.x, top: finger.y, backgroundColor: player?.color, borderColor: player?.color }}><span className="finger-number">{index + 1}</span></div>
          })}
          {countdown === 'idle' && fingers.length === 0 && !showBackButton && <div className="multitouch-instructions"><span className="multitouch-icon" role="img" aria-label="fingers">👆</span><p>{t('multitouchInstructions')}</p></div>}
          {countdown === 'idle' && fingers.length > 0 && fingers.length < players.length && <p className="waiting-text">{t('multitouchWaiting')}</p>}
          {countdown === 'selected' && <div className="multitouch-result">
            <button className="primary-button confirm-button" type="button" onPointerDown={event => event.stopPropagation()} onClick={confirmSelection}>{t('continue')}</button>
            <button className="secondary-button" type="button" onPointerDown={event => event.stopPropagation()} onClick={resetMultiTouch}>{t('tryAgain')}</button>
          </div>}
        </div>
      ) : (
        <div className="chwatzi-card">
          {onBack && <button className="back-button" type="button" onClick={onBack} disabled={isSpinning}>←</button>}
          <header className="chwatzi-header"><p className="eyebrow">CHWATZI</p><h1>{t('whoStarts')}</h1><p className="muted">{t('chwatziTagline')}</p></header>
          <div className="chwatzi-mode-toggle">
            <button type="button" className="mode-btn active">🎰 {t('modeRoulette')}</button>
            <button type="button" className="mode-btn" onClick={() => { setMode('multitouch'); resetMultiTouch() }}>👆 {t('modeMultitouch')}</button>
          </div>
          <div className={isSpinning ? 'roulette-wheel spinning' : 'roulette-wheel'}>{displayPlayers.map(player => <div key={player.id} className={`roulette-item ${selectedPlayer?.id === player.id ? 'selected' : ''}`} style={{ '--player-color': player.color } as CSSProperties} onClick={() => selectManually(player)}><span className="player-indicator" style={{ backgroundColor: player.color }} /><span className="player-name">{player.name}</span>{selectedPlayer?.id === player.id && <span className="selection-badge">✓</span>}</div>)}</div>
          <div className="chwatzi-actions"><button className="primary-button roulette-button" type="button" onClick={startRoulette} disabled={isSpinning}>{t('pickRandomly')}</button><button className="primary-button confirm-button" type="button" onClick={confirmSelection} disabled={!selectedPlayer}>{t('continue')}</button></div>
        </div>
      )}
    </main>
  )
}
