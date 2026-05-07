import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthState } from "../contexts/AuthContext";
import { Loader2 } from "lucide-react";

function getDefaultHomePath(roles?: string[]) {
  return roles?.includes("ADMIN") ? "/admin/dashboard" : "/dashboard";
}

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthState();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export function PublicRoute() {
  const { isAuthenticated, isLoading, user } = useAuthState();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  // If already logged in, public auth pages (login/register) redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to={getDefaultHomePath(user?.roles)} replace />;
  }

  return <Outlet />;
}

export function AdminOnlyRoute() {
  const { isAuthenticated, isLoading, user } = useAuthState();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user?.roles?.includes("ADMIN")) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export function NonAdminOnlyRoute() {
  const { isAuthenticated, isLoading, user } = useAuthState();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.roles?.includes("ADMIN")) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
}
