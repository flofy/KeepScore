import { useEffect, useRef, useState } from "react";
import type {
  ChangeEvent,
  CSSProperties,
  PointerEvent as ReactPointerEvent,
} from "react";
import type { Game, Player } from "../domain/game/types";
import { colorForIndex } from "../domain/game/colors";
import { GameSetup } from "./GameSetup";
import { ChwatziScreen } from "./ChwatziScreen";
import { SavedGames } from "./SavedGames";
import { localGameRepository } from "../infrastructure/persistence/gameRepository";
import { createGame } from "../domain/game/gameFactory";
import {
  downloadGames,
  importGames,
} from "../infrastructure/portability/gamesPortability";
import { useGameHistory } from "./useGameHistory";
import { InstallButton } from "./InstallButton";
import { I18nProvider, useI18n } from "./i18n";
import { LangFlags } from "./LangFlags";
import "./saved-games.css";
import "./chwatzi.css";

function haptic() {
  if ("vibrate" in navigator) navigator.vibrate(8);
}
type Screen = "setup" | "chwatzi" | "game" | "saved";
const RECENT_DELTAS = 6;

function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

// Shrinks an element's font-size so its content always fits its available width.
function useFitText<T extends HTMLElement>(content: unknown) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = () => {
      const avail = el.clientWidth;
      const natural = el.scrollWidth;
      if (natural > avail && avail > 0) {
        const current = parseFloat(window.getComputedStyle(el).fontSize);
        el.style.fontSize = `${Math.max(12, current * (avail / natural))}px`;
      }
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => observer.disconnect();
  }, [content]);
  return ref;
}

type PlayerCardProps = {
  player: Player;
  deltas: number[];
  rotation?: number;
  lastDelta?: number;
  onRename: (name: string) => void;
  onDelta: (delta: number) => void;
  onQuickDelta: (delta: number) => void;
  onSetScore: (value: number) => void;
  onFlip?: () => void;
};

