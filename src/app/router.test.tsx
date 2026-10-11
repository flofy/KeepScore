import { describe, expect, it } from "vitest";
import { createAppRouteObjects } from "./router";

function createComponents() {
  return {
    home: <div>home</div>,
    setup: <div>setup</div>,
    chwatzi: <div>chwatzi</div>,
    quixscore: <div>quixscore</div>,
    game: <div>game</div>,
    saved: <div>saved</div>,
  };
}

describe("application router", () => {
  it("creates route objects from the application route contract", () => {
    const routeObjects = createAppRouteObjects(createComponents());

    expect(routeObjects.map((route) => route.path)).toEqual([
      "/",
      "/setup",
      "/chwatzi",
      "/quixscore",
      "/game",
      "/saved",
    ]);
  });
});
