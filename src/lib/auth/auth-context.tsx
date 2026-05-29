"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  email: string | null;
  name: string | null;
  role: "user" | "admin" | null;
  userId: string | null;
  login: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    error?: string;
    name?: string;
    role?: string;
  }>;
  logout: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthState | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [role, setRole] = useState<"user" | "admin" | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  /** Check with the server whether the current session token is valid */
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/verify");
      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(true);
        setEmail(data.email ?? null);
        setName(data.name ?? null);
        setRole(data.role ?? null);
        setUserId(data.userId ?? null);
      } else {
        setIsAuthenticated(false);
        setEmail(null);
        setName(null);
        setRole(null);
        setUserId(null);
      }
    } catch {
      setIsAuthenticated(false);
      setEmail(null);
      setName(null);
      setRole(null);
      setUserId(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Verify session on mount (page refresh / navigation)
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /** Authenticate with email + password */
  const login: AuthState["login"] = async (email, password) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Error al iniciar sesión" };
      }

      setIsAuthenticated(true);
      setEmail(email);
      setName(data.name ?? null);
      setRole(data.role ?? null);
      setUserId(data.userId ?? null);
      return { success: true, name: data.name, role: data.role };
    } catch {
      return { success: false, error: "Error de conexión con el servidor" };
    }
  };

  /** End the current session */
  const logout: AuthState["logout"] = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Silently fail — we clear local state regardless
    }
    setIsAuthenticated(false);
    setEmail(null);
    setName(null);
    setRole(null);
    setUserId(null);
    router.push("/admin/login");
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, email, name, role, userId, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return context;
}
