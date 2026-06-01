import { vi } from "vitest";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface MockCollection {
  find: ReturnType<typeof vi.fn>;
  sort: ReturnType<typeof vi.fn>;
  skip: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  toArray: ReturnType<typeof vi.fn>;
  countDocuments: ReturnType<typeof vi.fn>;
  aggregate: ReturnType<typeof vi.fn>;
}

export interface MockDb {
  /** The `getDb()` mock function — pass this as the `vi.mock` factory export */
  getDb: ReturnType<typeof vi.fn>;
  /** Reference to the underlying collection mock for per-test configuration */
  collection: MockCollection;
}

/* -------------------------------------------------------------------------- */
/*  Factories                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Returns a chained MongoDB collection mock where every cursor method
 * returns `this`, and `toArray` / `countDocuments` return sensible defaults.
 *
 * Override individual methods via `overrides` when a test needs specific
 * return values.
 */
export function createMockCollection(
  overrides?: Partial<MockCollection>
): MockCollection {
  return {
    find: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    toArray: vi.fn().mockResolvedValue([]),
    countDocuments: vi.fn().mockResolvedValue(0),
    aggregate: vi.fn().mockReturnThis(),
    ...overrides,
  };
}

/**
 * Creates a full mock DB object with a `getDb` function and the underlying
 * collection mock. Useful in API route tests where you need to control
 * what the database returns.
 *
 * @example
 * ```ts
 * const db = createMockDb();
 * db.collection.toArray.mockResolvedValue(mockOrders);
 * db.collection.countDocuments.mockResolvedValue(42);
 *
 * vi.mock("@/config/db", () => ({ getDb: db.getDb }));
 * ```
 */
export function createMockDb(overrides?: Partial<MockCollection>): MockDb {
  const collection = createMockCollection(overrides);
  return {
    getDb: vi.fn().mockResolvedValue({
      collection: vi.fn().mockReturnValue(collection),
    }),
    collection,
  };
}
