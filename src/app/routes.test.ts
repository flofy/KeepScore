import { describe, expect, it } from "vitest";
import { routes } from "./routes";

describe("application routes", () => {
  it("builds static routes", () => {
    expect(routes.home()).toBe("/");
    expect(routes.setup()).toBe("/setup");
    expect(routes.saved()).toBe("/saved");
  });

  it("builds Chwatzi route with player count", () => {
    expect(routes.chwatzi(4)).toBe("/chwatzi?players=4");
  });

  it("encodes game ids safely", () => {
    expect(routes.game("game/42?draft=true")).toBe(
      "/game?gameId=game%2F42%3Fdraft%3Dtrue",
    );
  });
});
