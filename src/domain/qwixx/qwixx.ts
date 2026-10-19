export type QwixxColor = "red" | "yellow" | "green" | "blue";

export type QwixxAction =
  | { type: "mark"; playerId: string; color: QwixxColor; value: number }
  | { type: "penalty"; playerId: string };

export type QwixxPlayer = { id: string; name: string };

export type QwixxDice = {
  white1: number;
  white2: number;
  colored: Record<QwixxColor, number>;
};

export type QwixxDieKey = "white1" | "white2" | QwixxColor;

/** Dice kept for the next reroll (keep/reroll variant). */
export type QwixxHeldDice = {
  white1: boolean;
  white2: boolean;
  colored: Record<QwixxColor, boolean>;
};

/** Game options, chosen at setup and adjustable mid-game from the menu. */
export type QwixxOptions = {
  /** Allow rerolling dice (keep/reroll variant, up to 3 rolls per turn). */
  allowReroll: boolean;
  /** Play beside real dice: no virtual dice, only the line rules apply. */
  physicalDice: boolean;
};

/** Marks already consumed during the current dice turn, per player. */
export type QwixxTurnMarks = Record<
  string,
  { white: boolean; combo: boolean }
>;

export type QwixxState = {
  players: QwixxPlayer[];
  actions: QwixxAction[];
  createdAt: number;
  lastRoll?: QwixxDice | null;
  /** Rolls already used in the current dice turn (keep/reroll variant). */
  rollsUsed?: number;
  /** Dice kept for the next reroll. */
  held?: QwixxHeldDice;
  /** Game options (legacy saved games have none and keep legacy behaviour). */
  options?: QwixxOptions;
  /** Index of the player whose turn it is. */
  activePlayerIndex?: number;
  /** Marks consumed during the current dice turn. */
  turnMarks?: QwixxTurnMarks;
};

export type QwixxSheet = {
  marks: Record<QwixxColor, number[]>;
  penalties: number;
};

export type QwixxDerived = {
  sheets: Record<string, QwixxSheet>;
  lockedRows: Record<QwixxColor, boolean>;
  finished: boolean;
};

export const QWIXX_COLORS: readonly QwixxColor[] = [
  "red",
  "yellow",
  "green",
  "blue",
];

