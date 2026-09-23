import { describe, expect, it } from "vitest";
import { getPlayerTileOrientation } from "./player-tile";

describe("getPlayerTileOrientation", () => {
  it("keeps 0° and 180° horizontal", () => {
    expect(getPlayerTileOrientation(0)).toBe("horizontal");
    expect(getPlayerTileOrientation(180)).toBe("horizontal");
  });

  it("uses vertical for 90° and 270°", () => {
    expect(getPlayerTileOrientation(90)).toBe("vertical");
    expect(getPlayerTileOrientation(270)).toBe("vertical");
  });

  it("handles negative and normalized rotations", () => {
    expect(getPlayerTileOrientation(-90)).toBe("vertical");
    expect(getPlayerTileOrientation(450)).toBe("vertical");
    expect(getPlayerTileOrientation(360)).toBe("horizontal");
  });
});
