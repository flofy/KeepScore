import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import type { Game } from "../domain/game/types";
import { GameSetup } from "../ui/GameSetup";
import { ChwatziScreen } from "../ui/ChwatziScreen";
import { SavedGames } from "../ui/SavedGames";
import { StartScreen } from "../ui/StartScreen";
import { localGameRepository } from "../infrastructure/persistence/gameRepository";
import { useI18n } from "../ui/i18n";
import { GameScreen } from "../features/game/GameScreen";
import { createTempGame } from "../features/chwatzi/createTempGame";

function BackButton() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  if (location.pathname === "/") return null;

  return (
    <button
      className="back-button"
      type="button"
      onClick={() => navigate(-1)}
      aria-label={t("back")}
    >
      ←
    </button>
  );
}

export function RouteShell({
  children,
  showBack = true,
}: {
  children: ReactNode;
  showBack?: boolean;
}) {
  return (
    <div className="route-shell">
      {showBack && <BackButton />}
      {children}
    </div>
  );
}

export function StartScreenRoute() {
  const navigate = useNavigate();
  return (
    <StartScreen
      onNewGame={() => navigate("/setup")}
      onChwatzi={(playerCount) =>
        navigate("/chwatzi?players=" + String(playerCount))
      }
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
  const [searchParams] = useSearchParams();
  const requestedCount = Number(searchParams.get("players"));
  const playerCount =
    Number.isInteger(requestedCount) && requestedCount >= 2
      ? requestedCount
      : 4;
  const game = createTempGame(playerCount);

  return (
    <ChwatziScreen
      game={game}
      onSelect={(startingPlayerId) => {
        localGameRepository.save({ ...game, startingPlayerId });
        navigate("/game?gameId=" + game.id);
      }}
    />
  );
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
      onChwatzi={() =>
        navigate("/chwatzi?players=" + String(game.players.length))
      }
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
    />
  );
}