export const QWIXX_ROWS: Record<QwixxColor, readonly number[]> = {
  red: [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
  yellow: [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
  green: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  blue: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
};

export const MAX_PENALTIES = 4;
export const PENALTY_SCORE = -5;
export const MIN_MARKS_TO_LOCK = 5;
export const ROWS_LOCKED_ENDING_GAME = 2;
export const MAX_ROLLS_PER_TURN = 3;

function emptySheet(): QwixxSheet {
  return {
    marks: { red: [], yellow: [], green: [], blue: [] },
    penalties: 0,
  };
}

export function createQwixxState(
  playerNames: string[],
  options?: QwixxOptions,
): QwixxState {
  const players: QwixxPlayer[] = playerNames.map((rawName, index) => ({
    id: crypto.randomUUID(),
    name: rawName.trim() || "Player " + (index + 1),
  }));

  if (players.length < 1) {
    throw new Error("A QuixScore game requires at least one player");
  }

  return {
    players,
    actions: [],
    createdAt: Date.now(),
    ...(options ? { options, activePlayerIndex: 0, turnMarks: {} } : {}),
  };
}

/** Options with defaults for legacy saved games without stored options. */
export function qwixxOptions(state: QwixxState): QwixxOptions {
  return state.options ?? { allowReroll: true, physicalDice: false };
}

/** Index of the player whose turn it is (legacy games: first player). */
export function activePlayerIndex(state: QwixxState): number {
  const index = state.activePlayerIndex ?? 0;
  if (index < 0 || index >= state.players.length) return 0;
  return index;
}

/*
 * A number is playable when it sits strictly to the right of the last crossed
 * number of the row (first cross anywhere), and the row's last number only
 * becomes playable once the sheet already shows MIN_MARKS_TO_LOCK crosses.
 */
function isMarkAllowed(sheet: QwixxSheet, color: QwixxColor, value: number) {
  const row = QWIXX_ROWS[color];
  const index = row.indexOf(value);
  if (index === -1) return false;

  const marks = sheet.marks[color];
  if (marks.length > 0) {
    const lastMarkIndex = row.indexOf(marks[marks.length - 1] ?? -1);
    if (lastMarkIndex === -1 || index <= lastMarkIndex) return false;
  }

  if (index === row.length - 1 && marks.length < MIN_MARKS_TO_LOCK) {
    return false;
  }

  return true;
}

export function deriveQwixx(state: QwixxState): QwixxDerived {
  const sheets: Record<string, QwixxSheet> = {};
  for (const player of state.players) {
    sheets[player.id] = emptySheet();
  }

  const lockedRows: Record<QwixxColor, boolean> = {
    red: false,
    yellow: false,
    green: false,
    blue: false,
  };

  for (const action of state.actions) {
    const sheet = sheets[action.playerId];
    if (!sheet) continue;

    if (action.type === "penalty") {
      if (sheet.penalties < MAX_PENALTIES) sheet.penalties += 1;
      continue;
    }

    if (lockedRows[action.color]) continue;
    if (!isMarkAllowed(sheet, action.color, action.value)) continue;

    sheet.marks[action.color].push(action.value);
    const row = QWIXX_ROWS[action.color];
    if (action.value === row[row.length - 1]) {
      lockedRows[action.color] = true;
    }
  }

  const lockedCount = QWIXX_COLORS.filter((color) => lockedRows[color]).length;
  const finished =
    lockedCount >= ROWS_LOCKED_ENDING_GAME ||
    state.players.some(
      (player) => (sheets[player.id] ?? emptySheet()).penalties >= MAX_PENALTIES,
    );

  return { sheets, lockedRows, finished };
}

export function canMark(
  derived: QwixxDerived,
  playerId: string,
  color: QwixxColor,
  value: number,
): boolean {
  if (derived.finished || derived.lockedRows[color]) return false;
  const sheet = derived.sheets[playerId];
  if (!sheet || sheet.marks[color].includes(value)) return false;
  return isMarkAllowed(sheet, color, value);
}

/*
 * Turn-aware marking rules (Qwixx): every player may cross the white dice
 * sum once; the active player may additionally cross one combo (a colored die
 * paired with a white die on that row, or the white pair on any row).
 * Real-dice games only enforce the line rules, and legacy games without
 * stored options keep the fully permissive behaviour.
 */
export function canMarkNow(
  state: QwixxState,
  playerId: string,
  color: QwixxColor,
  value: number,
): boolean {
  const derived = deriveQwixx(state);
  if (!canMark(derived, playerId, color, value)) return false;
  if (state.options === undefined) return true;

  if (qwixxOptions(state).physicalDice) return true;

  const roll = state.lastRoll;
  if (!roll) return false;

  const sums = diceCombinations(roll);
  const marks = state.turnMarks ?? {};
  const player = marks[playerId] ?? { white: false, combo: false };
  const active = state.players[activePlayerIndex(state)];
  const isActive = active !== undefined && active.id === playerId;

  if (value === sums.whiteSum) {
    if (!player.white) return true;
    return isActive && !player.combo;
  }
  if (!isActive) return false;
  return !player.combo && sums.coloredSums[color].includes(value);
}

export function applyMark(
  state: QwixxState,
  playerId: string,
  color: QwixxColor,
  value: number,
): QwixxState | null {
  if (!canMarkNow(state, playerId, color, value)) return null;
  const next: QwixxState = {
    ...state,
    actions: [...state.actions, { type: "mark", playerId, color, value }],
  };

  const roll = state.lastRoll;
  if (state.options === undefined || qwixxOptions(state).physicalDice) {
    return next;
  }
  if (!roll) return next;

  const sums = diceCombinations(roll);
  const marks: QwixxTurnMarks = { ...(state.turnMarks ?? {}) };
  const player = marks[playerId] ?? { white: false, combo: false };
  if (value === sums.whiteSum) {
    marks[playerId] = player.white
      ? { ...player, combo: true }
      : { ...player, white: true };
  } else {
    marks[playerId] = { ...player, combo: true };
  }
  return { ...next, turnMarks: marks };
}

export function canAddPenalty(derived: QwixxDerived, playerId: string) {
  if (derived.finished) return false;
  const sheet = derived.sheets[playerId];
  return sheet !== undefined && sheet.penalties < MAX_PENALTIES;
}

export function applyPenalty(
  state: QwixxState,
  playerId: string,
): QwixxState | null {
  if (!canAddPenalty(deriveQwixx(state), playerId)) return null;
  return {
    ...state,
    actions: [...state.actions, { type: "penalty", playerId }],
  };
}

export function undoLastAction(state: QwixxState): QwixxState {
  if (state.actions.length === 0) return state;
  return { ...state, actions: state.actions.slice(0, -1) };
}

/** Ends the turn: next player in list order, roll and marks quotas reset. */
export function nextTurn(state: QwixxState): QwixxState {
  const count = state.players.length;
  const current = activePlayerIndex(state);
  return {
    ...state,
    activePlayerIndex: count > 0 ? (current + 1) % count : 0,
    lastRoll: null,
    rollsUsed: 0,
    held: emptyHeldDice(),
    turnMarks: {},
  };
}

export function rowScore(sheet: QwixxSheet, color: QwixxColor): number {
  const count = sheet.marks[color].length;
  return (count * (count + 1)) / 2;
}

export function sheetScore(sheet: QwixxSheet): number {
  let total = sheet.penalties * PENALTY_SCORE;
  for (const color of QWIXX_COLORS) {
    total += rowScore(sheet, color);
  }
  return total;
}

export function rankedScores(
  state: QwixxState,
  derived: QwixxDerived,
): { player: QwixxPlayer; score: number }[] {
  return state.players
    .map((player) => {
      const sheet = derived.sheets[player.id];
      return { player, score: sheet ? sheetScore(sheet) : 0 };
    })
    .sort((a, b) => b.score - a.score);
}

/*
 * Dice: two white dice shared by every player plus one die per row color.
 * Randomness is injected so tests stay deterministic.
 */
export function rollQwixxDice(rng: () => number): QwixxDice {
  const face = () => 1 + Math.floor(rng() * 6);
  return {
    white1: face(),
    white2: face(),
    colored: {
      red: face(),
      yellow: face(),
      green: face(),
      blue: face(),
    },
  };
}

export function emptyHeldDice(): QwixxHeldDice {
  return {
    white1: false,
    white2: false,
    colored: { red: false, yellow: false, green: false, blue: false },
  };
}

/** First roll of a turn: rolls every die and clears the held selection. */
export function startDiceTurn(state: QwixxState, rng: () => number): QwixxState {
  return {
    ...state,
    lastRoll: rollQwixxDice(rng),
    rollsUsed: 1,
    held: emptyHeldDice(),
  };
}

/** Rerolls every die that is not held. Null once the turn's rolls are used up. */
export function rerollDice(
  state: QwixxState,
  rng: () => number,
): QwixxState | null {
  if (!qwixxOptions(state).allowReroll) return null;
  if (!state.lastRoll) return null;
  const used = state.rollsUsed ?? 0;
  if (used < 1 || used >= MAX_ROLLS_PER_TURN) return null;

  const held = state.held ?? emptyHeldDice();
  const fresh = rollQwixxDice(rng);
  return {
    ...state,
    lastRoll: {
      white1: held.white1 ? state.lastRoll.white1 : fresh.white1,
      white2: held.white2 ? state.lastRoll.white2 : fresh.white2,
      colored: {
        red: held.colored.red ? state.lastRoll.colored.red : fresh.colored.red,
        yellow: held.colored.yellow
          ? state.lastRoll.colored.yellow
          : fresh.colored.yellow,
        green: held.colored.green
          ? state.lastRoll.colored.green
          : fresh.colored.green,
        blue: held.colored.blue ? state.lastRoll.colored.blue : fresh.colored.blue,
      },
    },
    rollsUsed: used + 1,
    held,
  };
}

/** Toggles a die between kept and rerolled for the next roll of the turn. */
export function toggleHeldDie(state: QwixxState, die: QwixxDieKey): QwixxState {
  if (!state.lastRoll) return state;
  const used = state.rollsUsed ?? 0;
  if (used < 1 || used >= MAX_ROLLS_PER_TURN) return state;

  const held = state.held ?? emptyHeldDice();
  if (die === "white1") {
    return { ...state, held: { ...held, white1: !held.white1 } };
  }
  if (die === "white2") {
    return { ...state, held: { ...held, white2: !held.white2 } };
  }
  return {
    ...state,
    held: {
      ...held,
      colored: { ...held.colored, [die]: !held.colored[die] },
    },
  };
}

/** Ends the dice turn: the next roll starts from a full set of dice. */
export function resetDiceTurn(state: QwixxState): QwixxState {
  return { ...state, rollsUsed: 0, held: emptyHeldDice() };
}

type QwixxDiceSums = {
  /** White1 + white2: playable on any color row. */
  whiteSum: number;
  /** Colored die + each white die: playable on that color's row only. */
  coloredSums: Record<QwixxColor, number[]>;
};

export function diceCombinations(dice: QwixxDice): QwixxDiceSums {
  return {
    whiteSum: dice.white1 + dice.white2,
    coloredSums: {
      red: [dice.colored.red + dice.white1, dice.colored.red + dice.white2],
      yellow: [
        dice.colored.yellow + dice.white1,
        dice.colored.yellow + dice.white2,
      ],
      green: [
        dice.colored.green + dice.white1,
        dice.colored.green + dice.white2,
      ],
      blue: [dice.colored.blue + dice.white1, dice.colored.blue + dice.white2],
    },
  };
}

/** Values playable on each row for a given roll (white sum applies to every row). */
export function playableValues(
  sums: QwixxDiceSums,
): Record<QwixxColor, Set<number>> {
  const values: Record<QwixxColor, Set<number>> = {
    red: new Set([sums.whiteSum, ...sums.coloredSums.red]),
    yellow: new Set([sums.whiteSum, ...sums.coloredSums.yellow]),
    green: new Set([sums.whiteSum, ...sums.coloredSums.green]),
    blue: new Set([sums.whiteSum, ...sums.coloredSums.blue]),
  };
  return values;
}
