import { use, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { API_URL } from "../lib/api";
import { useToast } from "../contexts/ToastContext";
import {
  LogOut, Laptop, Smartphone, Trash2,
  KeyRound, ShieldCheck, Fingerprint, ShieldAlert,
  Users, Settings2, Globe, Webhook, TerminalSquare,
  Clock, MapPin, Sparkles, CreditCard,
  Github, Mail
} from "lucide-react";
import { OnboardingTour } from "../components/OnboardingTour";
import { ConfirmationModal } from "../components/ui/ConfirmationModal";
import { ReAuthModal } from "../components/ui/ReAuthModal";

interface Session {
  id: string;
  ipAddress: string | null;
  deviceInfo: { browser?: string; os?: string; isMobile?: boolean };
  expiresAt: string;
}

let sessionsResource: Promise<Session[]> | null = null;

function getSessionsResource(forceRefresh = false) {
  if (!sessionsResource || forceRefresh) {
    sessionsResource = api
      .get("/auth/sessions")
      .then((data) => data.sessions || [])
      .catch(() => []);
  }
  return sessionsResource;
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
  const { user, logout, refreshProfile } = useAuth();
  const initialSessions = use(getSessionsResource());
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  const handleLink = (providerId: string) => {
    window.location.href = `${API_URL}/auth/${providerId}?mode=link&user_id=${user?.id}`;
  };

  const handleUnlink = async (providerLinkId: string) => {
    const performUnlink = async () => {
      try {
        await api.delete(`/auth/providers/${providerLinkId}`);
        toastSuccess("Provider unlinked successfully.");
        await refreshProfile();
      } catch (err: any) {
        toastError(err.message || "Failed to unlink provider.");
      }
    };

    if (user?.hasPassword) {
      setReAuthModalConfig({
        isOpen: true,
        title: "Confirm Identity",
        message: "Please enter your password to unlink this social account.",
        onConfirm: () => {
          setReAuthModalConfig(prev => ({ ...prev, isOpen: false }));
          performUnlink();
        }
      });
    } else {
      setModalConfig({
        isOpen: true,
        title: "Unlink Provider?",
        message: "Are you sure you want to remove this login method?",
        onConfirm: () => {
          setModalConfig(prev => ({ ...prev, isOpen: false }));
          performUnlink();
        }
      });
    }
  };

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [reAuthModalConfig, setReAuthModalConfig] = useState<{
    isOpen: boolean;
    onConfirm: () => void;
    title?: string;
    message?: string;
  }>({
    isOpen: false,
    onConfirm: () => {},
  });

  const handleRevokeSession = async (id: string) => {
    try {
      await api.delete(`/auth/sessions/${id}`);
      
      const currentSid = (user as any)?.sid;
      if (currentSid && id === currentSid) {
        toastSuccess("Current session revoked. Logging out...");
        setTimeout(logout, 1500);
        return;
      }

      setSessions(prev => prev.filter(x => x.id !== id));
      sessionsResource = null;
      toastSuccess("Session revoked");
    } catch (err: any) { 
      toastError(err.message || "Failed to revoke session"); 
    }
  };

  const handleRevokeAllOther = async () => {
    const currentSid = (user as any)?.sid;
    
    if (!currentSid) {
      toastError("Security update required. Please log out and back in once to enable this feature.");
      return;
    }

    const performRevoke = async () => {
      try {
        await api.delete("/auth/sessions/others");
        setSessions(prev => prev.filter(x => x.id === currentSid));
        sessionsResource = null;
        const fresh = await api.get("/auth/sessions");
        setSessions(fresh.sessions || []);
        toastSuccess("All other sessions revoked");
      } catch (err: any) { 
        toastError(err.message || "Failed to revoke other sessions"); 
      }
    };

    if (user?.hasPassword) {
      setReAuthModalConfig({
        isOpen: true,
        title: "Elevated Action",
        message: "Confirm your password to revoke all other active sessions.",
        onConfirm: () => {
          setReAuthModalConfig(prev => ({ ...prev, isOpen: false }));
          performRevoke();
        }
      });
    } else {
      setModalConfig({
        isOpen: true,
        title: "Revoke Other Sessions",
        message: "Are you sure you want to revoke all other active sessions? You will remain logged in on this device.",
        onConfirm: () => {
          setModalConfig(prev => ({ ...prev, isOpen: false }));
          performRevoke();
        }
      });
    }
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
          <div className="md:col-span-1 space-y-5 animate-fade-up stagger-1">
            {/* Developer Section - PROMOTED TO TOP */}
            <div className="glass-card p-5 border border-cyan-500/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-cyan-500/10 transition-colors" />
              <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold mb-4 flex items-center gap-2 relative z-10">
                <TerminalSquare className="w-3 h-3" /> Developer Tools
              </p>
              <div className="space-y-2 relative z-10">
                <NavCard 
                  id="tour-developer-portal" 
                  icon={Globe} 
                  label="Developer Portal" 
                  sub={`${user?.clientCount || 0} Active Apps`} 
                  action="Open" 
                  onClick={() => navigate("/developer")} 
                  accent={true}
                />
                <NavCard 
                  icon={Webhook} 
                  label="Webhooks" 
                  sub="Status: Live" 
                  action="Config" 
                  onClick={() => navigate("/webhooks")} 
                />
              </div>
            </div>

            <div className="glass-card p-5">
              <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-4 flex items-center gap-2">
                <ShieldCheck className="w-3 h-3 text-violet-400" /> Account & Security
              </p>
              <div className="space-y-2">
                {/* <NavCard icon={CreditCard} label="Billing" sub="Manage subscription" action="View" onClick={() => navigate("/billing")} /> */}
                <NavCard 
                  icon={KeyRound} 
                  label={(user as any)?.hasPassword ? "Password" : "Set Password"} 
                  sub={(user as any)?.hasPassword ? "Manage credentials" : "No password set"} 
                  action={(user as any)?.hasPassword ? "Change" : "Set"} 
                  onClick={() => navigate("/change-password")} 
                />
                <NavCard 
                  id="tour-mfa-setup" 
                  icon={ShieldCheck} 
                  label="Two-Factor Auth" 
                  sub={user?.mfaEnabled ? "Enabled · Secure" : "TOTP authenticator"} 
                  action={user?.mfaEnabled ? "Manage" : "Setup"} 
                  onClick={() => navigate("/mfa-setup")} 
                  accent={!user?.mfaEnabled}
                />
                <NavCard icon={Fingerprint} label="Passkeys" sub="Biometric login" action="Add" onClick={() => navigate("/passkey-setup")} />
                <NavCard icon={ShieldAlert} label="Security Audit" sub="Login history" action="View" onClick={() => navigate("/security-audit")} />
              </div>
            </div>

            {/* --- NEW: Linked Identities Section --- */}
            <div className="glass-card p-6 animate-fade-up" style={{ animationDelay: '0.15s' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
                  <Fingerprint className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Linked Identities</h3>
                  <p className="text-white/40 text-xs mt-0.5">Manage your connected social accounts</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { id: 'google', name: 'Google', icon: Mail },
                  { id: 'github', name: 'GitHub', icon: Github },
                ].map((provider) => {
                  const linked = user?.providers?.find(p => p.name === provider.id);
                  return (
                    <div key={provider.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all group">
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl ${linked ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-white/40 border border-white/10'}`}>
                          <provider.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{provider.name}</p>
                          <p className={`text-[10px] font-medium uppercase tracking-wider ${linked ? 'text-emerald-400' : 'text-white/20'}`}>
                            {linked ? 'Connected' : 'Not Linked'}
                          </p>
                        </div>
                      </div>
                      
                      {linked ? (
                        <button 
                          onClick={() => handleUnlink(linked.id)}
                          className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                        >
                          Unlink
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleLink(provider.id)}
                          className="px-4 py-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 text-xs font-bold border border-violet-500/20 transition-all"
                        >
                          Link Account
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* --- End Linked Identities --- */}

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

          <div className="md:col-span-2 animate-fade-up stagger-2">
            <div id="tour-active-sessions" className="glass-card h-full p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-0.5">Active Sessions</p>
                  <h2 className="text-white font-semibold">Devices & Locations</h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="badge badge-cyan">{sessions.length} active</div>
                  {sessions.length > 1 && (
                    <button 
                      onClick={handleRevokeAllOther}
                      className="text-[10px] font-bold text-rose-400/60 hover:text-rose-400 uppercase tracking-wider transition-colors"
                    >
                      Revoke Others
                    </button>
                  )}
                </div>
              </div>

              {sessions.length === 0 ? (
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
                        <div className="text-sm font-medium text-white/80 truncate flex items-center gap-2">
                          {session.deviceInfo?.os || "Unknown OS"} · {session.deviceInfo?.browser || "Unknown Browser"}
                          {session.id === (user as any)?.sid && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 font-bold uppercase tracking-tighter">Current</span>
                          )}
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

      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />

      <ReAuthModal
        isOpen={reAuthModalConfig.isOpen}
        title={reAuthModalConfig.title}
        message={reAuthModalConfig.message}
        onConfirm={reAuthModalConfig.onConfirm}
        onCancel={() => setReAuthModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
