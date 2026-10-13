import { InstallButton } from "./InstallButton";
import { useI18n, type Lang } from "./i18n";
import type { QwixxOptions } from "../domain/qwixx/qwixx";

export type QuixScoreMenuPlayer = {
  id: string;
  name: string;
  score: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onHome?: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onNewGame?: () => void;
  onSavedGames?: () => void;
  fullscreen: boolean;
  onFullscreenToggle: () => void;
  lang: Lang;
  onLanguageChange: (lang: Lang) => void;
  players: QuixScoreMenuPlayer[];
  activePageIndex: number;
  turnPlayerId: string;
  onSelectPlayer: (index: number) => void;
  onSelectDice: () => void;
  showDice: boolean;
  options: QwixxOptions;
  onToggleOption: (key: "allowReroll" | "physicalDice") => void;
  hideScores: boolean;
  onHideScoresToggle: () => void;
};

export function QuixScoreMenuDrawer({
  open,
  onClose,
  onHome,
  onUndo,
  canUndo,
  onNewGame,
  onSavedGames,
  fullscreen,
  onFullscreenToggle,
  lang,
  onLanguageChange,
  players,
  activePageIndex,
  turnPlayerId,
  onSelectPlayer,
  onSelectDice,
  showDice,
  options,
  onToggleOption,
  hideScores,
  onHideScoresToggle,
}: Props) {
  const { t } = useI18n();

  if (!open) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <nav
        className="menu-drawer"
        aria-label={t("menu")}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="menu-close"
          type="button"
          onClick={onClose}
          aria-label={t("closeMenu")}
        >
          ✕
        </button>

        <div className="menu-content">
          {onHome && (
            <button
              className="menu-item"
              type="button"
              onClick={() => {
                onClose();
                onHome();
              }}
            >
              <span className="menu-icon">🏠</span>
              {t("home")}
            </button>
          )}

          {showDice && (
            <button
              className="menu-item"
              type="button"
              onClick={() => {
                onClose();
                onSelectDice();
              }}
            >
              <span className="menu-icon">🎲</span>
              {t("quixScoreDicePage")}
            </button>
          )}

          <button
            className="menu-item"
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
          >
            <span className="menu-icon">↩</span>
            {t("undo")}
          </button>

          <button
            className="menu-item"
            type="button"
            onClick={onHideScoresToggle}
            aria-pressed={hideScores}
          >
            <span className="menu-icon">{hideScores ? "👁" : "🙈"}</span>
            {hideScores ? t("quixScoreShowScores") : t("quixScoreHideScores")}
          </button>

          <div className="menu-separator" />

          <p className="quixscore-menu-players-label">{t("players")}</p>
          <div className="quixscore-menu-players">
            {players.map((player, index) => {
              const active = activePageIndex === index;
              const isTurn = player.id === turnPlayerId;
              const classes = [
                "quixscore-player-chip",
                active ? "quixscore-player-chip--active" : null,
                isTurn ? "quixscore-player-chip--turn" : null,
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <button
                  key={player.id}
                  type="button"
                  className={classes}
                  aria-pressed={active}
                  onClick={() => {
                    onSelectPlayer(index);
                    onClose();
                  }}
                >
                  <span className="quixscore-player-chip-name">
                    {isTurn ? "🎯 " : ""}
                    {player.name}
                  </span>
                  <span className="quixscore-player-chip-score">
                    {hideScores ? "•••" : player.score}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="menu-separator" />

          <p className="quixscore-menu-players-label">
            {t("quixScoreGameOptions")}
          </p>
          <div className="quixscore-menu-options">
            <button
              className="quixscore-menu-option"
              type="button"
              aria-pressed={options.allowReroll}
              onClick={() => onToggleOption("allowReroll")}
            >
              <span>{t("quixScoreOptionReroll")}</span>
              <span className="quixscore-option-check">
                {options.allowReroll ? "✓" : ""}
              </span>
            </button>
            <button
              className="quixscore-menu-option"
              type="button"
              aria-pressed={options.physicalDice}
              onClick={() => onToggleOption("physicalDice")}
            >
              <span>{t("quixScoreOptionPhysicalDice")}</span>
              <span className="quixscore-option-check">
                {options.physicalDice ? "✓" : ""}
              </span>
            </button>
          </div>

          <div className="menu-separator" />

          {onNewGame && (
            <button
              className="menu-item"
              type="button"
              onClick={() => {
                onClose();
                onNewGame();
              }}
            >
              <span className="menu-icon">🎮</span>
              {t("newGameMenuItem")}
            </button>
          )}

          {onSavedGames && (
            <button
              className="menu-item"
              type="button"
              onClick={() => {
                onClose();
                onSavedGames();
              }}
            >
              <span className="menu-icon">💾</span>
              {t("savedGames")}
            </button>
          )}

          <div className="menu-separator" />

          <button
            className="menu-item"
            type="button"
            onClick={onFullscreenToggle}
            aria-pressed={fullscreen}
          >
            <span className="menu-icon">⛶</span>
            {fullscreen ? t("exitFullscreen") : t("fullscreen")}
          </button>

          <div className="menu-separator" />

          <p className="quixscore-menu-players-label">
            {t("quixScoreHowTo")}
          </p>
          <ul className="quixscore-menu-help">
            <li>{t("quixScoreSwipeHint")}</li>
            <li>{t("quixScoreTurnRestricted")}</li>
            <li>{t("quixScoreLockedHint")}</li>
            {options.allowReroll && !options.physicalDice && (
              <li>{t("quixScoreRerollHint")}</li>
            )}
          </ul>

          <div className="menu-separator" />

          <InstallButton variant="menu" />
          <div className="menu-row lang-row">
            <button
              type="button"
              className={
                lang === "fr" ? "menu-item lang active" : "menu-item lang"
              }
              onClick={() => onLanguageChange("fr")}
            >
              <span className="menu-icon">🇫🇷</span>Français
            </button>
            <button
              type="button"
              className={
                lang === "en" ? "menu-item lang active" : "menu-item lang"
              }
              onClick={() => onLanguageChange("en")}
            >
              <span className="menu-icon">🇬🇧</span>English
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
