import { describe, it, expect, vi, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/__tests__/utils";
import AdminContabilidad from "@/components/admin/sections/AdminContabilidad";
import type { ContabilidadResponse } from "@/domain/dto/contabilidad.dto";

/* -------------------------------------------------------------------------- */
/*  Fixtures                                                                  */
/* -------------------------------------------------------------------------- */

const singleOrderResponse: ContabilidadResponse = {
  items: [
    {
      orderId: "ord-001",
      _id: "abc123def456",
      customer: {
        name: "Juan",
        lastName: "Pérez",
        email: "juan@test.com",
      },
      items: [
        {
          productId: "p1",
          productName: "Product A",
          quantity: 2,
          unitPrice: 100,
          costPrice: 50,
          gain: 100,
          marginPct: 100,
        },
      ],
      totals: { subtotal: 200, shipping: 10, taxes: 44.1, total: 254.1 },
      totalCost: 100,
      totalGain: 100,
      avgMargin: 100,
      unpricedCount: 0,
      createdAt: "2024-06-20T10:00:00.000Z",
      status: "captured",
    },
  ],
  totals: {
    totalOrders: 1,
    totalRevenue: 254.1,
    totalCosts: 100,
    totalProfit: 100,
    avgMargin: 100,
    unpricedOrders: 0,
    unpricedItemCount: 0,
  },
  page: 1,
  limit: 18,
  totalPages: 1,
  total: 1,
};

const emptyResponse: ContabilidadResponse = {
  items: [],
  totals: {
    totalOrders: 0,
    totalRevenue: 0,
    totalCosts: 0,
    totalProfit: 0,
    avgMargin: null,
    unpricedOrders: 0,
    unpricedItemCount: 0,
  },
  page: 1,
  limit: 18,
  totalPages: 0,
  total: 0,
};

const paginatedResponse: ContabilidadResponse = {
  ...singleOrderResponse,
  totalPages: 3,
  total: 42,
};

/* -------------------------------------------------------------------------- */
/*  Tests                                                                     */
/* -------------------------------------------------------------------------- */

describe("AdminContabilidad", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders summary cards with data", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(singleOrderResponse),
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(<AdminContabilidad />);

    // StatCard labels should always be visible
    expect(screen.getByText("Órdenes")).toBeInTheDocument();
    expect(screen.getByText("Ingresos")).toBeInTheDocument();
    expect(screen.getByText("Costos")).toBeInTheDocument();
    expect(screen.getByText("Ganancia Neta")).toBeInTheDocument();

    // Wait for data to load and verify customer appears in the table/cards
    // Name renders in both desktop <p> and mobile <span> => use getAllByText
    await waitFor(() => {
      const elements = screen.getAllByText("Juan Pérez");
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    expect(
      screen.getByText("1 orden en el período")
    ).toBeInTheDocument();
  });

  it("shows loading state while fetching", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(new Promise(() => {}))
    );

    renderWithProviders(<AdminContabilidad />);

    // "Cargando..." appears in header, desktop table, and mobile cards
    const loadingElements = screen.getAllByText("Cargando...");
    expect(loadingElements.length).toBeGreaterThanOrEqual(1);
  });

  it("shows error state with retry button", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Error de conexión"))
    );

    renderWithProviders(<AdminContabilidad />);

    await waitFor(() => {
      expect(screen.getByText("Error de conexión")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /Reintentar/i })
    ).toBeInTheDocument();
  });

  it("shows empty state when no orders", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(emptyResponse),
      })
    );

    renderWithProviders(<AdminContabilidad />);

    await waitFor(() => {
      // Empty message appears in both desktop table and mobile cards
      const elements = screen.getAllByText(
        "No se encontraron órdenes en el rango seleccionado"
      );
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows pagination controls when totalPages > 1", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(paginatedResponse),
      })
    );

    renderWithProviders(<AdminContabilidad />);

    await waitFor(() => {
      expect(screen.getByText("Siguiente →")).toBeInTheDocument();
    });

    expect(screen.getByText("← Anterior")).toBeInTheDocument();
    expect(screen.getByText(/Página 1 de 3/)).toBeInTheDocument();
  });

  it("advances page when next button is clicked", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(paginatedResponse),
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(<AdminContabilidad />);

    // Wait for pagination to render
    await waitFor(() => {
      expect(screen.getByText("Siguiente →")).toBeInTheDocument();
    });

    // Prepare next page mock
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          ...paginatedResponse,
          page: 2,
          items: [
            {
              ...paginatedResponse.items[0],
              orderId: "ord-002",
              customer: {
                name: "María",
                lastName: "García",
                email: "maria@test.com",
              },
            },
          ],
        }),
    });

    await userEvent.click(screen.getByText("Siguiente →"));

    // Verify fetch was called with page=2
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("page=2")
      );
    });

    // Name appears in both desktop table and mobile cards
    await waitFor(() => {
      const elements = screen.getAllByText("María García");
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("renders date filter inputs", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(singleOrderResponse),
      })
    );

    renderWithProviders(<AdminContabilidad />);

    const dateInputs = screen.getAllByDisplayValue(/2026/);
    expect(dateInputs.length).toBeGreaterThanOrEqual(1);
  });
});
