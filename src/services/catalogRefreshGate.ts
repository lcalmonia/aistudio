const CATALOG_REFRESH_MIN_INTERVAL_MS = 30_000;

let lastRefreshAt = 0;
let refreshInFlight: Promise<void> | null = null;

/**
 * Coalesce catalog refreshes triggered by focus/visibility events.
 * The first caller within the interval performs the refresh; later callers
 * reuse the same in-flight operation or skip it until the interval expires.
 */
export function runCatalogRefresh(refresh: () => Promise<void>): Promise<void> {
  if (refreshInFlight) return refreshInFlight;

  const now = Date.now();
  if (now - lastRefreshAt < CATALOG_REFRESH_MIN_INTERVAL_MS) {
    return Promise.resolve();
  }

  refreshInFlight = refresh()
    .then(() => {
      lastRefreshAt = Date.now();
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}
