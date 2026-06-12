import { vi, describe, it, expect, beforeEach } from "vitest";

/* -------------------------------------------------------------------------- */
/*  Module-level mock for getDb() — vi.hoisted is REQUIRED by Vitest         */
/* -------------------------------------------------------------------------- */

const mockFindOneAndUpdate = vi.hoisted(() => vi.fn());
const mockFindOne = vi.hoisted(() => vi.fn());
const mockUpdateOne = vi.hoisted(() => vi.fn());

vi.mock("@/config/db", () => ({
  getDb: vi.fn().mockResolvedValue({
    collection: vi.fn().mockReturnValue({
      findOneAndUpdate: mockFindOneAndUpdate,
      findOne: mockFindOne,
      updateOne: mockUpdateOne,
    }),
  }),
}));

// Must import AFTER vi.mock
import { productRepository } from "@/api/repository/product.repository";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function makeProductDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: "507f1f77bcf86cd799439011",
    name: "Producto Manual",
    stock: 5,
    inStock: true,
    status: "active",
    ...overrides,
  };
}

/* -------------------------------------------------------------------------- */
/*  decrementStock                                                            */
/* -------------------------------------------------------------------------- */

describe("productRepository.decrementStock()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("decrements stock atomically with $inc", async () => {
    mockFindOneAndUpdate.mockResolvedValue(makeProductDoc({ stock: 4 }));

    const result = await productRepository.decrementStock(
      "507f1f77bcf86cd799439011",
      1
    );

    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      { _id: expect.anything() },
      { $inc: { stock: -1 } },
      { returnDocument: "after" }
    );
    expect(result).toEqual({ stock: 4, inStock: true });
  });

  it("decrements by multiple quantities", async () => {
    mockFindOneAndUpdate.mockResolvedValue(makeProductDoc({ stock: 3 }));

    const result = await productRepository.decrementStock(
      "507f1f77bcf86cd799439011",
      2
    );

    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      { _id: expect.anything() },
      { $inc: { stock: -2 } },
      { returnDocument: "after" }
    );
    expect(result).toEqual({ stock: 3, inStock: true });
  });

  it("sets inStock to false when stock reaches 0", async () => {
    mockFindOneAndUpdate.mockResolvedValue(makeProductDoc({ stock: 0 }));

    const result = await productRepository.decrementStock(
      "507f1f77bcf86cd799439011",
      1
    );

    // Should set inStock: false when stock drops to 0
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { _id: expect.anything() },
      { $set: { inStock: false } }
    );
    expect(result).toEqual({ stock: 0, inStock: false });
  });

  it("sets inStock to false when stock goes below 0", async () => {
    mockFindOneAndUpdate.mockResolvedValue(makeProductDoc({ stock: -2 }));

    const result = await productRepository.decrementStock(
      "507f1f77bcf86cd799439011",
      7
    );

    expect(mockUpdateOne).toHaveBeenCalledWith(
      { _id: expect.anything() },
      { $set: { inStock: false } }
    );
    expect(result).toEqual({ stock: -2, inStock: false });
  });

  it("returns null if product is not found", async () => {
    mockFindOneAndUpdate.mockResolvedValue(null);

    const result = await productRepository.decrementStock(
      "507f1f77bcf86cd799439011",
      1
    );

    expect(result).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/*  isManualProduct                                                           */
/* -------------------------------------------------------------------------- */

describe("productRepository.isManualProduct()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true when product has no externalId", async () => {
    mockFindOne.mockResolvedValue(makeProductDoc());

    const result = await productRepository.isManualProduct(
      "507f1f77bcf86cd799439011"
    );

    expect(result).toBe(true);
  });

  it("returns false when product has externalId (scraped)", async () => {
    mockFindOne.mockResolvedValue(
      makeProductDoc({ externalId: "ext-001", supplier: "proveedor-x" })
    );

    const result = await productRepository.isManualProduct(
      "507f1f77bcf86cd799439011"
    );

    expect(result).toBe(false);
  });

  it("returns false when product is not found", async () => {
    mockFindOne.mockResolvedValue(null);

    const result = await productRepository.isManualProduct(
      "507f1f77bcf86cd799439011"
    );

    expect(result).toBe(false);
  });

  it("projects only externalId for efficiency", async () => {
    mockFindOne.mockResolvedValue(makeProductDoc());

    await productRepository.isManualProduct(
      "507f1f77bcf86cd799439011"
    );

    expect(mockFindOne).toHaveBeenCalledWith(
      { _id: expect.anything() },
      { projection: { externalId: 1 } }
    );
  });
});
