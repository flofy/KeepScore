import { useState, useCallback } from 'react'
import { useI18n } from './i18n'
import type { Game, Player } from '../domain/game/types'
import { colorForIndex } from '../domain/game/colors'

type Props = {
  onNewGame: () => void
  onChwatzi: (playerCount: number) => void
}

export function StartScreen({ onNewGame, onChwatzi }: Props) {
  const { t } = useI18n()
  const [playerCount, setPlayerCount] = useState(2)

  const handlePlayerCountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value >= 2 && value <= 10) {
      setPlayerCount(value)
    }
  }, [])

  const handleIncrement = useCallback(() => {
    if (playerCount < 10) setPlayerCount(p => p + 1)
  }, [playerCount])

  const handleDecrement = useCallback(() => {
    if (playerCount > 2) setPlayerCount(p => p - 1)
  }, [playerCount])

  const handleChwatzi = useCallback(() => {
    onChwatzi(playerCount)
  }, [playerCount, onChwatzi])

  return (
    <main className="start-screen">
      <div className="start-card">
        <header className="start-header">
          <h1>KeepScore</h1>
          <p className="muted">{t('appName')}</p>
        </header>

        <div className="start-options">
          <button
            type="button"
            className="start-option-btn primary"
            onClick={onNewGame}
          >
            <span className="option-icon">🎮</span>
            <span className="option-label">{t('newGame')}</span>
            <span className="option-desc">{t('startNewGame')}</span>
          </button>

          <div className="option-divider">
            <span>{t('or')}</span>
          </div>

          <div className="chwatzi-option">
            <button
              type="button"
              className="start-option-btn primary chwatzi-btn"
              onClick={handleChwatzi}
              disabled={playerCount < 2}
            >
              <span className="option-icon">🎲</span>
              <span className="option-label">{t('whoStarts')}</span>
              <span className="option-desc">{t('startChwatzi')}</span>
            </button>

            <div className="player-count-selector">
              <button
                type="button"
                className="count-btn"
                onClick={handleDecrement}
                disabled={playerCount <= 2}
                aria-label="Decrease players"
              >
                −
              </button>
              <span className="count-value">{playerCount}</span>
              <input
                type="range"
                min={2}
                max={10}
                value={playerCount}
                onChange={handlePlayerCountChange}
                className="count-slider"
                aria-label="Number of players"
              />
              <button
                type="button"
                className="count-btn"
                onClick={handleIncrement}
                disabled={playerCount >= 10}
                aria-label="Increase players"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}