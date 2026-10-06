import "server-only";

/** Default TTL for cached read models (seconds). */
export const CACHE_TTL_SECONDS = 60;

/** Cache tags used to invalidate read models from mutations. */
export const CACHE_TAGS = {
  dashboard: "dashboard",
  reports: "reports",
} as const;

type Entry = { value: unknown; expiresAt: number; tags: string[] };

/**
 * In-process TTL cache for hot, workspace-scoped read models.
 *
 * Warm serverless instances share the same Map, so repeated dashboard/report
 * loads skip the database for up to `CACHE_TTL_SECONDS`. Entries are keyed by
 * both the static key parts and the function arguments, so one workspace never
 * reads another's cached rows. Mutations call `invalidateCache()` (via
 * `revalidateDashboard()`) to purge eagerly.
 */
const store = new Map<string, Entry>();

export function cached<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  keyParts: string[],
  options: { ttlSeconds?: number; tags?: string[] } = {},
): (...args: Args) => Promise<Result> {
  const ttlMs = (options.ttlSeconds ?? CACHE_TTL_SECONDS) * 1000;
  const tags = options.tags ?? [];

  return async (...args: Args): Promise<Result> => {
    const key = `${keyParts.join(":")}::${stableStringify(args)}`;
    const hit = store.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      return hit.value as Result;
    }

    const value = await fn(...args);
    store.set(key, { value, expiresAt: Date.now() + ttlMs, tags });
    return value;
  };
}

/** Drop every cache entry carrying `tag`. */
export function invalidateCache(tag: string): void {
  for (const [key, entry] of store) {
    if (entry.tags.includes(tag)) store.delete(key);
  }
}

/** Purge cached dashboard + reports read models after a mutation. */
export function revalidateDashboard(): void {
  invalidateCache(CACHE_TAGS.dashboard);
  invalidateCache(CACHE_TAGS.reports);
}

function stableStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? "";
  } catch {
    return String(value);
  }
}
