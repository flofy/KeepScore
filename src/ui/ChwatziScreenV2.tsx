import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { PLAYER_COLORS } from "../domain/game/colors";
import { useI18n } from "./i18n";
import "./chwatzi-v2.css";

type Props = {
  onBack?: () => void;
};

type Phase = "idle" | "counting" | "wiping" | "done";
type Finger = { pointerId: number; x: number; y: number; color: string };

const COUNTDOWN_MS = 1000;
const WATER_FILL_MS = 5000;

export function ChwatziScreenV2({ onBack }: Props) {
  const { t } = useI18n();
  const [fingers, setFingers] = useState<Finger[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(3);
  const [selectedFingerId, setSelectedFingerId] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const fingersRef = useRef<Finger[]>([]);
  const selectedFingerRef = useRef<Finger | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const wipeTimerRef = useRef<number | null>(null);

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
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
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

  const reset = useCallback(() => {
    clearTimers();
    fingersRef.current = [];
    selectedFingerRef.current = null;
    setFingers([]);
    setPhase("idle");
    setCountdown(3);
    setSelectedFingerId(null);
    setSelectedColor(null);
    setShowResult(false);
  }, [clearTimers]);

  const startSelection = useCallback(() => {
    if (phase !== "idle" || fingersRef.current.length < 2) return;

    setPhase("counting");
    setCountdown(3);
    let remaining = 3;

    countdownTimerRef.current = window.setInterval(() => {
      if (fingersRef.current.length < 2) {
        if (countdownTimerRef.current !== null) {
          window.clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        setCountdown(3);
        setPhase("idle");
        return;
      }

      remaining -= 1;
      if (remaining > 0) {
        setCountdown(remaining);
        if ("vibrate" in navigator) navigator.vibrate(35);
        return;
      }

      if (countdownTimerRef.current !== null) {
        window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
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
      setPhase("wiping");
      if ("vibrate" in navigator) navigator.vibrate([80, 50, 180]);

      wipeTimerRef.current = window.setTimeout(finish, WATER_FILL_MS);
    }, COUNTDOWN_MS);
  }, [finish, phase]);

  useEffect(() => {
    if (phase === "idle" && fingers.length >= 2) {
      startSelection();
    }
  }, [fingers.length, phase, startSelection]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (phase !== "idle") return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      updateFingers((current) => {
        if (current.some((finger) => finger.pointerId === event.pointerId)) {
          return current;
        }
        return [
          ...current,
          {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            color: PLAYER_COLORS[current.length % PLAYER_COLORS.length],
          },
        ];
      });
      if ("vibrate" in navigator) navigator.vibrate(25);
    },
    [phase, updateFingers],
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
      ) {
        selectedFingerRef.current = movedFinger;
      }
    },
    [phase, updateFingers],
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (phase === "done") return;
      const next = updateFingers((current) =>
        current.filter((finger) => finger.pointerId !== event.pointerId),
      );

      if (phase === "wiping" && next.length === 0) {
        finish();
      }
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
        {phase === "counting" && (
          <div className="chwatzi-v2-countdown" aria-live="assertive">
            {countdown}
          </div>
        )}

        {phase !== "done" &&
          fingers.map((finger) => {
            const isSelected = finger.pointerId === selectedFingerId;
            if (phase === "wiping" && !isSelected) return null;

            return (
              <div
                key={finger.pointerId}
                className={`chwatzi-v2-finger${
                  isSelected ? " chwatzi-v2-finger--selected" : ""
                }`}
                style={{
                  left: finger.x,
                  top: finger.y,
                  backgroundColor: finger.color,
                  borderColor: finger.color,
                }}
                aria-hidden="true"
              />
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
