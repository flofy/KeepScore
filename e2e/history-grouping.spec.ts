import { expect, test, type Page } from "@playwright/test";

async function startGame(page: Page) {
  await page.goto("setup", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Start game" }).click();
  await expect(page.locator(".players")).toBeVisible();
}

async function openHistory(page: Page) {
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "History" }).click();
  await expect(page.getByRole("dialog", { name: "History" })).toBeVisible();
}

test.describe("history grouping", () => {
  test("switches grouping and preserves the matching history entries", async ({
    page,
  }) => {
    await startGame(page);

    const playerCards = page.locator(".player-card");
    await playerCards
      .nth(0)
      .getByRole("button", { name: /Add one point to/ })
      .click();
    await playerCards
      .nth(1)
      .getByRole("button", { name: /Add one point to/ })
      .click();

    await openHistory(page);

    const dialog = page.getByRole("dialog", { name: "History" });
    const roundButton = dialog.getByRole("button", { name: "By round" });
    const playerButton = dialog.getByRole("button", { name: "By player" });

    await expect(roundButton).toHaveAttribute("aria-pressed", "true");
    await expect(playerButton).toHaveAttribute("aria-pressed", "false");
    await expect(
      dialog.getByRole("heading", { name: "Round 1" }),
    ).toBeVisible();
    await expect(dialog.locator(".history-group")).toHaveCount(1);

    await playerButton.click();

    await expect(roundButton).toHaveAttribute("aria-pressed", "false");
    await expect(playerButton).toHaveAttribute("aria-pressed", "true");
    await expect(dialog.locator(".history-group")).toHaveCount(2);
    await expect(dialog.getByRole("heading", { name: "Alice" })).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Bob" })).toBeVisible();
    await expect(dialog.getByText("+1")).toHaveCount(2);
  });

  test("edits and deletes entries while grouped by player", async ({
    page,
  }) => {
    await startGame(page);

    const playerCards = page.locator(".player-card");
    await playerCards
      .nth(0)
      .getByRole("button", { name: /Add one point to/ })
      .click();
    await playerCards
      .nth(1)
      .getByRole("button", { name: /Add one point to/ })
      .click();

    await openHistory(page);

    const dialog = page.getByRole("dialog", { name: "History" });
    await dialog.getByRole("button", { name: "By player" }).click();

    const aliceGroup = dialog
      .locator(".history-group")
      .filter({ has: page.getByRole("heading", { name: "Alice" }) });
    await expect(aliceGroup).toHaveCount(1);
    await aliceGroup.getByRole("button", { name: "Edit" }).click();

    const editor = aliceGroup.locator(".history-editor");
    const input = editor.getByRole("spinbutton", { name: "New score delta" });
    await input.fill("3");
    await editor.getByRole("button", { name: "Save" }).click();

    await expect(aliceGroup.getByText("+3")).toBeVisible();
    await expect(dialog.locator(".history-group")).toHaveCount(2);

    await aliceGroup.getByRole("button", { name: "Remove this entry" }).click();

    await expect(dialog.locator(".history-group")).toHaveCount(1);
    await expect(dialog.getByRole("heading", { name: "Bob" })).toBeVisible();
    await expect(dialog.getByText("+3")).toHaveCount(0);
  });

  test("shows the empty history state", async ({ page }) => {
    await startGame(page);
    await openHistory(page);

    await expect(
      page.getByRole("dialog", { name: "History" }).getByText("No moves yet."),
    ).toBeVisible();
  });
});
