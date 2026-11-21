import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  verifyToken: vi.fn(),
  findById: vi.fn(),
  delete: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/jwt", () => ({
  verifyToken: mocks.verifyToken,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/api/repository/product.repository", () => ({
  productRepository: {
    findById: mocks.findById,
    delete: mocks.delete,
  },
}));

import { DELETE } from "../../../app/api/products/[id]/route";

const productId = "507f1f77bcf86cd799439011";
const product = {
  _id: productId,
  name: "Producto a borrar",
  slug: "producto-a-borrar",
  description: "Producto temporal",
  price: 100,
  costPrice: 80,
  profitMargin: 25,
  currency: "USD",
  stock: 2,
  inStock: true,
  status: "active",
  categories: ["test"],
  imageUrls: [],
  cloudinaryUrls: [],
  createdAt: new Date("2025-01-01T00:00:00Z"),
  updatedAt: new Date("2025-01-01T00:00:00Z"),
};

function request(token?: string) {
  const headers = new Headers();
  if (token) headers.set("cookie", `admin-token=${token}`);
  return new NextRequest(
    new URL(`http://localhost/api/products/${productId}`, "http://localhost"),
    { method: "DELETE", headers }
  );
}

function params() {
  return { params: Promise.resolve({ id: productId }) };
}

describe("DELETE /api/products/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findById.mockResolvedValue(product);
    mocks.delete.mockResolvedValue(undefined);
  });

  it("rejects an unauthenticated delete", async () => {
    const response = await DELETE(request(), params());

    expect(response.status).toBe(401);
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("rejects a regular-user delete", async () => {
    mocks.verifyToken.mockResolvedValue({ role: "user", userId: "user-1" });

    const response = await DELETE(request("token"), params());

    expect(response.status).toBe(403);
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("allows an administrator to permanently delete a product", async () => {
    mocks.verifyToken.mockResolvedValue({ role: "admin", userId: "admin-1" });

    const response = await DELETE(request("token"), params());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(mocks.delete).toHaveBeenCalledWith(productId);
  });

  it("invalidates every affected category path", async () => {
    mocks.verifyToken.mockResolvedValue({ role: "admin", userId: "admin-1" });
    mocks.findById.mockResolvedValue({
      ...product,
      categories: ["perifericos", "teclados"],
    });

    const response = await DELETE(request("token"), params());

    expect(response.status).toBe(200);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/categorias/perifericos");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/categorias/teclados");
  });

  it("returns not found without deleting a missing product", async () => {
    mocks.verifyToken.mockResolvedValue({ role: "admin", userId: "admin-1" });
    mocks.findById.mockResolvedValue(null);

    const response = await DELETE(request("token"), params());

    expect(response.status).toBe(404);
    expect(mocks.delete).not.toHaveBeenCalled();
  });
});
