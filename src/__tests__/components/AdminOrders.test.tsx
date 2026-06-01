import { describe, it, expect, vi, afterEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithProviders, mockFetch } from "@/__tests__/utils";
import AdminOrders from "@/components/admin/sections/AdminOrders";
import type { Order } from "@/domain/models/order";

/* -------------------------------------------------------------------------- */
/*  Fixtures                                                                  */
/* -------------------------------------------------------------------------- */

const mockOrders: Order[] = [
  {
    _id: "ord-1" as any,
    orderId: "ORD-001-ABC-12345-XYZ",
    externalReference: "ref-001",
    status: "reserved",
    items: [
      {
        productId: "p1",
        productName: "Teclado",
        quantity: 2,
        unitPrice: 50,
      },
    ],
    totals: {
      subtotal: 100,
      shipping: 10,
      taxes: 0,
      total: 110,
    },
    customer: {
      name: "Juan",
      lastName: "Pérez",
      email: "juan@test.com",
      phone: "123456789",
      address: "Calle Falsa 123",
      street: "Calle Falsa",
      number: "123",
      province: "Buenos Aires",
      city: "CABA",
      postalCode: "1000",
      saveAddress: true,
      sameForBilling: true,
    },
    payment: {
      paymentId: "ORDABC1234567890",
    },
    timeline: [
      {
        status: "reserved",
        timestamp: new Date().toISOString(),
      },
    ],
    createdAt: new Date("2025-06-01T10:00:00"),
    updatedAt: new Date("2025-06-01T10:00:00"),
  },
  {
    _id: "ord-2" as any,
    orderId: "ORD-002-DEF-67890-UVW",
    externalReference: "ref-002",
    status: "captured",
    items: [
      {
        productId: "p2",
        productName: "Mouse",
        quantity: 1,
        unitPrice: 30,
      },
    ],
    totals: {
      subtotal: 30,
      shipping: 5,
      taxes: 0,
      total: 35,
    },
    customer: {
      name: "María",
      lastName: "González",
      email: "maria@test.com",
      phone: "987654321",
      address: "Av. Siempre Viva 456",
      street: "Av. Siempre Viva",
      number: "456",
      province: "CABA",
      city: "CABA",
      postalCode: "2000",
      saveAddress: true,
      sameForBilling: true,
    },
    timeline: [
      {
        status: "captured",
        timestamp: new Date().toISOString(),
      },
    ],
    createdAt: new Date("2025-06-02T14:30:00"),
    updatedAt: new Date("2025-06-02T14:30:00"),
  },
];

/* -------------------------------------------------------------------------- */
/*  Tests                                                                     */
/* -------------------------------------------------------------------------- */

describe("AdminOrders", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders orders in table", async () => {
    const fetch = mockFetch({
      items: mockOrders,
      total: 2,
      page: 1,
      totalPages: 1,
    });
    vi.stubGlobal("fetch", fetch);

    renderWithProviders(<AdminOrders />);

    // Wait for data to appear — customer name renders in both table and cards
    await waitFor(() => {
      expect(
        screen.getAllByText("Juan Pérez").length
      ).toBeGreaterThan(0);
    });

    expect(
      screen.getAllByText("María González").length
    ).toBeGreaterThan(0);

    // Order ID appears (truncated: table uses substring(0,20), cards use # + substring(0,12))
    expect(
      screen.getAllByText(/ORD-001-ABC-/).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/ORD-002-DEF-/).length
    ).toBeGreaterThan(0);

    // Status badges render
    expect(screen.getAllByText("Reservado").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cobrado").length).toBeGreaterThan(0);

    // Customer email renders
    expect(screen.getAllByText("juan@test.com").length).toBeGreaterThan(0);
    expect(screen.getAllByText("maria@test.com").length).toBeGreaterThan(0);
  });

  it("renders mobile cards", async () => {
    const fetch = mockFetch({
      items: [mockOrders[0]],
      total: 1,
      page: 1,
      totalPages: 1,
    });
    vi.stubGlobal("fetch", fetch);

    renderWithProviders(<AdminOrders />);

    await waitFor(() => {
      expect(
        screen.getAllByText("Juan Pérez").length
      ).toBeGreaterThan(0);
    });

    // Card-specific: items count and order ID with hash prefix
    expect(
      screen.getAllByText(/1 item/).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/ORD-001-ABC-/).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("juan@test.com").length
    ).toBeGreaterThan(0);
  });

  it("shows loading state", async () => {
    let resolvePromise!: (value: unknown) => void;
    const fetch = vi.fn().mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );
    vi.stubGlobal("fetch", fetch);

    renderWithProviders(<AdminOrders />);

    // Loading shows before fetch resolves (appears in both table + cards)
    expect(
      screen.getAllByText("Cargando pedidos...").length
    ).toBeGreaterThan(0);

    // Resolve the fetch to clean up
    resolvePromise(
      mockFetch({
        items: [],
        total: 0,
        page: 1,
        totalPages: 0,
      })()
    );

    await waitFor(() => {
      expect(
        screen.queryByText("Cargando pedidos...")
      ).not.toBeInTheDocument();
    });
  });

  it("shows empty state when no orders", async () => {
    const fetch = mockFetch({
      items: [],
      total: 0,
      page: 1,
      totalPages: 0,
    });
    vi.stubGlobal("fetch", fetch);

    renderWithProviders(<AdminOrders />);

    await waitFor(() => {
      expect(
        screen.getAllByText(
          "No hay pedidos registrados. Completá una compra en la tienda para verlos aquí."
        ).length
      ).toBeGreaterThan(0);
    });
  });

  it("pagination buttons work", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          items: mockOrders,
          total: 30,
          page: 1,
          totalPages: 2,
        }),
    });
    vi.stubGlobal("fetch", fetch);

    renderWithProviders(<AdminOrders />);

    await waitFor(() => {
      expect(
        screen.getAllByText("Juan Pérez").length
      ).toBeGreaterThan(0);
    });

    // Click "Siguiente"
    const nextButton = screen.getByRole("button", { name: /Siguiente/i });
    fireEvent.click(nextButton);

    // Should fetch with page=2
    await waitFor(() => {
      const calls = vi.mocked(fetch).mock.calls;
      const lastUrl = calls[calls.length - 1]?.[0] as string;
      expect(lastUrl).toContain("page=2");
    });
  });
});
