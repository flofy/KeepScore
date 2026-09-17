import { describe, expect, it } from "vitest";
import type { ScoreEntry } from "../domain/game/types";
import { groupHistory } from "./historyGrouping";

const entry = (id: string, playerId: string, delta: number): ScoreEntry => ({
  id,
  playerId,
  delta,
  timestamp: Number(id),
});

describe("groupHistory", () => {
  it("groups entries by player while preserving chronological order", () => {
    const history = [
      entry("1", "alice", 2),
      entry("2", "bob", 5),
      entry("3", "alice", -1),
    ];

    expect(groupHistory(history, "player")).toEqual([
      {
        key: "alice",
        round: 0,
        entries: [history[0], history[2]],
      },
      {
        key: "bob",
        round: 0,
        entries: [history[1]],
      },
    ]);
  });

  it("groups the first score of each player into round one", () => {
    const history = [
      entry("1", "alice", 2),
      entry("2", "bob", 5),
      entry("3", "alice", -1),
      entry("4", "bob", 3),
    ];

    expect(groupHistory(history, "round")).toEqual([
      {
        key: "round-1",
        round: 1,
        entries: [history[0], history[1]],
      },
      {
        key: "round-2",
        round: 2,
        entries: [history[2], history[3]],
      },
    ]);
  });

  it("keeps uneven rounds when a player has not scored yet", () => {
    const history = [entry("1", "alice", 2), entry("2", "alice", 3)];

    expect(groupHistory(history, "round")).toEqual([
      {
        key: "round-1",
        round: 1,
        entries: [history[0]],
      },
      {
        key: "round-2",
        round: 2,
        entries: [history[1]],
      },
    ]);
  });
});
