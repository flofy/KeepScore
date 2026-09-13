import { describe, expect, it } from "vitest";

import { useFullscreen } from "./useFullscreen";

describe("useFullscreen", () => {
  it("exports the fullscreen controller", () => {
    expect(useFullscreen).toBeTypeOf("function");
  });
});
