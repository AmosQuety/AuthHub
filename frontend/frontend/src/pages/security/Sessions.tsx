import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { 
  Laptop, Smartphone, Trash2, ShieldAlert, History, 
  Loader2, MapPin, Clock, Activity, ShieldCheck, XCircle
} from "lucide-react";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import { ReAuthModal } from "../../components/ui/ReAuthModal";

interface Session {
  id: string;
  ipAddress: string | null;
  deviceInfo: { browser?: string; os?: string; isMobile?: boolean };
  expiresAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  ipAddress: string | null;
  deviceInfo: string | null;
  status: "SUCCESS" | "FAILURE" | "BLOCKED";
  details: any;
  createdAt: string;
}

export default function Sessions() {
  const { user, logout, refreshProfile } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sessionsRes, logsRes] = await Promise.all([
        api.get("/auth/sessions"),
        api.get("/auth/audit-logs")
      ]);
      setSessions(sessionsRes.sessions || []);
      setAuditLogs(logsRes.logs || []);
    } catch (err) {
      console.error("Failed to load security data", err);
    } finally {
      setIsLoading(false);
    }
  };

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

  const getActionFormat = (action: string) => {
    const map: Record<string, string> = {
      LOGIN: "Login attempt", LOGIN_FAILED: "Failed login", LOGIN_ATTEMPT: "Anomalous login attempt",
      TOKEN_REFRESH: "Session refreshed", TOKEN_REVOCATION: "Session revoked", EMAIL_VERIFIED: "Email verified",
      PASSWORD_RESET_REQUESTED: "Password reset requested", PASSWORD_RESET: "Password changed", MFA_ENROLLED: "Two-factor auth enabled"
    };
    return map[action] || action.replace(/_/g, " ");
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Sessions Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Active Sessions</h1>
            <p className="text-sm text-white/50">Devices currently logged into your account.</p>
          </div>
          {sessions.length > 1 && (
            <button 
              onClick={handleRevokeAllOther}
              className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest border border-red-500/20 px-3 py-1.5 rounded-lg bg-red-500/5"
            >
              Revoke All Others
            </button>
          )}
        </div>

        <div className="data-table-container">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-white/30">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              <span className="text-sm">Fetching sessions...</span>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Device</th>
                  <th>IP Address</th>
                  <th>Status</th>
                  <th>Expires</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => {
                  const isCurrent = session.id === (user as any)?.sid;
                  return (
                    <tr key={session.id} className="group">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                            {session.deviceInfo?.isMobile ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {session.deviceInfo?.browser || "Unknown Browser"} on {session.deviceInfo?.os || "Unknown OS"}
                            </p>
                            {isCurrent && <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Current Device</p>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2 text-white/50 font-mono text-xs">
                          <MapPin className="w-3 h-3" />
                          {session.ipAddress || "Unknown"}
                        </div>
                      </td>
                      <td>
                        <span className={`status-dot ${isCurrent ? "status-active" : "status-inactive"}`}>
                          {isCurrent ? "Online" : "Idle"}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2 text-white/30 text-xs">
                          <Clock className="w-3 h-3" />
                          {new Date(session.expiresAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <div className="flex justify-end">
                          <button 
                            onClick={() => handleRevokeSession(session.id)}
                            className="p-1.5 text-white/30 hover:text-red-400 rounded transition-colors"
                            title="Revoke Session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Audit Log Section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Security Audit</h2>
          <p className="text-sm text-white/50">Historical record of security events.</p>
        </div>

        <div className="data-table-container">
          {isLoading ? (
            <div className="p-12 text-center text-white/20">Loading audit history...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Status</th>
                  <th>IP Address</th>
                  <th className="text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.slice(0, 10).map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div className="font-medium text-white text-sm">{getActionFormat(log.action)}</div>
                      <div className="text-[10px] text-white/30">{log.deviceInfo?.split(" ")[0] || "Unknown device"}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {log.status === "SUCCESS" ? (
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-400" />
                        )}
                        <span className={`text-[10px] font-bold uppercase ${log.status === "SUCCESS" ? "text-emerald-400" : "text-red-400"}`}>
                          {log.status}
                        </span>
                      </div>
                    </td>
                    <td className="font-mono text-xs text-white/40">{log.ipAddress || "Unknown"}</td>
                    <td className="text-right text-xs text-white/30">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

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
