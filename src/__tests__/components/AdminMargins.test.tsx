import { describe, it, expect, vi, afterEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithProviders, mockFetch } from "@/__tests__/utils";
import AdminMargins from "@/components/admin/sections/AdminMargins";

/* -------------------------------------------------------------------------- */
/*  Fixtures                                                                  */
/* -------------------------------------------------------------------------- */

// Slugs must be valid children of the default category group
// (CATEGORY_GROUPS[0] = "almacenamiento") so they pass the group filter.
const mockCategories = [
  {
    slug: "discos-hdd",
    name: "Discos HDD",
    productCount: 2,
    defaultProfitMargin: 20,
  },
  {
    slug: "discos-ssd",
    name: "Discos SSD",
    productCount: 1,
    defaultProfitMargin: null,
  },
];

const mockProducts = [
  {
    id: "prod-1",
    name: "Teclado Mecánico RGB",
    costPrice: 50,
    price: 80,
    profitMargin: 37.5,
    category: "Periféricos",
  },
  {
    id: "prod-2",
    name: "Mouse Inalámbrico",
    costPrice: 25,
    price: 35,
    profitMargin: 28.57,
    category: "Periféricos",
  },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Creates a smart `vi.fn()` that simulates the two sequential fetch calls
 * on mount: first `/api/margins` (initial), then `/api/margins?category=X`
 * (after auto-select). Also handles PATCH calls for tests that save.
 */
function createSmartFetch() {
  return vi.fn((url: string | URL | Request) => {
    const urlStr = typeof url === "string" ? url : url.toString();

    // PATCH to a product — inline edit save
    if (urlStr.includes("/api/products/")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });
    }

    // PATCH to bulk endpoint
    if (urlStr.includes("/api/margins/bulk")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({ updatedProducts: 2 }),
      });
    }

    // Second call — products fetch after category auto-select
    if (urlStr.includes("/api/margins?category=")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            products: mockProducts,
            categories: mockCategories,
          }),
      });
    }

    // First call — initial mount fetch
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          products: [],
          categories: mockCategories,
        }),
    });
  });
}

/* -------------------------------------------------------------------------- */
/*  Tests                                                                     */
/* -------------------------------------------------------------------------- */

