import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, CartesianGrid, Area, AreaChart
} from "recharts";
import { Activity, ShieldAlert, Users, Globe, TrendingUp } from "lucide-react";

interface Stats { activeSessions: number; loginsToday: number; anomaliesLast7Days: number; }
interface FunnelData { stage: string; count: number; }
interface TrendData { date: string; success: number; blocked: number; failed: number; }
interface HeatmapData { country: string; count: number; }

const TOOLTIP_STYLE = {
  backgroundColor: "#0c0c18",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "12px",
  color: "#e2e8f0",
  fontSize: "12px",
};

export default function AdminObservability() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [funnel, setFunnel] = useState<FunnelData[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapData[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const h = { Authorization: `Bearer ${token}` };
        const base = (import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1").replace(/\/api\/v1$/, "");
        const [s, f, t, hm] = await Promise.all([
          fetch(`${base}/api/v1/admin/observability/stats`, { headers: h }).then(r => r.json()),
          fetch(`${base}/api/v1/admin/observability/funnel`, { headers: h }).then(r => r.json()),
          fetch(`${base}/api/v1/admin/observability/risk-trends`, { headers: h }).then(r => r.json()),
          fetch(`${base}/api/v1/admin/observability/heatmap`, { headers: h }).then(r => r.json()),
        ]);
        setStats(s); setFunnel(f); setTrends(t); setHeatmap(hm);
      } catch (e: any) { setError(e.message); }
    };
    load();
  }, []);

  const kpis = [
    { label: "Logins Today", value: stats?.loginsToday ?? "—", icon: Users, color: "violet", sub: "from all tenants" },
    { label: "Active Sessions", value: stats?.activeSessions ?? "—", icon: Activity, color: "cyan", sub: "across the platform" },
    { label: "Anomalies (7d)", value: stats?.anomaliesLast7Days ?? "—", icon: ShieldAlert, color: "red", sub: "blocked attempts" },
  ];

  const colorMap: Record<string, string> = {
    violet: "from-violet-600/20 to-violet-600/5 border-violet-500/15 text-violet-300",
    cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/15 text-cyan-300",
    red: "from-red-500/20 to-red-500/5 border-red-500/15 text-red-300",
  };
  const iconColorMap: Record<string, string> = {
    violet: "bg-violet-600/20 text-violet-400",
    cyan: "bg-cyan-500/20 text-cyan-400",
    red: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <h1 className="text-3xl font-bold text-gradient" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Observability
        </h1>
        <p className="text-white/35 mt-1 text-sm">Real-time visibility into auth funnels, risk signals, and geography.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl text-sm text-red-300 bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, sub }, i) => (
          <div
            key={label}
            className={`stat-card animate-fade-up stagger-${i + 1} bg-gradient-to-br ${colorMap[color]} border rounded-2xl`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${iconColorMap[color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <TrendingUp className="w-4 h-4 text-white/15" />
            </div>
            <div className="text-4xl font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>{value}</div>
            <div className="text-xs text-white/40 mt-1 uppercase tracking-wider">{label}</div>
            <div className="text-[10px] text-white/25 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Auth Funnel */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-1">Auth Funnel</h2>
          <p className="text-white text-base font-semibold mb-5">Last 7 days</p>
          <div className="h-56">
            {funnel.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnel} layout="vertical" margin={{ left: 30, right: 12 }}>
                  <XAxis type="number" stroke="rgba(255,255,255,0.12)" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} />
                  <YAxis dataKey="stage" type="category" width={110} stroke="transparent" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} />
                  <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="count" fill="url(#violetBar)" radius={[0, 6, 6, 0]} barSize={28} />
                  <defs>
                    <linearGradient id="violetBar" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-white/20 text-sm">Collecting data…</div>
            )}
          </div>
        </div>

        {/* Risk & Anomaly Trends */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-1">Risk Trends</h2>
          <p className="text-white text-base font-semibold mb-5">Last 14 days</p>
          <div className="h-56">
            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="blockedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" stroke="transparent" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                  <YAxis stroke="transparent" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: "8px", fontSize: "11px", color: "rgba(255,255,255,0.4)" }} />
                  <Area type="monotone" name="Success" dataKey="success" stroke="#22c55e" strokeWidth={2} fill="url(#successGrad)" dot={false} />
                  <Area type="monotone" name="Blocked" dataKey="blocked" stroke="#ef4444" strokeWidth={2} fill="url(#blockedGrad)" dot={{ r: 3, fill: "#ef4444" }} />
                  <Area type="monotone" name="Failed" dataKey="failed" stroke="#f59e0b" strokeWidth={1.5} fill="transparent" dot={false} strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-white/20 text-sm">Collecting data…</div>
            )}
          </div>
        </div>
      </div>

      {/* Geo Heatmap table */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/35">Top Geographies</p>
            <h2 className="text-white font-semibold mt-0.5">Login Origins — Past 30 days</h2>
          </div>
          <Globe className="w-5 h-5 text-white/20" />
        </div>
        <div className="divide-y divide-white/4">
          {heatmap.length > 0 ? heatmap.slice(0, 10).map((loc, idx) => {
            const pct = heatmap[0].count > 0 ? (loc.count / heatmap[0].count) * 100 : 0;
            return (
              <div key={idx} className="px-5 py-3.5 flex items-center gap-4 hover:bg-white/2 transition-colors group">
                <span className="text-xs text-white/25 w-5 text-right">{idx + 1}</span>
                <div className="w-8 h-8 rounded-full bg-violet-600/15 border border-violet-500/15 flex items-center justify-center text-violet-300 text-[10px] font-bold">
                  {loc.country}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-white/70 font-medium">{loc.country === "US" ? "United States" : loc.country}</div>
                  <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className="text-sm font-semibold text-white/60 tabular-nums">{loc.count.toLocaleString()}</span>
              </div>
            );
          }) : (
            <div className="p-10 text-center text-white/20 text-sm">No geographic data yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
