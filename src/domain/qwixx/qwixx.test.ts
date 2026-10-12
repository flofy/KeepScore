import { describe, expect, it } from "vitest";
import {
  MAX_PENALTIES,
  MAX_ROLLS_PER_TURN,
  MIN_MARKS_TO_LOCK,
  PENALTY_SCORE,
  QWIXX_COLORS,
  ROWS_LOCKED_ENDING_GAME,
  applyMark,
  applyPenalty,
  canAddPenalty,
  canMark,
  createQwixxState,
  deriveQwixx,
  diceCombinations,
  emptyHeldDice,
  playableValues,
  rankedScores,
  rerollDice,
  resetDiceTurn,
  rollQwixxDice,
  rowScore,
  sheetScore,
  startDiceTurn,
  toggleHeldDie,
  undoLastAction,
  type QwixxAction,
  type QwixxColor,
  type QwixxDerived,
  type QwixxDice,
  type QwixxSheet,
  type QwixxState,
} from "./qwixx";

function sheetOf(
  derived: QwixxDerived,
  state: QwixxState,
  index = 0,
): QwixxSheet {
  const sheet = derived.sheets[state.players[index].id];
  if (!sheet) throw new Error("missing sheet");
  return sheet;
}

function markSequence(
  state: QwixxState,
  playerId: string,
  color: QwixxColor,
  values: number[],
): QwixxState {
  let current = state;
  for (const value of values) {
    const next = applyMark(current, playerId, color, value);
    if (!next) throw new Error(`invalid mark ${value}`);
    current = next;
  }
  return current;
}

