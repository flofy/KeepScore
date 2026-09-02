import { useState } from 'react'
import { createGame } from '../domain/game/gameFactory'
import { PLAYER_COLORS, colorForIndex } from '../domain/game/colors'
import { GAME_PRESETS } from '../domain/game/presets'
import type { Game } from '../domain/game/types'
import { useI18n } from './i18n'

type Props = { onCreate: (game: Game) => void }

export function GameSetup({ onCreate }: Props) {
  const { t, lang, setLang } = useI18n()
  const [names, setNames] = useState(['Alice', 'Bob'])
  const [colors, setColors] = useState<string[]>(() => names.map((_, index) => colorForIndex(index)))
  const [gameName, setGameName] = useState('')
  const [startingScore, setStartingScore] = useState('0')
  const [presetId, setPresetId] = useState('custom')

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
  function selectPreset(id: string) {
    const preset = GAME_PRESETS.find((candidate) => candidate.id === id)
    if (!preset) return
    setPresetId(id)
    setStartingScore(String(preset.startingScore))
    if (preset.id !== 'custom' && !gameName.trim()) setGameName(preset.name)
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
          <h1>{t('newGame')}</h1>
          <p className="muted">{t('setupTagline')}</p>
        </header>
        <section className="setup-section">
          <label className="field-label" htmlFor="game-name"><span>{t('gameName')}</span><span className="optional">{t('optional')}</span></label>
          <input id="game-name" className="setup-input" value={gameName} onChange={(event) => setGameName(event.target.value)} placeholder={t('gameNamePlaceholder')} />
        </section>
        <section className="setup-section">
          <label className="field-label" htmlFor="starting-score"><span>{t('startingScore')}</span><span className="optional">{t('startingScoreHint')}</span></label>
          <input id="starting-score" className="setup-input" type="number" inputMode="numeric" value={startingScore} onChange={(event) => { setStartingScore(event.target.value); setPresetId('custom') }} placeholder="0" />
        </section>
        <section className="setup-section">
          <p className="field-kicker">{t('presets')}</p>
          <div className="preset-row" role="radiogroup" aria-label={t('presets')}>
            {GAME_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                role="radio"
                aria-checked={presetId === preset.id}
                className={presetId === preset.id ? 'preset-chip selected' : 'preset-chip'}
                onClick={() => selectPreset(preset.id)}
              >
                <span className="preset-emoji" aria-hidden="true">{preset.emoji}</span>
                <span className="preset-name">{preset.id === 'custom' ? t('presetCustom') : preset.name}</span>
                <span className="preset-score">{preset.startingScore}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="setup-section">
          <div className="section-heading"><div><p className="field-kicker">{t('players')}</p><h2>{t('whoIsPlaying')}</h2></div><span className="player-count">{names.length}</span></div>
          <div className="player-list">
            {names.map((name, index) => (
              <div className="player-editor" key={index}>
                <span className="player-number">{index + 1}</span>
                <input value={name} onChange={(event) => updateName(index, event.target.value)} aria-label={`${t('playerNumber')} ${index + 1} ${t('playerName')}`} />
                <button className="icon-button" type="button" onClick={() => removePlayer(index)} disabled={names.length <= 1} aria-label={`${t('removePlayer')} ${index + 1}`}>×</button>
                <div className="color-row" role="radiogroup" aria-label={`${t('colorForPlayer')} ${index + 1}`}>
                  {PLAYER_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      role="radio"
                      aria-checked={colors[index] === color}
                      className={colors[index] === color ? 'color-dot selected' : 'color-dot'}
                      style={{ background: color }}
                      onClick={() => setColor(index, color)}
                      aria-label={`${t('setPlayerColor')} ${color} ${t('playerNumber')} ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button className="add-player-button" type="button" onClick={addPlayer}>{t('addPlayer')}</button>
        </section>
        <button className="primary-button" type="button" onClick={startGame}>{t('startGame')} <span>→</span></button>
        <button className="lang-toggle" type="button" onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}>{t('language')}</button>
      </div>
    </main>
  )
}
