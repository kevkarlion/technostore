import React, { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  /**
   * Future: override mock auth state values.
   * When AuthContext wrapping is added in a follow-up PR, these overrides
   * will be passed to `mockAuthState()` before wrapping children.
   */
  authOverrides?: Record<string, unknown>;
}

/**
 * Renders a React element wrapped in common providers.
 *
 * Currently passes children through (no wrapping). In future PRs this will
 * wrap with `AuthContext.Provider`, `ThemeProvider`, etc.
 *
 * @example
 * ```tsx
 * renderWithProviders(<AdminCustomers />);
 * renderWithProviders(<ProtectedSection />, { authOverrides: { role: "user" } });
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: RenderWithProvidersOptions
) {
  const { authOverrides: _authOverrides, ...renderOptions } = options ?? {};

  function Wrapper({ children }: { children: React.ReactNode }) {
    // Future: wrap with AuthContext.Provider, ThemeProvider, etc.
    return <>{children}</>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
