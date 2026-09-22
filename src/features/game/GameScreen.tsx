import { useEffect, useRef, useState } from "react";
import type { Game, MunchkinStats } from "../../domain/game/types";
import { useGameHistory } from "../../ui/useGameHistory";
import { useFullscreen } from "../../ui/useFullscreen";
import { useI18n } from "../../ui/i18n";
import { appToast } from "../../ui/toast";
import { GameHistoryOverlay } from "./GameHistoryOverlay";
import { GameMenuDrawer } from "./GameMenuDrawer";
import { MunchkinCombatPanel } from "./MunchkinCombatPanel";
import { GamePlayerArea } from "./GamePlayerArea";
import { GameToolbar } from "./GameToolbar";
import { useGameHistoryView } from "./useGameHistoryView";
import { useGamePlayerView } from "./useGamePlayerView";
import { getPlayerGridColumns, usePlayerGrid } from "./usePlayerGrid";
import "./munchkin-combat.css";

function haptic() {
  if ("vibrate" in navigator) navigator.vibrate(8);
}

const FLOATING_CONTROL_KEY = "keepscore-fullscreen-exit-control-position";
const CONTROL_SIZE = 34;
const CONTROL_MARGIN = 8;
const TAP_MAX_DURATION_MS = 300;
const DRAG_THRESHOLD_PX = 8;
const TAP_MAX_DURATION_MS = 300;
const TAP_MAX_DISTANCE_PX = 8;

type ControlPosition = { x: number; y: number };
type ControlPointer = {
  pointerId: number;
  offsetX: number;
  offsetY: number;
  startX: number;
  startY: number;
  startedAt: number;
};

