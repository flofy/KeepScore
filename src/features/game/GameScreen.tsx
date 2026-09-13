import { useEffect, useState } from "react";
import type { Game } from "../../domain/game/types";
import { findPreset } from "../../domain/game/presets";
import { useGameHistory } from "../../ui/useGameHistory";
import { useI18n } from "../../ui/i18n";
import type { HistoryGrouping } from "../../ui/historyGrouping";
import { GameHistoryOverlay } from "./GameHistoryOverlay";
import { GameMenuDrawer } from "./GameMenuDrawer";
import { GamePlayerArea } from "./GamePlayerArea";
import { GameToolbar } from "./GameToolbar";

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
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [draftDelta, setDraftDelta] = useState("");
  const [swapped, setSwapped] = useState(false);
  const [playerRotations, setPlayerRotations] = useState<
    Record<string, number>
  >({});
  const [fullscreen, setFullscreen] = useState(
    () => localStorage.getItem("keepscore-fullscreen") === "1",
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [removeMode, setRemoveMode] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyFlipped, setHistoryFlipped] = useState(false);
  const [historyGrouping, setHistoryGrouping] = useState<HistoryGrouping>(
    () =>
      findPreset(game.presetId ?? "default")?.defaultHistoryGrouping ?? "round",
  );
  const isDuo = game.players.length === 2;
  const orderedPlayers =
    isDuo && swapped ? [game.players[1], game.players[0]] : game.players;

  useEffect(() => {
    localStorage.setItem("keepscore-fullscreen", fullscreen ? "1" : "0");
  }, [fullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    document.body.style.overflow = historyOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [historyOpen]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else {
        setFullscreen((current) => !current);
      }
    } catch {
      setFullscreen((current) => !current);
    }
  };

  const beginEdit = (id: string, delta: number) => {
    setEditingEntry(id);
    setDraftDelta(String(delta));
  };

  const saveEdit = () => {
    if (!editingEntry) return;
    const delta = Number(draftDelta);
    if (Number.isFinite(delta) && delta !== 0) {
      dispatch({ type: "EDIT_HISTORY_ENTRY", entryId: editingEntry, delta });
    }
    setEditingEntry(null);
  };

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
    setHistoryOpen(true);
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
          onSwap={() => setSwapped((current) => !current)}
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
          onFlipPlayer={(playerId) =>
            setPlayerRotations((prev) => ({
              ...prev,
              [playerId]: prev[playerId] ? 0 : 180,
            }))
          }
        />

        {historyOpen && (
          <GameHistoryOverlay
            game={game}
            historyGrouping={historyGrouping}
            onHistoryGroupingChange={setHistoryGrouping}
            historyFlipped={historyFlipped}
            onClose={() => setHistoryOpen(false)}
            onFlip={() => setHistoryFlipped((current) => !current)}
            editingEntry={editingEntry}
            draftDelta={draftDelta}
            onBeginEdit={beginEdit}
            onDraftDeltaChange={setDraftDelta}
            onSaveEdit={saveEdit}
            onCancelEdit={() => setEditingEntry(null)}
            onDeleteEntry={(entryId) =>
              dispatch({ type: "DELETE_HISTORY_ENTRY", entryId })
            }
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
