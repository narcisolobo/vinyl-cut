import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * Condition labels overlap ("VG" is a substring of "VG+"), and Playwright's
 * `getByRole(..., { name })` matching is substring-based by default -- see
 * album-detail.spec.ts. Every variant-button lookup must pass `exact: true`.
 */
function variantButton(scope: Locator | Page, condition: string): Locator {
  return scope.getByRole("button", { name: condition, exact: true });
}

/**
 * Adds the "New" variant of a high-stock fixture album to the cart. The
 * cheapest (and thus default-selected) variant on this album is VG, which
 * is out of stock -- New must be selected explicitly. High stock (14 units,
 * live-verified) is deliberate: unlike the other specs, a successful
 * checkout here permanently decrements real inventory.
 */
async function addFixtureToCart(page: Page): Promise<void> {
  await page.goto("/us/albums/the-rolling-stones-exile-on-main-st");
  await variantButton(page.locator("main"), "New").click();
  await expect(page.locator("main").getByText("$22.51")).toBeVisible();
  await page
    .locator("main")
    .getByRole("button", { name: "Add to Cart" })
    .click();

  // Wait for the add to actually land (async server action) before
  // navigating away -- same race-avoidance lesson from cart.spec.ts.
  await expect(page.getByTestId("cart-subtotal")).toContainText("$22.51");
}

async function fillAddressStep(page: Page, email: string): Promise<void> {
  await page.getByLabel("First name").fill("Test");
  await page.getByLabel("Last name").fill("Shopper");
  // Required fields append a "*" to the label's accessible name (see
  // AddressField in AddressForm.tsx), and "Address" alone is also a
  // substring of the "Billing address same as shipping" checkbox label --
  // anchor the regex to avoid both pitfalls.
  await page.getByLabel(/^Address\*?$/).fill("123 Vinyl Way");
  await page.getByLabel("Postal code").fill("94103");
  await page.getByLabel("City").fill("San Francisco");
  await page
    .locator('select[name="shipping_address.province"]')
    .selectOption("ca");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Continue to delivery" }).click();
}

function stripeFrame(page: Page) {
  // Stripe's Payment Element mounts its actual form fields inside an
  // "elements-inner-accessory-target" iframe -- despite the name (and
  // despite this project's Stripe.js version also rendering an unrelated
  // "elements-inner-easel" iframe, which turns out to be Stripe's
  // test-mode Developer Tools panel, not the form), this is the real one,
  // confirmed by inspecting its actual input fields directly.
  return page.frameLocator('iframe[src*="elements-inner-accessory-target"]');
}

async function fillCard(
  page: Page,
  cardNumber: string,
  {
    expiry = "12/34",
    cvc = "123",
    zip = "94103",
  }: { expiry?: string; cvc?: string; zip?: string } = {},
): Promise<void> {
  const frame = stripeFrame(page);
  // Targeted by Stripe's internal element ids, not label text -- the
  // accessible label copy on these fields varies by Stripe.js A/B
  // experiment assignment (observed "Expiration date" vs. "Expiration
  // (MM/YY)" across two runs against the same test-mode key), but the
  // ids are stable implementation details.
  await frame.locator("#payment-numberInput").fill(cardNumber);
  await frame.locator("#payment-expiryInput").fill(expiry);
  await frame.locator("#payment-cvcInput").fill(cvc);
  await frame.locator("#payment-postalCodeInput").fill(zip);
}

/**
 * A plain Playwright click on "Continue to Review" intermittently never
 * reaches React's onSubmit -- confirmed by instrumenting the handler
 * directly that a native `el.click()` fires it reliably while Playwright's
 * synthetic mouse click sometimes doesn't, right after filling the last
 * field in Stripe's cross-origin iframe (likely a timing race with the
 * iframe settling, not a real app bug -- the ZIP field, address fields,
 * etc. all resolve fine via normal `.click()` elsewhere in this file).
 * `dispatchEvent("click")` fires a real DOM click event without going
 * through synthetic mouse coordinates, and was reliable in testing.
 */
