import { InstallButton } from "../../ui/InstallButton";
import { useI18n } from "../../ui/i18n";

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
  onAddPlayer: () => void;
  onRemovePlayerMode: () => void;
  onSavedGames: () => void;
  onNewGame: () => void;
  onChwatzi: () => void;
  lang: "fr" | "en";
  onLanguageChange: (lang: "fr" | "en") => void;
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
            <span className="menu-icon">🇫🇷</span>
            Français
          </button>
          <button
            type="button"
            className={
              lang === "en" ? "menu-item lang active" : "menu-item lang"
            }
            onClick={() => onLanguageChange("en")}
          >
            <span className="menu-icon">🇬🇧</span>
            English
          </button>
        </div>
      </nav>
    </div>
  );
}
