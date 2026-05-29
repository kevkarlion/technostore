"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  Search,
  RefreshCw,
  AlertTriangle,
  Plus,
  Shield,
  UserCog,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  X,
  Pencil,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminUser {
  _id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

interface FetchResponse {
  items: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FormErrors {
  email?: string;
  password?: string;
  name?: string;
  newPassword?: string;
  currentPassword?: string;
  general?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ITEMS_PER_PAGE = 20;

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminUsers() {
  const { userId: authUserId, role: authRole } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create user modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    name: "",
    role: "user" as "user" | "admin",
  });
  const [createErrors, setCreateErrors] = useState<FormErrors>({});
  const [creating, setCreating] = useState(false);

  // Change password modal
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changePwUserId, setChangePwUserId] = useState<string | null>(null);
  const [changePwForm, setChangePwForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [changePwErrors, setChangePwErrors] = useState<FormErrors>({});
  const [changingPw, setChangingPw] = useState(false);

  // Reset password modal
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetPwUserId, setResetPwUserId] = useState<string | null>(null);
  const [resetPwNewPassword, setResetPwNewPassword] = useState("");
  const [resetPwErrors, setResetPwErrors] = useState<FormErrors>({});
  const [resettingPw, setResettingPw] = useState(false);

  // Edit user modal
  const [showEdit, setShowEdit] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "" });
  const [editErrors, setEditErrors] = useState<FormErrors>({});
  const [editing, setEditing] = useState(false);

  // Confirm modals
  const [confirmAction, setConfirmAction] = useState<{
    type: "toggle-status" | "change-role" | "delete";
    user: AdminUser;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Show/hide passwords
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showResetPw, setShowResetPw] = useState(false);

  // ── Fetch users ─────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async (searchTerm: string, page: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(ITEMS_PER_PAGE));
      params.set("page", String(page));
      if (searchTerm.trim()) params.set("search", searchTerm.trim());

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error("Error al cargar usuarios");
      const data: FetchResponse = await res.json();

      setUsers(data.items || []);
      setTotalItems(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error("[AdminUsers] Error:", err);
      setError(err instanceof Error ? err.message : "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(search, currentPage);
  }, [currentPage, fetchUsers]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  // ── Create user ─────────────────────────────────────────────────────────

  const validateCreateForm = (): boolean => {
    const errors: FormErrors = {};
    if (!createForm.email || !createForm.email.includes("@"))
      errors.email = "Email inválido";
    if (!createForm.password || createForm.password.length < 6)
      errors.password = "Mínimo 6 caracteres";
    if (!createForm.name.trim()) errors.name = "El nombre es requerido";
    setCreateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateCreateForm()) return;
    setCreating(true);
    setCreateErrors({});
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateErrors({ general: data.message || "Error al crear usuario" });
        return;
      }
      setShowCreate(false);
      setCreateForm({ email: "", password: "", name: "", role: "admin" });
      fetchUsers(search, 1);
      setCurrentPage(1);
    } catch {
      setCreateErrors({ general: "Error de conexión" });
    } finally {
      setCreating(false);
    }
  };

  // ── Toggle status ───────────────────────────────────────────────────────

  const handleToggleStatus = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      const newStatus =
        confirmAction.user.status === "active" ? "inactive" : "active";
      const res = await fetch(
        `/api/admin/users/${confirmAction.user._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Error al actualizar");
        return;
      }
      setConfirmAction(null);
      fetchUsers(search, currentPage);
    } catch {
      setError("Error de conexión");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Change role ─────────────────────────────────────────────────────────

  const handleChangeRole = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      const newRole =
        confirmAction.user.role === "user" ? "admin" : "user";
      const res = await fetch(
        `/api/admin/users/${confirmAction.user._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Error al actualizar");
        return;
      }
      setConfirmAction(null);
      fetchUsers(search, currentPage);
    } catch {
      setError("Error de conexión");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Change password ─────────────────────────────────────────────────────

  const handleChangePassword = async () => {
    if (!changePwUserId || !changePwForm.newPassword || changePwForm.newPassword.length < 6) {
      setChangePwErrors({ newPassword: "Mínimo 6 caracteres" });
      return;
    }
    if (!changePwForm.currentPassword) {
      setChangePwErrors({ currentPassword: "Requerida" });
      return;
    }
    setChangingPw(true);
    setChangePwErrors({});
    try {
      const res = await fetch(
        `/api/admin/users/${changePwUserId}/change-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(changePwForm),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setChangePwErrors({ general: data.message || "Error al cambiar contraseña" });
        return;
      }
      setShowChangePassword(false);
      setChangePwUserId(null);
      setChangePwForm({ currentPassword: "", newPassword: "" });
    } catch {
      setChangePwErrors({ general: "Error de conexión" });
    } finally {
      setChangingPw(false);
    }
  };

  // ── Reset password ──────────────────────────────────────────────────────

  const handleResetPassword = async () => {
    if (!resetPwUserId || !resetPwNewPassword || resetPwNewPassword.length < 6) {
      setResetPwErrors({ newPassword: "Mínimo 6 caracteres" });
      return;
    }
    setResettingPw(true);
    setResetPwErrors({});
    try {
      const res = await fetch(
        `/api/admin/users/${resetPwUserId}/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPassword: resetPwNewPassword }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setResetPwErrors({ general: data.message || "Error al resetear contraseña" });
        return;
      }
      setShowResetPassword(false);
      setResetPwUserId(null);
      setResetPwNewPassword("");
    } catch {
      setResetPwErrors({ general: "Error de conexión" });
    } finally {
      setResettingPw(false);
    }
  };

  // ── Edit user ───────────────────────────────────────────────────────────

  const openEditModal = (user: AdminUser) => {
    setEditUser(user);
    setEditForm({ name: user.name, email: user.email });
    setEditErrors({});
    setShowEdit(true);
  };

  const handleEdit = async () => {
    if (!editUser) return;
    if (!editForm.name.trim()) {
      setEditErrors({ name: "El nombre es requerido" });
      return;
    }
    if (!editForm.email.includes("@")) {
      setEditErrors({ email: "Email inválido" });
      return;
    }
    setEditing(true);
    setEditErrors({});
    try {
      const res = await fetch(`/api/admin/users/${editUser._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditErrors({ general: data.message || "Error al editar" });
        return;
      }
      setShowEdit(false);
      setEditUser(null);
      fetchUsers(search, currentPage);
    } catch {
      setEditErrors({ general: "Error de conexión" });
    } finally {
      setEditing(false);
    }
  };

  // ── Delete user ─────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!confirmAction || confirmAction.type !== "delete") return;
    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/admin/users/${confirmAction.user._id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Error al eliminar");
        return;
      }
      setConfirmAction(null);
      fetchUsers(search, currentPage);
    } catch {
      setError("Error de conexión");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  if (error && users.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center rounded-xl border border-rose-800/50 bg-rose-950/20 py-16">
          <AlertTriangle className="h-12 w-12 text-rose-400" />
          <p className="mt-4 text-sm text-rose-400">{error}</p>
          <Button onClick={() => fetchUsers(search, currentPage)} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Error banner ────────────────────────────────────────────────── */}
      {error && users.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-800/50 bg-rose-950/20 px-4 py-3 text-sm text-rose-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="shrink-0 rounded p-1 hover:bg-rose-900/30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Usuarios
          </h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            {loading
              ? "Cargando..."
              : search
              ? `${totalItems} resultados para "${search}"`
              : `${totalItems} usuarios administradores`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
          <div className="relative order-2 w-full sm:order-1 sm:w-auto sm:min-w-[200px] lg:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <Input
              placeholder="Buscar usuarios..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9"
            />
          </div>
          <div className="order-1 flex gap-2 sm:order-2">
            <Button
              variant="outline"
              onClick={() => fetchUsers(search, currentPage)}
              disabled={loading}
              className="px-3 sm:px-4"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="ml-1.5 hidden sm:inline">Actualizar</span>
            </Button>
            <Button onClick={() => setShowCreate(true)} className="px-3 sm:px-4">
              <Plus className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Nuevo usuario</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Loading ────────────────────────────────────────────────────── */}
      {loading && users.length === 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-slate-800 bg-slate-950/50 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-800" />
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded bg-slate-800" />
                  <div className="h-3 w-20 rounded bg-slate-800" />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <div className="h-8 flex-1 rounded-lg bg-slate-800" />
                <div className="h-8 flex-1 rounded-lg bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────────── */}
      {!loading && users.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950/50 py-16">
          <Shield className="h-12 w-12 text-[var(--foreground-muted)]" />
          <p className="mt-4 text-sm text-[var(--foreground-muted)]">
            {search
              ? `No se encontraron usuarios para "${search}"`
              : "No hay usuarios administradores. Creá el primero."}
          </p>
        </div>
      )}

      {/* ── Users grid ────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => {
          const isLegacy = !authUserId;
          const isSelf = !isLegacy && user._id === authUserId;
          const isAdmin = isLegacy || authRole === "admin" || authRole === "superadmin";

          return (
            <div
              key={user._id}
              className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 transition-colors hover:bg-slate-900/30"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      user.role === "admin"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-[var(--accent)]/10 text-[var(--accent)]"
                    }`}
                  >
                    <span className="text-sm font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[var(--foreground)]">
                      {user.name}
                      {isSelf && (
                        <span className="ml-1.5 text-xs text-[var(--foreground-muted)]">
                          (vos)
                        </span>
                      )}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Badge
                        tone={
                          user.status === "active" ? "success" : "default"
                        }
                      >
                        {user.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                      <Badge
                        tone={
                          user.role === "admin" ? "warning" : "default"
                        }
                      >
                        {user.role === "admin" ? "Admin" : "Usuario"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email */}
              <p className="mt-3 text-sm text-[var(--foreground-muted)] truncate">
                {user.email}
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">
                Creado: {formatDate(user.createdAt)}
              </p>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                {/* Edit */}
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(user)}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    Editar
                  </Button>
                )}

                {/* Toggle block */}
                {isAdmin && !isSelf && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setConfirmAction({ type: "toggle-status", user })
                    }
                  >
                    {user.status === "active" ? "Bloquear" : "Desbloquear"}
                  </Button>
                )}

                {/* Change role */}
                {isAdmin && !isSelf && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setConfirmAction({ type: "change-role", user })
                    }
                  >
                    <UserCog className="mr-1 h-3.5 w-3.5" />
                    {user.role === "user" ? "Hacer admin" : "Hacer usuario"}
                  </Button>
                )}

                {/* Change own password */}
                {isSelf && isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setChangePwUserId(user._id);
                      setShowChangePassword(true);
                    }}
                  >
                    <KeyRound className="mr-1 h-3.5 w-3.5" />
                    Cambiar contraseña
                  </Button>
                )}

                {/* Reset password (admin only) */}
                {isAdmin && !isSelf && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setResetPwUserId(user._id);
                      setShowResetPassword(true);
                    }}
                  >
                    <Lock className="mr-1 h-3.5 w-3.5" />
                    Resetear contraseña
                  </Button>
                )}

                {/* Delete (admin only, not self) */}
                {isAdmin && !isSelf && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setConfirmAction({ type: "delete", user })
                    }
                    className="text-rose-400 hover:border-rose-800 hover:bg-rose-950/30"
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Borrar
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────── */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-center text-sm text-[var(--foreground-muted)] sm:text-left">
            Página {currentPage} de {totalPages}
            <span className="hidden sm:inline"> · {totalItems} usuarios</span>
          </span>
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ← Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente →
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODALS                                                           */}
      {/* ══════════════════════════════════════════════════════════════════ */}

      {/* ── Create User Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !creating && setShowCreate(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  Nuevo usuario
                </h2>
                <button
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg p-1.5 text-[var(--foreground-muted)] hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {createErrors.general && (
                <div className="mb-4 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-400">
                  {createErrors.general}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm text-[var(--foreground-muted)]">
                    Nombre
                  </label>
                  <Input
                    placeholder="Nombre del usuario"
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, name: e.target.value })
                    }
                  />
                  {createErrors.name && (
                    <p className="mt-1 text-xs text-rose-400">{createErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-[var(--foreground-muted)]">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="email@ejemplo.com"
                    value={createForm.email}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, email: e.target.value })
                    }
                  />
                  {createErrors.email && (
                    <p className="mt-1 text-xs text-rose-400">{createErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-[var(--foreground-muted)]">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={createForm.password}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, password: e.target.value })
                      }
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {createErrors.password && (
                    <p className="mt-1 text-xs text-rose-400">
                      {createErrors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-[var(--foreground-muted)]">
                    Rol
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        setCreateForm({ ...createForm, role: "user" })
                      }
                      className={`flex-1 rounded-lg border px-4 py-2.5 text-sm transition ${
                        createForm.role === "user"
                          ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                          : "border-slate-700 text-[var(--foreground-muted)] hover:border-slate-600"
                      }`}
                    >
                      Usuario
                    </button>
                    <button
                      onClick={() =>
                        setCreateForm({ ...createForm, role: "admin" })
                      }
                      className={`flex-1 rounded-lg border px-4 py-2.5 text-sm transition ${
                        createForm.role === "admin"
                          ? "border-amber-500 bg-amber-500/10 text-amber-400"
                          : "border-slate-700 text-[var(--foreground-muted)] hover:border-slate-600"
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCreate(false)}
                  disabled={creating}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCreate}
                  disabled={creating}
                >
                  {creating ? "Creando..." : "Crear usuario"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Change Password Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {showChangePassword && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !changingPw && setShowChangePassword(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  Cambiar contraseña
                </h2>
                <button
                  onClick={() => setShowChangePassword(false)}
                  className="rounded-lg p-1.5 text-[var(--foreground-muted)] hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {changePwErrors.general && (
                <div className="mb-4 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-400">
                  {changePwErrors.general}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm text-[var(--foreground-muted)]">
                    Contraseña actual
                  </label>
                  <div className="relative">
                    <Input
                      type={showCurrentPw ? "text" : "password"}
                      placeholder="Tu contraseña actual"
                      value={changePwForm.currentPassword}
                      onChange={(e) =>
                        setChangePwForm({
                          ...changePwForm,
                          currentPassword: e.target.value,
                        })
                      }
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    >
                      {showCurrentPw ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {changePwErrors.currentPassword && (
                    <p className="mt-1 text-xs text-rose-400">
                      {changePwErrors.currentPassword}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-[var(--foreground-muted)]">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <Input
                      type={showNewPw ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={changePwForm.newPassword}
                      onChange={(e) =>
                        setChangePwForm({
                          ...changePwForm,
                          newPassword: e.target.value,
                        })
                      }
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    >
                      {showNewPw ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {changePwErrors.newPassword && (
                    <p className="mt-1 text-xs text-rose-400">
                      {changePwErrors.newPassword}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowChangePassword(false)}
                  disabled={changingPw}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleChangePassword}
                  disabled={changingPw}
                >
                  {changingPw ? "Guardando..." : "Cambiar contraseña"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Reset Password Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {showResetPassword && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !resettingPw && setShowResetPassword(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  Resetear contraseña
                </h2>
                <button
                  onClick={() => setShowResetPassword(false)}
                  className="rounded-lg p-1.5 text-[var(--foreground-muted)] hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="mb-4 text-sm text-[var(--foreground-muted)]">
                Esta acción no requiere la contraseña anterior. El usuario
                iniciará sesión con la nueva contraseña.
              </p>

              {resetPwErrors.general && (
                <div className="mb-4 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-400">
                  {resetPwErrors.general}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm text-[var(--foreground-muted)]">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <Input
                    type={showResetPw ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={resetPwNewPassword}
                    onChange={(e) => setResetPwNewPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPw(!showResetPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                  >
                    {showResetPw ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {resetPwErrors.newPassword && (
                  <p className="mt-1 text-xs text-rose-400">
                    {resetPwErrors.newPassword}
                  </p>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowResetPassword(false)}
                  disabled={resettingPw}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleResetPassword}
                  disabled={resettingPw}
                >
                  {resettingPw ? "Guardando..." : "Resetear contraseña"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Edit User Modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showEdit && editUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !editing && setShowEdit(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  Editar usuario
                </h2>
                <button
                  onClick={() => setShowEdit(false)}
                  className="rounded-lg p-1.5 text-[var(--foreground-muted)] hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {editErrors.general && (
                <div className="mb-4 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-400">
                  {editErrors.general}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm text-[var(--foreground-muted)]">
                    Nombre
                  </label>
                  <Input
                    placeholder="Nombre del usuario"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                  />
                  {editErrors.name && (
                    <p className="mt-1 text-xs text-rose-400">{editErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-[var(--foreground-muted)]">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="email@ejemplo.com"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                  />
                  {editErrors.email && (
                    <p className="mt-1 text-xs text-rose-400">{editErrors.email}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowEdit(false)}
                  disabled={editing}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleEdit}
                  disabled={editing}
                >
                  {editing ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Confirm Modals ─────────────────────────────────────────────── */}
      <ConfirmModal
        open={confirmAction?.type === "toggle-status"}
        title={
          confirmAction?.user.status === "active"
            ? "Bloquear usuario"
            : "Desbloquear usuario"
        }
        message={
          confirmAction?.user.status === "active"
            ? `¿Estás seguro de bloquear a ${confirmAction?.user.name}? No podrá acceder al panel hasta que sea desbloqueado.`
            : `¿Estás seguro de desbloquear a ${confirmAction?.user.name}? Podrá acceder al panel nuevamente.`
        }
        variant={confirmAction?.user.status === "active" ? "danger" : "default"}
        confirmLabel={
          confirmAction?.user.status === "active" ? "Bloquear" : "Desbloquear"
        }
        onConfirm={handleToggleStatus}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmModal
        open={confirmAction?.type === "change-role"}
        title="Cambiar rol"
        message={
          confirmAction?.user.role === "user"
            ? `¿Convertir a ${confirmAction?.user.name} en admin? Tendrá acceso completo a todas las funciones.`
            : `¿Convertir a ${confirmAction?.user.name} en usuario? Perderá acceso a funciones de administración.`
        }
        variant="default"
        confirmLabel="Confirmar"
        onConfirm={handleChangeRole}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmModal
        open={confirmAction?.type === "delete"}
        title="Eliminar usuario"
        message={`¿Estás seguro de eliminar a ${confirmAction?.user.name}? Esta acción no se puede deshacer.`}
        variant="danger"
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
