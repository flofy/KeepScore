import type { Game } from '../domain/game/types'

interface SavedGamesProps {
  games: Game[]
  onResume: (game: Game) => void
  onDelete: (id: string) => void
}

export function SavedGames({ games, onResume, onDelete }: SavedGamesProps) {
  return (
    <>
      {games.length === 0 ? (
        <section className="history"><p className="empty-state">No saved games yet.</p></section>
      ) : (
        <section className="saved-games" aria-label="Saved games">
          {games.map((game) => (
            <article className="saved-game" key={game.id}>
              <div>
                <h2>{game.name || 'Untitled game'}</h2>
                <p>{game.players.map((player) => `${player.name}: ${player.score}`).join(' · ')}</p>
              </div>
              <div className="toolbar">
                <button className="secondary-button" type="button" onClick={() => onResume(game)}>Resume</button>
                <button className="secondary-button" type="button" onClick={() => onDelete(game.id)}>Delete</button>
              </div>
            </article>
          ))}
        </section>
      )}
    </>
  )
}
