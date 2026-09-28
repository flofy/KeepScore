import { describe, expect, it } from "vitest";
import { nextPlayerRotation } from "./useGamePlayerView";

describe("nextPlayerRotation", () => {
  it("continues through every quarter turn without reversing at a full cycle", () => {
    expect(nextPlayerRotation(0)).toBe(90);
    expect(nextPlayerRotation(90)).toBe(180);
    expect(nextPlayerRotation(180)).toBe(270);
    expect(nextPlayerRotation(270)).toBe(360);
    expect(nextPlayerRotation(360)).toBe(450);
  });

  it("falls back to the first rotation for an unknown value", () => {
    expect(nextPlayerRotation(45)).toBe(0);
  });
});
