import { describe, expect, it } from "vitest";
import { findPreset, GAME_PRESETS } from "./presets";

describe("game presets", () => {
  it("defines a history grouping default for every preset", () => {
    expect(GAME_PRESETS.every((preset) =>
      ["round", "player"].includes(preset.defaultHistoryGrouping),
    )).toBe(true);
  });

  it("uses player grouping for Munchkin", () => {
    expect(findPreset("munchkin")?.defaultHistoryGrouping).toBe("player");
  });

  it("falls back to the round grouping for the default preset", () => {
    expect(findPreset("default")?.defaultHistoryGrouping).toBe("round");
  });
});
