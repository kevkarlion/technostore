import { describe, it, expect, vi, afterEach } from "vitest";
import { screen, waitFor, fireEvent, within } from "@testing-library/react";
import { renderWithProviders, mockFetch } from "@/__tests__/utils";
import { useAdminStore } from "@/store/admin-store";
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
    // Resetear el navState del store para que no se filtre entre tests
    useAdminStore.getState().resetAllNavState();
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

  it("search debounce resets page to 1", async () => {
    // Partimos en página 2
    useAdminStore.getState().setNavState("products", { page: 2 });

    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          items: mockProducts,
          total: 30,
          page: 2,
          limit: 15,
          totalPages: 3,
        }),
    });
    vi.stubGlobal("fetch", fetch);

    renderWithProviders(<AdminProducts />);

    await waitFor(() => {
      expect(
        screen.getAllByText("Teclado Mecánico RGB").length
      ).toBeGreaterThan(0);
    });

    const searchInput = screen.getByPlaceholderText("Buscar productos...");
    fireEvent.change(searchInput, { target: { value: "teclado" } });

    // El debounce (350ms) dispara setNavState({ search, page: 1 })
    await waitFor(
      () => {
        const calls = vi.mocked(fetch).mock.calls;
        const lastUrl = calls[calls.length - 1]?.[0] as string;
        expect(lastUrl).toContain("page=1");
        expect(lastUrl).toContain("search=teclado");
      },
      { timeout: 2000 }
    );
  });

  it("status filter change resets page to 1", async () => {
    // Partimos en página 2
    useAdminStore.getState().setNavState("products", { page: 2 });

    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          items: mockProducts,
          total: 30,
          page: 2,
          limit: 15,
          totalPages: 3,
        }),
    });
    vi.stubGlobal("fetch", fetch);

    renderWithProviders(<AdminProducts />);

    await waitFor(() => {
      expect(
        screen.getAllByText("Teclado Mecánico RGB").length
      ).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole("button", { name: /Activos/i }));

    await waitFor(() => {
      const calls = vi.mocked(fetch).mock.calls;
      const lastUrl = calls[calls.length - 1]?.[0] as string;
      expect(lastUrl).toContain("page=1");
      expect(lastUrl).toContain("status=active");
    });
  });

  it("modal onSuccess refetches with the current page (not page 1)", async () => {
    // Partimos en página 5
    useAdminStore.getState().setNavState("products", { page: 5 });

    const fetch = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
      if (url.includes("/api/categories")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ items: [] }),
        });
      }
      if (url.includes("/api/products/prod-1") && opts?.method === "PATCH") {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({}),
        });
      }
      if (url.includes("/api/products/prod-1")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              id: "prod-1",
              name: "Teclado Mecánico RGB",
              price: 89.99,
              costPrice: 50,
              profitMargin: 20,
              currency: "USD",
              stock: 15,
              inStock: true,
              status: "active",
              categories: ["Periféricos"],
              imageUrls: [],
              cloudinaryUrls: [],
            }),
        });
      }
      // Listado de productos
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            items: mockProducts,
            total: 30,
            page: 5,
            limit: 15,
            totalPages: 5,
          }),
      });
    });
    vi.stubGlobal("fetch", fetch);

    renderWithProviders(<AdminProducts />);

    await waitFor(() => {
      expect(
        screen.getAllByText("Teclado Mecánico RGB").length
      ).toBeGreaterThan(0);
    });

    // Abrir el modal de edición desde la fila de la tabla
    const desktopRow = screen
      .getAllByRole("row")
      .find((row) => within(row).queryByText("Teclado Mecánico RGB"));
    expect(desktopRow).toBeDefined();
    const editButton = within(desktopRow!)
      .getAllByRole("button")
      .filter((b) => b.querySelector("svg.lucide-pen"))
      .pop();
    fireEvent.click(editButton!);

    await waitFor(() => {
      expect(
        screen.getByText("Editar Producto")
      ).toBeInTheDocument();
    });

    // Esperar a que el modal esté estable (form precargado y categorías
    // resueltas) antes de enviar, para evitar races de re-render
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Guardar Cambios/i })
      ).toBeEnabled();
    });
    fireEvent.click(screen.getByRole("button", { name: /Guardar Cambios/i }));

    // onSuccess refetchea con la página ACTUAL (5), no con la 1
    await waitFor(() => {
      const calls = vi.mocked(fetch).mock.calls;
      const lastUrl = calls[calls.length - 1]?.[0] as string;
      expect(lastUrl).toContain("/api/products?");
      expect(lastUrl).toContain("page=5");
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
