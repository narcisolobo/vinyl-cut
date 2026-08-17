const STORAGE_KEY = "vinyl-cut:plp-scroll-restore";

type ScrollRestorePoint = {
  url: string;
  y: number;
};

/** Records the current scroll position keyed to the current URL, so a later "Back to Store" navigation can restore it once the PLP remounts. */
function saveScrollPosition(): void {
  const point: ScrollRestorePoint = {
    url: `${window.location.pathname}${window.location.search}`,
    y: window.scrollY,
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(point));
}

/** Returns the saved scroll position if it matches the current URL, consuming it (single-use) so a later unrelated visit to the same URL doesn't inherit a stale restore. */
function consumeScrollPosition(): number | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(STORAGE_KEY);

  let point: ScrollRestorePoint;
  try {
    point = JSON.parse(raw);
  } catch {
    return null;
  }

  const currentUrl = `${window.location.pathname}${window.location.search}`;
  return point.url === currentUrl ? point.y : null;
}

export { saveScrollPosition, consumeScrollPosition };
