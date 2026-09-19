import { describe, expect, it } from "vitest";
import { nextPlayerRotation } from "./useGamePlayerView";

describe("nextPlayerRotation", () => {
  it("cycles through every quarter turn", () => {
    expect(nextPlayerRotation(0)).toBe(90);
    expect(nextPlayerRotation(90)).toBe(180);
    expect(nextPlayerRotation(180)).toBe(270);
    expect(nextPlayerRotation(270)).toBe(0);
  });

  it("falls back to the first rotation for an unknown value", () => {
    expect(nextPlayerRotation(45)).toBe(0);
  });
});
