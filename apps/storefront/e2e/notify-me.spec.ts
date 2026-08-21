import { expect, test } from "@playwright/test";

test.describe("Restock notify", () => {
  test("submitting the Notify Me form shows success feedback", async ({
    page,
  }) => {
    await page.goto("/us/albums/fleetwood-mac-rumours");

    // Condition labels overlap ("VG" is a substring of "VG+") -- exact:
    // true avoids matching the wrong button, same as every prior spec.
    await page
      .locator("main")
      .getByRole("button", { name: "VG+", exact: true })
      .click();

    await page
      .locator("main")
      .getByRole("button", { name: "Notify Me" })
      .click();

    // The page also has an unrelated "Grading Guide" <dialog> (footer
    // link) -- aria-labelledby stays "notify-me-title" across both the
    // form and success states (only the referenced heading's text
    // changes), so it's a stable scope for the whole flow.
    const dialog = page.locator('dialog[aria-labelledby="notify-me-title"]');
    await expect(dialog).toBeVisible();

    await dialog
      .getByLabel("Email")
      .fill("e2e-notify@vinylcut.test");
    await dialog.getByRole("button", { name: "Notify Me" }).click();

    // subscribeToRestock is an async server action (real network round
    // trip) -- assert with auto-retrying expectations, not an immediate
    // read, same lesson as every prior spec.
    await expect(
      page.getByRole("heading", { name: "You're on the list" }),
    ).toBeVisible({ timeout: 15000 });
    await expect(dialog.locator(".alert-success")).toContainText(
      'We\'ll email you the moment Fleetwood Mac — "Rumours" (VG+) is back in stock.',
    );

    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).not.toBeVisible();
  });
});
