// src/components/AdminRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Loader2, BarChart3, Users, Globe, Settings2, ArrowLeft, ShieldCheck } from "lucide-react";

const navLinks = [
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/clients", label: "Applications", icon: Globe },
  { href: "/admin/observability", label: "Observability", icon: BarChart3 },
];

export function AdminRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center animate-glow-pulse">
            <ShieldCheck className="w-5 h-5 text-violet-400" />
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const isAdmin = Array.isArray((user as any)?.roles) && (user as any).roles.includes("ADMIN");
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen w-full">
      {/* Top navigation bar */}
      <nav className="sticky top-0 z-40 border-b border-white/5 bg-[#070710]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-1 h-14">
          {/* Brand mark */}
          <div className="flex items-center gap-2 pr-6 mr-2 border-r border-white/8">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-[0_0_12px_rgba(124,58,237,0.6)]">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-gradient">Admin</span>
          </div>

          {/* Nav links */}
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = location.pathname.startsWith(href);
            return (
              <a
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-violet-600/20 text-violet-300 shadow-[inset_0_0_0_1px_rgba(124,58,237,0.3)]"
                    : "text-white/40 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </a>
            );
          })}

          {/* Spacer + back link */}
          <a
            href="/"
            className="ml-auto flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </a>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
