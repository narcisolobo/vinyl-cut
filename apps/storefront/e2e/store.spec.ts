import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * The desktop genre/condition/era filters live inside a closed
 * `<details class="dropdown">` (StoreFilter.tsx) -- its `<summary>` must be
 * opened before a checkbox inside is interactable. These tests run at the
 * default desktop viewport (`devices["Desktop Chrome"]`), which renders that
 * dropdown path rather than the mobile drawer.
 */
async function openFilterDropdown(page: Page, label: string): Promise<void> {
  await page.locator("summary").filter({ hasText: label }).click();
}

function albumCards(page: Page): Locator {
  return page.getByTestId("album-card");
}

function cardPrice(card: Locator): Locator {
  return card.locator("p").filter({ hasText: /^\$/ });
}

/**
 * The grid only ever renders one page (24 cards) at a time, so comparing
 * `album-card` counts before/after filtering can't detect narrowing once
 * both the unfiltered and filtered result sets exceed a page (true here for
 * every single-dimension genre/condition filter against the 500-item seed
 * catalog). Read the actual result-set size instead via the "Last page"
 * link's `page=` param -- `Pagination` only renders once `totalPages > 1`,
 * and on a fresh page-1 load `hasNext` is always true whenever it renders,
 * so the link is present whenever there's more than one page.
 */
async function getTotalPages(page: Page): Promise<number> {
  const pagination = page.getByTestId("pagination-top");
  if ((await pagination.count()) === 0) {
    return 1;
  }
  const href = await pagination
    .getByRole("link", { name: "Last page" })
    .getAttribute("href");
  return Number(new URL(href ?? "", page.url()).searchParams.get("page"));
}

test.describe("Catalog browsing & filtering", () => {
  test("grid renders products on load", async ({ page }) => {
    await page.goto("/us/store");

    await expect(page.getByTestId("album-grid")).toBeVisible();
    await expect(albumCards(page).first()).toBeVisible();
    expect(await albumCards(page).count()).toBeGreaterThan(0);
  });

  test("genre filter narrows results and updates the URL", async ({
    page,
  }) => {
    await page.goto("/us/store");
    const unfilteredTotalPages = await getTotalPages(page);

    await openFilterDropdown(page, "Genres");
    await page.locator("#desktop-genres-rock").click();

    // The checkbox is fully URL-driven (no optimistic client state), so it
    // only re-renders checked once router.replace()'s RSC round-trip lands.
    // Wait on the URL rather than the checkbox's own checked state.
    await expect(page).toHaveURL(/genre=Rock/);
    expect(await albumCards(page).count()).toBeGreaterThan(0);
    expect(await getTotalPages(page)).toBeLessThan(unfilteredTotalPages);
  });

  test("condition filter narrows results", async ({ page }) => {
    await page.goto("/us/store");
    const unfilteredTotalPages = await getTotalPages(page);

    await openFilterDropdown(page, "Conditions");
    await page
      .locator('[id="desktop-conditions-very-good-plus-(vg+)"]')
      .click();

    await expect(page).toHaveURL(/condition=/);
    expect(await albumCards(page).count()).toBeGreaterThan(0);
    expect(await getTotalPages(page)).toBeLessThan(unfilteredTotalPages);
  });

  test("genre + condition + sort compose together", async ({ page }) => {
    await page.goto("/us/store");

    await openFilterDropdown(page, "Genres");
    await page.locator("#desktop-genres-rock").click();
    await expect(page).toHaveURL(/genre=Rock/);
    const genreOnlyTotalPages = await getTotalPages(page);

    await openFilterDropdown(page, "Conditions");
    await page
      .locator('[id="desktop-conditions-very-good-plus-(vg+)"]')
      .click();
    await expect(page).toHaveURL(/condition=/);

    await page
      .locator('select[name="sorting-options"]')
      .selectOption("price-asc");
    await expect(page).toHaveURL(/sort=price-asc/);

    expect(await albumCards(page).count()).toBeGreaterThan(0);
    expect(await getTotalPages(page)).toBeLessThan(genreOnlyTotalPages);

    const prices = await cardPrice(page.getByTestId("album-card"))
      .allTextContents()
      .then((texts) =>
        texts.map((text) => Number(text.replace(/[^0-9.]/g, ""))),
      );
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  test("zero-match filter combo shows the empty state", async ({ page }) => {
    await page.goto("/us/store");

    // World + Mint (M) is empirically zero-match against the local dev
    // seed data (verified live against the Medusa backend at authoring
    // time: World x {M,NM,VG+} = 0). If this starts failing after a
    // reseed, re-derive a zero-match genre/condition pair from the
    // running dev stack rather than guessing.
    await openFilterDropdown(page, "Genres");
    await page.locator("#desktop-genres-world").click();
    await expect(page).toHaveURL(/genre=World/);

    await openFilterDropdown(page, "Conditions");
    await page.locator('[id="desktop-conditions-mint-(m)"]').click();
    await expect(page).toHaveURL(/condition=/);

    const emptyState = page.getByTestId("album-grid-empty-state");
    await expect(emptyState).toBeVisible();
    expect(await albumCards(page).count()).toBe(0);

    await emptyState.getByRole("link", { name: "Clear filters" }).click();

    await expect(page).toHaveURL(/\/us\/store$/);
    await expect(albumCards(page).first()).toBeVisible();
  });

  test("pagination: page 2 shows different products", async ({ page }) => {
    await page.goto("/us/store");
    const albumGrid = page.getByTestId("album-grid");
    const page1Titles = await albumGrid
      .getByRole("heading", { level: 4 })
      .allTextContents();

    const pagination = page.getByTestId("pagination-top");
    await pagination.getByRole("link", { name: "Next page" }).click();

    await expect(page).toHaveURL(/page=2/);
    await expect(
      page.getByTestId("pagination-top").locator('[aria-current="page"]'),
    ).toHaveText("2");

    const page2Titles = await albumGrid
      .getByRole("heading", { level: 4 })
      .allTextContents();
    expect(page2Titles).not.toEqual(page1Titles);
  });

  test("pagination: page=0 does not break the page", async ({ page }) => {
    const response = await page.goto("/us/store?page=0");

    expect(response?.status()).toBeLessThan(500);
    await expect(
      page.getByTestId("album-grid").or(page.getByTestId("album-grid-empty-state")),
    ).toBeVisible();
  });

  test("pagination: past-the-end page shows the empty state", async ({
    page,
  }) => {
    const response = await page.goto("/us/store?page=999");

    expect(response?.status()).toBeLessThan(500);
    await expect(page.getByTestId("album-grid-empty-state")).toBeVisible();
    expect(await albumCards(page).count()).toBe(0);
  });
});
