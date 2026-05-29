import { AuthProvider } from "@/lib/auth/auth-context";

/**
 * Admin layout — wraps ALL /admin/* routes (login + dashboard)
 * with the AuthProvider so every page can access auth state.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