describe("AdminMargins", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders products table and categories table", async () => {
    const fetch = createSmartFetch();
    vi.stubGlobal("fetch", fetch);

    renderWithProviders(<AdminMargins />);

    // Wait for products to appear (second fetch)
    await waitFor(() => {
      expect(
        screen.getAllByText("Teclado Mecánico RGB").length
      ).toBeGreaterThan(0);
    });

    expect(
      screen.getAllByText("Mouse Inalámbrico").length
    ).toBeGreaterThan(0);

    // Category names render (in both table + cards)
    expect(
      screen.getAllByText("Discos HDD").length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Discos SSD").length
    ).toBeGreaterThan(0);

    // Product category text renders (from product.category field)
    expect(
      screen.getAllByText("Periféricos").length
    ).toBeGreaterThan(0);

    // Cost and price values
    expect(screen.getAllByText("$50.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$80.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$25.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$35.00").length).toBeGreaterThan(0);

    // Margin badge labels
    expect(screen.getAllByText(/Alto/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Medio/).length).toBeGreaterThan(0);
  });

  it("shows skeleton loading state", async () => {
    // Block the initial fetch so the component stays in loading state
    const fetch = vi.fn().mockReturnValue(new Promise(() => {}));
    vi.stubGlobal("fetch", fetch);

    renderWithProviders(<AdminMargins />);

    // Subtitle shows "Cargando..." when either loading flag is true
    expect(screen.getByText("Cargando...")).toBeInTheDocument();

    // Skeleton elements have the animate-pulse class
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows error state with retry button", async () => {
    const fetch = vi.fn().mockRejectedValue(new Error("Error de conexión"));
    vi.stubGlobal("fetch", fetch);

    renderWithProviders(<AdminMargins />);

    await waitFor(() => {
      expect(screen.getByText("Error de conexión")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /Reintentar/i })
    ).toBeInTheDocument();
  });

  it("margin inline edit modal opens, closes, and saves via PATCH", async () => {
    const fetch = createSmartFetch();
    vi.stubGlobal("fetch", fetch);

    renderWithProviders(<AdminMargins />);

    await waitFor(() => {
      expect(
        screen.getAllByText("Teclado Mecánico RGB").length
      ).toBeGreaterThan(0);
    });

    // Click "Editar margen" on the first product (desktop table)
    const editButtons = screen.getAllByText("Editar margen");
    fireEvent.click(editButtons[0]);

    // Modal should open — title "Editar margen" (appears alongside existing
    // buttons, so use getAllByText to accommodate the duplicate)
    expect(
      screen.getAllByText("Editar margen").length
    ).toBeGreaterThan(0);

    // Modal shows product name and cost/price info
    // (name appears in table, cards, AND modal — use getAllByText)
    expect(
      screen.getAllByText("Teclado Mecánico RGB").length
    ).toBeGreaterThan(0);
    expect(screen.getByText("Costo actual")).toBeInTheDocument();
    expect(screen.getByText("Precio actual")).toBeInTheDocument();

    // Find the margin input (type="number" → spinbutton role)
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs.length).toBeGreaterThan(0);

    // Change the margin value
    fireEvent.change(inputs[0], { target: { value: "50" } });

    // Click "Guardar margen"
    const saveButton = screen.getByText("Guardar margen");
    fireEvent.click(saveButton);

    // Verify PATCH call to `/api/products/{id}`
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

    // Verify the PATCH body contains the new margin
    const calls = vi.mocked(fetch).mock.calls;
    const patchCall = calls.find(
      ([url, opts]) =>
        typeof url === "string" &&
        url.includes("/api/products/") &&
        (opts as RequestInit)?.method === "PATCH"
    )!;
    const body = JSON.parse((patchCall[1] as RequestInit).body as string);
    expect(body).toMatchObject({ profitMargin: 50 });
  });

  it("bulk edit modal opens, closes, and applies via PATCH", async () => {
    const fetch = createSmartFetch();
    vi.stubGlobal("fetch", fetch);

    renderWithProviders(<AdminMargins />);

    await waitFor(() => {
      expect(
        screen.getAllByText("Teclado Mecánico RGB").length
      ).toBeGreaterThan(0);
    });

    // Click the "Editar" button for a category in the categories table.
    // The desktop categories table renders "Editar" buttons BEFORE the
    // product mobile cards (which also say "Editar"), so the first
    // matching button in the DOM belongs to the categories section.
    const editButtons = screen.getAllByText("Editar");
    fireEvent.click(editButtons[0]);

    // Bulk modal should open — title "Margen por Categoría"
    expect(screen.getByText("Margen por Categoría")).toBeInTheDocument();

    // Modal shows category name and product count
    // (name appears in categories table AND modal — use getAllByText)
    expect(
      screen.getAllByText(/Discos HDD/).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/2 productos/).length
    ).toBeGreaterThan(0);

    // Find the margin input and change the value
    const inputs = screen.getAllByRole("spinbutton");
    // There might be inputs from a previously closed modal or other elements
    // Filter to find one inside the bulk modal
    const bulkInput = inputs.find(
      (el) => el.closest('[class*="z-\\[100\\]"]') !== null
    ) ?? inputs[0];
    fireEvent.change(bulkInput, { target: { value: "25" } });

    // Click "Aplicar a todos los productos"
    const applyButton = screen.getByText("Aplicar a todos los productos");
    fireEvent.click(applyButton);

    // Verify PATCH call to `/api/margins/bulk`
    await waitFor(() => {
      const calls = vi.mocked(fetch).mock.calls;
      const patchCall = calls.find(
        ([url, opts]) =>
          typeof url === "string" &&
          url.includes("/api/margins/bulk") &&
          (opts as RequestInit)?.method === "PATCH"
      );
      expect(patchCall).toBeDefined();
    });

    // Verify the PATCH body contains the category slug and margin value
    const calls = vi.mocked(fetch).mock.calls;
    const patchCall = calls.find(
      ([url, opts]) =>
        typeof url === "string" &&
        url.includes("/api/margins/bulk") &&
        (opts as RequestInit)?.method === "PATCH"
    )!;
    const body = JSON.parse((patchCall[1] as RequestInit).body as string);
    expect(body).toMatchObject({
      categorySlug: "discos-hdd",
      profitMargin: 25,
    });
  });
});
