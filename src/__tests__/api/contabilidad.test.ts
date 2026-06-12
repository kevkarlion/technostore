import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

/* -------------------------------------------------------------------------- */
/*  Module-level mock for getDb()                                             */
/*  IMPORTANT: vi.mock is hoisted above imports by Vitest.                    */
/* -------------------------------------------------------------------------- */

const mockCollection = vi.hoisted(() => ({
  find: vi.fn().mockReturnThis(),
  sort: vi.fn().mockReturnThis(),
  skip: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  toArray: vi.fn(),
  countDocuments: vi.fn(),
  aggregate: vi.fn().mockReturnThis(),
}));

vi.mock("@/config/db", () => ({
  getDb: vi.fn().mockResolvedValue({
    collection: vi.fn().mockReturnValue(mockCollection),
  }),
}));

// Import MUST come after vi.mock — Vitest hoists it, but keep ordering clear
import { GET } from "../../../app/api/admin/contabilidad/route";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function makeRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost"));
}

function makeOrderDoc(overrides: Record<string, unknown> = {}) {
  return {
    orderId: "ord-001",
    _id: "abc123def456",
    customer: { name: "Juan", lastName: "Pérez", email: "juan@test.com" },
      items: [
        {
          productId: "000000000000000000000001",
          productName: "Product A",
          quantity: 2,
          unitPrice: 100,
          costPrice: 50,
        },
      ],
    totals: { subtotal: 200, shipping: 10, taxes: 44.1, total: 254.1 },
    createdAt: new Date("2024-06-20T10:00:00Z"),
    status: "captured",
    ...overrides,
  };
}

/* -------------------------------------------------------------------------- */
/*  Tests                                                                     */
/* -------------------------------------------------------------------------- */

describe("GET /api/admin/contabilidad", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns filtered results with date params and calculates totals", async () => {
    const doc = makeOrderDoc();
    mockCollection.toArray
      .mockResolvedValueOnce([doc]) // find().toArray()
      .mockResolvedValueOnce([
        { totalOrders: 1, totalRevenue: 254.1 },
      ]) // first aggregate
      .mockResolvedValueOnce([
        {
          totalOrders: 1,
          totalRevenue: 254.1,
          totalCosts: 100,
          totalProfit: 154.1,
          unpricedOrders: 0,
          unpricedItemCount: 0,
        },
      ]); // second aggregate
    mockCollection.countDocuments.mockResolvedValue(1);

    const req = makeRequest(
      "/api/admin/contabilidad?startDate=2024-01-01&endDate=2024-12-31&page=1&limit=20"
    );
    const res = await GET(req);

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].orderId).toBe("ord-001");
    expect(body.items[0].customer.name).toBe("Juan");
    expect(body.totals.totalOrders).toBe(1);
    expect(body.totals.totalRevenue).toBe(254.1);
    expect(body.totals.totalProfit).toBeGreaterThan(0);
    expect(body.page).toBe(1);
    expect(body.total).toBe(1);
  });

  it("returns empty response for empty collection", async () => {
    mockCollection.toArray.mockResolvedValueOnce([]); // find returns empty
    mockCollection.countDocuments.mockResolvedValue(0);

    const req = makeRequest("/api/admin/contabilidad");
    const res = await GET(req);

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.items).toHaveLength(0);
    expect(body.totals.totalOrders).toBe(0);
    expect(body.totals.totalRevenue).toBe(0);
    expect(body.total).toBe(0);
    expect(body.totalPages).toBe(0);
  });

  it("returns 400 for invalid page parameter", async () => {
    const req = makeRequest(
      "/api/admin/contabilidad?page=-1"
    );
    const res = await GET(req);

    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.message).toBe("Parámetros inválidos");
  });

  it("returns 400 for non-numeric page parameter", async () => {
    const req = makeRequest(
      "/api/admin/contabilidad?page=abc"
    );
    const res = await GET(req);

    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.message).toBe("Parámetros inválidos");
  });

  it("applies pagination skip/limit based on page param", async () => {
    const doc = makeOrderDoc();
    mockCollection.toArray
      .mockResolvedValueOnce([doc])
      .mockResolvedValueOnce([
        { totalOrders: 1, totalRevenue: 254.1 },
      ])
      .mockResolvedValueOnce([
        {
          totalOrders: 1,
          totalRevenue: 254.1,
          totalCosts: 100,
          totalProfit: 154.1,
          unpricedOrders: 0,
          unpricedItemCount: 0,
        },
      ]);
    mockCollection.countDocuments.mockResolvedValue(50);

    const req = makeRequest(
      "/api/admin/contabilidad?page=3&limit=10"
    );
    await GET(req);

    expect(mockCollection.skip).toHaveBeenCalledWith(20); // (3-1) * 10
    expect(mockCollection.limit).toHaveBeenCalledWith(10);
  });

  it("uses default 30-day range when no dates provided", async () => {
    mockCollection.toArray.mockResolvedValueOnce([]);
    mockCollection.countDocuments.mockResolvedValue(0);

    const req = makeRequest("/api/admin/contabilidad");
    await GET(req);

    // find should have been called with a createdAt filter + only captured status
    expect(mockCollection.find).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "captured",
        createdAt: expect.objectContaining({
          $gte: expect.any(Date),
        }),
      })
    );
  });

  it("only returns captured orders in contabilidad", async () => {
    mockCollection.toArray.mockResolvedValueOnce([]);
    mockCollection.countDocuments.mockResolvedValue(0);

    const req = makeRequest("/api/admin/contabilidad");
    await GET(req);

    // The filter MUST include status: "captured" — non-captured orders
    // (pending, reserved, failed, etc.) should never appear in accounting
    expect(mockCollection.find).toHaveBeenCalledWith(
      expect.objectContaining({ status: "captured" })
    );
  });
});
