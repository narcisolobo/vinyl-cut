import { expect, test, type Page } from "@playwright/test";

const MOBILE = { width: 375, height: 812 };
const TABLET = { width: 820, height: 1180 };
const DESKTOP = { width: 1280, height: 800 };

/**
 * DrawerMenu.tsx (the off-canvas mobile nav panel) renders the same nav
 * links as NavMenu.tsx, hidden off-screen via CSS transform rather than
 * `display:none` -- Playwright's `.toBeVisible()` counts a translated
 * element as visible, so an unscoped `getByRole("link", { name: "Store" })`
 * matches both copies and throws a strict-mode error at every viewport.
 * Scope to NavMenu's `menu-horizontal` class, which DrawerMenu doesn't use.
 *
 * Check the "Store" link itself, not the `<ul>` container -- the `<ul>`
 * carries daisyUI's `.menu` padding regardless of its `hidden lg:block`
 * `<li>` children's visibility, so it never collapses to a zero-size box
 * even when every link inside it is genuinely `display:none`.
 */
function desktopStoreLink(page: Page) {
  return page
    .locator("ul.menu-horizontal")
    .getByRole("link", { name: "Store", exact: true });
}

async function hasNoHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
}

type FocusCheck = { tag?: string; text?: string; ariaLabel?: string };

/**
 * Presses Tab repeatedly (real keyboard input, not `.focus()` -- Playwright
 * notes programmatic focus doesn't trigger `:focus-visible`, which this
 * spec needs to check) until the focused element matches `check`, bailing
 * out after `maxPresses` to avoid an infinite loop if it's unreachable.
 */
async function tabUntilFocused(
  page: Page,
  check: FocusCheck,
  maxPresses = 25,
): Promise<boolean> {
  for (let i = 0; i < maxPresses; i++) {
    await page.keyboard.press("Tab");
    const matched = await page.evaluate((c: FocusCheck) => {
      const el = document.activeElement;
      if (!el) return false;
      if (c.tag && el.tagName !== c.tag) return false;
      if (c.text && !(el.textContent ?? "").includes(c.text)) return false;
      if (c.ariaLabel && el.getAttribute("aria-label") !== c.ariaLabel) {
        return false;
      }
      return true;
    }, check);
    if (matched) return true;
  }
  return false;
}

async function hasVisibleFocusOutline(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return false;
    const style = getComputedStyle(el);
    const hasOutline =
      style.outlineStyle !== "none" && style.outlineWidth !== "0px";
    const hasBoxShadow = style.boxShadow !== "none";
    return hasOutline || hasBoxShadow;
  });
}

test.describe("Responsive layout", () => {
  test("mobile (375x812)", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/us/store");

    await expect(page.getByLabel("open navigation menu")).toBeVisible();
    await expect(desktopStoreLink(page)).not.toBeVisible();
    await expect(page.getByLabel("open filters")).toBeVisible();
    await expect(
      page.locator("summary").filter({ hasText: "Genres" }),
    ).not.toBeVisible();
    await expect(page.getByTestId("album-card").first()).toBeVisible();
    expect(await hasNoHorizontalOverflow(page)).toBe(true);

    await page.goto("/us/albums/fleetwood-mac-rumours");
    await expect(
      page.getByAltText("Fleetwood Mac — Rumours cover art"),
    ).toBeVisible();
    await expect(
      page.locator("main").getByRole("button", { name: "Add to Cart" }),
    ).toBeVisible();
    expect(await hasNoHorizontalOverflow(page)).toBe(true);
  });

  test("tablet (820x1180)", async ({ page }) => {
    await page.setViewportSize(TABLET);
    await page.goto("/us/store");

    // Still below `lg` (1024) -- nav and filters share that breakpoint, so
    // this looks like mobile, just with more grid columns.
    await expect(page.getByLabel("open navigation menu")).toBeVisible();
    await expect(desktopStoreLink(page)).not.toBeVisible();
    await expect(page.getByLabel("open filters")).toBeVisible();
    await expect(
      page.locator("summary").filter({ hasText: "Genres" }),
    ).not.toBeVisible();
    await expect(page.getByTestId("album-card").first()).toBeVisible();
    expect(await hasNoHorizontalOverflow(page)).toBe(true);

    await page.goto("/us/albums/fleetwood-mac-rumours");
    await expect(
      page.getByAltText("Fleetwood Mac — Rumours cover art"),
    ).toBeVisible();
    expect(await hasNoHorizontalOverflow(page)).toBe(true);
  });

  test("desktop (1280x800)", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/us/store");

    await expect(page.getByLabel("open navigation menu")).not.toBeVisible();
    await expect(desktopStoreLink(page)).toBeVisible();
    await expect(page.getByLabel("open filters")).not.toBeVisible();
    await expect(
      page.locator("summary").filter({ hasText: "Genres" }),
    ).toBeVisible();
    await expect(page.getByTestId("album-card").first()).toBeVisible();
    expect(await hasNoHorizontalOverflow(page)).toBe(true);

    await page.goto("/us/albums/fleetwood-mac-rumours");
    const gallery = page.getByAltText("Fleetwood Mac — Rumours cover art");
    const addToCart = page
      .locator("main")
      .getByRole("button", { name: "Add to Cart" });
    await expect(gallery).toBeVisible();
    await expect(addToCart).toBeVisible();

    const galleryBox = await gallery.boundingBox();
    const detailsBox = await addToCart.boundingBox();
    expect(galleryBox!.x + galleryBox!.width).toBeLessThanOrEqual(
      detailsBox!.x + 1,
    );
    expect(await hasNoHorizontalOverflow(page)).toBe(true);
  });
});

