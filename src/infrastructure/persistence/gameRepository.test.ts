import { beforeEach, describe, expect, it } from "vitest";
import type { Game } from "../../domain/game/types";
import { localGameRepository } from "./gameRepository";

const game = (id: string, updatedAt: number, name?: string): Game => ({
  id,
  name,
  players: [],
  history: [],
  createdAt: updatedAt,
  updatedAt,
});

describe("localGameRepository", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns an empty list when storage is empty", () => {
    expect(localGameRepository.list()).toEqual([]);
    expect(localGameRepository.get("missing")).toBeUndefined();
  });

  it("saves, finds and lists games sorted by updatedAt (newest first)", () => {
    const old = game("old", 100, "Old");
    const recent = game("recent", 200, "Recent");

    localGameRepository.save(old);
    localGameRepository.save(recent);

    expect(localGameRepository.list().map((g) => g.id)).toEqual([
      "recent",
      "old",
    ]);
    expect(localGameRepository.get("old")?.name).toBe("Old");
  });

  it("overwrites a game with the same id instead of duplicating it", () => {
    localGameRepository.save(game("a", 100, "First"));
    localGameRepository.save(game("a", 300, "Updated"));

    const games = localGameRepository.list();
    expect(games).toHaveLength(1);
    expect(games[0].name).toBe("Updated");
    expect(games[0].updatedAt).toBe(300);
  });

  it("removes a game and ignores corrupted storage content", () => {
    localGameRepository.save(game("a", 100));
    localGameRepository.remove("a");
    expect(localGameRepository.list()).toEqual([]);

    localStorage.setItem("keepscore.games.v1", "{not-json");
    expect(localGameRepository.list()).toEqual([]);
  });
});
