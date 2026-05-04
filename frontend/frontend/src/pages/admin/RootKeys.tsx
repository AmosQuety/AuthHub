import { useState } from "react";
import { 
  KeyRound, Plus, Trash2, Copy, ShieldAlert, 
  ShieldCheck, Loader2, Eye, EyeOff, Search
} from "lucide-react";

interface RootKey {
  id: string;
  name: string;
  key: string;
  lastUsed: string | null;
  createdAt: string;
}

export default function RootKeys() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [keys, setKeys] = useState<RootKey[]>([
    { id: "rk_1", name: "Internal Automation Service", key: "ak_live_73kP9mNqR...", lastUsed: "2026-05-02T10:00:00Z", createdAt: "2026-01-15T00:00:00Z" },
    { id: "rk_2", name: "CI/CD Deployment Bot", key: "ak_live_x8vR2bL0W...", lastUsed: null, createdAt: "2026-04-20T00:00:00Z" },
  ]);

  const generateKey = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const newKey = {
        id: `rk_${Date.now()}`,
        name: "New Root Key",
        key: `ak_live_${Math.random().toString(36).substring(7)}...`,
        lastUsed: null,
        createdAt: new Date().toISOString()
      };
      setKeys([newKey, ...keys]);
      setIsGenerating(false);
    }, 800);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>Root API Keys</h1>
          <p className="text-sm text-white/50">High-privilege keys for platform automation · Bypasses tenant restrictions</p>
        </div>
        <button 
          onClick={generateKey}
          disabled={isGenerating}
          className="btn-primary !w-auto px-6 flex items-center gap-2"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Generate Root Key
        </button>
      </div>

      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-[10px] text-amber-400/80 leading-relaxed font-medium uppercase tracking-wider">
          Security Warning: Root keys have absolute power over the entire multi-tenant system. Never share these keys or commit them to source control. Use them only for infrastructure-level service integration.
        </div>
      </div>

      {/* Keys List */}
      <div className="glass-card overflow-hidden">
        <div className="data-table-container border-0 rounded-none bg-transparent">
          <table className="data-table">
            <thead>
              <tr>
                <th>Service Name / ID</th>
                <th>API Key</th>
                <th>Last Activity</th>
                <th>Created</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="group">
                  <td>
                    <div>
                      <p className="text-xs font-bold text-white">{k.name}</p>
                      <p className="text-[9px] text-white/20 font-mono">{k.id}</p>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <code className="text-[10px] bg-white/5 px-2 py-1 rounded text-cyan-400/70 border border-white/5">
                        {showKey === k.id ? k.key : "••••••••••••••••••••••••"}
                      </code>
                      <button 
                        onClick={() => setShowKey(showKey === k.id ? null : k.id)}
                        className="p-1 hover:bg-white/5 rounded text-white/20 hover:text-white transition-all"
                      >
                        {showKey === k.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button className="p-1 hover:bg-white/5 rounded text-white/20 hover:text-white transition-all">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td>
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                      {k.lastUsed ? new Date(k.lastUsed).toLocaleDateString() : "Never"}
                    </span>
                  </td>
                  <td>
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                      {new Date(k.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <button className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/10 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-widest">Usage Scoping</h4>
          </div>
          <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-wider">Root keys bypass all Tenant-level Rate Limits and Scopes. Each request is logged under the 'SYSTEM' audit trail.</p>
        </div>
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-widest">Revocation</h4>
          </div>
          <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-wider">Deleting a root key immediately invalidates all active requests using that key across all edge nodes.</p>
        </div>
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-4 h-4 text-violet-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-widest">Global Audit</h4>
          </div>
          <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-wider">All 'God Mode' actions are mirrored to the platform observability logs for security compliance.</p>
        </div>
      </div>
    </div>
  );
}
