import { InstallButton } from "./InstallButton";
import { useI18n, type Lang } from "./i18n";

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

          <button
            className="menu-item"
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
          >
            <span className="menu-icon">↩</span>
            {t("undo")}
          </button>

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
