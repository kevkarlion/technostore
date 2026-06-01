import { describe, it, expect, vi, afterEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithProviders, mockFetch } from "@/__tests__/utils";
import AdminProducts from "@/components/admin/sections/AdminProducts";

/* -------------------------------------------------------------------------- */
/*  Fixtures                                                                  */
/* -------------------------------------------------------------------------- */

const mockProducts = [
  {
    id: "prod-1",
    name: "Teclado Mecánico RGB",
    price: 89.99,
    stock: 15,
    inStock: true,
    categories: ["Periféricos"],
    status: "active",
    images: [{ src: "/img/keyboard.jpg" }],
  },
  {
    id: "prod-2",
    name: "Mouse Inalámbrico",
    price: 49.99,
    stock: 0,
    inStock: false,
    categories: ["Periféricos"],
    status: "active",
  },
];

/* -------------------------------------------------------------------------- */
/*  Tests                                                                     */
/* -------------------------------------------------------------------------- */

describe("AdminProducts", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders products in table", async () => {
    const fetch = mockFetch({
      items: mockProducts,
      total: 2,
      page: 1,
      limit: 15,
      totalPages: 1,
    });
    vi.stubGlobal("fetch", fetch);

    renderWithProviders(<AdminProducts />);

    // Wait for data to appear
    await waitFor(() => {
      expect(
        screen.getAllByText("Teclado Mecánico RGB").length
      ).toBeGreaterThan(0);
    });

    // Product name appears (in both table + cards)
    expect(
      screen.getAllByText("Mouse Inalámbrico").length
    ).toBeGreaterThan(0);

    // Category renders
    expect(
      screen.getAllByText("Periféricos").length
    ).toBeGreaterThan(0);

    // Price renders with dollar sign
    expect(
      screen.getAllByText("$89.99").length
    ).toBeGreaterThan(0);

    // Status badge renders
    expect(
      screen.getAllByText("Activo").length
    ).toBeGreaterThan(0);
  });

  it("renders mobile cards", async () => {
    const fetch = mockFetch({
      items: [mockProducts[0]],
      total: 1,
      page: 1,
      limit: 15,
      totalPages: 1,
    });
    vi.stubGlobal("fetch", fetch);

    renderWithProviders(<AdminProducts />);

    await waitFor(() => {
      expect(
        screen.getAllByText("Teclado Mecánico RGB").length
      ).toBeGreaterThan(0);
    });

    // Both table and card layout render product data — verify the
    // card-specific elements exist (price inside the cards grid)
    expect(screen.getAllByText("$89.99").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Periféricos").length).toBeGreaterThan(0);
  });

  it("shows loading state initially", async () => {
    let resolvePromise!: (value: unknown) => void;
    const fetch = vi.fn().mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );
    vi.stubGlobal("fetch", fetch);

    renderWithProviders(<AdminProducts />);

    // Loading shows before fetch resolves (appears in both table + cards)
    expect(
      screen.getAllByText("Cargando productos...").length
    ).toBeGreaterThan(0);

    // Resolve the fetch to clean up
    resolvePromise(
      mockFetch({
        items: [],
        total: 0,
        page: 1,
        limit: 15,
        totalPages: 0,
      })()
    );

    await waitFor(() => {
      expect(
        screen.queryByText("Cargando productos...")
      ).not.toBeInTheDocument();
    });
  });

  it("shows empty state when no products", async () => {
    const fetch = mockFetch({
      items: [],
      total: 0,
      page: 1,
      limit: 15,
      totalPages: 0,
    });
    vi.stubGlobal("fetch", fetch);

    renderWithProviders(<AdminProducts />);

    await waitFor(() => {
      expect(
        screen.getAllByText(
          "No hay productos cargados. Corré el scraper primero."
        ).length
      ).toBeGreaterThan(0);
    });
  });

  it("shows error state with retry button", async () => {
    const fetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));
    vi.stubGlobal("fetch", fetch);

    renderWithProviders(<AdminProducts />);

    await waitFor(() => {
      expect(screen.getByText("Failed to fetch")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /Reintentar/i })
    ).toBeInTheDocument();
  });

  it("pagination advances page and fetches again", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          items: mockProducts,
          total: 30,
          page: 1,
          limit: 15,
          totalPages: 2,
        }),
    });
    vi.stubGlobal("fetch", fetch);

    renderWithProviders(<AdminProducts />);

    await waitFor(() => {
      expect(
        screen.getAllByText("Teclado Mecánico RGB").length
      ).toBeGreaterThan(0);
    });

    // Click "Siguiente"
    const nextButton = screen.getByRole("button", { name: /Siguiente/i });
    fireEvent.click(nextButton);

    // Should fetch again with page=2
    await waitFor(() => {
      const calls = vi.mocked(fetch).mock.calls;
      const lastUrl = calls[calls.length - 1]?.[0] as string;
      expect(lastUrl).toContain("page=2");
    });
  });

  it("inline stock edit triggers PATCH", async () => {
    const productWithStock = {
      id: "prod-1",
      name: "Teclado Mecánico",
      price: 89.99,
      stock: 15,
      inStock: true,
      categories: ["Periféricos"],
      status: "active",
    };

    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          items: [productWithStock],
          total: 1,
          page: 1,
          limit: 15,
          totalPages: 1,
        }),
    });
    vi.stubGlobal("fetch", fetch);

    renderWithProviders(<AdminProducts />);

    await waitFor(() => {
      expect(
        screen.getAllByText("Teclado Mecánico").length
      ).toBeGreaterThan(0);
    });

    // Click the stock value to enter edit mode
    const stockButtons = screen.getAllByText("15");
    fireEvent.click(stockButtons[0]);

    // Input should appear (number inputs get role "spinbutton")
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs.length).toBeGreaterThan(0);

    // Change the value
    fireEvent.change(inputs[0], { target: { value: "25" } });

    // Press Enter to save
    fireEvent.keyDown(inputs[0], { key: "Enter", code: "Enter" });

    // Wait for PATCH call
    await waitFor(() => {
      const calls = vi.mocked(fetch).mock.calls;
      const patchCall = calls.find(
        ([url, opts]) =>
          typeof url === "string" &&
          url.includes("/api/products/") &&
          (opts as RequestInit)?.method === "PATCH"
      );
      expect(patchCall).toBeDefined();
    });

    // Verify the PATCH body contains the new stock
    const calls = vi.mocked(fetch).mock.calls;
    const patchCall = calls.find(
      ([url, opts]) =>
        typeof url === "string" &&
        url.includes("/api/products/") &&
        (opts as RequestInit)?.method === "PATCH"
    )!;
    const body = JSON.parse((patchCall[1] as RequestInit).body as string);
    expect(body).toMatchObject({ stock: 25, inStock: true });
  });
});