async function submitPaymentStep(page: Page): Promise<void> {
  await page
    .getByRole("button", { name: "Continue to Review" })
    .dispatchEvent("click");
}

test.describe("Guest checkout, happy path", () => {
  test("completes with a successful card", async ({ page }) => {
    await addFixtureToCart(page);
    await page.goto("/us/checkout");

    await fillAddressStep(page, "e2e-checkout@vinylcut.test");

    // Delivery step is fully automatic (ShippingMethodForm.tsx) -- no
    // interaction, just wait for the auto-redirect to the payment step.
    await expect(page.getByRole("button", { name: "Continue to Review" })).toBeVisible({
      timeout: 15000,
    });

    await fillCard(page, "4242424242424242");
    await submitPaymentStep(page);

    await expect(page.getByRole("button", { name: "Place order" })).toBeVisible({
      timeout: 15000,
    });
    await page.getByRole("button", { name: "Place order" }).click();

    await expect(page).toHaveURL(/\/order\/.+\/confirmed/, { timeout: 15000 });
    await expect(
      page.getByRole("heading", { name: "Thank you for your order!" }),
    ).toBeVisible();
    await expect(page.getByText(/Order #\d+/)).toBeVisible();

    await expect(page.getByText("Exile on Main St.")).toBeVisible();
    await expect(page.getByText("Qty: 1")).toBeVisible();

    await expect(page.getByText("Test Shopper")).toBeVisible();
    await expect(page.getByText("123 Vinyl Way")).toBeVisible();
    await expect(page.getByText(/San Francisco, CA 94103/)).toBeVisible();

    // Each totals row in OrderConfirmed.tsx is `<div><span>label</span>
    // <span>$amount</span></div>` -- walk to the parent and back down to
    // the sibling `$`-prefixed span, rather than a broad `div` filter that
    // could match multiple ancestor levels.
    const totalsRow = (label: string) =>
      page
        .getByText(label, { exact: true })
        .locator("..")
        .getByText(/^\$/);

    const subtotal = totalsRow("Subtotal (excl. shipping and taxes)");
    const shipping = totalsRow("Shipping");
    const tax = totalsRow("Taxes");
    const total = totalsRow("Total");
    await expect(shipping).toBeVisible();

    await expect(page.getByText("Credit Card")).toBeVisible();

    const subtotalText = await subtotal.textContent();
    const shippingText = await shipping.textContent();
    const taxText = await tax.textContent();
    const totalText = await total.textContent();

    const toCents = (text: string | null) =>
      Math.round(Number((text ?? "").replace(/[^0-9.]/g, "")) * 100);
    const sum =
      toCents(subtotalText) + toCents(shippingText) + toCents(taxText);
    expect(Math.abs(sum - toCents(totalText))).toBeLessThanOrEqual(1);
  });

  test("a declined card shows an error and does not complete the order", async ({
    page,
  }) => {
    await addFixtureToCart(page);
    await page.goto("/us/checkout");

    await fillAddressStep(page, "e2e-checkout-decline@vinylcut.test");

    await expect(page.getByRole("button", { name: "Continue to Review" })).toBeVisible({
      timeout: 15000,
    });

    await fillCard(page, "4000000000000002");
    await submitPaymentStep(page);

    // Scoped to the app's own error box (`role="alert" class="alert-error"`
    // in PaymentMethodForm.tsx) -- a bare `getByRole("alert")` also matches
    // Next.js's App Router route-announcer live region, which is always
    // present and would make this assertion pass even without a real
    // payment error.
    const errorAlert = page.locator(".alert-error");
    await expect(errorAlert).toBeVisible({ timeout: 15000 });
    await expect(errorAlert).not.toBeEmpty();

    await expect(
      page.getByRole("button", { name: "Continue to Review" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Place order" }),
    ).toHaveCount(0);
    expect(page.url()).not.toMatch(/step=review/);
  });
});
