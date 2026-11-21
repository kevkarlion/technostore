import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  verifyToken: vi.fn(),
  findPaginated: vi.fn(),
  findByEmail: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/lib/auth/jwt", () => ({
  verifyToken: mocks.verifyToken,
}));

vi.mock("@/api/repository/admin-user.repository", () => ({
  adminUserRepository: {
    findPaginated: mocks.findPaginated,
    findByEmail: mocks.findByEmail,
    findById: mocks.findById,
    create: mocks.create,
    update: mocks.update,
    delete: mocks.delete,
  },
}));

import { GET, POST } from "../../../app/api/admin/users/route";
import {
  DELETE as DELETE_USER,
  PATCH as PATCH_USER,
} from "../../../app/api/admin/users/[id]/route";

const adminUser = {
  _id: "507f1f77bcf86cd799439011",
  email: "admin@test.com",
  name: "Admin",
  role: "admin" as const,
  status: "active" as const,
  passwordHash: "secret-hash",
  createdAt: new Date("2025-01-01T00:00:00Z"),
  updatedAt: new Date("2025-01-01T00:00:00Z"),
};

function request(
  path: string,
  options: {
    method?: string;
    token?: string;
    body?: unknown;
  } = {}
) {
  const headers = new Headers();
  if (options.token) headers.set("cookie", `admin-token=${options.token}`);
  if (options.body !== undefined) headers.set("content-type", "application/json");

  return new NextRequest(new URL(path, "http://localhost"), {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

function idParams() {
  return { params: Promise.resolve({ id: adminUser._id }) };
}

describe("admin user management authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findPaginated.mockResolvedValue({
      items: [adminUser],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    mocks.findByEmail.mockResolvedValue(null);
    mocks.findById.mockResolvedValue(adminUser);
    mocks.create.mockResolvedValue(adminUser);
    mocks.update.mockResolvedValue(adminUser);
    mocks.delete.mockResolvedValue(true);
  });

  it("rejects an unauthenticated user list request", async () => {
    const response = await GET(request("/api/admin/users"));

    expect(response.status).toBe(401);
    expect(mocks.findPaginated).not.toHaveBeenCalled();
  });

  it("rejects a regular user list request", async () => {
    mocks.verifyToken.mockResolvedValue({ role: "user", userId: "user-1" });

    const response = await GET(request("/api/admin/users", { token: "token" }));

    expect(response.status).toBe(403);
    expect(mocks.findPaginated).not.toHaveBeenCalled();
  });

  it("allows an administrator to list users without password hashes", async () => {
    mocks.verifyToken.mockResolvedValue({ role: "admin", userId: "admin-1" });

    const response = await GET(request("/api/admin/users", { token: "token" }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.items[0]).not.toHaveProperty("passwordHash");
  });

  it("rejects user creation by a regular user", async () => {
    mocks.verifyToken.mockResolvedValue({ role: "user", userId: "user-1" });

    const response = await POST(
      request("/api/admin/users", {
        method: "POST",
        token: "token",
        body: {
          email: "new@test.com",
          password: "secret123",
          name: "New User",
          role: "user",
        },
      })
    );

    expect(response.status).toBe(403);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("allows an administrator to create a user without returning the password hash", async () => {
    mocks.verifyToken.mockResolvedValue({ role: "admin", userId: "admin-1" });

    const response = await POST(
      request("/api/admin/users", {
        method: "POST",
        token: "token",
        body: {
          email: "new@test.com",
          password: "secret123",
          name: "New User",
          role: "user",
        },
      })
    );

    expect(response.status).toBe(201);
    expect(await response.json()).not.toHaveProperty("passwordHash");
    expect(mocks.create).toHaveBeenCalledOnce();
  });

  it("rejects user edits by a regular user", async () => {
    mocks.verifyToken.mockResolvedValue({ role: "user", userId: "user-1" });

    const response = await PATCH_USER(
      request(`/api/admin/users/${adminUser._id}`, {
        method: "PATCH",
        token: "token",
        body: { name: "Changed" },
      }),
      idParams()
    );

    expect(response.status).toBe(403);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("allows an administrator to edit a user", async () => {
    mocks.verifyToken.mockResolvedValue({ role: "admin", userId: "admin-1" });

    const response = await PATCH_USER(
      request(`/api/admin/users/${adminUser._id}`, {
        method: "PATCH",
        token: "token",
        body: { name: "Changed" },
      }),
      idParams()
    );

    expect(response.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledOnce();
  });

  it("rejects user deletion by a regular user", async () => {
    mocks.verifyToken.mockResolvedValue({ role: "user", userId: "user-1" });

    const response = await DELETE_USER(
      request(`/api/admin/users/${adminUser._id}`, {
        method: "DELETE",
        token: "token",
      }),
      idParams()
    );

    expect(response.status).toBe(403);
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("allows an administrator to delete a user", async () => {
    mocks.verifyToken.mockResolvedValue({ role: "admin", userId: "admin-1" });

    const response = await DELETE_USER(
      request(`/api/admin/users/${adminUser._id}`, {
        method: "DELETE",
        token: "token",
      }),
      idParams()
    );

    expect(response.status).toBe(200);
    expect(mocks.delete).toHaveBeenCalledWith(adminUser._id);
  });
});
