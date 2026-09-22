import { beforeEach, describe, expect, it } from "vitest";
import {
  getFullscreenHeaderPreference,
  setFullscreenHeaderPreference,
} from "./fullscreenHeaderPreference";

describe("fullscreen header preference", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("keeps the header by default", () => {
    expect(getFullscreenHeaderPreference()).toBe(true);
  });

  it("persists a disabled preference", () => {
    setFullscreenHeaderPreference(false);

    expect(localStorage.getItem("keepscore-fullscreen-header")).toBe("0");
    expect(getFullscreenHeaderPreference()).toBe(false);
  });

  it("persists an enabled preference", () => {
    setFullscreenHeaderPreference(false);
    setFullscreenHeaderPreference(true);

    expect(localStorage.getItem("keepscore-fullscreen-header")).toBe("1");
    expect(getFullscreenHeaderPreference()).toBe(true);
  });

  it("treats unknown stored values as enabled", () => {
    localStorage.setItem("keepscore-fullscreen-header", "unexpected");

    expect(getFullscreenHeaderPreference()).toBe(true);
  });
});
