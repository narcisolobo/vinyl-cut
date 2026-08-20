import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * Condition labels overlap ("VG" is a substring of "VG+"), and Playwright's
 * `getByRole(..., { name })` matching is substring-based by default -- see
 * album-detail.spec.ts. Every variant-button lookup must pass `exact: true`.
 */
function variantButton(scope: Locator | Page, condition: string): Locator {
  return scope.getByRole("button", { name: condition, exact: true });
}

test.describe("Cart", () => {
  test("adding an item shows it in the cart dropdown with correct subtotal and quantity", async ({
    page,
  }) => {
    await page.goto("/us/albums/joni-mitchell-blue");
    await expect(page.locator("main").getByText("$6.50")).toBeVisible();

    await page
      .locator("main")
      .getByRole("button", { name: "Add to Cart" })
      .click();

    // addToCart revalidates via updateTag("cart"), not instant client
    // state -- assert with auto-retrying expectations, not an immediate
    // read (same lesson as store.spec.ts / album-detail.spec.ts).
    await expect(page.getByTestId("product-link")).toHaveText("Blue");
    await expect(page.getByTestId("cart-item-quantity")).toHaveText(
      "Quantity: 1",
    );
    await expect(page.getByTestId("cart-subtotal")).toContainText("$6.50");
  });

  test("updating quantity on the cart page recalculates the subtotal", async ({
    page,
  }) => {
    await page.goto("/us/albums/joni-mitchell-blue");
    await variantButton(page.locator("main"), "VG").click();
    await expect(page.locator("main").getByText("$10.25")).toBeVisible();
    await page
      .locator("main")
      .getByRole("button", { name: "Add to Cart" })
      .click();

    // Wait for the add to actually land (async server action) before
    // navigating away -- otherwise the goto below can race ahead of the
    // cart cookie being set, landing on a still-empty cart.
    await expect(page.getByTestId("cart-subtotal")).toContainText("$10.25");

    // Hard navigation -- resets the header dropdown's transient isOpen
    // client state, so it starts closed here regardless of the PDP's
    // auto-open.
    await page.goto("/us/cart");
    const table = page.getByRole("table");
    const quantity = table.getByRole("group", { name: "Quantity" }).locator("span");
    const subtotal = page.getByTestId("cart-summary-subtotal");

    await expect(subtotal).toHaveText("$10.25");
    await expect(quantity).toHaveText("1");

    await table
      .getByRole("button", { name: "Increase quantity of Blue" })
      .click();
    await expect(quantity).toHaveText("2");
    await expect(subtotal).toHaveText("$20.50");

    await table
      .getByRole("button", { name: "Decrease quantity of Blue" })
      .click();
    await expect(quantity).toHaveText("1");
    await expect(subtotal).toHaveText("$10.25");
  });

  test("removing an item shows the empty-cart state", async ({ page }) => {
    await page.goto("/us/albums/joni-mitchell-blue");
    await page
      .locator("main")
      .getByRole("button", { name: "Add to Cart" })
      .click();

    // Wait for the add to actually land before navigating away -- see the
    // matching comment in the quantity-update test above.
    await expect(page.getByTestId("cart-subtotal")).toContainText("$6.50");

    await page.goto("/us/cart");

    // Table-scoped so this can't collide with the header dropdown's own
    // "Remove" button, even though that dropdown is expected closed here
    // (CartButton.tsx skips auto-open while already on a /cart pathname).
    await page
      .getByRole("table")
      .getByRole("button", { name: "Remove" })
      .click();

    const emptyState = page.getByTestId("cart-page-empty");
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText("Your cart is empty.");
  });
});
