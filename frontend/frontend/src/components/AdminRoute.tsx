// src/components/AdminRoute.tsx
// A route guard that reads the JWT claims from localStorage to verify ADMIN role.
// If the user is not an admin, they are silently redirected to the dashboard.
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Loader2 } from "lucide-react";

export function AdminRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if the roles array on the user object contains ADMIN
  const isAdmin = Array.isArray((user as any)?.roles) && (user as any).roles.includes("ADMIN");

  if (!isAdmin) {
    // Silently redirect non-admins to their dashboard
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen w-full">
      <nav className="border-b border-brand-border bg-brand-surface/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 flex items-center gap-8 h-14">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">Admin Console</span>
          <a href="/admin/clients" className="text-sm text-gray-400 hover:text-white transition-colors">Applications</a>
          <a href="/admin/users" className="text-sm text-gray-400 hover:text-white transition-colors">Users</a>
          <a href="/admin/tenant" className="text-sm text-gray-400 hover:text-white transition-colors">Tenant Settings</a>
          <a href="/" className="ml-auto text-sm text-gray-500 hover:text-gray-300 transition-colors">← Back to Dashboard</a>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
