import { InstallButton } from "../../ui/InstallButton";
import { useI18n, type Lang } from "../../ui/i18n";
import type { PlayerGridLayout } from "./usePlayerGrid";

type Props = {
  open: boolean;
  onClose: () => void;
  onHome: () => void;
  onHistory: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  playerCount: number;
  isMunchkin: boolean;
  playerGridLayout: PlayerGridLayout;
  onPlayerGridLayoutChange: (layout: PlayerGridLayout) => void;
  onAddPlayer: () => void;
  onRemovePlayerMode: () => void;
  onSavedGames: () => void;
  onNewGame: () => void;
  onChwatzi: () => void;
  lang: Lang;
  onLanguageChange: (lang: Lang) => void;
};

export function GameMenuDrawer({
  open,
  onClose,
  onHome,
  onHistory,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  playerCount,
  isMunchkin,
  playerGridLayout,
  onPlayerGridLayoutChange,
  onAddPlayer,
  onRemovePlayerMode,
  onSavedGames,
  onNewGame,
  onChwatzi,
  lang,
  onLanguageChange,
}: Props) {
  const { t } = useI18n();

  if (!open) return null;

  const gridOptions: Array<{ value: PlayerGridLayout; label: string }> =
    lang === "fr"
      ? [
          { value: "auto", label: "Auto" },
          { value: "1", label: "1 par ligne" },
          { value: "2", label: "2 par ligne" },
          { value: "3", label: "3 par ligne" },
          { value: "4", label: "4 par ligne" },
        ]
      : [
          { value: "auto", label: "Auto" },
          { value: "1", label: "1 per row" },
          { value: "2", label: "2 per row" },
          { value: "3", label: "3 per row" },
          { value: "4", label: "4 per row" },
        ];

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

        <button className="menu-item" type="button" onClick={onHistory}>
          <span className="menu-icon">🕘</span>
          {t("history")}
        </button>
        <div className="menu-separator" />
        <div className="menu-row">
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
            onClick={onRedo}
            disabled={!canRedo}
          >
            <span className="menu-icon">↪</span>
            {t("redo")}
          </button>
        </div>
        <div className="menu-separator" />
        {!isMunchkin && (
          <div className="menu-player-grid">
            <div className="menu-item menu-player-grid-label">
              <span className="menu-icon">▦</span>
              {lang === "fr" ? "Disposition des joueurs" : "Player layout"}
            </div>
            <div
              className="player-grid-options"
              role="group"
              aria-label={lang === "fr" ? "Disposition" : "Layout"}
            >
              {gridOptions.map((option) => (
                <button
                  key={option.value}
                  className={
                    option.value === playerGridLayout
                      ? "menu-option player-grid-option active"
                      : "menu-option player-grid-option"
                  }
                  type="button"
                  aria-label={option.label}
                  aria-pressed={option.value === playerGridLayout}
                  title={option.label}
                  onClick={() => onPlayerGridLayoutChange(option.value)}
                >
                  <span
                    className="menu-grid-icon"
                    data-columns={option.value}
                    aria-hidden="true"
                  >
                    <span />
                    <span />
                    <span />
                    <span />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="menu-separator" />
        <div className="menu-row player-count-row">
          <button
            className="menu-stepper-btn"
            type="button"
            aria-label={t("addPlayerMenuItem")}
            onClick={onAddPlayer}
          >
            +
          </button>
          <span className="menu-stepper-count">
            {playerCount} {t("playersPlural")}
          </span>
          <button
            className="menu-stepper-btn"
            type="button"
            aria-label={t("removePlayer")}
            disabled={playerCount <= 1}
            onClick={onRemovePlayerMode}
          >
            −
          </button>
        </div>
        <button className="menu-item" type="button" onClick={onSavedGames}>
          <span className="menu-icon">💾</span>
          {t("savedGames")}
        </button>
        <button className="menu-item" type="button" onClick={onNewGame}>
          <span className="menu-icon">🎮</span>
          {t("newGameMenuItem")}
        </button>
        <button className="menu-item" type="button" onClick={onChwatzi}>
          <span className="menu-icon">🎲</span>
          {t("whoStarts")}
        </button>
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
      </nav>
    </div>
  );
}
