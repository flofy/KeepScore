import { InstallButton } from "../../ui/InstallButton";
import { useI18n } from "../../ui/i18n";
import type { Game } from "../../domain/game/types";

type Props = {
  game: Game;
  fullscreen: boolean;
  onFullscreenToggle: () => void;
  swapped: boolean;
  onSwap: () => void;
  onMenuOpen: () => void;
  onRename: (name: string) => void;
};

export function GameToolbar({
  game,
  fullscreen,
  onFullscreenToggle,
  swapped,
  onSwap,
  onMenuOpen,
  onRename,
}: Props) {
  const { t } = useI18n();
  const isDuo = game.players.length === 2;

  return (
    <>
      <header className="app-header game-header">
        <div>
          <p className="eyebrow">SCORE KEEPER</p>
          <input
            className="game-name"
            value={game.name ?? ""}
            placeholder={t("appName")}
            onChange={(event) => onRename(event.target.value)}
            aria-label={t("gameName")}
          />
        </div>
        <div className="toolbar">
          <InstallButton variant="header" />
          <div className={isDuo ? "quick-actions duo" : "quick-actions"}>
            {isDuo && (
              <button
                className="icon-fab"
                type="button"
                onClick={onSwap}
                aria-pressed={swapped}
                aria-label={t("swapPlayers")}
              >
                ⇅
              </button>
            )}
            <button
              className="icon-fab"
              type="button"
              onClick={onFullscreenToggle}
              aria-pressed={fullscreen}
              aria-label={fullscreen ? t("exitFullscreen") : t("fullscreen")}
            >
              {fullscreen ? (
                <svg
                  className="fab-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              ) : (
                <svg
                  className="fab-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              )}
            </button>
            <button
              className="burger-button"
              type="button"
              onClick={onMenuOpen}
              aria-label={t("menu")}
            >
              <svg
                className="burger-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
