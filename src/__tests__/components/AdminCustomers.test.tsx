import { describe, it, expect, vi, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/__tests__/utils";
import AdminCustomers from "@/components/admin/sections/AdminCustomers";

/* -------------------------------------------------------------------------- */
/*  Fixtures                                                                  */
/* -------------------------------------------------------------------------- */

const mockCustomers = [
  {
    _id: "1",
    email: "juan@test.com",
    name: "Juan",
    lastName: "Pérez",
    phone: "123456789",
    address: "Calle Falsa 123",
    street: "Calle Falsa",
    number: "123",
    province: "Buenos Aires",
    city: "CABA",
    postalCode: "1000",
    saveAddress: true,
    sameForBilling: true,
    totalOrders: 3,
    totalSpent: 45000,
    firstOrderDate: "2024-01-15",
    lastOrderDate: "2024-06-20",
    orders: [
      {
        orderId: "ord-001",
        total: 25000,
        status: "captured",
        createdAt: "2024-06-20",
      },
    ],
    status: "active",
  },
];

/* -------------------------------------------------------------------------- */
/*  Tests                                                                     */
/* -------------------------------------------------------------------------- */

describe("AdminCustomers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders customer data after loading", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          items: mockCustomers,
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(<AdminCustomers />);

    // Loading indicator is shown initially
    expect(screen.getByText("Cargando...")).toBeInTheDocument();

    // Wait for data to appear — name + lastName are rendered in one <p>
    await waitFor(() => {
      expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
    });

    expect(screen.getByText("juan@test.com")).toBeInTheDocument();
    expect(screen.getByText("123456789")).toBeInTheDocument();
    // Component uses "clientes" for singular too (no pluralization)
    expect(screen.getByText("1 clientes registrados")).toBeInTheDocument();
  });

  it("shows empty state when no customers", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          items: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(<AdminCustomers />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "No hay clientes registrados. Cuando alguien realice una compra, aparecerá aquí automáticamente."
        )
      ).toBeInTheDocument();
    });
  });

  it("shows error state with retry button", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("Network error"));
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(<AdminCustomers />);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /Reintentar/i })
    ).toBeInTheDocument();
  });
});
