import type { ObjectId } from "mongodb";

export type AdminRole = "user" | "admin";
export type AdminStatus = "active" | "inactive";

export interface AdminUser {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  role: AdminRole;
  status: AdminStatus;
  createdAt: Date;
  updatedAt: Date;
}

/** Public-facing shape — never includes passwordHash */
export type AdminUserPublic = Omit<AdminUser, "passwordHash"> & {
  _id: string;
};
