import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration for KeepScore.
 *
 * The app is served by Vite's dev server during tests. Because GitHub Pages
 * serves the app from `/KeepScore/` (see `base` in vite.config.ts), the
 * `baseURL` reflects that path so route URLs resolve correctly.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173/KeepScore/",
    trace: "on-first-attempt",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev -- --strictPort --port 5173",
    url: "http://localhost:5173/KeepScore/",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