describe("QuixScore state", () => {
  it("creates players with fallback names and rejects empty rosters", () => {
    const state = createQwixxState(["Alice", "  "]);
    expect(state.players[0].name).toBe("Alice");
    expect(state.players[1].name).toBe("Player 2");
    expect(state.actions).toEqual([]);
    expect(() => createQwixxState([])).toThrow();
  });

  it("allows a first cross anywhere and enforces left-to-right order", () => {
    const state = createQwixxState(["Alice"]);
    const playerId = state.players[0].id;
    const derived = deriveQwixx(state);

    expect(canMark(derived, playerId, "red", 5)).toBe(true);
    expect(canMark(derived, playerId, "green", 7)).toBe(true);

    const marked = markSequence(state, playerId, "red", [9]);
    expect(applyMark(marked, playerId, "red", 11)).toBeNull();
    expect(applyMark(marked, playerId, "red", 9)).toBeNull();
    expect(applyMark(marked, playerId, "red", 4)).not.toBeNull();
  });

  it("rejects values outside the row", () => {
    const state = createQwixxState(["Alice"]);
    const playerId = state.players[0].id;
    expect(applyMark(state, playerId, "red", 1)).toBeNull();
    expect(applyMark(state, playerId, "red", 13)).toBeNull();
    expect(applyMark(state, playerId, "green", 1)).toBeNull();
  });

  it("requires five crosses before the last number of a row", () => {
    const state = createQwixxState(["Alice"]);
    const playerId = state.players[0].id;

    const prepared = markSequence(state, playerId, "red", [12, 11, 10, 9]);
    expect(canMark(deriveQwixx(prepared), playerId, "red", 2)).toBe(false);

    const withFive = markSequence(prepared, playerId, "red", [8]);
    const sheet = sheetOf(deriveQwixx(withFive), withFive);
    expect(sheet.marks.red).toHaveLength(MIN_MARKS_TO_LOCK);
    expect(canMark(deriveQwixx(withFive), playerId, "red", 2)).toBe(true);

    const locked = markSequence(withFive, playerId, "red", [2]);
    expect(deriveQwixx(locked).lockedRows.red).toBe(true);
  });

  it("locks a row for every player once someone crosses its last number", () => {
    const state = createQwixxState(["Alice", "Bob"]);
    const [aliceId, bobId] = state.players.map((player) => player.id);

    const locked = markSequence(state, aliceId, "green", [2, 3, 4, 5, 6, 12]);
    const derived = deriveQwixx(locked);
    expect(derived.lockedRows.green).toBe(true);
    expect(canMark(derived, bobId, "green", 7)).toBe(false);
    expect(applyMark(locked, bobId, "green", 7)).toBeNull();
  });

  it("ends the game once two rows are locked", () => {
    const state = createQwixxState(["Alice"]);
    const playerId = state.players[0].id;

    const firstLocked = markSequence(state, playerId, "red", [
      12, 11, 10, 9, 8, 2,
    ]);
    expect(deriveQwixx(firstLocked).finished).toBe(false);

    const secondLocked = markSequence(firstLocked, playerId, "blue", [
      2, 3, 4, 5, 6, 12,
    ]);
    const derived = deriveQwixx(secondLocked);
    expect(
      QWIXX_COLORS.filter((color) => derived.lockedRows[color]).length,
    ).toBe(ROWS_LOCKED_ENDING_GAME);
    expect(derived.finished).toBe(true);
    expect(canMark(derived, playerId, "yellow", 7)).toBe(false);
  });

  it("ends the game when a player reaches four penalties", () => {
    let state: QwixxState = createQwixxState(["Alice"]);
    const playerId = state.players[0].id;

    for (let index = 0; index < MAX_PENALTIES; index += 1) {
      state = applyPenalty(state, playerId) ?? state;
    }

    const derived = deriveQwixx(state);
    expect(sheetOf(derived, state).penalties).toBe(MAX_PENALTIES);
    expect(derived.finished).toBe(true);
    expect(canAddPenalty(derived, playerId)).toBe(false);
    expect(applyPenalty(state, playerId)).toBeNull();
  });

  it("scores rows with the Qwixx progression and penalties at -5", () => {
    const state = createQwixxState(["Alice"]);
    const playerId = state.players[0].id;

    const marked = markSequence(state, playerId, "green", [2, 3, 4]);
    let derived = deriveQwixx(marked);
    let sheet = sheetOf(derived, marked);
    expect(rowScore(sheet, "green")).toBe(6);
    expect(sheetScore(sheet)).toBe(6);

    const penalized = applyPenalty(marked, playerId) ?? marked;
    derived = deriveQwixx(penalized);
    sheet = sheetOf(derived, penalized);
    expect(sheetScore(sheet)).toBe(6 + PENALTY_SCORE);

    expect(sheetScore(sheetOf(deriveQwixx(state), state))).toBe(0);
  });

  it("undoes the last action and restores the derived state", () => {
    const state = createQwixxState(["Alice"]);
    const playerId = state.players[0].id;

    const marked = markSequence(state, playerId, "red", [12]);
    const penalized = applyPenalty(marked, playerId) ?? marked;
    expect(penalized.actions).toHaveLength(2);

    const undonePenalty = undoLastAction(penalized);
    expect(
      sheetOf(deriveQwixx(undonePenalty), undonePenalty).penalties,
    ).toBe(0);

    const undoneMark = undoLastAction(undonePenalty);
    const sheet = sheetOf(deriveQwixx(undoneMark), undoneMark);
    expect(sheet.marks.red).toEqual([]);
    expect(undoLastAction(undoneMark)).toBe(undoneMark);
  });

  it("ranks players by descending total score", () => {
    const state = createQwixxState(["Alice", "Bob"]);
    const [aliceId, bobId] = state.players.map((player) => player.id);

    const played = markSequence(state, aliceId, "red", [12, 11]);
    const ranking = rankedScores(
      played,
      deriveQwixx(played),
    );
    expect(ranking[0].player.id).toBe(aliceId);
    expect(ranking[0].score).toBe(3);
    expect(ranking[1].player.id).toBe(bobId);
    expect(ranking[1].score).toBe(0);
  });

  it("ignores actions from unknown players when deriving sheets", () => {
    const state = createQwixxState(["Alice"]);
    const ghostAction: QwixxAction = {
      type: "mark",
      playerId: "ghost",
      color: "red",
      value: 12,
    };
    const haunted: QwixxState = { ...state, actions: [ghostAction] };
    expect(deriveQwixx(haunted).sheets["ghost"]).toBeUndefined();
    expect(applyMark(state, "ghost", "red", 12)).toBeNull();
  });

  it("rolls six-sided dice in a deterministic order with the injected rng", () => {
    const rolls = [0.1, 0.5, 0.99, 0, 0.5, 0.84];
    let index = 0;
    const dice = rollQwixxDice(() => rolls[index++]);
    expect(dice).toEqual({
      white1: 1,
      white2: 4,
      colored: { red: 6, yellow: 1, green: 4, blue: 6 },
    });
  });

  it("computes the playable sums from a roll", () => {
    const dice: QwixxDice = {
      white1: 2,
      white2: 5,
      colored: { red: 3, yellow: 6, green: 1, blue: 4 },
    };
    const sums = diceCombinations(dice);
    expect(sums.whiteSum).toBe(7);
    expect(sums.coloredSums.red).toEqual([5, 8]);
    expect(sums.coloredSums.yellow).toEqual([8, 11]);
    expect(sums.coloredSums.green).toEqual([3, 6]);
    expect(sums.coloredSums.blue).toEqual([6, 9]);
  });

  it("maps a roll to the playable values of each row", () => {
    const dice: QwixxDice = {
      white1: 2,
      white2: 5,
      colored: { red: 3, yellow: 6, green: 1, blue: 4 },
    };
    const values = playableValues(diceCombinations(dice));
    expect(values.red).toEqual(new Set([7, 5, 8]));
    expect(values.green).toEqual(new Set([7, 3, 6]));
    expect(values.blue).toEqual(new Set([7, 6, 9]));
  });
});

