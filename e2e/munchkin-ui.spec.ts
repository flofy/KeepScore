import { expect, test, type Page } from "@playwright/test";

async function startGame(page: Page) {
  await page.goto("setup", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Start game" }).click();
  await expect(page.locator(".players")).toBeVisible();
}

async function startMunchkinGame(page: Page) {
  await page.goto("setup", { waitUntil: "networkidle" });
  await page.getByRole("radio", { name: /Munchkin/ }).click();
  await page.getByRole("button", { name: "Start game" }).click();
  await expect(page.locator(".munchkin-player-card")).toHaveCount(2);
}

test.describe("Munchkin player card", () => {
  test("toggles the character and confirms player removal", async ({
    page,
  }) => {
    await startMunchkinGame(page);

    const firstCard = page.locator(".munchkin-player-card").first();
    const genderToggle = firstCard.getByRole("button", {
      name: /Personnage homme/,
    });

    await expect(genderToggle).toHaveAttribute("aria-pressed", "false");
    await genderToggle.click();
    await expect(
      firstCard.getByRole("button", { name: /Personnage femme/ }),
    ).toHaveAttribute("aria-pressed", "true");

    page.once("dialog", async (dialog) => {
      expect(dialog.type()).toBe("confirm");
      expect(dialog.message()).toContain("Alice");
      await dialog.dismiss();
    });
    await firstCard.getByRole("button", { name: /Supprimer Alice/ }).click();

    await expect(page.locator(".munchkin-player-card")).toHaveCount(2);

    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    await firstCard.getByRole("button", { name: /Supprimer Alice/ }).click();

    await expect(page.locator(".munchkin-player-card")).toHaveCount(1);
    const nameInputs = page.getByLabel(/Nom du joueur/);
    await expect(nameInputs).toHaveCount(1);
    await expect(nameInputs).not.toHaveValue("Alice");
  });

  test("focuses number inputs when starting an edit", async ({ page }) => {
    await startGame(page);

    const firstCard = page.locator(".player-card").first();
    await firstCard.getByRole("button", { name: /Set score/ }).click();

    const scoreInput = firstCard.locator("input[type=number]");
    await expect(scoreInput).toBeFocused();

    await startMunchkinGame(page);
    const munchkinCard = page.locator(".munchkin-player-card").first();
    await munchkinCard
      .getByRole("button", { name: /Lancer un combat/ })
      .click();

    const monsterInput = page.locator(".munchkin-combat input[type=number]");
    await expect(monsterInput).toBeVisible();
    await expect(monsterInput).toBeFocused();
    await monsterInput.fill("7");
    await expect(monsterInput).toHaveValue("7");
  });
});
