import { vi } from "vitest";

export interface MockAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  email: string | null;
  name: string | null;
  role: "user" | "admin" | null;
  userId: string | null;
  login: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
}

/**
 * Factory that creates a mock auth state with sensible defaults.
 * Pass `overrides` to customize — useful when testing role-gated behavior.
 *
 * @example
 * ```ts
 * const adminAuth = mockAuthState();
 * const userAuth = mockAuthState({ role: "user", name: "User" });
 * const unauthed = mockAuthState({ isAuthenticated: false, role: null });
 * ```
 */
export function mockAuthState(
  overrides?: Partial<MockAuthState>
): MockAuthState {
  return {
    isAuthenticated: true,
    isLoading: false,
    email: "admin@test.com",
    name: "Admin",
    role: "admin",
    userId: "123",
    login: vi.fn().mockResolvedValue({ success: true }),
    logout: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}
