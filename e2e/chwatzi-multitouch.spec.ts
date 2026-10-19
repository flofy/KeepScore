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
 *   1. Two fingers placed → a 2s circular hold-progress animation
 *   2. Progress completes → a short confirmation pulse and water-fill animation
 *   3. Water fill animation: 5s (WATER_FILL_MS)
 *   4. finish() → done phase + result dialog
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

    // The two fingers should show the circular hold-progress indicator.
    await expect(
      page.locator(".chwatzi-v2-finger--settling .chwatzi-v2-finger-ring"),
    ).toHaveCount(2);

    // There is no numeric countdown; the water-fill starts after the
    // two-second ring completes.
    await expect(page.locator(".chwatzi-v2-countdown")).toHaveCount(0);
    await expect(page.locator(".chwatzi-v2-water")).toBeVisible({
      timeout: 5_000,
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
