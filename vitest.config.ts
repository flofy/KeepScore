import { defineConfig } from "vitest/config";

/**
 * Vitest configuration.
 *
 * Excludes the Playwright E2E directory (e2e/) and build output (dist/)
 * from the unit-test run so that `npm test` only runs the fast unit tests.
 * Playwright E2E tests live in e2e/ and are executed separately via
 * `npx playwright test`.
 */
export default defineConfig({
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: [
      "node_modules",
      "dist",
      "e2e",
      "test-results",
      "playwright-report",
    ],
  },
});
