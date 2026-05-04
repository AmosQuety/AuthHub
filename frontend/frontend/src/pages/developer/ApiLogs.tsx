import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { TerminalSquare, Search, Filter, Loader2, ArrowUpRight, Copy, MapPin, Clock } from "lucide-react";

interface ApiLog {
  id: string;
  method: string;
  path: string;
  status: number;
  latency: number;
  ip: string;
  timestamp: string;
  action: string;
}

export default function ApiLogs() {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await api.get("/auth/audit-logs");
        // Map existing audit logs to API-style logs for the demo
        const mappedLogs = (data.logs || []).map((l: any) => ({
          id: l.id,
          method: l.action.includes("LOGIN") ? "POST" : l.action.includes("REVOKE") ? "DELETE" : "GET",
          path: l.action.includes("LOGIN") ? "/auth/login" : l.action.includes("MFA") ? "/auth/mfa/verify" : "/auth/me",
          status: l.status === "SUCCESS" ? 200 : l.status === "BLOCKED" ? 403 : 401,
          latency: Math.floor(Math.random() * 150) + 20, // Mock latency for the high-density UI feel
          ip: l.ipAddress || "127.0.0.1",
          timestamp: l.createdAt,
          action: l.action
        }));
        setLogs(mappedLogs);
      } catch (err) {
        console.error("Failed to load api logs", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET": return "text-cyan-400";
      case "POST": return "text-emerald-400";
      case "PUT": return "text-amber-400";
      case "DELETE": return "text-red-400";
      default: return "text-white/40";
    }
  };

  const filteredLogs = logs.filter(l => 
    l.path.toLowerCase().includes(search.toLowerCase()) || 
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.ip.includes(search)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">API Logs</h1>
          <p className="text-sm text-white/50">Real-time request monitoring and observability.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex -space-x-2">
             {[1,2,3].map(i => (
               <div key={i} className="w-6 h-6 rounded-full border-2 border-[#0d0f14] bg-white/5 flex items-center justify-center">
                 <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
               </div>
             ))}
           </div>
           <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Live Monitoring</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search path, action, or IP..."
            className="input-field pl-9 h-10 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="h-10 px-4 rounded-xl border border-white/10 bg-white/[0.02] text-white/70 text-sm font-medium flex items-center gap-2 hover:bg-white/[0.05] hover:text-white transition-colors">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      {/* Logs Table */}
      <div className="data-table-container">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-white/30">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            <span className="text-sm">Tailing logs...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-white/40 text-sm">
            No logs found matching your criteria.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Method</th>
                <th>Path / Event</th>
                <th>Status</th>
                <th>Latency</th>
                <th>IP Address</th>
                <th className="text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="group cursor-pointer">
                  <td>
                    <span className={`method-badge ${getMethodColor(log.method)}`}>
                      {log.method}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="font-mono text-xs text-white/80">{log.path}</div>
                      <span className="text-[10px] text-white/30 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                        {log.action}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        log.status < 300 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                      }`} />
                      <span className="text-xs font-medium text-white/70">{log.status}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`text-xs font-mono ${log.latency > 80 ? "text-amber-400" : "text-white/40"}`}>
                      {log.latency}ms
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors">
                      <MapPin className="w-3 h-3" />
                      <span className="text-[11px] font-mono">{log.ip}</span>
                    </div>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2 text-white/30 text-[11px]">
                      <Clock className="w-3 h-3" />
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer / Pagination */}
      <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-widest font-bold">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          Gateway Connected
        </div>
        <button className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-widest flex items-center gap-1">
          Export Logs <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
