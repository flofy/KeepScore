import type { Game } from '../domain/game/types'
import { useI18n } from './i18n'

interface SavedGamesProps {
  games: Game[]
  onResume: (game: Game) => void
  onDelete: (id: string) => void
  onBack?: () => void
}

export function SavedGames({ games, onResume, onDelete, onBack }: SavedGamesProps) {
  const { t } = useI18n()
  return (
    <>
      {onBack && (
        <button
          className="saved-back-button"
          type="button"
          onClick={onBack}
          aria-label={t('back')}
        >
          ←
        </button>
      )}
      {games.length === 0 ? (
        <section className="history"><p className="empty-state">{t('noSavedGames')}</p></section>
      ) : (
        <section className="saved-games" aria-label={t('savedGames')}>
          {games.map((game) => (
            <article className="saved-game" key={game.id}>
              <div>
                <h2>{game.name || t('untitledGame')}</h2>
                <p>{game.players.map((player) => `${player.name}: ${player.score}`).join(' · ')}</p>
              </div>
              <div className="toolbar">
                <button className="secondary-button" type="button" onClick={() => onResume(game)}>{t('resume')}</button>
                <button className="secondary-button" type="button" onClick={() => onDelete(game.id)}>{t('delete')}</button>
              </div>
            </article>
          ))}
        </section>
      )}
    </>
  )
}
