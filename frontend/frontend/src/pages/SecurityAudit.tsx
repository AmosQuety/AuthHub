import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { TableSkeleton } from "../components/ui/TableSkeleton";
import { ShieldAlert, CheckCircle2, XCircle, Clock, MapPin, Monitor } from "lucide-react";

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
    const fetchLogs = async () => {
      try {
        const data = await api.get("/auth/audit-logs");
        setLogs(data.logs || []);
      } catch (e) {
        console.error("Failed to fetch audit logs:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getActionFormat = (action: string) => {
    const map: Record<string, string> = {
      LOGIN: "Login attempt",
      LOGIN_FAILED: "Failed login",
      LOGIN_ATTEMPT: "Anomalous login attempt",
      TOKEN_REFRESH: "Session refreshed",
      TOKEN_REVOCATION: "Session revoked",
      EMAIL_VERIFIED: "Email verified",
      PASSWORD_RESET_REQUESTED: "Password reset requested",
      PASSWORD_RESET: "Password changed",
      MFA_ENROLLED: "Two-factor auth enabled"
    };
    return map[action] || action.replace(/_/g, " ");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS": return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case "FAILURE": return <XCircle className="w-4 h-4 text-red-400" />;
      case "BLOCKED": return <ShieldAlert className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-brand-primary" /> 
            Security Audit Log
          </h1>
          <p className="text-gray-400 mt-1">Review your recent login history and security events.</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <TableSkeleton columns={5} rows={6} />
        ) : logs.length === 0 ? (
          <div className="text-center p-12 text-gray-500">
            <ShieldAlert className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>No recent security events found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-brand-border bg-brand-surface/30">
                <tr>
                  {["Action", "Status", "IP Address", "Device / Location", "Date"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-brand-surface/50 transition-colors">
                    <td className="px-5 py-4 font-medium text-white max-w-[200px] truncate" title={log.action}>
                      {getActionFormat(log.action)}
                      {log.details?.reason && (
                        <div className="text-xs text-red-400 mt-1 font-normal break-words">{log.details.reason}</div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                        ${log.status === "SUCCESS" ? "bg-green-500/10 text-green-400 border-green-500/20" : 
                          log.status === "FAILURE" ? "bg-red-500/10 text-red-400 border-red-500/20" : 
                          "bg-red-500/20 text-red-500 border-red-500/30"}`}
                      >
                        {getStatusIcon(log.status)}
                        <span className="capitalize">{log.status.toLowerCase()}</span>
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-gray-300">
                        <MapPin className="w-3.5 h-3.5 text-gray-500" />
                        <span className="font-mono text-xs">{log.ipAddress || "Unknown IP"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Monitor className="w-3.5 h-3.5" />
                        <span className="text-xs truncate max-w-[180px]" title={log.deviceInfo || "Unknown"}>
                          {log.deviceInfo?.split(" ")[0]} {/* Simplistic UA parse for the log table */}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">
                       <div className="flex items-center gap-1.5 whitespace-nowrap">
                         <Clock className="w-3.5 h-3.5 text-gray-500" />
                         {new Date(log.createdAt).toLocaleString()}
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
