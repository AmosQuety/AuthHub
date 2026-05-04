import React, { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { 
  KeyRound, Users, ShieldCheck, Fingerprint, Webhook, 
  TerminalSquare, Settings2, Globe, LogOut, Bell, Search,
  Activity, LayoutDashboard, ChevronRight
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useTenant } from "../../contexts/TenantContext";
import { CommandMenu } from "../../components/ui/CommandMenu";

export default function AppShell() {
  const { user, logout } = useAuth();
  const { tenant } = useTenant();
  const location = useLocation();
  const navigate = useNavigate();

  const [isAdmin] = useState(Array.isArray((user as any)?.roles) && (user as any).roles.includes("ADMIN"));
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Keyboard shortcut for ⌘K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Determine breadcrumbs from location
  const pathParts = location.pathname.split("/").filter(Boolean);
  const breadcrumbs = pathParts.map(part => part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '));
  if (breadcrumbs.length === 0) breadcrumbs.push("Overview");

  return (
    <div className="flex w-full min-h-screen bg-[#06080f] text-white overflow-hidden">
      
      {/* ── Fixed Left Sidebar ── */}
      <aside className="sidebar">
        {/* Brand Header */}
        <div className="p-5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <KeyRound className="w-5 h-5 text-black" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>AuthHub</h2>
            <p className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest leading-none mt-0.5">Enterprise</p>
          </div>
        </div>

        {/* Tenant Switcher */}
        <div className="px-4 mb-4">
          <button className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-bold">
                {tenant?.name?.charAt(0) || "A"}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">{tenant?.name || "Global Console"}</p>
                <p className="text-[10px] text-white/40">{tenant?.id || "authhub.io"}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-1">
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <LayoutDashboard className="w-4 h-4" /> Overview
          </NavLink>

          {isAdmin && (
            <>
              <p className="nav-group-label">Platform Admin</p>
              <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <Activity className="w-4 h-4" /> Admin Console
              </NavLink>
              <NavLink to="/admin/users" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <Users className="w-4 h-4" /> Global Users
              </NavLink>
              <NavLink to="/admin/tenants" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <Globe className="w-4 h-4" /> Tenants
              </NavLink>
              <NavLink to="/admin/observability" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <ShieldCheck className="w-4 h-4" /> Observability
              </NavLink>
              <NavLink to="/admin/settings" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <Settings2 className="w-4 h-4" /> System Settings
              </NavLink>
              <NavLink to="/admin/keys" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <KeyRound className="w-4 h-4" /> Root Keys
              </NavLink>
            </>
          )}

          <p className="nav-group-label">Developer</p>
          <NavLink to="/developer/applications" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <Globe className="w-4 h-4" /> Applications
          </NavLink>
          <NavLink to="/developer/webhooks" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <Webhook className="w-4 h-4" /> Webhooks
          </NavLink>
          <NavLink to="/developer/api-logs" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <TerminalSquare className="w-4 h-4" /> API Logs
          </NavLink>

          <p className="nav-group-label">Security</p>
          <NavLink to="/security/sessions" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <Activity className="w-4 h-4" /> Sessions
          </NavLink>
          <NavLink to="/security/mfa" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <ShieldCheck className="w-4 h-4" /> Two-Factor Auth
          </NavLink>
          <NavLink to="/security/passkeys" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <Fingerprint className="w-4 h-4" /> Passkeys
          </NavLink>
        </div>

        {/* User Profile / Logout */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center justify-between">
            <NavLink to="/account/profile" className="flex items-center gap-3 group/user overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold border border-emerald-500/20 group-hover/user:border-emerald-500/50 transition-colors">
                {(user?.email || "U").charAt(0).toUpperCase()}{(user?.email || "").split("@")[0].charAt(1).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate max-w-[100px] group-hover/user:text-cyan-400 transition-colors">{user?.name || user?.email?.split("@")[0]}</p>
                <p className="text-[10px] text-white/40 truncate max-w-[100px]">View Profile</p>
              </div>
            </NavLink>
            <button onClick={logout} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 ml-[220px] flex flex-col min-h-screen">
        
        {/* Sticky Topbar */}
        <header className="topbar justify-between">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-white/40">
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx} className="flex items-center gap-2">
                {idx > 0 && <ChevronRight className="w-3 h-3 text-white/20" />}
                <span className={idx === breadcrumbs.length - 1 ? "text-white font-medium" : ""}>
                  {crumb}
                </span>
              </span>
            ))}
          </div>

          {/* Global Actions */}
          <div className="flex items-center gap-4">
            <div 
              className="relative group cursor-pointer"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2 group-hover:text-cyan-400 transition-colors" />
              <div className="w-64 h-8 bg-white/[0.02] border border-white/10 rounded-lg pl-9 pr-8 text-xs text-white/40 flex items-center transition-all group-hover:border-white/20">
                Quick search...
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                <kbd className="font-mono text-[9px] text-white/30 bg-white/5 px-1 rounded">⌘</kbd>
                <kbd className="font-mono text-[9px] text-white/30 bg-white/5 px-1 rounded">K</kbd>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Outlet */}
        <div className="p-8">
          <Outlet />
        </div>
      </main>

      <CommandMenu isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
