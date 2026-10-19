import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  MAX_PENALTIES,
  MAX_ROLLS_PER_TURN,
  QWIXX_COLORS,
  QWIXX_ROWS,
  activePlayerIndex,
  applyMark,
  applyPenalty,
  canAddPenalty,
  canMark,
  canMarkNow,
  createQwixxState,
  deriveQwixx,
  diceCombinations,
  emptyHeldDice,
  nextTurn,
  playableValues,
  qwixxOptions,
  rankedScores,
  rerollDice,
  rowScore,
  sheetScore,
  startDiceTurn,
  toggleHeldDie,
  undoLastAction,
} from "../domain/qwixx/qwixx";
import type {
  QwixxColor,
  QwixxDerived,
  QwixxDieKey,
  QwixxOptions,
  QwixxState,
} from "../domain/qwixx/qwixx";
import { DEFAULT_PLAYER_NAMES, defaultPlayerName } from "../domain/game/players";
import { useI18n } from "./i18n";
import { appToast } from "./toast";
import { QuixScoreMenuDrawer, type QuixScoreMenuPlayer } from "./QuixScoreMenuDrawer";
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
const SWIPE_MIN_PX = 48;

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

function useMatchMedia(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches,
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);
  return matches;
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
  const [draftOptions, setDraftOptions] = useState<QwixxOptions>({
    allowReroll: true,
    physicalDice: false,
  });
  const [hideScores, setHideScores] = useState<boolean>(loadHideScores);
  const [pageIndex, setPageIndex] = useState(0);
  const [diceOpen, setDiceOpen] = useState(false);
  const [dragDelta, setDragDelta] = useState(0);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const portraitPhone = useMatchMedia(
    "(orientation: portrait) and (max-width: 900px)",
  );
  const shortLandscape = useMatchMedia(
    "(orientation: landscape) and (max-height: 540px)",
  );

  const derived: QwixxDerived | null = useMemo(
    () => (state ? deriveQwixx(state) : null),
    [state],
  );

  const options = state ? qwixxOptions(state) : null;
  const physicalDice = options?.physicalDice ?? false;
  const allowReroll = options?.allowReroll ?? true;
  const inGame = state !== null && derived !== null;
  const rotated = inGame && portraitPhone;
  const compact = inGame && (rotated || shortLandscape);

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

  const toggleDraftOption = useCallback((key: "allowReroll" | "physicalDice") => {
    setDraftOptions((current) =>
      key === "allowReroll"
        ? { ...current, allowReroll: !current.allowReroll }
        : { ...current, physicalDice: !current.physicalDice },
    );
  }, []);

  const startGame = useCallback(() => {
    const names = draftNames
      .map((name) => name.trim())
      .filter((name) => name.length > 0);
    if (names.length === 0) return;
    setState(createQwixxState(names, draftOptions));
    setPageIndex(0);
    setDiceOpen(false);
    setDraftNames([...DEFAULT_PLAYER_NAMES]);
  }, [draftNames, draftOptions]);

  const handleMark = useCallback(
    (playerId: string, color: QwixxColor, value: number) => {
      if (!state || !derived) return;
      if (!canMark(derived, playerId, color, value)) {
        appToast.warning(t("quixScoreInvalidMark"));
        return;
      }
      if (!canMarkNow(state, playerId, color, value)) {
        appToast.warning(t("quixScoreTurnRestricted"));
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
    setState((current) => {
      if (!current) return current;
      const last = current.actions[current.actions.length - 1];
      const next = undoLastAction(current);
      if (
        !last ||
        last.type !== "mark" ||
        !current.lastRoll ||
        !current.turnMarks ||
        qwixxOptions(current).physicalDice
      ) {
        return next;
      }
      const marks = { ...current.turnMarks };
      const player = marks[last.playerId] ?? { white: false, combo: false };
      const sums = diceCombinations(current.lastRoll);
      if (last.value === sums.whiteSum) {
        marks[last.playerId] =
          player.combo && !player.white
            ? { ...player, combo: false }
            : { ...player, white: false };
      } else {
        marks[last.playerId] = { ...player, combo: false };
      }
      return { ...next, turnMarks: marks };
    });
  }, []);

  const handleRoll = useCallback(() => {
    setState((current) => {
      if (!current || deriveQwixx(current).finished) return current;
      if (qwixxOptions(current).physicalDice) return current;
      const used = current.rollsUsed ?? 0;
      if (!current.lastRoll || used === 0 || used >= MAX_ROLLS_PER_TURN) {
        return startDiceTurn(current, Math.random);
      }
      return rerollDice(current, Math.random) ?? current;
    });
  }, []);

  const handleToggleDie = useCallback((die: QwixxDieKey) => {
    setState((current) => (current ? toggleHeldDie(current, die) : current));
  }, []);

  const handleNextTurn = useCallback(() => {
    setState((current) => {
      if (!current || deriveQwixx(current).finished) return current;
      const next = nextTurn(current);
      setPageIndex(next.activePlayerIndex ?? 0);
      return next;
    });
    setDiceOpen(false);
  }, []);

  const handleToggleOption = useCallback(
    (key: "allowReroll" | "physicalDice") => {
      setState((current) => {
        if (!current) return current;
        const currentOptions = qwixxOptions(current);
        const nextOptions =
          key === "allowReroll"
            ? { ...currentOptions, allowReroll: !currentOptions.allowReroll }
            : {
                ...currentOptions,
                physicalDice: !currentOptions.physicalDice,
              };
        if (key === "physicalDice") {
          return {
            ...current,
            options: nextOptions,
            lastRoll: null,
            rollsUsed: 0,
            held: emptyHeldDice(),
            turnMarks: {},
          };
        }
        return { ...current, options: nextOptions };
      });
      if (key === "physicalDice") setDiceOpen(false);
    },
    [],
  );

  const pageCount = state ? state.players.length : 1;

  const resetDrag = useCallback(() => {
    dragRef.current = null;
    setDragDelta(0);
  }, []);

  const handlePagerPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      dragRef.current = { x: event.clientX, y: event.clientY };
    },
    [],
  );

  const handlePagerPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || diceOpen) return;
      const sdx = event.clientX - drag.x;
      const sdy = event.clientY - drag.y;
      const dx = rotated ? sdy : sdx;
      const dy = rotated ? -sdx : sdy;
      if (Math.abs(dx) <= Math.abs(dy)) return;
      setDragDelta(dx);
    },
    [diceOpen, rotated],
  );

  const handlePagerPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      dragRef.current = null;
      setDragDelta(0);
      if (!drag) return;
      const sdx = event.clientX - drag.x;
      const sdy = event.clientY - drag.y;
      const dx = rotated ? sdy : sdx;
      const dy = rotated ? -sdx : sdy;
      if (Math.abs(dy) > Math.abs(dx)) {
        if (!physicalDice && Math.abs(dy) >= SWIPE_MIN_PX) {
          setDiceOpen((open) => !open);
        }
        return;
      }
      if (diceOpen || Math.abs(dx) < SWIPE_MIN_PX) return;
      setPageIndex((current) => {
        const maxIndex = pageCount - 1;
        const next = current + (dx < 0 ? 1 : -1);
        return Math.max(0, Math.min(maxIndex, next));
      });
    },
    [diceOpen, pageCount, physicalDice, rotated],
  );

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
          <p className="field-kicker">{t("quixScoreGameOptions")}</p>
          <div className="quixscore-options">
            <button
              type="button"
              className="quixscore-option"
              aria-pressed={draftOptions.allowReroll}
              onClick={() => toggleDraftOption("allowReroll")}
            >
              <span>{t("quixScoreOptionReroll")}</span>
              <span className="quixscore-option-check">
                {draftOptions.allowReroll ? "✓" : ""}
              </span>
            </button>
            <button
              type="button"
              className="quixscore-option"
              aria-pressed={draftOptions.physicalDice}
              onClick={() => toggleDraftOption("physicalDice")}
            >
              <span>{t("quixScoreOptionPhysicalDice")}</span>
              <span className="quixscore-option-check">
                {draftOptions.physicalDice ? "✓" : ""}
              </span>
            </button>
          </div>
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

  const currentPageIndex = Math.min(pageIndex, pageCount - 1);
  const finished = derived.finished;
  const lastRoll = state.lastRoll ?? null;
  const rollsUsed = state.rollsUsed ?? 0;
  const held = state.held ?? emptyHeldDice();
  const activeIndex = activePlayerIndex(state);
  const activePlayer = state.players[activeIndex] ?? null;
  const canHoldDice =
    allowReroll && !finished && rollsUsed > 0 && rollsUsed < MAX_ROLLS_PER_TURN;
  const rollBlocked =
    finished ||
    (rollsUsed >= 1 && (!allowReroll || rollsUsed >= MAX_ROLLS_PER_TURN));
  const ranking = rankedScores(state, derived);
  const menuPlayers: QuixScoreMenuPlayer[] = state.players.map((player) => {
    const sheet = derived.sheets[player.id];
    return {
      id: player.id,
      name: player.name,
      score: sheet ? sheetScore(sheet) : 0,
    };
  });

  const renderDicePage = () => (
    <section
      className="quixscore-page quixscore-page--dice"
      aria-label={t("quixScoreDicePage")}
    >
      <h2 className="quixscore-page-title">🎲 {t("quixScoreDicePage")}</h2>
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
      <section className="quixscore-dice">
        <div className="quixscore-dice-faces">
          {lastRoll ? (
            <>
              <button
                type="button"
                className={
                  held.white1
                    ? "quixscore-die quixscore-die--white quixscore-die--held"
                    : "quixscore-die quixscore-die--white"
                }
                onClick={() => handleToggleDie("white1")}
                disabled={!canHoldDice}
                aria-pressed={held.white1}
                aria-label={t("quixScoreKeepDie") + " " + lastRoll.white1}
              >
                {lastRoll.white1}
              </button>
              <button
                type="button"
                className={
                  held.white2
                    ? "quixscore-die quixscore-die--white quixscore-die--held"
                    : "quixscore-die quixscore-die--white"
                }
                onClick={() => handleToggleDie("white2")}
                disabled={!canHoldDice}
                aria-pressed={held.white2}
                aria-label={t("quixScoreKeepDie") + " " + lastRoll.white2}
              >
                {lastRoll.white2}
              </button>
              {QWIXX_COLORS.map((color) => {
                const locked = derived.lockedRows[color];
                const isHeld = held.colored[color];
                return (
                  <button
                    key={color}
                    type="button"
                    className={
                      locked
                        ? `quixscore-die quixscore-die--${color} quixscore-die--locked`
                        : isHeld
                          ? `quixscore-die quixscore-die--${color} quixscore-die--held`
                          : `quixscore-die quixscore-die--${color}`
                    }
                    onClick={() => handleToggleDie(color)}
                    disabled={!canHoldDice}
                    aria-pressed={isHeld}
                    aria-label={
                      t("quixScoreKeepDie") + " " + lastRoll.colored[color]
                    }
                  >
                    {lastRoll.colored[color]}
                  </button>
                );
              })}
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
          disabled={rollBlocked}
        >
          {rollBlocked && rollsUsed >= 1
            ? `🎲 ${t("quixScoreRolled")}`
            : rollsUsed > 0
              ? `🎲 ${t("quixScoreRoll")} (${rollsUsed}/${MAX_ROLLS_PER_TURN})`
              : `🎲 ${t("quixScoreRoll")}`}
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
    </section>
  );

  const renderPlayerPage = (player: QwixxState["players"][number]) => {
    const sheet = derived.sheets[player.id];
    if (!sheet) return null;
    return (
      <section className="quixscore-page" key={player.id} aria-label={player.name}>
        <div className="quixscore-sheet">
          <header className="quixscore-sheet-header">
            <h2 className="quixscore-player-name">{player.name}</h2>
            {activePlayer?.id === player.id && (
              <span className="quixscore-turn-badge quixscore-turn-badge--sheet">
                🎯 {t("quixScoreYourTurn")}
              </span>
            )}
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
                    canMarkNow(state, player.id, color, value);
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
                    disabled={
                      crossed || !canAddPenalty(derived, player.id)
                    }
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
        </div>
      </section>
    );
  };

  const viewportClasses = [
    "quixscore-viewport",
    rotated ? "quixscore-viewport--rotated" : null,
    compact ? "quixscore-viewport--compact" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={viewportClasses}>
      <main className="quixscore-screen">
        <div className="quixscore-gamebar">
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
          <div className="quixscore-dots" aria-hidden="true">
            {Array.from({ length: pageCount }, (_, index) => (
              <span
                key={index}
                className={
                  index === currentPageIndex
                    ? "quixscore-dot quixscore-dot--active"
                    : "quixscore-dot"
                }
              />
            ))}
          </div>
        </div>
        <div className="quixscore-turnbar">
          {activePlayer && (
            <span className="quixscore-turn-badge">
              🎯 {t("quixScoreActivePlayer")}: {activePlayer.name}
            </span>
          )}
          <button
            type="button"
            className="quixscore-roll"
            onClick={handleNextTurn}
            disabled={finished}
          >
            {t("quixScoreNextTurn")} →
          </button>
        </div>

        <div
          className="quixscore-stack"
          onPointerDown={handlePagerPointerDown}
          onPointerMove={handlePagerPointerMove}
          onPointerUp={handlePagerPointerUp}
          onPointerCancel={resetDrag}
          onPointerLeave={resetDrag}
        >
          <div className="quixscore-pager">
            <div
              className={
                dragDelta !== 0
                  ? "quixscore-pages quixscore-pages--dragging"
                  : "quixscore-pages"
              }
              style={{
                transform: `translateX(calc(${-currentPageIndex * 100}% + ${dragDelta}px))`,
              }}
            >
              {state.players.map((player) => renderPlayerPage(player))}
            </div>
          </div>
          {!physicalDice && (
            <div
              className={
                diceOpen
                  ? "quixscore-layer quixscore-layer--dice quixscore-layer--dice--open"
                  : "quixscore-layer quixscore-layer--dice"
              }
              aria-hidden={!diceOpen}
            >
              {renderDicePage()}
            </div>
          )}
        </div>

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
          players={menuPlayers}
          activePageIndex={currentPageIndex}
          turnPlayerId={activePlayer?.id ?? ""}
          onSelectPlayer={(index) => {
            setPageIndex(index);
            setDiceOpen(false);
          }}
          onSelectDice={() => setDiceOpen(true)}
          showDice={!physicalDice}
          options={options ?? { allowReroll: true, physicalDice: false }}
          onToggleOption={handleToggleOption}
          hideScores={hideScores}
          onHideScoresToggle={() => setHideScores((hidden) => !hidden)}
        />
      </main>
    </div>
  );
}