function getInitialControlPosition(): ControlPosition {
  if (typeof window === "undefined") return { x: 0, y: 0 };
  try {
    const stored = JSON.parse(
      localStorage.getItem(FLOATING_CONTROL_KEY) ?? "null",
    );
    if (stored && Number.isFinite(stored.x) && Number.isFinite(stored.y))
      return stored;
  } catch {}
  return {
    x: Math.max(
      CONTROL_MARGIN,
      window.innerWidth - CONTROL_SIZE - CONTROL_MARGIN,
    ),
    y: Math.max(
      CONTROL_MARGIN,
      window.innerHeight - CONTROL_SIZE - CONTROL_MARGIN,
    ),
  };
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
  const {
    fullscreen,
    toggleFullscreen,
    keepHeaderInFullscreen,
    setKeepHeaderPreference,
  } = useFullscreen();
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
  const { layout: playerGridLayout, setLayout: setPlayerGridLayout } =
    usePlayerGrid();
  const [menuOpen, setMenuOpen] = useState(false);
  const [removeMode, setRemoveMode] = useState(false);
  const [combatPlayerId, setCombatPlayerId] = useState<string | null>(null);
  const [controlPosition, setControlPosition] = useState<ControlPosition>(
    getInitialControlPosition,
  );
  const dragRef = useRef<ControlPointer | null>(null);

  useEffect(() => {
    if (!fullscreen || keepHeaderInFullscreen) return;
    const clamped = clampControlPosition(controlPosition);
    if (clamped.x !== controlPosition.x || clamped.y !== controlPosition.y)
      setControlPosition(clamped);
  }, [fullscreen, keepHeaderInFullscreen]);

  useEffect(() => {
    if (typeof window !== "undefined")
      localStorage.setItem(
        FLOATING_CONTROL_KEY,
        JSON.stringify(controlPosition),
      );
  }, [controlPosition]);

  const handleControlPointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - controlPosition.x,
      offsetY: event.clientY - controlPosition.y,
      startX: event.clientX,
      startY: event.clientY,
      startedAt: performance.now(),
    };
  };

  const handleControlPointerMove = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setControlPosition(
      clampControlPosition({
        x: event.clientX - drag.offsetX,
        y: event.clientY - drag.offsetY,
      }),
    );
  };

  const handleControlPointerUp = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const elapsed = performance.now() - drag.startedAt;
    const distance = Math.hypot(
      event.clientX - drag.startX,
      event.clientY - drag.startY,
    );
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (elapsed <= TAP_MAX_DURATION_MS && distance <= TAP_MAX_DISTANCE_PX)
      toggleFullscreen();
  };

  const handleControlPointerCancel = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const removePlayer = (playerId: string) => {
    dispatch({ type: "REMOVE_PLAYER", playerId });
    appToast.success(t("playerRemoved"));
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
    dispatch({ type: "ADD_SCORE", playerId, delta: value - player.score });
    haptic();
  };
  const updateMunchkinStats = (playerId: string, stats: MunchkinStats) => {
    dispatch({ type: "UPDATE_MUNCHKIN_STATS", playerId, stats });
    haptic();
  };
  const updateMunchkinLevel = (playerId: string, level: number) => {
    const player = game.players.find((candidate) => candidate.id === playerId);
    if (!player?.munchkin) return;
    updateMunchkinStats(playerId, {
      ...player.munchkin,
      level: Math.max(0, Math.min(10, Math.trunc(level))),
    });
  };
  const addPlayer = () => {
    dispatch({ type: "ADD_PLAYER" });
    appToast.success(t("playerAdded"));
    haptic();
  };
  const openHistory = () => {
    openHistoryView();
    setMenuOpen(false);
  };
  const closeMenu = () => setMenuOpen(false);
  const combatPlayer = game.players.find(
    (player) => player.id === combatPlayerId,
  );
  const shellClassName = [
    "app-shell",
    fullscreen ? "fullscreen" : "",
    fullscreen && !keepHeaderInFullscreen ? "fullscreen-hide-header" : "",
    game.presetId === "munchkin" ? "munchkin-theme" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <main className={shellClassName}>
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
        {!keepHeaderInFullscreen && fullscreen && (
          <button
            className="fullscreen-exit-control"
            type="button"
            onPointerDown={handleControlPointerDown}
            onPointerMove={handleControlPointerMove}
            onPointerUp={handleControlPointerUp}
            onPointerCancel={handleControlPointerCancel}
            style={{ left: controlPosition.x, top: controlPosition.y }}
            aria-label={t("exitFullscreen")}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </button>
        )}
        <GamePlayerArea
          game={game}
          orderedPlayers={orderedPlayers}
          removeMode={removeMode}
          playerRotations={playerRotations}
          playerGridColumns={getPlayerGridColumns(
            playerGridLayout,
            game.players.length,
          )}
          onRemovePlayer={removePlayer}
          onRenamePlayer={(playerId, name) =>
            dispatch({ type: "RENAME_PLAYER", playerId, name })
          }
          onAddScore={addScore}
          onSetScore={setScore}
          onUpdateMunchkinStats={updateMunchkinStats}
          onFlipPlayer={togglePlayerRotation}
          onCombat={setCombatPlayerId}
        />
        {combatPlayer && (
          <div className="munchkin-combat-backdrop">
            <div className="munchkin-combat-modal">
              <button
                className="munchkin-combat-close"
                type="button"
                onClick={() => setCombatPlayerId(null)}
                aria-label={lang === "fr" ? "Fermer" : "Close"}
              >
                ×
              </button>
              <MunchkinCombatPanel
                key={combatPlayer.id}
                game={{ ...game, startingPlayerId: combatPlayer.id }}
                onUpdateLevel={updateMunchkinLevel}
              />
            </div>
          </div>
        )}
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
          appToast.info(t("undoApplied"));
          closeMenu();
        }}
        onRedo={() => {
          redo();
          appToast.info(t("redoApplied"));
          closeMenu();
        }}
        canUndo={Boolean(past.length)}
        canRedo={Boolean(future.length)}
        playerCount={game.players.length}
        isMunchkin={game.presetId === "munchkin"}
        playerGridLayout={playerGridLayout}
        onPlayerGridLayoutChange={setPlayerGridLayout}
        keepHeaderInFullscreen={keepHeaderInFullscreen}
        onKeepHeaderInFullscreenChange={setKeepHeaderPreference}
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

function clampControlPosition(position: ControlPosition): ControlPosition {
  if (typeof window === "undefined") return position;
  return {
    x: Math.min(
      Math.max(CONTROL_MARGIN, position.x),
      Math.max(
        CONTROL_MARGIN,
        window.innerWidth - CONTROL_SIZE - CONTROL_MARGIN,
      ),
    ),
    y: Math.min(
      Math.max(CONTROL_MARGIN, position.y),
      Math.max(
        CONTROL_MARGIN,
        window.innerHeight - CONTROL_SIZE - CONTROL_MARGIN,
      ),
    ),
  };
}
