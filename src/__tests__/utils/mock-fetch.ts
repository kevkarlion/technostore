import { vi } from "vitest";

/**
 * Creates a `vi.fn()` that mimics a successful (or failed) `fetch()` Response.
 *
 * @param data  - Body returned by `response.json()`
 * @param ok    - Whether the response signals success (`response.ok`)
 * @param status - HTTP status code
 *
 * @example
 * ```ts
 * const fetch = mockFetch({ items: [], total: 0 });
 * vi.spyOn(global, "fetch").mockImplementation(fetch);
 * ```
 */
export function mockFetch<T>(
  data: T,
  ok = true,
  status = 200
) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(data),
  });
}
