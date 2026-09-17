import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import type { Game, Player } from "../domain/game/types";
import { colorForIndex } from "../domain/game/colors";
import { useI18n } from "./i18n";
import "./chwatzi-selection.css";

type Props = {
  game: Game;
  onSelect: (startingPlayerId: string) => void;
  onBack?: () => void;
};
type ChwatziMode = "roulette" | "multitouch";
type CountdownState = "idle" | "counting" | "blinking" | "selected";
type FingerSlot = { pointerId: number; x: number; y: number };
type ColoredPlayer = Player & { color: string };

const COUNTDOWN_TICK_MS = 450;
const BLINK_STEP_MS = 300;
const COLOR_WIPE_MS = 900;

export function ChwatziScreen({ game, onSelect, onBack }: Props) {
  const { t } = useI18n();
  const players = game.players.map((player, index) => ({
    ...player,
    color: player.color ?? colorForIndex(index),
  })) as ColoredPlayer[];
  const [mode, setMode] = useState<ChwatziMode>("roulette");
  const [displayPlayers, setDisplayPlayers] =
    useState<ColoredPlayer[]>(players);
  const [selectedPlayer, setSelectedPlayer] = useState<ColoredPlayer | null>(
    null,
  );
  const [isSpinning, setIsSpinning] = useState(false);
  const spinTimerRef = useRef<number | null>(null);
  const [fingers, setFingers] = useState<FingerSlot[]>([]);
  const [countdown, setCountdown] = useState<CountdownState>("idle");
  const [countdownValue, setCountdownValue] = useState(3);
  const [blinkingIndex, setBlinkingIndex] = useState<number | null>(null);
  const [selectedFingerIndex, setSelectedFingerIndex] = useState<number | null>(
    null,
  );
  const [colorWipeVisible, setColorWipeVisible] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showBackButton, setShowBackButton] = useState(false);
  const holdTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const blinkTimerRef = useRef<number | null>(null);
  const resultTimerRef = useRef<number | null>(null);
  const noTouchTimerRef = useRef<number | null>(null);
  const selectedPlayerRef = useRef<ColoredPlayer | null>(null);

  useEffect(() => setDisplayPlayers(players), [game.id, game.players.length]);
  useEffect(() => {
    if (countdown !== "selected") {
      setColorWipeVisible(false);
      setShowResult(false);
      return;
    }
    const frame = window.requestAnimationFrame(() => setColorWipeVisible(true));
    resultTimerRef.current = window.setTimeout(
      () => setShowResult(true),
      COLOR_WIPE_MS,
    );
    return () => {
      window.cancelAnimationFrame(frame);
      if (resultTimerRef.current !== null)
        window.clearTimeout(resultTimerRef.current);
    };
  }, [countdown]);

  const clearTimers = useCallback(() => {
    if (spinTimerRef.current !== null)
      window.clearInterval(spinTimerRef.current);
    if (holdTimerRef.current !== null)
      window.clearTimeout(holdTimerRef.current);
    if (countdownTimerRef.current !== null)
      window.clearInterval(countdownTimerRef.current);
    if (blinkTimerRef.current !== null)
      window.clearInterval(blinkTimerRef.current);
    if (resultTimerRef.current !== null)
      window.clearTimeout(resultTimerRef.current);
    if (noTouchTimerRef.current !== null)
      window.clearTimeout(noTouchTimerRef.current);
  }, []);
  useEffect(() => () => clearTimers(), [clearTimers]);

  const confirmSelection = useCallback(() => {
    const player = selectedPlayer ?? players[0];
    if (player) onSelect(player.id);
  }, [onSelect, players, selectedPlayer]);

  const startRoulette = useCallback(() => {
    if (isSpinning || players.length === 0) return;
    setIsSpinning(true);
    setSelectedPlayer(null);
    let iterations = 0;
    const maxIterations = 30;
    spinTimerRef.current = window.setInterval(() => {
      iterations += 1;
      setDisplayPlayers((current) =>
        current.length < 2
          ? current
          : [current[current.length - 1], ...current.slice(0, -1)],
      );
      if (iterations >= maxIterations) {
        if (spinTimerRef.current !== null)
          window.clearInterval(spinTimerRef.current);
        const winner = players[Math.floor(Math.random() * players.length)];
        setSelectedPlayer(winner);
        setDisplayPlayers([
          winner,
          ...players.filter((player) => player.id !== winner.id),
        ]);
        setIsSpinning(false);
      }
    }, 100);
  }, [isSpinning, players]);

  const selectManually = useCallback(
    (player: ColoredPlayer) => {
      if (isSpinning) return;
      setSelectedPlayer(player);
      setDisplayPlayers([
        player,
        ...players.filter((candidate) => candidate.id !== player.id),
      ]);
    },
    [isSpinning, players],
  );

  const resetMultiTouch = useCallback(() => {
    setFingers([]);
    setCountdown("idle");
    setCountdownValue(3);
    setBlinkingIndex(null);
    setSelectedFingerIndex(null);
    setSelectedPlayer(null);
    setColorWipeVisible(false);
    setShowResult(false);
    selectedPlayerRef.current = null;
    setShowBackButton(false);
    if (holdTimerRef.current !== null)
      window.clearTimeout(holdTimerRef.current);
    if (countdownTimerRef.current !== null)
      window.clearInterval(countdownTimerRef.current);
    if (blinkTimerRef.current !== null)
      window.clearInterval(blinkTimerRef.current);
    if (resultTimerRef.current !== null)
      window.clearTimeout(resultTimerRef.current);
  }, []);

  const finishSelection = useCallback(() => {
    const player = selectedPlayerRef.current;
    if (!player) return;
    if ("vibrate" in navigator) navigator.vibrate([100, 60, 180]);
    onSelect(player.id);
  }, [onSelect]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (mode !== "multitouch" || countdown !== "idle") return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      setFingers((current) =>
        current.some((f) => f.pointerId === event.pointerId)
          ? current
          : [
              ...current,
              {
                pointerId: event.pointerId,
                x: event.clientX,
                y: event.clientY,
              },
            ],
      );
      setShowBackButton(false);
      if (noTouchTimerRef.current !== null)
        window.clearTimeout(noTouchTimerRef.current);
      if ("vibrate" in navigator) navigator.vibrate(25);
    },
    [countdown, mode],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (
        mode !== "multitouch" ||
        !fingers.some((f) => f.pointerId === event.pointerId)
      )
        return;
      setFingers((current) =>
        current.map((f) =>
          f.pointerId === event.pointerId
            ? { ...f, x: event.clientX, y: event.clientY }
            : f,
        ),
      );
    },
    [fingers, mode],
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (mode !== "multitouch") return;
      if (countdown === "idle") {
        setFingers((current) =>
          current.filter((f) => f.pointerId !== event.pointerId),
        );
        return;
      }
    },
    [countdown, mode],
  );

  const startSelection = useCallback(() => {
    if (
      countdown !== "idle" ||
      fingers.length < players.length ||
      players.length === 0
    )
      return;
    setCountdown("counting");
    setCountdownValue(3);
    let count = 3;
    countdownTimerRef.current = window.setInterval(() => {
      count -= 1;
      if (count > 0) setCountdownValue(count);
      if (count <= 0) {
        if (countdownTimerRef.current !== null)
          window.clearInterval(countdownTimerRef.current);
        const maxFingerIndex = Math.min(fingers.length, players.length) - 1;
        const winnerIndex = Math.floor(Math.random() * (maxFingerIndex + 1));
        const winner = players[winnerIndex];
        selectedPlayerRef.current = winner;
        setSelectedFingerIndex(winnerIndex);
        setSelectedPlayer(winner);
        setCountdown("blinking");
        setBlinkingIndex(winnerIndex);
        if ("vibrate" in navigator) navigator.vibrate(70);

        window.setTimeout(() => {
          if (blinkTimerRef.current !== null)
            window.clearInterval(blinkTimerRef.current);
          setBlinkingIndex(null);
          setCountdown("selected");
          if ("vibrate" in navigator) navigator.vibrate([70, 50, 140]);
        }, BLINK_STEP_MS);
      }
    }, COUNTDOWN_TICK_MS);
  }, [countdown, fingers.length, players]);

  useEffect(() => {
    if (
      mode !== "multitouch" ||
      countdown !== "idle" ||
      fingers.length < players.length ||
      fingers.length === 0
    ) {
      if (holdTimerRef.current !== null)
        window.clearTimeout(holdTimerRef.current);
      return;
    }
    holdTimerRef.current = window.setTimeout(startSelection, 450);
  }, [countdown, fingers.length, mode, players.length, startSelection]);

  useEffect(() => {
    if (mode !== "multitouch" || fingers.length > 0) return;
    noTouchTimerRef.current = window.setTimeout(
      () => setShowBackButton(true),
      3000,
    );
    return () => {
      if (noTouchTimerRef.current !== null)
        window.clearTimeout(noTouchTimerRef.current);
    };
  }, [fingers.length, mode]);

  const selectedColor = selectedPlayer?.color ?? "#0f172a";

  return (
    <main className="chwatzi-screen">
      {mode === "multitouch" ? (
        <div
          className="multitouch-overlay"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {countdown === "selected" && (
            <div
              className="multitouch-color-wipe"
              style={{
                backgroundColor: selectedColor,
                transform: colorWipeVisible ? "scaleY(1)" : "scaleY(0)",
              }}
              aria-hidden="true"
            />
          )}
          {showBackButton && onBack && countdown === "idle" && (
            <button
              className="multitouch-back-btn"
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onBack}
            >
              ← {t("back")}
            </button>
          )}
          {countdown === "counting" && (
            <span className="countdown-number">{countdownValue}</span>
          )}
          {(countdown === "idle" ||
            countdown === "counting" ||
            countdown === "blinking") &&
            fingers.map((finger, index) => {
              const player = players[index];
              const selected = index === selectedFingerIndex;
              const blinking = index === blinkingIndex;
              const neutral = countdown === "blinking" && !selected;
              return (
                <div
                  key={finger.pointerId}
                  className={`finger-dot ${blinking ? "finger-dot-blinking" : ""} ${selected ? "finger-dot-selected" : ""} ${neutral ? "finger-dot-neutral" : ""}`}
                  style={{
                    left: finger.x,
                    top: finger.y,
                    backgroundColor: player?.color,
                    borderColor: player?.color,
                  }}
                >
                  <span className="finger-number">{index + 1}</span>
                  {blinking && (
                    <span
                      className="blink-ring blinking"
                      style={{
                        borderColor: player?.color,
                        boxShadow: `0 0 24px ${player?.color}`,
                      }}
                    />
                  )}
                </div>
              );
            })}
          {showResult && selectedPlayer && (
            <div className="multitouch-result" role="dialog" aria-modal="true">
              <div
                className="multitouch-result-card"
                style={{ "--selected-color": selectedColor } as CSSProperties}
              >
                <span className="multitouch-result-label">
                  {t("selectedPlayer")}
                </span>
                <div className="multitouch-result-color" aria-hidden="true" />
                <div className="multitouch-result-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={resetMultiTouch}
                  >
                    {t("tryAgain")}
                  </button>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={finishSelection}
                  >
                    {t("startGame")}
                  </button>
                </div>
              </div>
            </div>
          )}
          {countdown === "idle" && fingers.length === 0 && !showBackButton && (
            <div className="multitouch-instructions">
              <span className="multitouch-icon" role="img" aria-label="fingers">
                👆
              </span>
              <p>{t("multitouchInstructions")}</p>
            </div>
          )}
          {countdown === "idle" &&
            fingers.length > 0 &&
            fingers.length < players.length && (
              <p className="waiting-text">{t("multitouchWaiting")}</p>
            )}
        </div>
      ) : (
        <div className="chwatzi-card">
          {onBack && (
            <button
              className="back-button"
              type="button"
              onClick={onBack}
              disabled={isSpinning}
            >
              ←
            </button>
          )}
          <header className="chwatzi-header">
            <p className="eyebrow">CHWATZI</p>
            <h1>{t("whoStarts")}</h1>
            <p className="muted">{t("chwatziTagline")}</p>
          </header>
          <div className="chwatzi-mode-toggle">
            <button type="button" className="mode-btn active">
              🎰 {t("modeRoulette")}
            </button>
            <button
              type="button"
              className="mode-btn"
              onClick={() => {
                setMode("multitouch");
                resetMultiTouch();
              }}
            >
              👆 {t("modeMultitouch")}
            </button>
          </div>
          <div
            className={
              isSpinning ? "roulette-wheel spinning" : "roulette-wheel"
            }
          >
            {displayPlayers.map((player) => (
              <div
                key={player.id}
                className={`roulette-item ${selectedPlayer?.id === player.id ? "selected" : ""}`}
                style={{ "--player-color": player.color } as CSSProperties}
                onClick={() => selectManually(player)}
              >
                <span
                  className="player-indicator"
                  style={{ backgroundColor: player.color }}
                />
                <span className="player-name">{player.name}</span>
                {selectedPlayer?.id === player.id && (
                  <span className="selection-badge">✓</span>
                )}
              </div>
            ))}
          </div>
          <div className="chwatzi-actions">
            <button
              className="primary-button roulette-button"
              type="button"
              onClick={startRoulette}
              disabled={isSpinning}
            >
              {t("pickRandomly")}
            </button>
            <button
              className="primary-button confirm-button"
              type="button"
              onClick={confirmSelection}
              disabled={!selectedPlayer}
            >
              {t("continue")}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
