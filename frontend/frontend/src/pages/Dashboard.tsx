import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { useToast } from "../contexts/ToastContext";
import {
  LogOut, Laptop, Smartphone, Trash2, Loader2,
  KeyRound, ShieldCheck, Fingerprint, ShieldAlert,
  Users, Settings2, Globe, Webhook, TerminalSquare,
  Clock, MapPin, Sparkles, CreditCard
} from "lucide-react";
import { OnboardingTour } from "../components/OnboardingTour";

interface Session {
  id: string;
  ipAddress: string | null;
  deviceInfo: { browser?: string; os?: string; isMobile?: boolean };
  expiresAt: string;
}

function NavCard({
  icon: Icon, label, sub, action, onClick, accent = false, id
}: {
  icon: any; label: string; sub: string; action: string; onClick: () => void; accent?: boolean; id?: string;
}) {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`group flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all duration-200 border
        ${accent
          ? "border-violet-500/15 bg-violet-600/5 hover:bg-violet-600/10 hover:border-violet-500/30"
          : "border-white/5 bg-white/2 hover:bg-white/5 hover:border-white/10"
        }`}
    >
      <div className={`p-2 rounded-lg flex-shrink-0 ${accent ? "bg-violet-600/20 text-violet-400" : "bg-white/5 text-white/40 group-hover:text-white/60"}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium truncate ${accent ? "text-violet-300" : "text-white/70"}`}>{label}</div>
        <div className="text-[10px] text-white/25 truncate">{sub}</div>
      </div>
      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 transition-all
        ${accent
          ? "text-violet-400 bg-violet-600/15 group-hover:bg-violet-600/25"
          : "text-white/30 bg-white/5 group-hover:text-white/50"
        }`}
      >
        {action}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  useEffect(() => {
    api.get("/auth/sessions")
      .then(d => setSessions(d.sessions || []))
      .catch(() => {})
      .finally(() => setIsLoadingSessions(false));
  }, []);

  const handleRevokeSession = async (id: string) => {
    try {
      await api.delete(`/auth/sessions/${id}`);
      setSessions(s => s.filter(x => x.id !== id));
      success("Session revoked");
    } catch { showError("Failed to revoke session"); }
  };

  const isAdmin = Array.isArray((user as any)?.roles) && (user as any).roles.includes("ADMIN");

  return (
    <div className="min-h-screen w-full p-4 md:p-8">
      <OnboardingTour />
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header bar */}
        <header className="glass-card-vivid p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-up">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Account Dashboard</p>
            <h1 className="text-2xl font-bold text-gradient" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {user?.email?.split("@")[0]}
            </h1>
            <p className="text-sm text-white/35 mt-0.5">{user?.email}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {isAdmin && (
              <span className="badge badge-violet">
                <ShieldCheck className="w-3 h-3" /> Admin
              </span>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm font-medium hover:bg-red-500/10 hover:border-red-500/30 transition-all"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column — navigation cards */}
          <div className="md:col-span-1 space-y-5 animate-fade-up stagger-1">
            {/* Account & Security section */}
            <div className="glass-card p-5">
              <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-4 flex items-center gap-2">
                <ShieldCheck className="w-3 h-3 text-violet-400" /> Account & Security
              </p>
              <div className="space-y-2">
                <NavCard icon={CreditCard} label="Billing" sub="Manage subscription" action="View" onClick={() => navigate("/billing")} />
                <NavCard icon={KeyRound} label="Password" sub="Manage credentials" action="Change" onClick={() => {}} />
                <NavCard id="tour-mfa-setup" icon={ShieldCheck} label="Two-Factor Auth" sub="TOTP authenticator" action="Setup" onClick={() => navigate("/mfa-setup")} />
                <NavCard icon={Fingerprint} label="Passkeys" sub="Biometric login" action="Add" onClick={() => navigate("/passkey-setup")} />
                <NavCard icon={ShieldAlert} label="Security Audit" sub="Login history" action="View" onClick={() => navigate("/security-audit")} />
              </div>
            </div>

            {/* Developer section */}
            <div className="glass-card p-5">
              <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-4 flex items-center gap-2">
                <TerminalSquare className="w-3 h-3 text-cyan-400" /> Developer
              </p>
              <div className="space-y-2">
                <NavCard id="tour-developer-portal" icon={Globe} label="Developer Portal" sub="OAuth applications" action="Open" onClick={() => navigate("/developer")} />
                <NavCard icon={Webhook} label="Webhooks" sub="Event streams" action="Config" onClick={() => navigate("/webhooks")} />
              </div>
            </div>

            {/* Admin section — only visible to admins */}
            {isAdmin && (
              <div className="glass-card p-5">
                <p className="text-[10px] uppercase tracking-widest text-violet-400/60 font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-violet-400" /> Admin Console
                </p>
                <div className="space-y-2">
                  <NavCard icon={Users} label="User Management" sub="View all users" action="Manage" onClick={() => navigate("/admin/users")} accent />
                  <NavCard icon={Globe} label="Global Apps" sub="All OAuth clients" action="Manage" onClick={() => navigate("/admin/clients")} accent />
                  <NavCard icon={Settings2} label="Tenant Branding" sub="Configure styles" action="Config" onClick={() => navigate("/admin/tenant")} accent />
                </div>
              </div>
            )}
          </div>

          {/* Right column — active sessions */}
          <div className="md:col-span-2 animate-fade-up stagger-2">
            <div id="tour-active-sessions" className="glass-card h-full p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-0.5">Active Sessions</p>
                  <h2 className="text-white font-semibold">Devices & Locations</h2>
                </div>
                <div className="badge badge-cyan">{sessions.length} active</div>
              </div>

              {isLoadingSessions ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`skeleton h-[72px] rounded-xl stagger-${i}`} />
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <Laptop className="w-10 h-10 text-white/10 mb-3" />
                  <p className="text-white/25 text-sm">No active sessions found.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {sessions.map((session, i) => (
                    <div
                      key={session.id}
                      className={`group flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/2 hover:bg-white/4 hover:border-white/10 transition-all duration-200 animate-fade-up stagger-${Math.min(i + 1, 5)}`}
                    >
                      <div className="p-2.5 rounded-xl bg-white/5 flex-shrink-0">
                        {session.deviceInfo?.isMobile
                          ? <Smartphone className="w-5 h-5 text-white/40" />
                          : <Laptop className="w-5 h-5 text-white/40" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white/80 truncate">
                          {session.deviceInfo?.os || "Unknown OS"} · {session.deviceInfo?.browser || "Unknown Browser"}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-white/25">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {session.ipAddress || "Unknown IP"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Expires {new Date(session.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                        title="Revoke session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
