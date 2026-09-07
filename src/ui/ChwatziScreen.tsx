import { useState, useEffect, useRef, useCallback } from 'react'
import type { Game, Player } from '../domain/game/types'
import { colorForIndex } from '../domain/game/colors'
import { useI18n } from './i18n'

type Props = {
  game: Game
  onSelect: (startingPlayerId: string) => void
  onBack?: () => void
}

type ChwatziMode = 'roulette' | 'multitouch'
type PickMode = 'single' | 'order'

type FingerSlot = {
  pointerId: number
  x: number
  y: number
  player?: Player
}

type CountdownState = 'idle' | 'counting' | 'blinking' | 'done'

export function ChwatziScreen({ game, onSelect, onBack }: Props) {
  const { t } = useI18n()
  const [mode, setMode] = useState<ChwatziMode>('roulette')
  const [isSpinning, setIsSpinning] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [displayPlayers, setDisplayPlayers] = useState<Player[]>([])
  const [animationSpeed, setAnimationSpeed] = useState(50)
  const spinTimerRef = useRef<number | null>(null)
  const slowdownTimerRef = useRef<number | null>(null)
  const finalTimeoutRef = useRef<number | null>(null)

  // Multi-touch state
  const [pickMode, setPickMode] = useState<PickMode>('single')
  const [fingers, setFingers] = useState<FingerSlot[]>([])
  const [multiResult, setMultiResult] = useState<Player[] | null>(null)
  const [countdown, setCountdown] = useState<CountdownState>('idle')
  const [countdownValue, setCountdownValue] = useState(3)
  const [blinkingIndex, setBlinkingIndex] = useState(0)
  const holdTimerRef = useRef<number | null>(null)
  const countdownTimerRef = useRef<number | null>(null)
  const blinkTimerRef = useRef<number | null>(null)

  // Joueurs avec leurs couleurs
  const playersWithColors = game.players.map((player, index) => ({
    ...player,
    color: player.color ?? colorForIndex(index),
  }))

  // Démarrer l'animation roulette
  const startRoulette = useCallback(() => {
    if (isSpinning) return
    if (playersWithColors.length === 0) return

    setIsSpinning(true)
    setSelectedPlayer(null)
    setAnimationSpeed(50)

    if (spinTimerRef.current) clearInterval(spinTimerRef.current)
    if (slowdownTimerRef.current) clearTimeout(slowdownTimerRef.current)
    if (finalTimeoutRef.current) clearTimeout(finalTimeoutRef.current)

    const shuffled = [...playersWithColors].sort(() => Math.random() - 0.5)
    setDisplayPlayers(shuffled)

    let currentSpeed = 50
    let iterations = 0
    const maxIterations = 30

    const spin = () => {
      iterations++

      if (iterations > maxIterations * 0.7) {
        currentSpeed = Math.min(500, currentSpeed * 1.2)
      } else if (iterations > maxIterations * 0.4) {
        currentSpeed = Math.min(200, currentSpeed * 1.1)
      }

      setAnimationSpeed(currentSpeed)

      setDisplayPlayers(prev => {
        const newPlayers = [...prev]
        const last = newPlayers.pop()
        if (last) newPlayers.unshift(last)
        return newPlayers
      })

      if (iterations >= maxIterations) {
        if (spinTimerRef.current) clearInterval(spinTimerRef.current)

        const finalIndex = Math.floor(Math.random() * playersWithColors.length)
        const finalPlayer = playersWithColors[finalIndex]

        setSelectedPlayer(finalPlayer)
        setDisplayPlayers([finalPlayer, ...playersWithColors.filter(p => p.id !== finalPlayer.id)])
        setIsSpinning(false)
        return
      }
    }

    spinTimerRef.current = window.setInterval(spin, currentSpeed)
  }, [isSpinning, playersWithColors])

  // Confirmer la sélection
  const confirmSelection = useCallback(() => {
    if (selectedPlayer) {
      onSelect(selectedPlayer.id)
    } else if (playersWithColors.length > 0) {
      const randomIndex = Math.floor(Math.random() * playersWithColors.length)
      onSelect(playersWithColors[randomIndex].id)
    }
  }, [selectedPlayer, playersWithColors, onSelect])

  // Sélection manuelle
  const selectManually = useCallback((player: Player) => {
    if (isSpinning) return
    setSelectedPlayer(player)
    setDisplayPlayers([player, ...playersWithColors.filter(p => p.id !== player.id)])
  }, [isSpinning, playersWithColors])

  // Nettoyer les timers
  useEffect(() => {
    return () => {
      if (spinTimerRef.current) clearInterval(spinTimerRef.current)
      if (slowdownTimerRef.current) clearTimeout(slowdownTimerRef.current)
      if (finalTimeoutRef.current) clearTimeout(finalTimeoutRef.current)
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current)
      if (blinkTimerRef.current) clearInterval(blinkTimerRef.current)
    }
  }, [])

  // Initialiser displayPlayers
  useEffect(() => {
    setDisplayPlayers(playersWithColors)
  }, [playersWithColors])

  // --- Multi-touch logic ---

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (mode !== 'multitouch') return
    if (countdown !== 'idle') return
    e.preventDefault()
    const pointerId = e.pointerId
    setFingers(prev => {
      if (prev.some(f => f.pointerId === pointerId)) return prev
      return [...prev, { pointerId, x: e.clientX, y: e.clientY }]
    })
    if ('vibrate' in navigator) navigator.vibrate(30)
  }, [mode, countdown])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (mode !== 'multitouch') return
    if (countdown !== 'idle') return
    const pointerId = e.pointerId
    setFingers(prev =>
      prev.map(f => f.pointerId === pointerId ? { ...f, x: e.clientX, y: e.clientY } : f)
    )
  }, [mode, countdown])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (mode !== 'multitouch') return
    if (countdown !== 'idle') return
    const pointerId = e.pointerId
    setFingers(prev => prev.filter(f => f.pointerId !== pointerId))
  }, [mode, countdown])

  const resetMultiTouch = useCallback(() => {
    setFingers([])
    setMultiResult(null)
    setSelectedPlayer(null)
    setCountdown('idle')
    setCountdownValue(3)
    setBlinkingIndex(0)
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
    if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current)
    if (blinkTimerRef.current) clearInterval(blinkTimerRef.current)
  }, [])

  // Auto-trigger countdown when enough fingers are down
  useEffect(() => {
    if (mode !== 'multitouch' || countdown !== 'idle') return
    if (fingers.length >= playersWithColors.length && fingers.length > 0) {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
      holdTimerRef.current = window.setTimeout(() => {
        startCountdown()
      }, 500)
    } else {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
    }
  }, [fingers, mode, countdown, playersWithColors.length])

  const startCountdown = useCallback(() => {
    if (countdown !== 'idle' || fingers.length < playersWithColors.length) return
    setCountdown('counting')
    setCountdownValue(3)
    if ('vibrate' in navigator) navigator.vibrate(100)

    let count = 3
    const timer = setInterval(() => {
      count--
      setCountdownValue(count)
      if ('vibrate' in navigator) navigator.vibrate(50)
      if (count <= 0) {
        clearInterval(timer)
        startBlinking()
      }
    }, 1000)
    countdownTimerRef.current = timer as unknown as number
  }, [countdown, fingers.length, playersWithColors.length])

  const startBlinking = useCallback(() => {
    setCountdown('blinking')
    setBlinkingIndex(0)
    
    // Assign players to fingers (shuffle players and assign by index)
    const shuffled = [...playersWithColors].sort(() => Math.random() - 0.5)
    
    // If single mode, just take the first player
    const resultPlayers = pickMode === 'single' ? [shuffled[0]] : shuffled
    
    // Start blinking animation
    let index = 0
    const blinkInterval = setInterval(() => {
      if (index >= fingers.length) {
        clearInterval(blinkInterval)
        setCountdown('done')
        setMultiResult(resultPlayers)
        setSelectedPlayer(resultPlayers[0])
        return
      }
      setBlinkingIndex(index)
      if ('vibrate' in navigator) navigator.vibrate(30)
      index++
    }, 300)
    
    blinkTimerRef.current = blinkInterval as unknown as number
  }, [fingers, playersWithColors, pickMode])

  const confirmMultiResult = useCallback(() => {
    if (multiResult && multiResult.length > 0) {
      onSelect(multiResult[0].id)
    }
  }, [multiResult, onSelect])

  const wheelClass = isSpinning ? 'roulette-wheel spinning' : 'roulette-wheel'

  return (
    <main className="chwatzi-screen">
      {/* Full-screen multi-touch overlay - covers ENTIRE viewport */}
      {mode === 'multitouch' && (
        <div
          className="multitouch-overlay"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Countdown overlay */}
          {countdown === 'counting' && (
            <div className="countdown-overlay">
              <span className="countdown-number">{countdownValue}</span>
            </div>
          )}

          {/* Blinking rings */}
          {countdown === 'blinking' && fingers.map((f, i) => {
            const player = playersWithColors[i % playersWithColors.length]
            const isBlinking = i === blinkingIndex
            return (
              <div
                key={f.pointerId}
                className={`blink-ring ${isBlinking ? 'blinking' : ''}`}
                style={{
                  left: `${f.x}px`,
                  top: `${f.y}px`,
                  borderColor: player.color,
                  boxShadow: `0 0 30px 10px ${player.color}`,
                }}
              />
            )
          })}

          {/* Fingers dots - visible when idle */}
          {countdown === 'idle' && fingers.length > 0 && (
            <>
              {fingers.map((f, i) => {
                const player = playersWithColors[i % playersWithColors.length]
                return (
                  <div
                    key={f.pointerId}
                    className="finger-dot"
                    style={{
                      left: `${f.x}px`,
                      top: `${f.y}px`,
                      backgroundColor: player.color,
                      borderColor: player.color,
                    }}
                  >
                    <span>{i + 1}</span>
                  </div>
                )
              })}
              <div className="multitouch-count">
                {fingers.length} / {playersWithColors.length}
              </div>
            </>
          )}
        </div>
      )}

      <div className="chwatzi-card" style={{ pointerEvents: mode === 'multitouch' ? 'none' : 'auto' }}>
        {onBack && (
          <button
            className="back-button"
            type="button"
            onClick={onBack}
            aria-label={t('back')}
            disabled={isSpinning || countdown !== 'idle'}
            style={{ pointerEvents: 'auto' }}
          >
            ←
          </button>
        )}

        <header className="chwatzi-header" style={{ pointerEvents: 'auto' }}>
          <p className="eyebrow">CHWATZI</p>
          <h1>{t('whoStarts')}</h1>
          <p className="muted">{t('chwatziTagline')}</p>
        </header>

        {/* Mode toggle */}
        <div className="chwatzi-mode-toggle" style={{ pointerEvents: 'auto' }}>
          <button
            type="button"
            className={mode === 'roulette' ? 'mode-btn active' : 'mode-btn'}
            onClick={() => { setMode('roulette'); resetMultiTouch(); }}
            disabled={isSpinning || countdown !== 'idle'}
          >
            🎰 {t('modeRoulette')}
          </button>
          <button
            type="button"
            className={mode === 'multitouch' ? 'mode-btn active' : 'mode-btn'}
            onClick={() => { setMode('multitouch'); setSelectedPlayer(null); setMultiResult(null); resetMultiTouch(); }}
            disabled={isSpinning || countdown !== 'idle'}
          >
            👆 {t('modeMultitouch')}
          </button>
        </div>

        {mode === 'roulette' && (
          <>
            <div className="chwatzi-roulette">
              <div className={wheelClass}>
                {displayPlayers.map((player) => (
                  <div
                    key={player.id}
                    className={'roulette-item ' + (selectedPlayer?.id === player.id ? 'selected' : '')}
                    style={{
                      '--player-color': player.color,
                    } as React.CSSProperties}
                    onClick={() => selectManually(player)}
                  >
                    <span
                      className="player-indicator"
                      style={{ backgroundColor: player.color }}
                    />
                    <span className="player-name">{player.name}</span>
                    {selectedPlayer?.id === player.id && (
                      <span className="selection-badge">✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="chwatzi-actions">
              <button
                className="primary-button roulette-button"
                type="button"
                onClick={startRoulette}
                disabled={isSpinning || displayPlayers.length === 0}
              >
                <span className="dice-emoji" role="img" aria-label="dice">🎲</span>
                {t('pickRandomly')}
              </button>

              {selectedPlayer && (
                <div className="selection-result">
                  <span>{t('selectedPlayer')}: </span>
                  <strong style={{ color: selectedPlayer.color }}>
                    {selectedPlayer.name}
                  </strong>
                </div>
              )}

              <button
                className="primary-button confirm-button"
                type="button"
                onClick={confirmSelection}
                disabled={displayPlayers.length === 0}
              >
                {t('continue')}
              </button>
            </div>
          </>
        )}

        {mode === 'multitouch' && (
          <div style={{ pointerEvents: 'auto' }}>
            {/* Pick mode sub-toggle */}
            <div className="pick-mode-toggle">
              <button
                type="button"
                className={pickMode === 'single' ? 'pick-btn active' : 'pick-btn'}
                onClick={() => { setPickMode('single'); resetMultiTouch(); }}
                disabled={countdown !== 'idle'}
              >
                {t('pickSingle')}
              </button>
              <button
                type="button"
                className={pickMode === 'order' ? 'pick-btn active' : 'pick-btn'}
                onClick={() => { setPickMode('order'); resetMultiTouch(); }}
                disabled={countdown !== 'idle'}
              >
                {t('pickOrder')}
              </button>
            </div>

            {/* Instructions - shown when no fingers down */}
            {countdown === 'idle' && fingers.length === 0 && (
              <div className="multitouch-instructions">
                <span className="multitouch-icon" role="img" aria-label="fingers">👆</span>
                <p>{t('multitouchInstructions')}</p>
                <p className="muted small">
                  {pickMode === 'single'
                    ? t('multitouchSingleHint')
                    : t('multitouchOrderHint')}
                </p>
              </div>
            )}

            {/* Waiting message */}
            {countdown === 'idle' && fingers.length > 0 && fingers.length < playersWithColors.length && (
              <p className="muted small center-text waiting-text">
                {t('multitouchWaiting')}
              </p>
            )}

            {multiResult && (
              <div className="multitouch-result">
                {pickMode === 'single' ? (
                  <div className="single-winner">
                    <p className="result-label">{t('selectedPlayer')}</p>
                    <div
                      className="winner-card"
                      style={{ '--player-color': multiResult[0].color } as React.CSSProperties}
                    >
                      <span
                        className="player-indicator"
                        style={{ backgroundColor: multiResult[0].color }}
                      />
                      <strong>{multiResult[0].name}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="order-result">
                    <p className="result-label">{t('playOrder')}</p>
                    <ol className="order-list">
                      {multiResult.map((p, i) => (
                        <li
                          key={p.id}
                          className="order-item"
                          style={{ '--player-color': p.color } as React.CSSProperties}
                        >
                          <span className="order-rank">{i + 1}</span>
                          <span
                            className="player-indicator"
                            style={{ backgroundColor: p.color }}
                          />
                          <span className="player-name">{p.name}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <div className="chwatzi-actions">
                  <button
                    className="primary-button confirm-button"
                    type="button"
                    onClick={confirmMultiResult}
                  >
                    {t('continue')}
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={resetMultiTouch}
                  >
                    {t('tryAgain')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
