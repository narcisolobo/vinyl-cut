import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * Condition labels overlap ("VG" is a substring of "VG+", "M" of "NM"), and
 * Playwright's `getByRole(..., { name })` matching is substring-based by
 * default -- every variant-button lookup here must pass `exact: true` or it
 * can resolve to the wrong button.
 */
function variantButton(scope: Locator | Page, condition: string): Locator {
  return scope.getByRole("button", { name: condition, exact: true });
}

function cardPrice(card: Locator): Locator {
  return card.locator("p").filter({ hasText: /^\$/ });
}

test.describe("Inline condition selector & PDP", () => {
  test("PLP inline condition selector updates price with no navigation", async ({
    page,
  }) => {
    await page.goto("/us/store");

    const card = page
      .getByTestId("album-card")
      .filter({ has: page.locator(".join button:nth-of-type(2)") })
      .first();
    await expect(card).toBeVisible();

    const priceBefore = await cardPrice(card).textContent();
    const urlBefore = page.url();

    // nth-of-type(2) isn't guaranteed to be *unselected* -- the default
    // variant is chosen by lowest price, not DOM position, so pick a
    // button that's explicitly not the current selection.
    const unselectedVariant = card
      .locator('.join button[aria-pressed="false"]')
      .first();
    const otherCondition = (await unselectedVariant.textContent())!.trim();
    await variantButton(card, otherCondition).click();

    await expect(cardPrice(card)).not.toHaveText(priceBefore!);
    expect(page.url()).toBe(urlBefore);
    await expect(card).toBeVisible();
  });

  test("PDP renders gallery, metadata, and variant selector", async ({
    page,
  }) => {
    await page.goto("/us/albums/fleetwood-mac-rumours");
    const main = page.locator("main");

    await expect(
      page.getByAltText("Fleetwood Mac — Rumours cover art"),
    ).toBeVisible();
    await expect(
      page.getByAltText("Fleetwood Mac - Rumours front cover"),
    ).toBeVisible();
    await expect(
      page.getByAltText("Fleetwood Mac - Rumours back cover"),
    ).toBeVisible();

    await expect(page.getByRole("heading", { name: "Rumours" })).toBeVisible();
    await expect(main.getByText("Fleetwood Mac", { exact: true })).toBeVisible();
    await expect(main.getByText("Rock", { exact: true })).toBeVisible();
    await expect(main.getByText("1970s", { exact: true })).toBeVisible();

    await expect(variantButton(main, "G")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(variantButton(main, "VG+")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await expect(variantButton(main, "VG")).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await expect(main.getByText("$5.25")).toBeVisible();
    await expect(
      main.getByRole("button", { name: "Add to Cart" }),
    ).toBeEnabled();
  });

  test("switching variant on the PDP updates price and stock state", async ({
    page,
  }) => {
    await page.goto("/us/albums/fleetwood-mac-rumours");
    const main = page.locator("main");

    await variantButton(main, "VG+").click();
    await expect(main.getByText("$11.50")).toBeVisible();
    await expect(variantButton(main, "VG+")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(
      main.getByRole("button", { name: "Notify Me" }),
    ).toBeVisible();
    await expect(
      main.getByRole("button", { name: "Add to Cart" }),
    ).toHaveCount(0);

    await variantButton(main, "VG").click();
    await expect(main.getByText("$8.75")).toBeVisible();
    await expect(variantButton(main, "VG")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(
      main.getByRole("button", { name: "Add to Cart" }),
    ).toBeVisible();
    await expect(
      main.getByRole("button", { name: "Notify Me" }),
    ).toHaveCount(0);
  });

  test("add to cart from the PDP", async ({ page }) => {
    await page.goto("/us/albums/fleetwood-mac-rumours");
    const main = page.locator("main");

    await variantButton(main, "VG").click();
    await expect(main.getByText("$8.75")).toBeVisible();
    await main.getByRole("button", { name: "Add to Cart" }).click();

    // addToCart is a server action revalidated via updateTag("cart"), not
    // instant client state -- assert with auto-retrying expectations
    // rather than an immediate read.
    await expect(page.getByTestId("product-link")).toHaveText("Rumours");
    await expect(page.getByTestId("cart-item-quantity")).toHaveText(
      "Quantity: 1",
    );
    await expect(page.getByTestId("cart-subtotal")).toContainText("$8.75");
  });
});