test.describe("Keyboard accessibility", () => {
  test.beforeEach(({ browserName }) => {
    // By default, Safari/WebKit only includes links and text fields in the
    // Tab order -- buttons, checkboxes, and radios (everything these tests
    // exercise) are excluded unless the user has macOS's "Full Keyboard
    // Access" enabled, which is off by default. This is genuine platform
    // behavior, not a testing artifact or an app bug: confirmed by tracing
    // exactly which elements failed to receive focus, matching this known
    // WebKit default precisely (button/checkbox targets unreachable, link
    // targets unaffected elsewhere in this suite).
    test.skip(
      browserName === "webkit",
      "WebKit excludes buttons/checkboxes/radios from the default Tab order without macOS Full Keyboard Access",
    );
  });

  test("PLP filters via the desktop dropdown path", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/us/store");

    const reachedGenres = await tabUntilFocused(page, {
      tag: "SUMMARY",
      text: "Genres",
    });
    expect(reachedGenres).toBe(true);
    await expect(
      page.locator("summary").filter({ hasText: "Genres" }),
    ).toBeFocused();
    expect(await hasVisibleFocusOutline(page)).toBe(true);

    await page.keyboard.press("Enter");
    const firstCheckbox = page.locator("#desktop-genres-blues");
    await expect(firstCheckbox).toBeVisible();

    // Firefox inserts an extra tab stop on the wrapping <fieldset> (a
    // known Firefox-specific quirk, not present in Chromium/WebKit) --
    // search forward a couple of presses rather than assuming exactly one.
    const reachedCheckbox = await tabUntilFocused(page, { tag: "INPUT" }, 3);
    expect(reachedCheckbox).toBe(true);
    await expect(firstCheckbox).toBeFocused();
    expect(await hasVisibleFocusOutline(page)).toBe(true);

    await page.keyboard.press("Space");
    await expect(page).toHaveURL(/genre=Blues/);

    await page.keyboard.press("Tab");
    await expect(page.locator("#desktop-genres-country")).toBeFocused();
  });

  test("PLP filters via the mobile drawer path", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/us/store");

    const reachedFilterButton = await tabUntilFocused(page, {
      ariaLabel: "open filters",
    });
    expect(reachedFilterButton).toBe(true);
    expect(await hasVisibleFocusOutline(page)).toBe(true);

    await page.keyboard.press("Enter");
    await expect(page.locator("#mobile-filter-drawer")).toBeChecked();
    // The drawer slides in via a CSS transition -- pressing Tab immediately
    // races ahead of it and the next Tab press lands past the drawer's
    // content entirely (empirically confirmed: reaches the sort <select>
    // instead of the drawer's overlay button). Wait for the overlay to be
    // genuinely visible first.
    await expect(page.getByLabel("close filters")).toBeVisible();

    // Tab order within the open drawer: overlay ("close filters") first,
    // then the filter accordion radios.
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("close filters")).toBeFocused();

    await page.keyboard.press("Tab");
    const genresAccordion = page
      .locator('input[name="mobile-filter-accordion"]')
      .first();
    await expect(genresAccordion).toBeFocused();

    // Radio inputs toggle on Space, not Enter (unlike buttons/checkboxes).
    await page.keyboard.press("Space");
    const firstCheckbox = page.locator("#mobile-genres-blues");
    await expect(firstCheckbox).toBeVisible();

    // Same Firefox fieldset-tab-stop quirk as the desktop path above.
    const reachedCheckbox = await tabUntilFocused(page, { tag: "INPUT" }, 3);
    expect(reachedCheckbox).toBe(true);
    await expect(firstCheckbox).toBeFocused();
    await page.keyboard.press("Space");
    await expect(page).toHaveURL(/genre=Blues/);

    // Deliberate .focus() here, not further Tab presses -- skipping past
    // the rest of the (currently one-selected) genre checkboxes to the
    // close button. Not asserting focus-visible styling at this specific
    // step, only the close behavior that follows, so the :focus-visible
    // caveat on programmatic focus doesn't matter here.
    await page.getByRole("button", { name: "Show Results" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#mobile-filter-drawer")).not.toBeChecked();
    await expect(page.getByLabel("open filters")).toBeFocused();

    // Escape closes the same way, via a different trigger.
    await page.getByLabel("open filters").click();
    await expect(page.locator("#mobile-filter-drawer")).toBeChecked();
    await page.keyboard.press("Escape");
    await expect(page.locator("#mobile-filter-drawer")).not.toBeChecked();
  });
});
