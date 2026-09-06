import { useState, useEffect, useRef, useCallback } from 'react'
import type { Game, Player } from '../domain/game/types'
import { colorForIndex } from '../domain/game/colors'
import { useI18n } from './i18n'

type Props = {
  game: Game
  onSelect: (startingPlayerId: string) => void
  onBack?: () => void
}

export function ChwatziScreen({ game, onSelect, onBack }: Props) {
  const { t } = useI18n()
  const [isSpinning, setIsSpinning] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [displayPlayers, setDisplayPlayers] = useState<Player[]>([])
  const [animationSpeed, setAnimationSpeed] = useState(50)
  const spinTimerRef = useRef<number | null>(null)
  const slowdownTimerRef = useRef<number | null>(null)
  const finalTimeoutRef = useRef<number | null>(null)

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
    
    // Nettoyer les timers précédents
    if (spinTimerRef.current) clearInterval(spinTimerRef.current)
    if (slowdownTimerRef.current) clearTimeout(slowdownTimerRef.current)
    if (finalTimeoutRef.current) clearTimeout(finalTimeoutRef.current)
    
    // Initialiser avec les joueurs mélangés
    const shuffled = [...playersWithColors].sort(() => Math.random() - 0.5)
    setDisplayPlayers(shuffled)
    
    let currentSpeed = 50
    let iterations = 0
    const maxIterations = 30
    
    // Fonction pour faire tourner
    const spin = () => {
      iterations++
      
      // Ralentir progressivement
      if (iterations > maxIterations * 0.7) {
        currentSpeed = Math.min(500, currentSpeed * 1.2)
      } else if (iterations > maxIterations * 0.4) {
        currentSpeed = Math.min(200, currentSpeed * 1.1)
      }
      
      setAnimationSpeed(currentSpeed)
      
      // Changer l'ordre des joueurs
      setDisplayPlayers(prev => {
        const newPlayers = [...prev]
        const last = newPlayers.pop()
        if (last) newPlayers.unshift(last)
        return newPlayers
      })
      
      // Condition d'arrêt
      if (iterations >= maxIterations) {
        if (spinTimerRef.current) clearInterval(spinTimerRef.current)
        
        // Sélectionner un joueur final
        const finalIndex = Math.floor(Math.random() * playersWithColors.length)
        const finalPlayer = playersWithColors[finalIndex]
        
        setSelectedPlayer(finalPlayer)
        setDisplayPlayers([finalPlayer, ...playersWithColors.filter(p => p.id !== finalPlayer.id)])
        setIsSpinning(false)
        return
      }
    }
    
    // Démarrer la rotation
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
    }
  }, [])

  // Initialiser displayPlayers
  useEffect(() => {
    setDisplayPlayers(playersWithColors)
  }, [playersWithColors])

  const wheelClass = isSpinning ? 'roulette-wheel spinning' : 'roulette-wheel'

  return (
    <main className="chwatzi-screen">
      <div className="chwatzi-card">
        {onBack && (
          <button 
            className="back-button" 
            type="button" 
            onClick={onBack}
            aria-label={t('back')}
            disabled={isSpinning}
          >
            ←
          </button>
        )}
        
        <header className="chwatzi-header">
          <p className="eyebrow">CHWATZI</p>
          <h1>{t('whoStarts')}</h1>
          <p className="muted">{t('chwatziTagline')}</p>
        </header>

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
      </div>
    </main>
  )
}
