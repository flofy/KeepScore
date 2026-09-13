import { useState } from "react";
import type { Game } from "../../domain/game/types";
import { useGameHistory } from "../../ui/useGameHistory";
import { useFullscreen } from "../../ui/useFullscreen";
import { useI18n } from "../../ui/i18n";
import { GameHistoryOverlay } from "./GameHistoryOverlay";
import { GameMenuDrawer } from "./GameMenuDrawer";
import { GamePlayerArea } from "./GamePlayerArea";
import { GameToolbar } from "./GameToolbar";
import { useGameHistoryView } from "./useGameHistoryView";
import { useGamePlayerView } from "./useGamePlayerView";

function haptic() {
  if ("vibrate" in navigator) navigator.vibrate(8);
}

export function GameScreen({
  initialGame,
  onNewGame,
  onSavedGames,
  onChwatzi,
  onHome,
}: {
  initialGame: Game;
  onNewGame: () => void;
  onSavedGames: () => void;
  onChwatzi: () => void;
  onHome: () => void;
}) {
  const {
    present: game,
    past,
    future,
    dispatch,
    undo,
    redo,
  } = useGameHistory(initialGame);
  const { t, lang, setLang } = useI18n();
  const { fullscreen, toggleFullscreen } = useFullscreen();
  const {
    editingEntry,
    draftDelta,
    historyOpen,
    historyFlipped,
    historyGrouping,
    setHistoryGrouping,
    setHistoryFlipped,
    setDraftDelta,
    beginEdit,
    saveEdit,
    openHistory: openHistoryView,
    closeHistory,
    cancelEdit,
    deleteEntry,
  } = useGameHistoryView({ game, dispatch });
  const {
    swapped,
    orderedPlayers,
    playerRotations,
    toggleSwap,
    togglePlayerRotation,
  } = useGamePlayerView(game);
  const [menuOpen, setMenuOpen] = useState(false);
  const [removeMode, setRemoveMode] = useState(false);

  const removePlayer = (playerId: string) => {
    dispatch({ type: "REMOVE_PLAYER", playerId });
    haptic();
    if (game.players.length <= 2) setRemoveMode(false);
  };

  const addScore = (playerId: string, delta: number) => {
    dispatch({ type: "ADD_SCORE", playerId, delta });
    haptic();
  };

  const setScore = (playerId: string, value: number) => {
    const player = game.players.find((candidate) => candidate.id === playerId);
    if (!player) return;
    dispatch({
      type: "ADD_SCORE",
      playerId,
      delta: value - player.score,
    });
    haptic();
  };

  const addPlayer = () => {
    dispatch({ type: "ADD_PLAYER" });
    haptic();
  };

  const openHistory = () => {
    openHistoryView();
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <main className={fullscreen ? "app-shell fullscreen" : "app-shell"}>
        {removeMode && (
          <div className="remove-mode-banner" role="status">
            <span className="remove-mode-hint">{t("removePlayersHint")}</span>
            <button
              className="remove-mode-done"
              type="button"
              onClick={() => setRemoveMode(false)}
            >
              {t("done")}
            </button>
          </div>
        )}

        <GameToolbar
          game={game}
          fullscreen={fullscreen}
          onFullscreenToggle={toggleFullscreen}
          swapped={swapped}
          onSwap={toggleSwap}
          onMenuOpen={() => setMenuOpen(true)}
          onRename={(name) => dispatch({ type: "RENAME_GAME", name })}
        />

        <GamePlayerArea
          game={game}
          orderedPlayers={orderedPlayers}
          removeMode={removeMode}
          playerRotations={playerRotations}
          onRemovePlayer={removePlayer}
          onRenamePlayer={(playerId, name) =>
            dispatch({ type: "RENAME_PLAYER", playerId, name })
          }
          onAddScore={addScore}
          onSetScore={setScore}
          onFlipPlayer={togglePlayerRotation}
        />

        {historyOpen && (
          <GameHistoryOverlay
            game={game}
            historyGrouping={historyGrouping}
            onHistoryGroupingChange={setHistoryGrouping}
            historyFlipped={historyFlipped}
            onClose={closeHistory}
            onFlip={() => setHistoryFlipped((current) => !current)}
            editingEntry={editingEntry}
            draftDelta={draftDelta}
            onBeginEdit={beginEdit}
            onDraftDeltaChange={setDraftDelta}
            onSaveEdit={saveEdit}
            onCancelEdit={cancelEdit}
            onDeleteEntry={deleteEntry}
          />
        )}
      </main>

      <GameMenuDrawer
        open={menuOpen}
        onClose={closeMenu}
        onHome={() => {
          closeMenu();
          onHome();
        }}
        onHistory={openHistory}
        onUndo={() => {
          undo();
          closeMenu();
        }}
        onRedo={() => {
          redo();
          closeMenu();
        }}
        canUndo={Boolean(past.length)}
        canRedo={Boolean(future.length)}
        playerCount={game.players.length}
        onAddPlayer={addPlayer}
        onRemovePlayerMode={() => {
          haptic();
          closeMenu();
          setRemoveMode(true);
        }}
        onSavedGames={() => {
          closeMenu();
          onSavedGames();
        }}
        onNewGame={() => {
          closeMenu();
          onNewGame();
        }}
        onChwatzi={() => {
          closeMenu();
          onChwatzi();
        }}
        lang={lang}
        onLanguageChange={setLang}
      />
    </>
  );
}
