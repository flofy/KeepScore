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
  diceCombinations,
  playableValues,
  rankedScores,
  rollQwixxDice,
  rowScore,
  sheetScore,
  undoLastAction,
} from "../domain/qwixx/qwixx";
import type { QwixxColor, QwixxDerived, QwixxState } from "../domain/qwixx/qwixx";
import { DEFAULT_PLAYER_NAMES, defaultPlayerName } from "../domain/game/players";
import { useI18n } from "./i18n";
import { appToast } from "./toast";
import { QuixScoreMenuDrawer } from "./QuixScoreMenuDrawer";
import { useFullscreen } from "./useFullscreen";
import "./quixscore.css";

type Props = {
  initialPlayerNames?: string[];
  onBack?: () => void;
  onHome?: () => void;
  onSavedGames?: () => void;
  onSetup?: () => void;
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

function emptyPlayableValues(): Record<QwixxColor, Set<number>> {
  return {
    red: new Set<number>(),
    yellow: new Set<number>(),
    green: new Set<number>(),
    blue: new Set<number>(),
  };
}

export function QuixScoreScreen({
  initialPlayerNames,
  onBack,
  onHome,
  onSavedGames,
  onSetup,
}: Props) {
  const { t, lang, setLang } = useI18n();
  const { fullscreen, toggleFullscreen } = useFullscreen();
  const [menuOpen, setMenuOpen] = useState(false);
  const [state, setState] = useState<QwixxState | null>(() =>
    initialPlayerNames && initialPlayerNames.length > 0
      ? createQwixxState(initialPlayerNames)
      : loadSavedState(),
  );
  const [draftNames, setDraftNames] = useState<string[]>(() => [
    ...DEFAULT_PLAYER_NAMES,
  ]);
  const [hideScores, setHideScores] = useState<boolean>(loadHideScores);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const derived: QwixxDerived | null = useMemo(
    () => (state ? deriveQwixx(state) : null),
    [state],
  );

  const playable = useMemo(() => {
    if (!state?.lastRoll) return emptyPlayableValues();
    return playableValues(diceCombinations(state.lastRoll));
  }, [state?.lastRoll]);

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
      names.length >= MAX_PLAYERS
        ? names
        : [...names, defaultPlayerName(names.length)],
    );
  }, []);

  const removeDraftPlayer = useCallback((index: number) => {
    setDraftNames((names) =>
      names.length <= 1 ? names : names.filter((_, nameIndex) => nameIndex !== index),
    );
  }, []);

  const startGame = useCallback(() => {
    const names = draftNames
      .map((name) => name.trim())
      .filter((name) => name.length > 0);
    if (names.length === 0) return;
    const created = createQwixxState(names);
    setState(created);
    setSelectedPlayerId(created.players[0].id);
    setDraftNames([...DEFAULT_PLAYER_NAMES]);
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

  const handleRoll = useCallback(() => {
    setState((current) =>
      current && !deriveQwixx(current).finished
        ? { ...current, lastRoll: rollQwixxDice(Math.random) }
        : current,
    );
  }, []);

  const handleNewGame = useCallback(() => {
    setState(null);
    setSelectedPlayerId(null);
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
  const lastRoll = state.lastRoll ?? null;
  const selectedPlayer =
    state.players.find((player) => player.id === selectedPlayerId) ??
    state.players[0];
  const sheet = derived.sheets[selectedPlayer.id];

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
          <button
            type="button"
            className="burger-button quixscore-burger"
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

      <details className="quixscore-dice-panel">
        <summary className="quixscore-dice-summary">
          <span className="quixscore-dice-summary-label">
            🎲 {t("quixScoreRoll")}
          </span>
          <span className="quixscore-dice-chevron" aria-hidden="true">
            ▾
          </span>
        </summary>
        <section className="quixscore-dice">
          <div className="quixscore-dice-faces">
            {lastRoll ? (
              <>
                <span className="quixscore-die quixscore-die--white">
                  {lastRoll.white1}
                </span>
                <span className="quixscore-die quixscore-die--white">
                  {lastRoll.white2}
                </span>
                {QWIXX_COLORS.map((color) => (
                  <span
                    key={color}
                    className={
                      derived.lockedRows[color]
                        ? `quixscore-die quixscore-die--${color} quixscore-die--locked`
                        : `quixscore-die quixscore-die--${color}`
                    }
                  >
                    {lastRoll.colored[color]}
                  </span>
                ))}
              </>
            ) : (
              <span className="quixscore-dice-empty">
                {t("quixScoreDiceHint")}
              </span>
            )}
          </div>
          <button
            type="button"
            className="quixscore-roll"
            onClick={handleRoll}
            disabled={finished}
          >
            🎲 {t("quixScoreRoll")}
          </button>
          {lastRoll && (
            <div className="quixscore-dice-sums">
              <span className="quixscore-sum quixscore-sum--white">
                {lastRoll.white1 + lastRoll.white2}
              </span>
              {QWIXX_COLORS.map((color) =>
                derived.lockedRows[color] ? null : (
                  <span key={color} className="quixscore-sum-group">
                    {[...new Set([lastRoll.white1, lastRoll.white2])]
                      .map((white) => lastRoll.colored[color] + white)
                      .map((sum) => (
                        <span
                          key={sum}
                          className={`quixscore-sum quixscore-sum--${color}`}
                        >
                          {sum}
                        </span>
                      ))}
                  </span>
                ),
              )}
            </div>
          )}
        </section>
      </details>

      <nav className="quixscore-players" aria-label={t("players")}>
        {state.players.map((player) => {
          const playerSheet = derived.sheets[player.id];
          const total = playerSheet ? sheetScore(playerSheet) : 0;
          const active = player.id === selectedPlayer.id;
          return (
            <button
              key={player.id}
              type="button"
              className={
                active
                  ? "quixscore-player-chip quixscore-player-chip--active"
                  : "quixscore-player-chip"
              }
              aria-pressed={active}
              onClick={() => setSelectedPlayerId(player.id)}
            >
              <span className="quixscore-player-chip-name">{player.name}</span>
              <span className="quixscore-player-chip-score">
                {hideScores ? "•••" : total}
              </span>
            </button>
          );
        })}
      </nav>

      {sheet && (
        <section
          className="quixscore-sheet"
          aria-label={selectedPlayer.name}
        >
          <header className="quixscore-sheet-header">
            <h2 className="quixscore-player-name">{selectedPlayer.name}</h2>
            <span className="quixscore-player-total">
              {t("quixScoreTotal")}:{" "}
              {hideScores ? "•••" : sheetScore(sheet)}
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
                    canMark(derived, selectedPlayer.id, color, value);
                  const blocked =
                    !marked &&
                    lastMarkIndex >= 0 &&
                    row.indexOf(value) < lastMarkIndex;
                  const hot = enabled && playable[color].has(value);
                  const classes = [
                    "quixscore-cell",
                    marked
                      ? "quixscore-cell--marked"
                      : blocked
                        ? "quixscore-cell--blocked"
                        : null,
                    value === lastValue ? "quixscore-cell--last" : null,
                    hot ? "quixscore-cell--hot" : null,
                  ]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <button
                      key={value}
                      type="button"
                      className={classes}
                      disabled={!enabled}
                      aria-pressed={marked}
                      aria-label={t("quixScoreCrossOff") + " " + value}
                      onClick={() =>
                        handleMark(selectedPlayer.id, color, value)
                      }
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
                    disabled={
                      crossed || !canAddPenalty(derived, selectedPlayer.id)
                    }
                    aria-pressed={crossed}
                    aria-label={
                      t("quixScoreAddPenalty") + " " + selectedPlayer.name
                    }
                    onClick={() => handlePenalty(selectedPlayer.id)}
                  >
                    -5
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}
      <QuixScoreMenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onHome={onHome}
        onUndo={handleUndo}
        canUndo={state.actions.length > 0}
        onNewGame={onSetup}
        onSavedGames={onSavedGames}
        fullscreen={fullscreen}
        onFullscreenToggle={toggleFullscreen}
        lang={lang}
        onLanguageChange={setLang}
      />
    </main>
  );
}