describe("QuixScore dice turns (keep/reroll variant)", () => {
  it("starts a turn with a full roll and clears the held selection", () => {
    const state: QwixxState = {
      ...createQwixxState(["Alice"]),
      rollsUsed: 0,
      held: { ...emptyHeldDice(), white1: true },
    };
    const rolls = [0.1, 0.5, 0.99, 0, 0.5, 0.84];
    let index = 0;
    const turned = startDiceTurn(state, () => rolls[index++]);

    expect(turned.lastRoll).toEqual({
      white1: 1,
      white2: 4,
      colored: { red: 6, yellow: 1, green: 4, blue: 6 },
    });
    expect(turned.rollsUsed).toBe(1);
    expect(turned.held).toEqual(emptyHeldDice());
  });

  it("rerolls only the dice that are not held", () => {
    const base: QwixxState = {
      ...createQwixxState(["Alice"]),
      lastRoll: {
        white1: 2,
        white2: 5,
        colored: { red: 3, yellow: 6, green: 1, blue: 4 },
      },
      rollsUsed: 1,
      held: {
        white1: true,
        white2: false,
        colored: { red: false, yellow: true, green: false, blue: false },
      },
    };
    const rolls = [0.1, 0.5, 0.99, 0, 0.5, 0.84];
    let index = 0;
    const rerolled = rerollDice(base, () => rolls[index++]);

    expect(rerolled?.rollsUsed).toBe(2);
    expect(rerolled?.lastRoll).toEqual({
      white1: 2,
      white2: 4,
      colored: { red: 6, yellow: 6, green: 4, blue: 6 },
    });
  });

  it("refuses to reroll without a roll or once the turn is exhausted", () => {
    const state = createQwixxState(["Alice"]);
    expect(rerollDice(state, () => 0.5)).toBeNull();

    const exhausted: QwixxState = {
      ...state,
      lastRoll: {
        white1: 1,
        white2: 1,
        colored: { red: 1, yellow: 1, green: 1, blue: 1 },
      },
      rollsUsed: MAX_ROLLS_PER_TURN,
    };
    expect(rerollDice(exhausted, () => 0.5)).toBeNull();
  });

  it("toggles held dice only in the middle of a turn", () => {
    const base: QwixxState = {
      ...createQwixxState(["Alice"]),
      lastRoll: {
        white1: 1,
        white2: 1,
        colored: { red: 1, yellow: 1, green: 1, blue: 1 },
      },
      rollsUsed: 1,
    };

    const heldWhite = toggleHeldDie(base, "white1");
    expect(heldWhite.held?.white1).toBe(true);
    const heldRed = toggleHeldDie(heldWhite, "red");
    expect(heldRed.held?.colored.red).toBe(true);
    expect(heldRed.held?.white1).toBe(true);

    const beforeRoll = toggleHeldDie({ ...base, rollsUsed: 0 }, "white1");
    expect(beforeRoll.held).toBeUndefined();
    const exhausted = toggleHeldDie(
      { ...base, rollsUsed: MAX_ROLLS_PER_TURN },
      "white1",
    );
    expect(exhausted.held).toBeUndefined();
  });

  it("resets the turn counter and the held dice", () => {
    const base: QwixxState = {
      ...createQwixxState(["Alice"]),
      lastRoll: {
        white1: 1,
        white2: 1,
        colored: { red: 1, yellow: 1, green: 1, blue: 1 },
      },
      rollsUsed: 2,
      held: {
        white1: true,
        white2: false,
        colored: { red: false, yellow: false, green: false, blue: false },
      },
    };
    const reset = resetDiceTurn(base);
    expect(reset.rollsUsed).toBe(0);
    expect(reset.held).toEqual(emptyHeldDice());
    expect(reset.lastRoll).toBe(base.lastRoll);
  });
});
