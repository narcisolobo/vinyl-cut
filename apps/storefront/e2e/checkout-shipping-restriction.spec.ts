import { expect, test, type Page } from "@playwright/test";

const WESTERN_US_STATES = ["ca", "or", "wa", "nv", "az", "co", "ut", "nm"];

async function addFixtureToCart(page: Page): Promise<void> {
  await page.goto("/us/albums/joni-mitchell-blue");
  await page
    .locator("main")
    .getByRole("button", { name: "Add to Cart" })
    .click();

  // Wait for the add to actually land (async server action) before
  // navigating away -- same race-avoidance lesson from cart.spec.ts.
  await expect(page.getByTestId("cart-subtotal")).toContainText("$6.50");
}

async function fillAddressStep(
  page: Page,
  province: string,
  email: string,
): Promise<void> {
  await page.getByLabel("First name").fill("Test");
  await page.getByLabel("Last name").fill("Shopper");
  // Required fields append a "*" to the label's accessible name, and
  // "Address" alone is also a substring of the "Billing address same as
  // shipping" checkbox label -- anchor the regex to avoid both pitfalls.
  // See checkout.spec.ts for the same gotcha.
  await page.getByLabel(/^Address\*?$/).fill("123 Vinyl Way");
  await page.getByLabel("Postal code").fill("94103");
  await page.getByLabel("City").fill("San Francisco");
  await page
    .locator('select[name="shipping_address.province"]')
    .selectOption(province);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Continue to delivery" }).click();
}

test.describe("Shipping region restriction", () => {
  test("the province select only offers in-region states", async ({
    page,
  }) => {
    await addFixtureToCart(page);
    await page.goto("/us/checkout");

    const optionValues = await page
      .locator('select[name="shipping_address.province"] option')
      .evaluateAll((options) =>
        options
          .map((option) => (option as HTMLOptionElement).value)
          .filter(Boolean),
      );

    expect(new Set(optionValues)).toEqual(new Set(WESTERN_US_STATES));
  });

  test("an in-region address shows the flat-rate shipping option", async ({
    page,
  }) => {
    await addFixtureToCart(page);
    await page.goto("/us/checkout");

    // A different in-region state than checkout.spec.ts (which uses "ca"),
    // for a little extra coverage across the 8 states.
    await fillAddressStep(page, "or", "e2e-shipping-region@vinylcut.test");

    // ShippingMethodForm.tsx auto-selects the shop's one flat-rate option
    // and redirects to ?step=payment -- once there, the delivery step
    // renders as a completed summary showing the method name and price.
    // No need to reach or interact with the payment step at all.
    const deliveryMethod = page.getByText("Standard Shipping");
    await expect(deliveryMethod).toBeVisible({ timeout: 15000 });

    // The CheckoutSummary sidebar also shows "$6.95" on its own "Shipping"
    // line once a method is set, so scope to the delivery summary's own
    // price paragraph (sibling of "Standard Shipping") rather than a
    // page-wide text match.
    await expect(deliveryMethod.locator("..").getByText("$6.95")).toBeVisible();
  });
});
