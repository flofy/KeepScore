import { useCallback, useState } from "react";
import { useI18n } from "./i18n";
import { SavedGamesList } from "./SavedGames";
import { localGameRepository } from "../infrastructure/persistence/gameRepository";
import type { Game } from "../domain/game/types";

type Props = {
  onNewGame: () => void;
  onChwatzi: () => void;
  onSavedGames: () => void;
  onResumeGame: (gameId: string) => void;
};

export function StartScreen({
  onNewGame,
  onChwatzi,
  onSavedGames,
  onResumeGame,
}: Props) {
  const { t } = useI18n();
  const [games, setGames] = useState<Game[]>(() => localGameRepository.list());

  const refreshGames = useCallback(() => {
    setGames(localGameRepository.list());
  }, []);

  const handleChwatzi = useCallback(() => {
    onChwatzi();
  }, [onChwatzi]);

  return (
    <main className="start-screen">
      <div className="start-card">
        <header className="start-header">
          <div className="intro-arena" aria-hidden="true">
            <span className="intro-ball" />
            <span className="intro-center-mark" />
            <span className="intro-square" />
          </div>
          <h1>KeepScore</h1>
          <p className="muted">{t("appName")}</p>
        </header>

        <div className="start-options">
          <button
            type="button"
            className="start-option-btn primary"
            onClick={onNewGame}
          >
            <span className="option-icon">🎮</span>
            <span className="option-label">{t("newGame")}</span>
            <span className="option-desc">{t("startNewGame")}</span>
          </button>

          <div className="option-divider">
            <span>{t("or")}</span>
          </div>

          <div className="chwatzi-option">
            <button
              type="button"
              className="start-option-btn primary chwatzi-btn"
              onClick={handleChwatzi}
            >
              <span className="option-icon">🎲</span>
              <span className="option-label">{t("whoStarts")}</span>
              <span className="option-desc">{t("startChwatzi")}</span>
            </button>
          </div>

          {games.length === 0 && (
            <button
              type="button"
              className="start-option-btn secondary"
              onClick={onSavedGames}
            >
              <span className="option-icon">💾</span>
              <span className="option-label">{t("savedGames")}</span>
              <span className="option-desc">{t("viewSavedGames")}</span>
            </button>
          )}
        </div>

        {games.length > 0 && (
          <div className="home-saved-games">
            <h2 className="home-saved-games-title">{t("savedGames")}</h2>
            <SavedGamesList
              games={games}
              onResume={(game) => onResumeGame(game.id)}
              onDelete={(id) => {
                localGameRepository.remove(id);
                refreshGames();
              }}
              compact
            />
          </div>
        )}
      </div>
    </main>
  );
}
