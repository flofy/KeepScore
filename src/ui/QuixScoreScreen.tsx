import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MAX_PENALTIES,
  QWIXX_COLORS,
  QWIXX_ROWS,
  applyMark,
  applyPenalty,
  canAddPenalty,
  canMark,
  createQwixxState,
  deriveQwixx,
  rankedScores,
  rowScore,
  sheetScore,
  undoLastAction,
} from "../domain/qwixx/qwixx";
import type { QwixxColor, QwixxDerived, QwixxState } from "../domain/qwixx/qwixx";
import { useI18n } from "./i18n";
import { appToast } from "./toast";
import "./quixscore.css";

type Props = {
  onBack?: () => void;
};

const STORAGE_KEY = "keepscore.quixscore.v1";
const HIDE_SCORES_KEY = "keepscore.quixscore.hide-scores";
const MAX_PLAYERS = 5;

function loadSavedState(): QwixxState | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QwixxState;
    if (!parsed || !Array.isArray(parsed.players) || parsed.players.length < 1)
      return null;
    return parsed;
  } catch {
    return null;
  }
}

function loadHideScores(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    return localStorage.getItem(HIDE_SCORES_KEY) === "1";
  } catch {
    return false;
  }
}

export function QuixScoreScreen({ onBack }: Props) {
  const { t } = useI18n();
  const [state, setState] = useState<QwixxState | null>(loadSavedState);
  const [draftNames, setDraftNames] = useState<string[]>(["", ""]);
  const [hideScores, setHideScores] = useState<boolean>(loadHideScores);

  const derived: QwixxDerived | null = useMemo(
    () => (state ? deriveQwixx(state) : null),
    [state],
  );

  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else localStorage.removeItem(STORAGE_KEY);
  }, [state]);

  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(HIDE_SCORES_KEY, hideScores ? "1" : "0");
  }, [hideScores]);

  const updateDraftName = useCallback((index: number, value: string) => {
    setDraftNames((names) =>
      names.map((name, nameIndex) => (nameIndex === index ? value : name)),
    );
  }, []);

  const addDraftPlayer = useCallback(() => {
    setDraftNames((names) =>
      names.length >= MAX_PLAYERS ? names : [...names, ""],
    );
  }, []);

  const removeDraftPlayer = useCallback((index: number) => {
    setDraftNames((names) =>
      names.length <= 1 ? names : names.filter((_, nameIndex) => nameIndex !== index),
    );
  }, []);

  const startGame = useCallback(() => {
    setState(createQwixxState(draftNames));
    setDraftNames(["", ""]);
  }, [draftNames]);

  const handleMark = useCallback(
    (playerId: string, color: QwixxColor, value: number) => {
      if (!state || !derived) return;
      if (!canMark(derived, playerId, color, value)) {
        appToast.warning(t("quixScoreInvalidMark"));
        return;
      }
      const next = applyMark(state, playerId, color, value);
      if (next) setState(next);
    },
    [derived, state, t],
  );

  const handlePenalty = useCallback(
    (playerId: string) => {
      if (!state || !derived) return;
      if (!canAddPenalty(derived, playerId)) return;
      const next = applyPenalty(state, playerId);
      if (next) setState(next);
    },
    [derived, state],
  );

  const handleUndo = useCallback(() => {
    setState((current) => (current ? undoLastAction(current) : current));
  }, []);

  const handleNewGame = useCallback(() => {
    setState(null);
  }, []);

  const canStart = draftNames.some((name) => name.trim().length > 0);

  if (!state || !derived) {
    return (
      <main className="quixscore-screen">
        {onBack && (
          <button
            type="button"
            className="quixscore-close"
            onClick={onBack}
            aria-label={t("close")}
          >
            ✕
          </button>
        )}
        <header className="quixscore-header">
          <div>
            <p className="eyebrow">KEEP SCORE</p>
            <h1>📝 QuixScore</h1>
          </div>
        </header>
        <p className="muted quixscore-tagline">{t("quixScoreTagline")}</p>
        <section className="quixscore-setup">
          <p className="field-kicker">{t("players")}</p>
          <div className="quixscore-player-list">
            {draftNames.map((name, index) => (
              <div className="quixscore-player-editor" key={index}>
                <span className="player-number">{index + 1}</span>
                <input
                  value={name}
                  onChange={(event) =>
                    updateDraftName(index, event.target.value)
                  }
                  placeholder={`${t("playerNumber")} ${index + 1}`}
                  aria-label={
                    t("playerNumber") +
                    " " +
                    (index + 1) +
                    " " +
                    t("playerName")
                  }
                />
                <button
                  type="button"
                  className="quixscore-remove-player"
                  onClick={() => removeDraftPlayer(index)}
                  disabled={draftNames.length <= 1}
                  aria-label={t("removePlayer") + " " + (index + 1)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="quixscore-add-player"
            onClick={addDraftPlayer}
            disabled={draftNames.length >= MAX_PLAYERS}
          >
            {t("addPlayer")}
          </button>
          <button
            type="button"
            className="primary-button quixscore-start"
            onClick={startGame}
            disabled={!canStart}
          >
            {t("startGame")} <span>→</span>
          </button>
        </section>
      </main>
    );
  }

  const ranking = rankedScores(state, derived);
  const finished = derived.finished;

  return (
    <main className="quixscore-screen">
      {onBack && (
        <button
          type="button"
          className="quixscore-close"
          onClick={onBack}
          aria-label={t("close")}
        >
          ✕
        </button>
      )}
      <header className="quixscore-header">
        <div>
          <p className="eyebrow">KEEP SCORE</p>
          <h1>📝 QuixScore</h1>
        </div>
        <div className="quixscore-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={handleUndo}
            disabled={state.actions.length === 0}
          >
            ↩ {t("undo")}
          </button>
          <button
            type="button"
            className="secondary-button"
            aria-pressed={hideScores}
            onClick={() => setHideScores((hidden) => !hidden)}
          >
            {hideScores
              ? `👁 ${t("quixScoreShowScores")}`
              : `🙈 ${t("quixScoreHideScores")}`}
          </button>
          <button
            type="button"
            className="secondary-button danger"
            onClick={handleNewGame}
          >
            {t("newGame")}
          </button>
        </div>
      </header>
      <p className="muted quixscore-hint">{t("quixScoreLockedHint")}</p>

      {finished && (
        <div className="quixscore-banner" role="status">
          <strong>🏁 {t("quixScoreGameOver")}</strong>
          <ol className="quixscore-ranking">
            {ranking.map((entry, index) => (
              <li key={entry.player.id}>
                {index === 0 ? `🏆 ${t("quixScoreWinner")}: ` : ""}
                {entry.player.name} — {hideScores ? "•••" : entry.score}
              </li>
            ))}
          </ol>
        </div>
      )}

      {state.players.map((player) => {
        const sheet = derived.sheets[player.id];
        if (!sheet) return null;
        return (
          <section
            key={player.id}
            className="quixscore-sheet"
            aria-label={player.name}
          >
            <header className="quixscore-sheet-header">
              <h2 className="quixscore-player-name">{player.name}</h2>
              <span className="quixscore-player-total">
                {t("quixScoreTotal")}: {hideScores ? "•••" : sheetScore(sheet)}
              </span>
            </header>
            {QWIXX_COLORS.map((color) => {
              const row = QWIXX_ROWS[color];
              const marks = sheet.marks[color];
              const locked = derived.lockedRows[color];
              const lastValue = row[row.length - 1];
              const lastMarkIndex = row.indexOf(marks[marks.length - 1] ?? -1);
              return (
                <div
                  key={color}
                  className={`quixscore-row quixscore-row--${color}${
                    locked ? " quixscore-row--locked" : ""
                  }`}
                >
                  {row.map((value) => {
                    const marked = marks.includes(value);
                    const enabled =
                      !finished &&
                      !marked &&
                      canMark(derived, player.id, color, value);
                    const blocked =
                      !marked &&
                      lastMarkIndex >= 0 &&
                      row.indexOf(value) < lastMarkIndex;
                    return (
                      <button
                        key={value}
                        type="button"
                        className={
                          marked
                            ? "quixscore-cell quixscore-cell--marked"
                            : blocked
                              ? "quixscore-cell quixscore-cell--blocked"
                              : value === lastValue
                                ? "quixscore-cell quixscore-cell--last"
                                : "quixscore-cell"
                        }
                        disabled={!enabled}
                        aria-pressed={marked}
                        aria-label={
                          t("quixScoreCrossOff") + " " + value
                        }
                        onClick={() => handleMark(player.id, color, value)}
                      >
                        {value}
                      </button>
                    );
                  })}
                  <span
                    className="quixscore-row-lock"
                    role="img"
                    aria-label={t("quixScoreLocked")}
                  >
                    {locked ? "🔒" : "—"}
                  </span>
                  <span className="quixscore-row-score">
                    {hideScores ? "•••" : rowScore(sheet, color)}
                  </span>
                </div>
              );
            })}
            <div className="quixscore-penalties">
              <span className="quixscore-penalties-label">
                {t("quixScorePenalties")}
              </span>
              <div className="quixscore-penalty-cells">
                {Array.from({ length: MAX_PENALTIES }, (_, index) => {
                  const crossed = index < sheet.penalties;
                  return (
                    <button
                      key={index}
                      type="button"
                      className={
                        crossed
                          ? "quixscore-penalty quixscore-penalty--crossed"
                          : "quixscore-penalty"
                      }
                      disabled={crossed || !canAddPenalty(derived, player.id)}
                      aria-pressed={crossed}
                      aria-label={
                        t("quixScoreAddPenalty") + " " + player.name
                      }
                      onClick={() => handlePenalty(player.id)}
                    >
                      -5
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}
    </main>
  );
}
