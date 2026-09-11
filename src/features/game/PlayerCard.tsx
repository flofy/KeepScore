import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import type { Player } from "../../domain/game/types";
import "./game-controls.css";
import { useI18n } from "../../ui/i18n";

function haptic() {
  if ("vibrate" in navigator) navigator.vibrate(8);
}

function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

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
  removeMode?: boolean;
  canRemove?: boolean;
  tilt?: "a" | "b";
  onRemove?: () => void;
  onRename: (name: string) => void;
  onDelta: (delta: number) => void;
  onQuickDelta: (delta: number) => void;
  onSetScore: (value: number) => void;
  onFlip?: () => void;
};

export function PlayerCard({
  player,
  deltas,
  rotation = 0,
  lastDelta,
  removeMode = false,
  canRemove = true,
  tilt,
  onRemove,
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
    if (removeMode) return;
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
    ) {
      clearLongPress();
    }
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

  const onQuickStepClick = (delta: number) => {
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    onQuickDelta(delta);
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
      ) {
        return;
      }
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
    if (customOpen) {
      scoreInputRef.current?.focus();
      scoreInputRef.current?.select();
    }
  }, [customOpen]);

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
      className={
        removeMode
          ? `player-card remove-mode${tilt ? ` tilt-${tilt}` : ""}`
          : rotation
            ? `player-card rotated-${rotation}`
            : "player-card"
      }
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
      {removeMode && (
        <button
          type="button"
          className="remove-badge"
          onClick={(event) => {
            event.stopPropagation();
            onRemove?.();
          }}
          disabled={!canRemove}
          aria-label={`${t("removePlayer")} — ${player.name}`}
        >
          ✕
        </button>
      )}
      {onFlip && !removeMode && (
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
          ↻
        </button>
      )}
      {deltas.length > 0 && (
        <div
          className="player-deltas"
          aria-label={`${t("history")} — ${player.name}`}
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
                onClick={() => onQuickStepClick(-2)}
                aria-label={`${t("removePoint")} 2 — ${player.name}`}
              >
                −2
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
                onClick={() => onQuickStepClick(-3)}
                aria-label={`${t("removePoint")} 3 — ${player.name}`}
              >
                −3
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
              aria-label={`${t("setScore")} — ${player.name}`}
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
                aria-label={`${t("setScore")} — ${player.name}`}
              >
                {player.score}
              </div>
              <button
                ref={customBtnRef}
                type="button"
                className="custom-delta-btn"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  setCustomOpen((current) => !current);
                }}
                aria-label={t("customDelta")}
              >
                ⋯
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
                onClick={() => onQuickStepClick(2)}
                aria-label={`${t("addPoint")} 2 — ${player.name}`}
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
                onClick={() => onQuickStepClick(3)}
                aria-label={`${t("addPoint")} 3 — ${player.name}`}
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
                  −20
                </button>
                <button
                  type="button"
                  className="delta-neg"
                  role="menuitem"
                  onClick={() => quick(-10)}
                >
                  −10
                </button>
                <button
                  type="button"
                  className="delta-neg"
                  role="menuitem"
                  onClick={() => quick(-5)}
                >
                  −5
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
      </div>
      {customOpen && (
        <div
          className="custom-score-backdrop"
          role="presentation"
          onClick={closeCustom}
        >
          <div
            ref={customTooltipRef}
            className="custom-score-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`custom-score-title-${player.id}`}
            onClick={(event) => event.stopPropagation()}
            style={
              {
                "--player-color": player.color ?? "#38bdf8",
              } as CSSProperties
            }
          >
            <h2
              id={`custom-score-title-${player.id}`}
              className="custom-score-title"
            >
              {t("customDelta")}
            </h2>
            <p className="custom-score-subtitle">{player.name}</p>
            <input
              ref={scoreInputRef}
              className="custom-score-input"
              type="number"
              inputMode="numeric"
              value={customDraft}
              onChange={(event) => setCustomDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") saveCustom(1);
                if (event.key === "Escape") closeCustom();
              }}
              aria-label={t("customDelta")}
              placeholder="0"
            />
            <div className="custom-score-actions">
              <button
                type="button"
                className="delta-neg"
                onClick={() => saveCustom(-1)}
                aria-label={`${t("removePoint")} — ${player.name}`}
              >
                −
              </button>
              <button
                type="button"
                className="delta-pos"
                onClick={() => saveCustom(1)}
                aria-label={`${t("addPoint")} — ${player.name}`}
              >
                +
              </button>
            </div>
            <button
              type="button"
              className="custom-score-cancel"
              onClick={closeCustom}
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
