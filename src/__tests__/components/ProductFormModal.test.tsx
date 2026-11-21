import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ProductFormModal from "@/components/admin/ProductFormModal";

function mockProductApi() {
  return vi.fn((url: string | URL | Request, options?: RequestInit) => {
    const href = typeof url === "string" ? url : url.toString();

    if (href.includes("/api/categories")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ items: [] }),
      });
    }

    if (href.includes("/api/products") && options?.method === "POST") {
      return Promise.resolve({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: "created-product" }),
      });
    }

    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ items: [] }),
    });
  });
}

describe("ProductFormModal", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends the entered cost price when creating a product", async () => {
    const fetch = mockProductApi();
    vi.stubGlobal("fetch", fetch);

    render(
      <ProductFormModal open onClose={vi.fn()} onSuccess={vi.fn()} />
    );

    fireEvent.change(screen.getByPlaceholderText("Nombre del producto"), {
      target: { value: "Producto manual" },
    });
    fireEvent.change(screen.getByPlaceholderText("0.00"), {
      target: { value: "42.50" },
    });
    fireEvent.change(screen.getAllByPlaceholderText("0")[0], {
      target: { value: "25" },
    });
    fireEvent.change(screen.getAllByPlaceholderText("0")[1], {
      target: { value: "3" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Crear Producto" }));

    await waitFor(() => {
      const createCall = fetch.mock.calls.find(
        ([url, options]) =>
          typeof url === "string" &&
          url.endsWith("/api/products") &&
          options?.method === "POST"
      );
      expect(createCall).toBeDefined();

      const body = JSON.parse(
        (createCall?.[1] as RequestInit).body as string
      );
      expect(body).toMatchObject({
        name: "Producto manual",
        costPrice: 42.5,
        profitMargin: 25,
        stock: 3,
        inStock: true,
      });
    });
  });
});
