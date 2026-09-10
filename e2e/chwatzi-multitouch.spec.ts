import { expect, test } from "@playwright/test";

/**
 * E2E test for the Chwatzi multi-touch player selection screen.
 *
 * Playwright's mouse API models a single pointer, so we dispatch synthetic
 * PointerEvents with distinct `pointerId` values inside the page context.
 *
 * Challenge: synthetic PointerEvents are not "trusted" and there is no real
 * active pointer, so `Element.setPointerCapture()` throws. We shim those
 * methods via addInitScript (runs before page load) so `handlePointerDown`
 * in ChwatziScreenV2 can run without aborting on the second finger.
 *
 * Timeline in ChwatziScreenV2:
 *   1. Two fingers placed  → scheduleCountdown (3s settle)
 *   2. After 3s           → counting phase (3 → 2 → 1, 1s ticks)
 *   3. Countdown reaches 0 → picking phase: 1s setTimeout then result
 *   4. Water fill animation: 5s (WATER_FILL_MS)
 *   5. finish() → done phase + result dialog
 *
 * Total expected ~12s worst case. We assert on the water element during the
 * "wiping" phase (after settle + countdown + 1s pick delay ≈ 7s) and on the
 * result dialog at the end (~12s).
 *
 * Note: we use a relative path ("chwatzi") for page.goto so that Playwright
 * resolves it against the configured baseURL (http://localhost:5173/KeepScore/)
 * — a leading slash would strip the /KeepScore base prefix.
 */

test.describe("Chwatzi multi-touch selection", () => {
  test("shows the water-fill animation and result after two touches", async ({
    page,
  }) => {
    // Shim pointer-capture methods before the page loads. Synthetic
    // PointerEvents have no backing "active pointer", so the real
    // setPointerCapture throws and would abort the handler.
    await page.addInitScript(() => {
      Element.prototype.setPointerCapture = () => undefined;
      Element.prototype.releasePointerCapture = () => undefined;
      Element.prototype.hasPointerCapture = () => false;
    });

    await page.goto("chwatzi", { waitUntil: "networkidle" });

    // Wait for React to hydrate and the stage to be interactive.
    const stage = page.locator(".chwatzi-v2-stage");
    await expect(
      stage,
      "chwatzi stage should render after hydration",
    ).toBeVisible({ timeout: 15_000 });

    // Dispatch two simultaneous pointer-down events with different ids.
    // Computing the bounding box inside the page context avoids any
    // cross-context coercion that could produce non-finite coordinates.
    await page.evaluate(() => {
      const stageEl = document.querySelector(".chwatzi-v2-stage")!;
      const rect = stageEl.getBoundingClientRect();
      const points = [
        { pointerId: 1, x: rect.left + 120, y: rect.top + 200 },
        { pointerId: 2, x: rect.left + 320, y: rect.top + 400 },
      ];
      for (const p of points) {
        stageEl.dispatchEvent(
          new PointerEvent("pointerdown", {
            pointerId: p.pointerId,
            clientX: p.x,
            clientY: p.y,
            button: 0,
            bubbles: true,
            cancelable: true,
            isPrimary: p.pointerId === 1,
            pointerType: "touch",
          }),
        );
      }
    });

    // Phase should transition to "counting" after the settle timer (3000ms).
    await expect(page.locator(".chwatzi-v2-countdown")).toBeVisible({
      timeout: 6_000,
    });

    // The countdown starts at 3 and ticks every 1s. After ~3s more the
    // picking phase begins (1s), then the water-fill animation renders.
    // Total wait before "wiping": 3s (settle) + 3s (countdown) + 1s (pick).
    await expect(page.locator(".chwatzi-v2-water")).toBeVisible({
      timeout: 9_000,
    });

    // The water animation runs for 5s (WATER_FILL_MS), then finish() shows
    // the result dialog. Allow generous time for the full sequence.
    await expect(page.locator(".chwatzi-v2-result")).toBeVisible({
      timeout: 9_000,
    });

    // The result card should show the selected player color dot.
    const resultColor = page.locator(".chwatzi-v2-result-color");
    await expect(resultColor).toBeVisible();
  });
});
