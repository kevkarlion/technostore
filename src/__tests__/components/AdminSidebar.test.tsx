import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/lib/auth/auth-context";

const mocks = vi.hoisted(() => ({
  useAdminStore: vi.fn(),
}));

vi.mock("@/lib/auth/auth-context");
vi.mock("@/store/admin-store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/store/admin-store")>();
  return { ...actual, useAdminStore: mocks.useAdminStore };
});

function authState(role: "user" | "admin") {
  return {
    userId: "user-1",
    role,
    isAuthenticated: true,
    isLoading: false,
    email: `${role}@test.com`,
    name: role,
    login: vi.fn(),
    logout: vi.fn(),
  };
}

describe("AdminSidebar user-management navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAdminStore.mockReturnValue({
      activeSection: "products",
      navigateToSection: vi.fn(),
      sidebarCollapsed: false,
      setSidebarCollapsed: vi.fn(),
      sidebarOpen: true,
      setSidebarOpen: vi.fn(),
    });
  });

  it("hides user management from regular users", () => {
    vi.mocked(useAuth).mockReturnValue(authState("user"));

    render(<AdminSidebar />);

    expect(screen.queryByText("Usuarios")).not.toBeInTheDocument();
  });

  it("shows user management to administrators", () => {
    vi.mocked(useAuth).mockReturnValue(authState("admin"));

    render(<AdminSidebar />);

    expect(screen.getAllByText("Usuarios")).toHaveLength(2);
  });
});