function PlayerCard({
  player,
  deltas,
  rotation = 0,
  lastDelta,
  onRename,
  onDelta,
  onQuickDelta,
  onSetScore,
  onFlip,
}: PlayerCardProps) {
  const { t } = useI18n();
  const longPressTimer = useRef<number | null>(null);
  const longPressOrigin = useRef<{ x: number; y: number } | null>(null);
  const longPressFired = useRef(false);
  const quickRef = useRef<HTMLDivElement>(null);
  const customBtnRef = useRef<HTMLButtonElement>(null);
  const customTooltipRef = useRef<HTMLDivElement>(null);
  const scoreInputRef = useRef<HTMLInputElement>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [forcedSign, setForcedSign] = useState<
    "positive" | "negative" | undefined
  >(undefined);
  const [scoreEditing, setScoreEditing] = useState(false);
  const [scoreDraft, setScoreDraft] = useState(String(player.score));
  const [customOpen, setCustomOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState("");
  const clearLongPress = () => {
    if (longPressTimer.current !== null) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    longPressOrigin.current = null;
  };
  const startLongPress = (
    event: ReactPointerEvent<HTMLElement>,
    sign?: "positive" | "negative",
  ) => {
    event.stopPropagation();
    longPressOrigin.current = { x: event.clientX, y: event.clientY };
    longPressTimer.current = window.setTimeout(() => {
      longPressFired.current = true;
      setForcedSign(sign);
      setQuickOpen(true);
      haptic();
    }, 500);
  };
  const moveLongPress = (event: ReactPointerEvent<HTMLElement>) => {
    if (!longPressOrigin.current) return;
    if (
      Math.hypot(
        event.clientX - longPressOrigin.current.x,
        event.clientY - longPressOrigin.current.y,
      ) > 10
    )
      clearLongPress();
  };
  const quick = (delta: number) => {
    onQuickDelta(delta);
    setQuickOpen(false);
    setForcedSign(undefined);
  };
  const closeQuick = () => {
    setQuickOpen(false);
    setForcedSign(undefined);
  };
  const onStepClick = (delta: number) => {
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    onDelta(delta);
  };
  const openScoreEditor = () => {
    setScoreDraft(String(player.score));
    setScoreEditing(true);
  };
  const saveScore = () => {
    const value = Number(scoreDraft);
    if (Number.isFinite(value)) onSetScore(Math.trunc(value));
    setScoreEditing(false);
  };
  const applyCustomDelta = (sign: 1 | -1) => {
    const value = Number(scoreDraft);
    if (Number.isFinite(value) && value !== 0) {
      onQuickDelta(sign * Math.abs(Math.trunc(value)));
      haptic();
    }
    setScoreEditing(false);
  };
  const cancelScoreEdit = () => {
    setScoreEditing(false);
    setScoreDraft(String(player.score));
  };
  const saveCustom = (sign: 1 | -1) => {
    const value = Number(customDraft);
    if (Number.isFinite(value) && value !== 0) {
      onQuickDelta(sign * Math.abs(Math.trunc(value)));
      haptic();
    }
    setCustomOpen(false);
    setCustomDraft("");
  };
  const closeCustom = () => {
    setCustomOpen(false);
    setCustomDraft("");
  };

  useEffect(() => {
    if (!quickOpen && !customOpen) return;
    const onDown = (event: Event) => {
      const target = event.target as Node;
      if (quickOpen && quickRef.current?.contains(target)) return;
      if (
        customOpen &&
        (customTooltipRef.current?.contains(target) ||
          customBtnRef.current?.contains(target))
      )
        return;
      closeQuick();
      closeCustom();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [quickOpen, customOpen]);

  useEffect(() => {
    if (scoreEditing) {
      scoreInputRef.current?.focus();
      scoreInputRef.current?.select();
    }
  }, [scoreEditing]);
  const scoreValueRef = useFitText<HTMLDivElement>(
    JSON.stringify(player.score),
  );
  const onScoreClick = () => {
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    openScoreEditor();
  };
  const effectiveSign =
    forcedSign ??
    (lastDelta === undefined
      ? undefined
      : lastDelta > 0
        ? "positive"
        : "negative");
  const showPositive =
    effectiveSign === undefined || effectiveSign === "positive";
  const showNegative =
    effectiveSign === undefined || effectiveSign === "negative";
  const signClass =
    effectiveSign === "positive"
      ? " positive"
      : effectiveSign === "negative"
        ? " negative"
        : "";
  return (
    <article
      className={rotation ? `player-card rotated-${rotation}` : "player-card"}
      style={
        {
          "--player-color": player.color ?? "#38bdf8",
          "--digits": String(Math.abs(player.score)).length,
        } as CSSProperties
      }
      onPointerDown={(event) => startLongPress(event)}
      onPointerMove={moveLongPress}
      onPointerUp={clearLongPress}
      onPointerLeave={clearLongPress}
      onPointerCancel={clearLongPress}
      onContextMenu={(event) => {
        event.preventDefault();
        clearLongPress();
      }}
    >
      {onFlip && (
        <button
          type="button"
          className="card-flip-btn"
          onClick={(event) => {
            event.stopPropagation();
            onFlip();
          }}
          aria-pressed={rotation > 0}
          aria-label={t("flipPlayer")}
        >
          â»
        </button>
      )}
      {deltas.length > 0 && (
        <div
          className="player-deltas"
          aria-label={`${t("history")} â ${player.name}`}
        >
          {deltas.map((delta, index) => (
            <span
              key={index}
              className={delta > 0 ? "delta-plus" : "delta-minus"}
            >
              {formatDelta(delta)}
            </span>
          ))}
        </div>
      )}
      <div
        className="card-content"
        style={{ transform: rotation ? `rotate(${rotation}deg)` : undefined }}
      >
        <input
          className="player-name"
          value={player.name}
          onChange={(event) => onRename(event.target.value)}
          aria-label={`${player.name} ${t("playerNameLabel")}`}
        />
        <div className="score-row">
          <div className="step-col">
            <button
              type="button"
              className="inline-step inline-neg"
              onPointerDown={(event) => startLongPress(event, "negative")}
              onPointerMove={moveLongPress}
              onPointerUp={clearLongPress}
              onPointerLeave={clearLongPress}
              onPointerCancel={clearLongPress}
              onClick={() => onStepClick(-1)}
              aria-label={`${t("removePoint")} ${player.name}`}
            >
              <svg className="step-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M5 12h14"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </button>
            <div className="quick-stack">
              <button
                type="button"
                className="quick-step neg"
                onPointerDown={(event) => {
                  event.stopPropagation();
                  startLongPress(event, "negative");
                }}
                onPointerMove={moveLongPress}
                onPointerUp={clearLongPress}
                onPointerLeave={clearLongPress}
                onPointerCancel={clearLongPress}
                onClick={() => onQuickDelta(-2)}
                aria-label={`${t("removePoint")} 2 â ${player.name}`}
              >
                â2
              </button>
              <button
                type="button"
                className="quick-step neg"
                onPointerDown={(event) => {
                  event.stopPropagation();
                  startLongPress(event, "negative");
                }}
                onPointerMove={moveLongPress}
                onPointerUp={clearLongPress}
                onPointerLeave={clearLongPress}
                onPointerCancel={clearLongPress}
                onClick={() => onQuickDelta(-3)}
                aria-label={`${t("removePoint")} 3 â ${player.name}`}
              >
                â3
              </button>
            </div>
          </div>
          {scoreEditing ? (
            <input
              ref={scoreInputRef}
              className="score-value score-input"
              type="number"
              inputMode="numeric"
              value={scoreDraft}
              onChange={(event) => setScoreDraft(event.target.value)}
              onBlur={saveScore}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  saveScore();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  cancelScoreEdit();
                }
              }}
              aria-label={`${t("setScore")} â ${player.name}`}
            />
          ) : (
            <div className="score-center">
              <div
                ref={scoreValueRef}
                className="score-value"
                onClick={onScoreClick}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onScoreClick();
                  }
                }}
                aria-label={`${t("setScore")} â ${player.name}`}
              >
                {player.score}
              </div>
              <button
                ref={customBtnRef}
                type="button"
                className="custom-delta-btn"
                onClick={(event) => {
                  event.stopPropagation();
                  setCustomOpen((current) => !current);
                }}
                aria-label={t("customDelta")}
              >
                â¯
              </button>
            </div>
          )}
          <div className="step-col">
            <button
              type="button"
              className="inline-step inline-pos"
              onPointerDown={(event) => startLongPress(event, "positive")}
              onPointerMove={moveLongPress}
              onPointerUp={clearLongPress}
              onPointerLeave={clearLongPress}
              onPointerCancel={clearLongPress}
              onClick={() => onStepClick(1)}
              aria-label={`${t("addPoint")} ${player.name}`}
            >
              <svg className="step-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M5 12h14M12 5v14"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </button>
            <div className="quick-stack">
              <button
                type="button"
                className="quick-step pos"
                onPointerDown={(event) => {
                  event.stopPropagation();
                  startLongPress(event, "positive");
                }}
                onPointerMove={moveLongPress}
                onPointerUp={clearLongPress}
                onPointerLeave={clearLongPress}
                onPointerCancel={clearLongPress}
                onClick={() => onQuickDelta(2)}
                aria-label={`${t("addPoint")} 2 â ${player.name}`}
              >
                +2
              </button>
              <button
                type="button"
                className="quick-step pos"
                onPointerDown={(event) => {
                  event.stopPropagation();
                  startLongPress(event, "positive");
                }}
                onPointerMove={moveLongPress}
                onPointerUp={clearLongPress}
                onPointerLeave={clearLongPress}
                onPointerCancel={clearLongPress}
                onClick={() => onQuickDelta(3)}
                aria-label={`${t("addPoint")} 3 â ${player.name}`}
              >
                +3
              </button>
            </div>
          </div>
        </div>
        {quickOpen && (
          <div
            ref={quickRef}
            className={`score-tooltip${signClass}`}
            role="tooltip"
            aria-label={`${t("quickScoreChange")} ${player.name}`}
          >
            {showNegative && (
              <>
                <button
                  type="button"
                  className="delta-neg"
                  role="menuitem"
                  onClick={() => quick(-20)}
                >
                  â20
                </button>
                <button
                  type="button"
                  className="delta-neg"
                  role="menuitem"
                  onClick={() => quick(-10)}
                >
                  â10
                </button>
                <button
                  type="button"
                  className="delta-neg"
                  role="menuitem"
                  onClick={() => quick(-5)}
                >
                  â5
                </button>
              </>
            )}
            {showPositive && (
              <>
                <button
                  type="button"
                  className="delta-pos"
                  role="menuitem"
                  onClick={() => quick(5)}
                >
                  +5
                </button>
                <button
                  type="button"
                  className="delta-pos"
                  role="menuitem"
                  onClick={() => quick(10)}
                >
                  +10
                </button>
                <button
                  type="button"
                  className="delta-pos"
                  role="menuitem"
                  onClick={() => quick(20)}
                >
                  +20
                </button>
              </>
            )}
          </div>
        )}
        {customOpen && (
          <div
            ref={customTooltipRef}
            className="score-tooltip"
            role="tooltip"
            aria-label={t("customDelta")}
          >
            <input
              type="number"
              inputMode="numeric"
              value={customDraft}
              onChange={(event) => setCustomDraft(event.target.value)}
              autoFocus
              onKeyDown={(event) => {
                if (event.key === "Enter") saveCustom(1);
                if (event.key === "Escape") closeCustom();
              }}
              aria-label={t("customDelta")}
              placeholder="0"
            />
            <button
              type="button"
              className="delta-neg"
              onClick={() => saveCustom(-1)}
              aria-label={`${t("removePoint")} â ${player.name}`}
            >
              â
            </button>
            <button
              type="button"
              className="delta-pos"
              onClick={() => saveCustom(1)}
              aria-label={`${t("addPoint")} â ${player.name}`}
            >
              +
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function GameScreen({
  initialGame,
  onNewGame,
  onSavedGames,
}: {
  initialGame: Game;
  onNewGame: () => void;
  onSavedGames: () => void;
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
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyFlipped, setHistoryFlipped] = useState(false);
  const isDuo = game.players.length === 2;
  const orderedPlayers =
    isDuo && swapped ? [game.players[1], game.players[0]] : game.players;
  useEffect(() => {
    localStorage.setItem("keepscore-fullscreen", fullscreen ? "1" : "0");
  }, [fullscreen]);
  useEffect(() => {
    document.body.style.overflow = historyOpen ? "hidden" : "";
  }, [historyOpen]);
  const beginEdit = (id: string, delta: number) => {
    setEditingEntry(id);
    setDraftDelta(String(delta));
  };
  const saveEdit = () => {
    if (!editingEntry) return;
    const delta = Number(draftDelta);
    if (Number.isFinite(delta) && delta !== 0)
      dispatch({ type: "EDIT_HISTORY_ENTRY", entryId: editingEntry, delta });
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
  const historyContent = (
    <section className="history" aria-label={t("history")}>
      <div className="section-heading">
        <h2>{t("history")}</h2>
        <span>
          {game.history.length} {t("moves")}
        </span>
      </div>
      {game.history.length === 0 ? (
        <p className="empty-state">{t("noMoves")}</p>
      ) : (
        <ol>
          {[...game.history].reverse().map((entry) => {
            const player = game.players.find(
              (candidate) => candidate.id === entry.playerId,
            );
            return (
              <li key={entry.id}>
                <span>
                  {player?.name}{" "}
                  <strong
                    className={entry.delta > 0 ? "delta-plus" : "delta-minus"}
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
                    </svg>{" "}
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
                    </svg>{" "}
                    {t("delete")}
                  </button>
                </span>
                {editingEntry === entry.id && (
                  <span className="history-editor">
                    <input
                      autoFocus
                      type="number"
                      value={draftDelta}
                      onChange={(event) => setDraftDelta(event.target.value)}
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
      )}
    </section>
  );
  return (
    <>
      <main className={fullscreen ? "app-shell fullscreen" : "app-shell"}>
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
            <InstallButton />
          </div>
        </header>
        <div className="quick-actions">
          {isDuo && (
            <button
              className="icon-fab"
              type="button"
              onClick={() => setSwapped((current) => !current)}
              aria-pressed={swapped}
              aria-label={t("swapPlayers")}
            >
              â
            </button>
          )}
          <button
            className="icon-fab"
            type="button"
            onClick={() => setFullscreen((current) => !current)}
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
            isDuo
              ? "players duo"
              : game.players.length >= 4
                ? "players crowded"
                : "players"
          }
          style={
            (!isDuo &&
              game.players.length > 2 && {
                "--cols": String(
                  Math.max(2, Math.min(4, Math.ceil(game.players.length / 2))),
                ),
              } as CSSProperties) ||
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
              â
            </button>
            <button
              className="history-flip-btn"
              type="button"
              onClick={() => setHistoryFlipped((current) => !current)}
              aria-pressed={historyFlipped}
              aria-label={t("flipHistory")}
              title={t("flipHistory")}
            >
              â»
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
              â
            </button>
            <button
              className="menu-item"
              type="button"
              onClick={() => {
                setHistoryOpen((current) => !current);
                setMenuOpen(false);
              }}
            >
              ð {t("history")}
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
                â© {t("undo")}
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
                âª {t("redo")}
              </button>
            </div>
            <div className="menu-separator" />
            <button
              className="menu-item"
              type="button"
              onClick={() => {
                dispatch({ type: "ADD_PLAYER" });
                haptic();
                setMenuOpen(false);
              }}
            >
              {t("addPlayerMenuItem")}
            </button>
            <div className="menu-separator" />
            <button
              className="menu-item"
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onSavedGames();
              }}
            >
              ð¾ {t("savedGames")}
            </button>
            <div className="menu-separator" />
            <button
              className="menu-item"
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onNewGame();
              }}
            >
              {t("newGameMenuItem")}
            </button>
            <div className="menu-separator" />
            <button
              className="menu-item"
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onNewGame();
              }}
            >
              ð² {t("whoStarts")}
            </button>
            <div className="menu-separator" />
            <div className="menu-row lang-row">
              <button
                type="button"
                className={
                  lang === "fr" ? "menu-item lang active" : "menu-item lang"
                }
                onClick={() => setLang("fr")}
              >
                ð«ð· FranÃ§ais
              </button>
              <button
                type="button"
                className={
                  lang === "en" ? "menu-item lang active" : "menu-item lang"
                }
                onClick={() => setLang("en")}
              >
                ð¬ð§ English
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

function SavedScreen({
  onResume,
  onBack,
}: {
  onResume: (game: Game) => void;
  onBack: () => void;
}) {
  const { t } = useI18n();
  const [games, setGames] = useState<Game[]>(() => {
    const saved = localGameRepository.list();
    return saved.sort((a, b) => b.updatedAt - a.updatedAt);
  });
  const [importing, setImporting] = useState(false);

  const refresh = () => {
    const saved = localGameRepository.list();
    setGames(saved.sort((a, b) => b.updatedAt - a.updatedAt));
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    setImporting(true);
    try {
      await importGames(event.target.files[0]);
      refresh();
    } finally {
      setImporting(false);
      // Reset the input so the same file can be re-imported
      event.target.value = "";
    }
  };

  const handleDownload = async () => {
    await downloadGames(games);
  };

  return (
    <main className="app-shell saved-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">SCORE KEEPER</p>
          <h1>{t("appName")}</h1>
        </div>
        <div className="toolbar">
          <InstallButton />
        </div>
      </header>
      <section className="saved-games" aria-label={t("savedGames")}>
        <div className="section-heading">
          <h2>{t("savedGames")}</h2>
          <span>
            {games.length} {t("games")}
          </span>
        </div>
        {games.length === 0 ? (
          <p className="empty-state">{t("noSavedGames")}</p>
        ) : (
          <ol>
            {games.map((game) => (
              <li key={game.id} className="game-row">
                <button
                  type="button"
                  className="game-summary"
                  onClick={() => onResume(game)}
                  aria-label={t("resumeGame")}
                >
                  <div className="game-meta">
                    <span className="game-name">
                      {game.name ?? t("unnamedGame")}
                    </span>
                    <span className="game-date">
                      {new Date(game.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="game-players">
                    {game.players.map((player) => (
                      <span
                        key={player.id}
                        className="player-pill"
                        style={{
                          backgroundColor: player.color ?? colorForIndex(0),
                        }}
                      >
                        {player.name}
                      </span>
                    ))}
                  </div>
                </button>
                <button
                  type="button"
                  className="game-delete"
                  onClick={() => {
                    localGameRepository.delete(game.id);
                    refresh();
                  }}
                  aria-label={t("deleteGame")}
                  title={t("deleteGame")}
                >
                  â
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>
      <section className="saved-actions">
        <label className="file-input">
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            disabled={importing}
          />
          {importing ? t("importing") : t("importGames")}
        </label>
        <button
          type="button"
          className="secondary-button"
          onClick={handleDownload}
          disabled={games.length === 0}
        >
          {t("exportGames")}
        </button>
      </section>
      <footer className="app-footer">
        <p>
          {t("madeBy")} <a href="https://x.com/flofy">@flofy</a> Â·
          <a href="https://github.com/flofy/KeepScore">GitHub</a>
        </p>
        <LangFlags />
      </footer>
    </main>
  );
}

function App() {
  const { t } = useI18n();
  const [screen, setScreen] = useState<Screen>("saved");
  const [gameInSetup, setGameInSetup] = useState<Game | null>(null);

  if (screen === "setup") {
    return (
      <I18nProvider>
        <GameSetup
          onCreate={(playerNames, options) => {
            const game = createGame(
              playerNames,
              options?.name,
              options?.startingScore,
              options?.colors,
            );
            setGameInSetup(game);
            setScreen("chwatzi");
          }}
          onBack={() => setScreen("saved")}
        />
      </I18nProvider>
    );
  }

  if (screen === "chwatzi" && gameInSetup) {
    return (
      <I18nProvider>
        <ChwatziScreen
          game={gameInSetup}
          onSelect={(startingPlayerId) => {
            const gameWithStartingPlayer = {
              ...gameInSetup,
              startingPlayerId,
            };
            localGameRepository.save(gameWithStartingPlayer);
            setScreen("game");
          }}
          onBack={() => setScreen("setup")}
        />
      </I18nProvider>
    );
  }

  if (screen === "game") {
    const game = localGameRepository.list().sort((a, b) => b.updatedAt - a.updatedAt)[0];
    if (!game) {
      setScreen("saved");
      return null;
    }
    return (
      <I18nProvider>
        <GameScreen
          initialGame={game}
          onNewGame={() => setScreen("setup")}
          onSavedGames={() => setScreen("saved")}
        />
      </I18nProvider>
    );
  }

  return (
    <I18nProvider>
      <SavedScreen
        onResume={(game) => {
          localGameRepository.save(game);
          setScreen("game");
        }}
        onBack={() => setScreen("saved")}
      />
    </I18nProvider>
  );
}

function Root() {
  return <App />;
}

export default Root;

