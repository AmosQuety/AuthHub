import { useState, useEffect } from "react";
import { api } from "../lib/api";

import { ShieldAlert, CheckCircle2, XCircle, Clock, MapPin, Monitor, History, Loader2 } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  ipAddress: string | null;
  deviceInfo: string | null;
  status: "SUCCESS" | "FAILURE" | "BLOCKED";
  details: any;
  createdAt: string;
}

export default function SecurityAudit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get("/auth/audit-logs")
      .then(d => setLogs(d.logs || []))
      .catch(e => console.error("Failed to fetch audit logs:", e))
      .finally(() => setIsLoading(false));
  }, []);

  const getActionFormat = (action: string) => {
    const map: Record<string, string> = {
      LOGIN: "Login attempt", LOGIN_FAILED: "Failed login", LOGIN_ATTEMPT: "Anomalous login attempt",
      TOKEN_REFRESH: "Session refreshed", TOKEN_REVOCATION: "Session revoked", EMAIL_VERIFIED: "Email verified",
      PASSWORD_RESET_REQUESTED: "Password reset requested", PASSWORD_RESET: "Password changed", MFA_ENROLLED: "Two-factor auth enabled"
    };
    return map[action] || action.replace(/_/g, " ");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS": return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case "FAILURE": return <XCircle className="w-3.5 h-3.5 text-rose-400" />;
      case "BLOCKED": return <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1 flex items-center gap-2">
            <History className="w-3 h-3 text-violet-400" /> Account Security
          </p>
          <h1 className="text-3xl font-bold text-gradient" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Audit Log
          </h1>
          <p className="text-white/40 mt-1.5 text-sm">Review your recent login history and security events.</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden border border-violet-500/15">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-white/20">
            <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
            <span className="text-sm">Loading security events…</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <ShieldAlert className="w-10 h-10 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No recent security events found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {["Action", "Status", "IP Address", "Device / Location", "Date"].map(h => (
                    <th key={h} className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-white/25 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {logs.map((log, i) => (
                  <tr key={log.id} className={`group hover:bg-white/2 transition-colors duration-150 animate-fade-up stagger-${Math.min(i + 1, 5)}`}>
                    <td className="px-5 py-4 max-w-[200px] truncate" title={log.action}>
                      <div className="font-semibold text-white/90">{getActionFormat(log.action)}</div>
                      {log.details?.reason && (
                        <div className="text-[11px] text-rose-400 mt-1 font-medium break-words bg-rose-500/10 px-2 py-0.5 rounded inline-block">
                          {log.details.reason}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border
                        ${log.status === "SUCCESS" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                          log.status === "FAILURE" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : 
                          "bg-rose-500/20 text-rose-500 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.3)]"}`}
                      >
                        {getStatusIcon(log.status)}
                        {log.status === "FAILURE" ? "FAILED" : log.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-white/60">
                        <MapPin className="w-3.5 h-3.5 text-white/20" />
                        <span className="font-mono text-[11px] bg-white/5 px-1.5 py-0.5 rounded">{log.ipAddress || "Unknown IP"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-white/50">
                        <Monitor className="w-3.5 h-3.5 text-white/20" />
                        <span className="text-xs truncate max-w-[180px]" title={log.deviceInfo || "Unknown"}>
                          {log.deviceInfo?.split(" ")[0]}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-white/40 text-xs">
                       <div className="flex items-center gap-1.5 whitespace-nowrap">
                         <Clock className="w-3.5 h-3.5 text-white/20" />
                         {new Date(log.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
