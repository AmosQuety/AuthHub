import { useEffect, useState } from "react";
import { 
  Users, Monitor, FileCode2, Package, ArrowUpRight, 
  Loader2, ShieldCheck, Globe, Activity 
} from "lucide-react";
import { api } from "../../lib/api";

interface DashboardStats {
  totalUsers: number;
  activeSessions: number;
  loginsToday: number;
  appCount: number;
  tenantCount: number;
  recentUsers: any[];
  riskTrends: { date: string; success: number; failed: number; blocked: number }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await api.get("/admin/observability/summary");
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch admin stats", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-white/20">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-sm font-medium animate-pulse">Initializing Administrative Console...</p>
      </div>
    );
  }

  const statCards = [
    { label: "GLOBAL USERS", value: stats?.totalUsers.toLocaleString(), icon: Users, color: "text-blue-400" },
    { label: "TOTAL TENANTS", value: stats?.tenantCount.toLocaleString(), icon: Globe, color: "text-amber-400" },
    { label: "ACTIVE SESSIONS", value: stats?.activeSessions.toLocaleString(), icon: Monitor, color: "text-emerald-400" },
    { label: "OAUTH CLIENTS", value: stats?.appCount.toLocaleString(), icon: Package, color: "text-violet-400" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>Admin Console</h1>
        <p className="text-sm text-white/50">Global Platform Overview · Multi-Tenant Monitoring</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="glass-card p-5 relative overflow-hidden group">
            <div className="absolute top-4 right-4 text-white/5 group-hover:text-white/10 transition-colors">
              <stat.icon className="w-12 h-12" strokeWidth={1} />
            </div>
            <p className="text-[10px] font-bold text-white/40 tracking-wider mb-3 uppercase">{stat.label}</p>
            <h3 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>{stat.value}</h3>
            <div className={`w-8 h-1 rounded-full ${stat.color.replace('text', 'bg')} opacity-40`} />
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Global Recent Users */}
        <div className="lg:col-span-2 glass-card overflow-hidden flex flex-col">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-white text-sm">Cross-Tenant Activity</h3>
            </div>
          </div>
          
          <div className="data-table-container border-0 rounded-none bg-transparent flex-1">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Status</th>
                  <th>Roles</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentUsers.map((u, i) => (
                  <tr key={i}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border border-white/10 bg-white/5 text-white/70">
                          {u.email.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="max-w-[150px]">
                          <p className="text-sm font-medium text-white truncate">{u.email.split('@')[0]}</p>
                          <p className="text-[10px] text-white/40 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-dot ${u.emailVerified ? 'status-active' : 'status-pending'}`}>
                        {u.emailVerified ? 'VERIFIED' : 'PENDING'}
                      </span>
                    </td>
                    <td className="text-[10px] text-white/50 font-mono">
                      {u.roles.join(', ')}
                    </td>
                    <td className="text-xs text-white/50">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Health / Summary */}
        <div className="glass-card p-5 space-y-6">
          <div>
            <h3 className="font-bold text-white text-sm mb-1">Platform Status</h3>
            <p className="text-[10px] text-white/40 uppercase tracking-wide">Real-time health check</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-medium text-white/80">Identity Core</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Healthy</span>
            </div>
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-medium text-white/80">Edge Delivery</span>
              </div>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Optimal</span>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileCode2 className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-medium text-white/80">Audit Streams</span>
              </div>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Active</span>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <button 
              className="w-full btn-primary py-2.5 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
              onClick={() => window.location.href = '/admin/observability'}
            >
              System Reports <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
