import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import type { Game } from "../domain/game/types";
import { GameSetup } from "../ui/GameSetup";
import { ChwatziScreenV2 } from "../ui/ChwatziScreenV2";
import { SavedGames } from "../ui/SavedGames";
import { StartScreen } from "../ui/StartScreen";
import { localGameRepository } from "../infrastructure/persistence/gameRepository";
import { useI18n } from "../ui/i18n";
import { InstallButton } from "../ui/InstallButton";
import { GameScreen } from "../features/game/GameScreen";

function BackButton({ close = false }: { close?: boolean }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  if (location.pathname === "/") return null;

  return (
    <button
      className={close ? "back-button close-button" : "back-button"}
      type="button"
      onClick={() => (close ? navigate("/") : navigate(-1))}
      aria-label={close ? t("close") : t("back")}
    >
      {close ? "✕" : "←"}
    </button>
  );
}

function GlobalMenu() {
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // The game screen already has its own contextual menu with game controls.
  if (location.pathname === "/game") return null;

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      <button
        className={open ? "global-menu-trigger is-open" : "global-menu-trigger"}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? t("closeMenu") : t("menu")}
        aria-expanded={open}
        aria-controls="global-menu-panel"
      >
        <svg className="burger-icon" viewBox="0 0 24 24" aria-hidden="true">
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          )}
        </svg>
      </button>
      {open && (
        <div className="global-menu-backdrop" onClick={() => setOpen(false)}>
          <nav
            id="global-menu-panel"
            className="global-menu-panel"
            aria-label={t("menu")}
            onClick={(event) => event.stopPropagation()}
          >
            <button className="global-menu-close" type="button" onClick={() => setOpen(false)} aria-label={t("closeMenu")}>✕</button>
            <p className="global-menu-eyebrow">KEEPSCORE</p>
            <button className="global-menu-item" type="button" onClick={() => go("/")}>
              <span aria-hidden="true">⌂</span>{t("home")}
            </button>
            <button className="global-menu-item" type="button" onClick={() => go("/setup")}>
              <span aria-hidden="true">＋</span>{t("newGameMenuItem")}
            </button>
            <button className="global-menu-item" type="button" onClick={() => go("/saved")}>
              <span aria-hidden="true">▤</span>{t("savedGames")}
            </button>
            <button className="global-menu-item" type="button" onClick={() => go("/chwatzi")}>
              <span aria-hidden="true">🎲</span>{t("whoStarts")}
            </button>
            <div className="global-menu-divider" />
            <InstallButton variant="menu" />
            <div className="global-menu-languages" role="group" aria-label={lang === "fr" ? "Langue" : "Language"}>
              <button className={lang === "fr" ? "global-menu-language active" : "global-menu-language"} type="button" aria-pressed={lang === "fr"} onClick={() => setLang("fr")}>🇫🇷 Français</button>
              <button className={lang === "en" ? "global-menu-language active" : "global-menu-language"} type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>🇬🇧 English</button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

export function RouteShell({
  children,
  showBack = true,
  close = false,
}: {
  children: ReactNode;
  showBack?: boolean;
  close?: boolean;
}) {
  return (
    <div className="route-shell">
      {showBack && <BackButton close={close} />}
      {children}
      <GlobalMenu />
    </div>
  );
}

export function StartScreenRoute() {
  const navigate = useNavigate();
  return (
    <StartScreen
      onNewGame={() => navigate("/setup")}
      onChwatzi={() => navigate("/chwatzi")}
      onSavedGames={() => navigate("/saved")}
    />
  );
}

export function GameSetupRoute() {
  const navigate = useNavigate();
  return (
    <GameSetup
      onCreate={(game) => {
        localGameRepository.save(game);
        navigate("/game?gameId=" + game.id);
      }}
    />
  );
}

export function ChwatziRoute() {
  const navigate = useNavigate();

  return <ChwatziScreenV2 onBack={() => navigate(-1)} />;
}

export function GameRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("gameId");
  const game = gameId ? localGameRepository.get(gameId) : undefined;

  useEffect(() => {
    if (!game) navigate("/");
  }, [game, navigate]);

  if (!game) return null;

  return (
    <GameScreen
      initialGame={game}
      onNewGame={() => navigate("/setup")}
      onSavedGames={() => navigate("/saved")}
      onChwatzi={() => navigate("/chwatzi")}
      onHome={() => navigate("/")}
    />
  );
}

export function SavedGamesRoute() {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>(() => localGameRepository.list());

  const refresh = useCallback(() => {
    setGames(localGameRepository.list());
  }, []);

  return (
    <SavedGames
      games={games}
      onResume={(game) => navigate("/game?gameId=" + game.id)}
      onDelete={(id) => {
        localGameRepository.remove(id);
        refresh();
      }}
      onClose={() => navigate(-1)}
    />
  );
}
