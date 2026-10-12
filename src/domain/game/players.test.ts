import { describe, expect, it } from "vitest";
import { DEFAULT_PLAYER_NAMES, defaultPlayerName } from "./players";

describe("default player names", () => {
  it("prefills new game setups with stable placeholder names", () => {
    expect(DEFAULT_PLAYER_NAMES).toEqual(["Alice", "Bob"]);
  });

  it("labels added player slots with a 1-based number", () => {
    expect(defaultPlayerName(0)).toBe("Player 1");
    expect(defaultPlayerName(4)).toBe("Player 5");
  });
});
