import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { PLAYER_COLORS } from "../domain/game/colors";
import { useI18n } from "./i18n";
import "./chwatzi-v2.css";
import "./chwatzi-animation-status.css";

type Props = {
  onBack?: () => void;
};

type Phase = "idle" | "wiping" | "done";
type Finger = { pointerId: number; x: number; y: number; color: string };

const FINGER_SETTLE_MS = 2000;
const WATER_FILL_MS = 5000;

export function ChwatziScreenV2({ onBack }: Props) {
  const { t, lang } = useI18n();
  const [fingers, setFingers] = useState<Finger[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [selectedFingerId, setSelectedFingerId] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [settleCycle, setSettleCycle] = useState(0);
  const fingersRef = useRef<Finger[]>([]);
  const fingerColorsRef = useRef(new Map<number, string>());
  const selectedFingerRef = useRef<Finger | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const wipeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReducedMotion(mediaQuery.matches);

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);
    return () =>
      mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  const updateFingers = useCallback(
    (updater: (current: Finger[]) => Finger[]) => {
      const next = updater(fingersRef.current);
      fingersRef.current = next;
      setFingers(next);
      return next;
    },
    [],
  );

  const clearTimers = useCallback(() => {
    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    if (wipeTimerRef.current !== null) {
      window.clearTimeout(wipeTimerRef.current);
      wipeTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const finish = useCallback(() => {
    clearTimers();
    setPhase("done");
    setShowResult(true);
    wipeTimerRef.current = null;
  }, [clearTimers]);

  const chooseFinger = useCallback(() => {
    if (fingersRef.current.length < 2) {
      setPhase("idle");
      return;
    }

    const currentFingers = fingersRef.current;
    const winner =
      currentFingers[Math.floor(Math.random() * currentFingers.length)];
    if (!winner) {
      setPhase("idle");
      return;
    }

    selectedFingerRef.current = winner;
    setSelectedFingerId(winner.pointerId);
    setSelectedColor(winner.color);
    setIsSettling(false);
    setPhase("wiping");
    // A short confirmation pulse replaces the old per-number countdown.
    if ("vibrate" in navigator) navigator.vibrate([45, 30, 80]);
    wipeTimerRef.current = window.setTimeout(finish, WATER_FILL_MS);
  }, [finish]);

  const scheduleSelection = useCallback(() => {
    if (fingersRef.current.length < 2) return;
    if (settleTimerRef.current !== null)
      window.clearTimeout(settleTimerRef.current);

    setSettleCycle((cycle) => cycle + 1);
    setIsSettling(true);
    settleTimerRef.current = window.setTimeout(() => {
      settleTimerRef.current = null;
      chooseFinger();
    }, FINGER_SETTLE_MS);
  }, [chooseFinger]);

  const reset = useCallback(() => {
    clearTimers();
    fingersRef.current = [];
    fingerColorsRef.current.clear();
    selectedFingerRef.current = null;
    setFingers([]);
    setIsSettling(false);
    setPhase("idle");
    setSelectedFingerId(null);
    setSelectedColor(null);
    setShowResult(false);
  }, [clearTimers]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (phase !== "idle") return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      const next = updateFingers((current) => {
        if (current.some((finger) => finger.pointerId === event.pointerId))
          return current;
        const color =
          fingerColorsRef.current.get(event.pointerId) ??
          PLAYER_COLORS[fingerColorsRef.current.size % PLAYER_COLORS.length];
        fingerColorsRef.current.set(event.pointerId, color);
        return [
          ...current,
          {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            color,
          },
        ];
      });
      if ("vibrate" in navigator) navigator.vibrate(25);
      if (next.length >= 2) scheduleSelection();
    },
    [phase, scheduleSelection, updateFingers],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (phase === "done") return;
      const next = updateFingers((current) =>
        current.map((finger) =>
          finger.pointerId === event.pointerId
            ? { ...finger, x: event.clientX, y: event.clientY }
            : finger,
        ),
      );
      const movedFinger = next.find(
        (finger) => finger.pointerId === event.pointerId,
      );
      if (
        movedFinger &&
        movedFinger.pointerId === selectedFingerRef.current?.pointerId
      )
        selectedFingerRef.current = movedFinger;
    },
    [phase, updateFingers],
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (phase === "done") return;
      const next = updateFingers((current) =>
        current.filter((finger) => finger.pointerId !== event.pointerId),
      );
      if (next.length < 2 && phase !== "wiping") {
        if (settleTimerRef.current !== null) {
          window.clearTimeout(settleTimerRef.current);
          settleTimerRef.current = null;
        }
        setIsSettling(false);
        setPhase("idle");
      }
      if (phase === "wiping" && next.length === 0) finish();
    },
    [finish, phase, updateFingers],
  );

  const selectedFinger = selectedFingerRef.current;
  const waterStyle =
    selectedFinger && selectedColor
      ? ({
          "--water-color": selectedColor,
          "--water-x": `${selectedFinger.x}px`,
          "--water-y": `${selectedFinger.y}px`,
        } as CSSProperties)
      : undefined;

  return (
    <main
      className="chwatzi-v2"
      style={
        selectedColor
          ? ({ "--selected-color": selectedColor } as CSSProperties)
          : undefined
      }
    >
      <div
        className={`chwatzi-v2-stage chwatzi-v2-stage--${phase}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {onBack && (
          <button
            type="button"
            className="chwatzi-v2-close"
            onClick={onBack}
            onPointerDown={(event) => event.stopPropagation()}
            aria-label={t("close")}
          >
            ✕
          </button>
        )}
        {reducedMotion && (
          <div
            className="chwatzi-v2-animation-status"
            role="status"
            aria-live="polite"
          >
            {lang === "fr"
              ? "Animations réduites par les réglages de votre appareil."
              : "Animations are reduced by your device settings."}
          </div>
        )}
        {phase !== "done" &&
          fingers.map((finger) => {
            const isSelected = finger.pointerId === selectedFingerId;
            if (phase === "wiping" && !isSelected) return null;
            const fingerClassName = [
              "chwatzi-v2-finger",
              isSelected && "chwatzi-v2-finger--selected",
              isSettling &&
                fingers.length >= 2 &&
                "chwatzi-v2-finger--settling",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <div
                key={finger.pointerId}
                className={fingerClassName}
                style={{
                  left: finger.x,
                  top: finger.y,
                  backgroundColor: finger.color,
                  borderColor: finger.color,
                }}
                aria-hidden="true"
              >
                {isSettling && fingers.length >= 2 && (
                  <svg
                    key={settleCycle}
                    className="chwatzi-v2-finger-ring"
                    viewBox="0 0 112 112"
                    aria-hidden="true"
                  >
                    <circle cx="56" cy="56" r="51" stroke={finger.color} />
                  </svg>
                )}
              </div>
            );
          })}
        {phase === "wiping" && selectedColor && (
          <div
            className="chwatzi-v2-water"
            style={waterStyle}
            aria-hidden="true"
          />
        )}
        {phase === "done" && (
          <div className="chwatzi-v2-background" aria-hidden="true" />
        )}
        {phase === "idle" && fingers.length === 0 && (
          <div className="chwatzi-v2-instructions">
            <span className="chwatzi-v2-icon" aria-hidden="true">
              👆
            </span>
            <p>{t("multitouchInstructions")}</p>
          </div>
        )}
        {phase === "idle" && fingers.length === 1 && (
          <p className="chwatzi-v2-hint">{t("multitouchSingleHint")}</p>
        )}
        {showResult && selectedColor && (
          <div className="chwatzi-v2-result" role="dialog" aria-modal="true">
            <div className="chwatzi-v2-result-card">
              <span
                className="chwatzi-v2-result-color"
                style={{ backgroundColor: selectedColor }}
              />
              <strong>{t("selectedPlayer")}</strong>
              <div className="chwatzi-v2-result-actions">
                {onBack && (
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={onBack}
                  >
                    ← {t("back")}
                  </button>
                )}
                <button
                  className="primary-button"
                  type="button"
                  onClick={reset}
                >
                  {t("tryAgain")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
