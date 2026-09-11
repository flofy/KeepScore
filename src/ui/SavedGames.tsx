import type { Game } from "../domain/game/types";
import { useI18n } from "./i18n";

interface SavedGamesListProps {
  games: Game[];
  onResume: (game: Game) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}

export function SavedGamesList({
  games,
  onResume,
  onDelete,
  compact = false,
}: SavedGamesListProps) {
  const { t } = useI18n();

  if (games.length === 0) {
    return (
      <section className="history">
        <p className="empty-state">{t("noSavedGames")}</p>
      </section>
    );
  }

  return (
    <section className="saved-games" aria-label={t("savedGames")}>
      {games.map((game) => (
        <article className="saved-game" key={game.id}>
          <div>
            <h2>{game.name || t("untitledGame")}</h2>
            <p>
              {game.players
                .map((player) => `${player.name}: ${player.score}`)
                .join(" · ")}
            </p>
          </div>
          {!compact && (
            <div className="toolbar">
              <button
                className="secondary-button"
                type="button"
                onClick={() => onResume(game)}
              >
                {t("resume")}
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => onDelete(game.id)}
              >
                {t("delete")}
              </button>
            </div>
          )}
        </article>
      ))}
    </section>
  );
}

interface SavedGamesProps {
  games: Game[];
  onResume: (game: Game) => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
}

export function SavedGames({
  games,
  onResume,
  onDelete,
  onClose,
}: SavedGamesProps) {
  const { t } = useI18n();
  return (
    <div className="saved-games-container">
      <header className="saved-games-header">
        <h2 className="saved-games-title">{t("savedGames")}</h2>
        {onClose && (
          <button
            type="button"
            className="saved-games-close"
            onClick={onClose}
            aria-label={t("close")}
          >
            ✕
          </button>
        )}
      </header>
      <SavedGamesList games={games} onResume={onResume} onDelete={onDelete} />
    </div>
  );
}
