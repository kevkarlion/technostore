import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithProviders, mockFetch } from "@/__tests__/utils";
import AdminUsers from "@/components/admin/sections/AdminUsers";
import { useAuth } from "@/lib/auth/auth-context";

/* -------------------------------------------------------------------------- */
/*  Module-level mock — AdminUsers calls useAuth() which throws without it    */
/* -------------------------------------------------------------------------- */

vi.mock("@/lib/auth/auth-context");

/* -------------------------------------------------------------------------- */
/*  Fixtures                                                                  */
/* -------------------------------------------------------------------------- */

const mockUsers = [
  {
    _id: "auth-1",
    email: "admin@test.com",
    name: "Admin User",
    role: "admin" as const,
    status: "active" as const,
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-01-15T10:00:00Z",
  },
  {
    _id: "other-1",
    email: "user@test.com",
    name: "Regular User",
    role: "user" as const,
    status: "inactive" as const,
    createdAt: "2025-02-20T14:30:00Z",
    updatedAt: "2025-02-20T14:30:00Z",
  },
];

const mockFetchResponse = {
  items: mockUsers,
  total: 2,
  page: 1,
  limit: 20,
  totalPages: 1,
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function createAuthMock(overrides?: Record<string, unknown>) {
  return {
    userId: "auth-1",
    role: "admin" as const,
    isAuthenticated: true,
    isLoading: false,
    email: "admin@test.com",
    name: "Admin",
    login: vi.fn().mockResolvedValue({ success: true }),
    logout: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

/* -------------------------------------------------------------------------- */
/*  Tests                                                                     */
/* -------------------------------------------------------------------------- */

describe("AdminUsers", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue(createAuthMock());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders users with name, email, role, and status", async () => {
    const fetch = mockFetch(mockFetchResponse);
    vi.stubGlobal("fetch", fetch);

    renderWithProviders(<AdminUsers />);

    // Wait for user names to appear
    await waitFor(() => {
      expect(screen.getAllByText("Admin User").length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText("Regular User").length).toBeGreaterThan(0);

    // Emails render
    expect(screen.getAllByText("admin@test.com").length).toBeGreaterThan(0);
    expect(screen.getAllByText("user@test.com").length).toBeGreaterThan(0);

    // Role badges
    expect(screen.getAllByText("Admin").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Usuario").length).toBeGreaterThan(0);

    // Status badges
    expect(screen.getAllByText("Activo").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Inactivo").length).toBeGreaterThan(0);
  });

  it("shows loading state while fetching", () => {
    const fetch = vi.fn().mockReturnValue(new Promise(() => {}));
    vi.stubGlobal("fetch", fetch);

    renderWithProviders(<AdminUsers />);

    expect(screen.getByText("Cargando...")).toBeInTheDocument();
  });

  it("shows error state with retry button", async () => {
    const fetch = vi.fn().mockRejectedValue(new Error("Error al cargar datos"));
    vi.stubGlobal("fetch", fetch);

    renderWithProviders(<AdminUsers />);

    await waitFor(() => {
      expect(
        screen.getByText("Error al cargar datos")
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /Reintentar/i })
    ).toBeInTheDocument();
  });

  it("shows empty state when no users", async () => {
    const fetch = mockFetch({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
    vi.stubGlobal("fetch", fetch);

    renderWithProviders(<AdminUsers />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "No hay usuarios administradores. Creá el primero."
        )
      ).toBeInTheDocument();
    });
  });

  it("create user modal opens and closes", async () => {
    const fetch = mockFetch(mockFetchResponse);
    vi.stubGlobal("fetch", fetch);

    renderWithProviders(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getAllByText("Admin User").length).toBeGreaterThan(0);
    });

    // Click "Nuevo usuario" button
    const newUserButton = screen.getByText("Nuevo usuario");
    fireEvent.click(newUserButton);

    // Modal should open with form fields — "Nuevo usuario" appears in both
    // the trigger button and the modal h2, so use getAllByText
    expect(
      screen.getAllByText("Nuevo usuario").length
    ).toBeGreaterThan(0);
    expect(screen.getByText("Crear usuario")).toBeInTheDocument();

    // Close via "Cancelar"
    const cancelButton = screen.getByText("Cancelar");
    fireEvent.click(cancelButton);

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText("Crear usuario")).not.toBeInTheDocument();
    });
  });

  it("displays (vos) indicator for the current authenticated user", async () => {
    const fetch = mockFetch(mockFetchResponse);
    vi.stubGlobal("fetch", fetch);

    renderWithProviders(<AdminUsers />);

    await waitFor(() => {
      expect(
        screen.getAllByText("Admin User").length
      ).toBeGreaterThan(0);
    });

    // User with _id matching authUserId shows "(vos)"
    expect(screen.getByText("(vos)")).toBeInTheDocument();
  });

  it("auth guard hides action buttons for non-admin users", async () => {
    // Mock useAuth with role "user" (not admin)
    vi.mocked(useAuth).mockReturnValue(createAuthMock({ role: "user" }));

    const fetch = mockFetch(mockFetchResponse);
    vi.stubGlobal("fetch", fetch);

    renderWithProviders(<AdminUsers />);

    await waitFor(() => {
      expect(
        screen.getAllByText("Admin User").length
      ).toBeGreaterThan(0);
    });

    // With non-admin role, action buttons should NOT render
    expect(screen.queryByText("Editar")).not.toBeInTheDocument();
    expect(screen.queryByText("Bloquear")).not.toBeInTheDocument();
    expect(screen.queryByText("Borrar")).not.toBeInTheDocument();
    expect(screen.queryByText("Hacer admin")).not.toBeInTheDocument();
    expect(screen.queryByText("Resetear contraseña")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Cambiar contraseña")
    ).not.toBeInTheDocument();

    // Header buttons should still be visible
    expect(screen.getByText("Nuevo usuario")).toBeInTheDocument();
  });
});
