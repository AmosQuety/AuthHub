import { useEffect, useState } from "react";
import { 
  Users, Monitor, FileCode2, Package, ArrowUpRight, 
  Loader2, Shield, Clock, Plus, Settings, 
  Terminal, AlertCircle, CheckCircle2
} from "lucide-react";
import { useTenant } from "../contexts/TenantContext";
import { api } from "../lib/api";
import { Link } from "react-router-dom";

interface DashboardStats {
  totalUsers: number;
  activeSessions: number;
  loginsToday: number;
  appCount: number;
  recentUsers: any[];
  riskTrends: { date: string; success: number; failed: number; blocked: number }[];
  mfaStats: { enabled: number; disabled: number };
  recentLogs: any[];
}

export default function Overview() {
  const { tenant } = useTenant();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const url = tenant?.id ? `/admin/observability/summary?tenantId=${tenant.id}` : "/admin/observability/summary";
      const data = await api.get(url);
      setStats(data);
    } catch (err) {
      console.error("Dashboard stats fetch failed:", err);
      // We don't throw here to avoid the global 401 interceptor if it's a 403 or data error
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-white/20">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-sm font-medium animate-pulse">Synchronizing platform data...</p>
      </div>
    );
  }

  const usageData = stats?.riskTrends.map(t => t.success + t.failed + t.blocked) || [];
  const maxUsage = usageData.length > 0 ? Math.max(...usageData) : 1;

  const mfaRate = stats ? Math.round((stats.mfaStats.enabled / (stats.totalUsers || 1)) * 100) : 0;

  return (
    <div className={`space-y-8 transition-opacity duration-500 pb-12 ${mounted ? "opacity-100" : "opacity-0"}`}>
      
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>Platform Overview</h1>
          <p className="text-sm text-white/50">{tenant?.name || "Global Console"} · All systems operational</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/developer/applications" className="btn-secondary !w-auto px-4 py-2 text-xs flex items-center gap-2">
            <Plus className="w-4 h-4" /> New App
          </Link>
          <Link to="/developer/api-logs" className="btn-primary !w-auto px-4 py-2 text-xs flex items-center gap-2">
            <Terminal className="w-4 h-4" /> Live Logs
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Org Identities", value: stats?.totalUsers.toLocaleString(), icon: Users, color: "bg-blue-500" },
          { label: "Active Sessions", value: stats?.activeSessions.toLocaleString(), icon: Monitor, color: "bg-emerald-500" },
          { label: "Auth Events Today", value: stats?.loginsToday.toLocaleString(), icon: FileCode2, color: "bg-cyan-500" },
          { label: "Your Clients", value: stats?.appCount.toLocaleString(), icon: Package, color: "bg-violet-500" },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.02] rounded-bl-full -mr-8 -mt-8" />
            <p className="text-[10px] font-bold text-white/40 tracking-wider mb-3 uppercase">{stat.label}</p>
            <h3 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>{stat.value}</h3>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${stat.color} animate-pulse`} />
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Real-time</span>
            </div>
          </div>
        ))}
      </div>

      {/* Middle Section: Trends & Security */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Activity Chart */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-white text-sm">Platform Traffic</h3>
              <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Last 14 days activity</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold text-white/30">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-cyan-400" /> Success</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-white/10" /> Blocked</span>
            </div>
          </div>
          
          <div className="flex-1 flex items-end gap-2 h-40">
            {stats?.riskTrends.map((t, i) => {
              const total = t.success + t.failed + t.blocked;
              const height = (total / maxUsage) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col justify-end gap-1 group relative h-full">
                  <div 
                    className="w-full bg-cyan-400/20 group-hover:bg-cyan-400/40 transition-all rounded-t-sm relative"
                    style={{ height: `${height || 5}%` }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white text-black text-[9px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {total} events
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-white/20 font-bold border-t border-white/5 pt-4 mt-4 uppercase">
            <span>{stats?.riskTrends[0]?.date}</span>
            <span>{stats?.riskTrends[stats?.riskTrends.length - 1]?.date}</span>
          </div>
        </div>

        {/* Security Posture */}
        <div className="glass-card p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Security Posture</h3>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center py-4">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle cx="64" cy="64" r="58" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/5" />
                <circle 
                  cx="64" cy="64" r="58" fill="none" stroke="currentColor" strokeWidth="8" 
                  strokeDasharray={364.4} 
                  strokeDashoffset={364.4 - (364.4 * mfaRate) / 100} 
                  className="text-emerald-500 transition-all duration-1000"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-bold text-white">{mfaRate}%</span>
                <span className="text-[8px] text-white/40 font-bold uppercase tracking-widest">MFA Adoption</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex justify-between text-xs">
              <span className="text-white/50">MFA Enabled</span>
              <span className="text-white font-mono">{stats?.mfaStats.enabled}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/50">Password Only</span>
              <span className="text-white font-mono">{stats?.mfaStats.disabled}</span>
            </div>
            <Link to="/security/mfa" className="block text-center text-[10px] font-bold text-cyan-400 uppercase tracking-widest hover:text-cyan-300 transition-colors pt-2">
              Improve Security Score →
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Activity & Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Users */}
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
            <h3 className="font-bold text-white text-sm">Recently Joined</h3>
            <Link to="/admin/users" className="text-[10px] font-bold text-white/30 uppercase tracking-widest hover:text-white transition-colors">Manage All</Link>
          </div>
          <div className="data-table-container border-0 rounded-none bg-transparent">
            <table className="data-table">
              <tbody>
                {stats?.recentUsers.map((u, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/40">
                          {u.email.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white">{u.email.split('@')[0]}</p>
                          <p className="text-[9px] text-white/30">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-right py-3">
                      <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mini Audit Log */}
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-white text-sm">Security Events</h3>
            </div>
            <Link to="/developer/api-logs" className="text-[10px] font-bold text-white/30 uppercase tracking-widest hover:text-white transition-colors">Audit Trail</Link>
          </div>
          <div className="p-2 space-y-1">
            {stats?.recentLogs.map((log, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.02] transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`p-1.5 rounded-md ${log.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {log.status === 'SUCCESS' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">{log.action.replace(/_/g, ' ')}</p>
                    <p className="text-[10px] text-white/40">{log.user?.email || 'System'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-mono text-white/20 group-hover:text-white/40 transition-colors">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
