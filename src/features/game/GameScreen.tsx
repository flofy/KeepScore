import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { Game } from "../../domain/game/types";
import { colorForIndex } from "../../domain/game/colors";
import { useGameHistory } from "../../ui/useGameHistory";
import { InstallButton } from "../../ui/InstallButton";
import { useI18n } from "../../ui/i18n";
import { HistoryGroupingToggle } from "../../ui/HistoryGroupingToggle";
import type { HistoryGrouping } from "../../ui/historyGrouping";
import { groupHistory } from "../../ui/historyGrouping";
import { PlayerCard } from "./PlayerCard";

const RECENT_DELTAS = 6;

function haptic() {
  if ("vibrate" in navigator) navigator.vibrate(8);
}

function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`;
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
  const [historyGrouping, setHistoryGrouping] =
    useState<HistoryGrouping>("round");
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

  const recentDeltasFor = (playerId: string): number[] =>
    game.history
      .filter((entry) => entry.playerId === playerId)
      .slice(-RECENT_DELTAS)
      .map((entry) => entry.delta)
      .reverse();

  const lastDeltaFor = (playerId: string) => {
    for (let i = game.history.length - 1; i >= 0; i -= 1) {
      if (game.history[i].playerId === playerId) return game.history[i].delta;
    }
    return undefined;
  };

  const historyGroups = groupHistory(game.history, historyGrouping);
  const orderedHistoryGroups =
    historyGrouping === "player"
      ? [...historyGroups].sort(
          (a, b) =>
            game.players.findIndex((player) => player.id === a.key) -
            game.players.findIndex((player) => player.id === b.key),
        )
      : [...historyGroups].reverse();

  const historyContent = (
    <section className="history" aria-label={t("history")}>
      <div className="section-heading">
        <div>
          <h2>{t("history")}</h2>
          <span>
            {game.history.length} {t("moves")}
          </span>
        </div>
        <HistoryGroupingToggle
          value={historyGrouping}
          onChange={setHistoryGrouping}
        />
      </div>
      {game.history.length === 0 ? (
        <p className="empty-state">{t("noMoves")}</p>
      ) : (
        <div className="history-groups">
          {orderedHistoryGroups.map((group) => {
            const player =
              historyGrouping === "player"
                ? game.players.find((candidate) => candidate.id === group.key)
                : undefined;
            const entries = [...group.entries].reverse();

            return (
              <section className="history-group" key={group.key}>
                <h3>
                  {historyGrouping === "player"
                    ? player?.name
                    : `Tour ${group.round}`}
                </h3>
                <ol>
                  {entries.map((entry) => {
                    const entryPlayer = game.players.find(
                      (candidate) => candidate.id === entry.playerId,
                    );
                    return (
                      <li key={entry.id}>
                        <span>
                          {historyGrouping === "round" && entryPlayer?.name}
                          {historyGrouping === "round" && "  "}
                          <strong
                            className={
                              entry.delta > 0 ? "delta-plus" : "delta-minus"
                            }
                          >
                            {formatDelta(entry.delta)}
                          </strong>
                        </span>
                        <span className="history-actions">
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => beginEdit(entry.id, entry.delta)}
                            title={t("edit")}
                          >
                            <svg
                              className="btn-icon"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                d="M16.8 3.8a2.4 2.4 0 013.4 3.4L7.6 19.7l-4.6 1.3 1.3-4.6L16.8 3.8z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                              />
                            </svg>
                            {t("edit")}
                          </button>
                          <button
                            type="button"
                            className="secondary-button danger"
                            onClick={() =>
                              dispatch({
                                type: "DELETE_HISTORY_ENTRY",
                                entryId: entry.id,
                              })
                            }
                            aria-label={t("removeHistoryEntry")}
                            title={t("delete")}
                          >
                            <svg
                              className="btn-icon"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                              />
                            </svg>
                            {t("delete")}
                          </button>
                        </span>
                        {editingEntry === entry.id && (
                          <span className="history-editor">
                            <input
                              autoFocus
                              type="number"
                              value={draftDelta}
                              onChange={(event) =>
                                setDraftDelta(event.target.value)
                              }
                              aria-label={t("editHistoryDelta")}
                            />
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={saveEdit}
                            >
                              {t("save")}
                            </button>
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => setEditingEntry(null)}
                            >
                              {t("cancel")}
                            </button>
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>
      )}
    </section>
  );

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
        <header className="app-header game-header">
          <div>
            <p className="eyebrow">SCORE KEEPER</p>
            <input
              className="game-name"
              value={game.name ?? ""}
              placeholder={t("appName")}
              onChange={(event) =>
                dispatch({ type: "RENAME_GAME", name: event.target.value })
              }
              aria-label={t("gameName")}
            />
          </div>
          <div className="toolbar">
            <InstallButton variant="header" />
          </div>
        </header>
        <div className={isDuo ? "quick-actions duo" : "quick-actions"}>
          {isDuo && (
            <button
              className="icon-fab"
              type="button"
              onClick={() => setSwapped((current) => !current)}
              aria-pressed={swapped}
              aria-label={t("swapPlayers")}
            >
              ⇅
            </button>
          )}
          <button
            className="icon-fab"
            type="button"
            onClick={toggleFullscreen}
            aria-pressed={fullscreen}
            aria-label={fullscreen ? t("exitFullscreen") : t("fullscreen")}
          >
            {fullscreen ? (
              <svg className="fab-icon" viewBox="0 0 24 24" aria-hidden="true">
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
              <svg className="fab-icon" viewBox="0 0 24 24" aria-hidden="true">
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
            onClick={() => setMenuOpen(true)}
            aria-label={t("menu")}
          >
            <svg className="burger-icon" viewBox="0 0 24 24" aria-hidden="true">
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
        <section
          className={
            removeMode
              ? "players remove-mode"
              : isDuo
                ? "players duo"
                : game.players.length >= 4
                  ? "players crowded"
                  : "players"
          }
          style={
            (!isDuo &&
              game.players.length > 2 &&
              ({
                "--cols": String(
                  Math.max(2, Math.min(4, Math.ceil(game.players.length / 2))),
                ),
              } as CSSProperties)) ||
            undefined
          }
          aria-label={t("players")}
        >
          {orderedPlayers.map((player, index) => {
            const rotation = playerRotations[player.id] ?? 0;
            return (
              <PlayerCard
                key={player.id}
                player={{
                  ...player,
                  color:
                    player.color ?? colorForIndex(game.players.indexOf(player)),
                }}
                deltas={recentDeltasFor(player.id)}
                rotation={rotation}
                lastDelta={lastDeltaFor(player.id)}
                removeMode={removeMode}
                canRemove={game.players.length > 1}
                tilt={removeMode ? (index % 2 === 0 ? "a" : "b") : undefined}
                onRemove={() => {
                  dispatch({ type: "REMOVE_PLAYER", playerId: player.id });
                  haptic();
                  if (game.players.length <= 2) setRemoveMode(false);
                }}
                onRename={(name) =>
                  dispatch({ type: "RENAME_PLAYER", playerId: player.id, name })
                }
                onDelta={(delta) => {
                  dispatch({ type: "ADD_SCORE", playerId: player.id, delta });
                  haptic();
                }}
                onQuickDelta={(delta) => {
                  dispatch({ type: "ADD_SCORE", playerId: player.id, delta });
                  haptic();
                }}
                onSetScore={(value) => {
                  dispatch({
                    type: "ADD_SCORE",
                    playerId: player.id,
                    delta: value - player.score,
                  });
                  haptic();
                }}
                onFlip={() =>
                  setPlayerRotations((prev) => ({
                    ...prev,
                    [player.id]: prev[player.id] ? 0 : 180,
                  }))
                }
              />
            );
          })}
        </section>
        {historyOpen && (
          <div
            className={
              historyFlipped
                ? "history-fullscreen flipped"
                : "history-fullscreen"
            }
            role="dialog"
            aria-label={t("history")}
          >
            <button
              className="history-close"
              type="button"
              onClick={() => setHistoryOpen(false)}
              aria-label={t("closeHistory")}
              title={t("closeHistory")}
            >
              ✕
            </button>
            <button
              className="history-flip-btn"
              type="button"
              onClick={() => setHistoryFlipped((current) => !current)}
              aria-pressed={historyFlipped}
              aria-label={t("flipHistory")}
              title={t("flipHistory")}
            >
              ↻
            </button>
            {historyContent}
          </div>
        )}
      </main>
      {menuOpen && (
        <div className="drawer-backdrop" onClick={() => setMenuOpen(false)}>
          <nav
            className="menu-drawer"
            aria-label={t("menu")}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="menu-close"
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label={t("closeMenu")}
            >
              ✕
            </button>
            <button
              className="menu-item"
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onHome();
              }}
            >
              <span className="menu-icon">🏠</span>
              {t("home")}
            </button>
            <button
              className="menu-item"
              type="button"
              onClick={() => {
                setHistoryOpen((current) => !current);
                setMenuOpen(false);
              }}
            >
              <span className="menu-icon">🕘</span>
              {t("history")}
            </button>
            <div className="menu-separator" />
            <div className="menu-row">
              <button
                className="menu-item"
                type="button"
                onClick={() => {
                  undo();
                  setMenuOpen(false);
                }}
                disabled={!past.length}
              >
                <span className="menu-icon">↩</span>
                {t("undo")}
              </button>
              <button
                className="menu-item"
                type="button"
                onClick={() => {
                  redo();
                  setMenuOpen(false);
                }}
                disabled={!future.length}
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
                onClick={() => {
                  dispatch({ type: "ADD_PLAYER" });
                  haptic();
                }}
              >
                +
              </button>
              <span className="menu-stepper-count">
                {game.players.length} {t("playersPlural")}
              </span>
              <button
                className="menu-stepper-btn"
                type="button"
                aria-label={t("removePlayer")}
                disabled={game.players.length <= 1}
                onClick={() => {
                  haptic();
                  setMenuOpen(false);
                  setRemoveMode(true);
                }}
              >
                −
              </button>
            </div>
            <button
              className="menu-item"
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onSavedGames();
              }}
            >
              <span className="menu-icon">💾</span>
              {t("savedGames")}
            </button>
            <button
              className="menu-item"
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onNewGame();
              }}
            >
              <span className="menu-icon">🎮</span>
              {t("newGameMenuItem")}
            </button>
            <button
              className="menu-item"
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onChwatzi();
              }}
            >
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
                onClick={() => setLang("fr")}
              >
                <span className="menu-icon">🇫🇷</span>
                Français
              </button>
              <button
                type="button"
                className={
                  lang === "en" ? "menu-item lang active" : "menu-item lang"
                }
                onClick={() => setLang("en")}
              >
                <span className="menu-icon">🇬🇧</span>
                English
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
