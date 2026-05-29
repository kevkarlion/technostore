"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Zap, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Login Page
// ---------------------------------------------------------------------------

export default function AdminLoginPage() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // If already authenticated, redirect via effect — never during render
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/admin");
    }
  }, [authLoading, isAuthenticated, router]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] px-4 sm:px-6">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-[var(--accent)]/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-[var(--accent)]/3 blur-3xl" />
      </div>

      {/* Loading state */}
      {authLoading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
          <p className="text-sm text-[var(--foreground-muted)]">
            Verificando sesión...
          </p>
        </div>
      ) : (
        <LoginForm />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Login Form
// ---------------------------------------------------------------------------

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  // ---- Validation ----

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    let valid = true;

    if (!email.trim()) {
      errors.email = "El email es requerido";
      valid = false;
    } else if (!email.includes("@")) {
      errors.email = "Ingresá un email válido";
      valid = false;
    }

    if (!password) {
      errors.password = "La contraseña es requerida";
      valid = false;
    } else if (password.length < 4) {
      errors.password = "La contraseña debe tener al menos 4 caracteres";
      valid = false;
    }

    setFieldErrors(errors);
    return valid;
  };

  // ---- Submit ----

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const result = await login(email.trim(), password);

      if (result.success) {
        router.replace("/admin");
      } else {
        setError(result.error || "Error al iniciar sesión");
      }
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- Render ----

  return (
    <div className="relative z-10 w-full max-w-sm">
      {/* Brand */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)] shadow-lg shadow-[var(--accent)]/20">
          <Zap className="h-7 w-7 text-zinc-900" />
        </div>
        <h1 className="text-xl font-bold text-[var(--foreground)]">
          Acceso Administrador
        </h1>
        <p className="mt-1.5 text-sm text-[var(--foreground-muted)]">
          Ingresá tus credenciales para continuar
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 shadow-xl shadow-black/20 sm:p-8">
        {/* Global error */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-rose-800/40 bg-rose-950/30 px-3.5 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <p className="text-sm text-rose-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
              }}
              placeholder="admin@technostore.com"
              className={`w-full rounded-lg border bg-[var(--background)] px-3.5 py-2.5 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--foreground-muted)] focus:ring-2 focus:ring-[var(--accent)]/40 ${
                fieldErrors.email
                  ? "border-rose-500/60"
                  : "border-[var(--border-subtle)]"
              }`}
              disabled={isSubmitting}
              inputMode="email"
              enterKeyHint="next"
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-rose-400">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                }}
                placeholder="••••••••"
                className={`w-full rounded-lg border bg-[var(--background)] px-3.5 py-2.5 pr-10 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--foreground-muted)] focus:ring-2 focus:ring-[var(--accent)]/40 ${
                  fieldErrors.password
                    ? "border-rose-500/60"
                    : "border-[var(--border-subtle)]"
                }`}
                disabled={isSubmitting}
                enterKeyHint="go"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
                tabIndex={-1}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-rose-400">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
