import { useState, useEffect } from "react";
import { 
  Globe, Plus, Search, Filter, ArrowUpRight, 
  Loader2, MoreHorizontal, Shield, Users as UsersIcon,
  Package
} from "lucide-react";
import { api } from "../../lib/api";

interface Tenant {
  id: string;
  name: string;
  clientId: string;
  createdAt: string;
  _count: {
    users: number;
    clients: number;
  };
}

export default function Tenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createForm, setCreateForm] = useState({ name: "", customDomain: "", logoUrl: "", primaryColor: "" });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const data = await api.get("/auth/admin/tenants");
      setTenants(data.tenants || []);
    } catch (err) {
      console.error("Failed to fetch tenants", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateError("");

    try {
      const data = await api.post("/auth/admin/tenants", {
        name: createForm.name.trim(),
        customDomain: createForm.customDomain.trim() || undefined,
        logoUrl: createForm.logoUrl.trim() || undefined,
        primaryColor: createForm.primaryColor.trim() || undefined,
      });

      setTenants((current) => [{
        id: data.tenant.id,
        name: data.tenant.name,
        clientId: data.tenant.clientId,
        createdAt: data.tenant.createdAt || new Date().toISOString(),
        _count: { users: 0, clients: 0 },
      }, ...current]);

      setCreateForm({ name: "", customDomain: "", logoUrl: "", primaryColor: "" });
      setShowCreateModal(false);
    } catch (err: any) {
      setCreateError(err?.message || "Failed to create tenant");
    } finally {
      setIsCreating(false);
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.clientId.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-white/20">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-sm font-medium">Loading organizations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>Tenants</h1>
          <p className="text-sm text-white/50">{tenants.length} total organizations registered</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2 !w-auto px-6">
          <Plus className="w-4 h-4" /> Create Tenant
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-cyan-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search organizations..." 
            className="input-field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-white/40 hover:text-white hover:bg-white/[0.05] transition-all">
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="data-table-container border-0 rounded-none bg-transparent">
          <table className="data-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Client ID</th>
                <th>Users</th>
                <th>Apps</th>
                <th>Status</th>
                <th>Created</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map((t) => (
                <tr key={t.id} className="group">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center text-xs font-bold border border-violet-500/20">
                        {t.name.charAt(0)}
                      </div>
                      <span className="font-medium text-white group-hover:text-cyan-400 transition-colors">{t.name}</span>
                    </div>
                  </td>
                  <td className="font-mono text-[10px] text-white/40">{t.clientId}</td>
                  <td>
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      <UsersIcon className="w-3 h-3 opacity-30" /> {t._count.users}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      <Package className="w-3 h-3 opacity-30" /> {t._count.clients}
                    </div>
                  </td>
                  <td>
                    <span className="status-dot status-active">ACTIVE</span>
                  </td>
                  <td className="text-xs text-white/40">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <button className="p-1.5 rounded-lg hover:bg-white/5 text-white/20 hover:text-white transition-all">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <form onSubmit={handleCreateTenant} className="relative w-full max-w-xl glass-card p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <button type="button" onClick={() => setShowCreateModal(false)} className="absolute top-5 right-5 p-2 text-white/40 hover:text-white rounded-full bg-white/5">✕</button>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>Create Tenant</h2>
              <p className="text-sm text-white/50">Provision a new organization space and register it in AuthHub.</p>
            </div>

            {createError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {createError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Tenant Name</label>
              <input
                required
                autoFocus
                className="input-field"
                placeholder="VaultKit"
                value={createForm.name}
                onChange={(e) => setCreateForm((current) => ({ ...current, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Custom Domain</label>
                <input
                  className="input-field"
                  placeholder="auth.vaultkit.com"
                  value={createForm.customDomain}
                  onChange={(e) => setCreateForm((current) => ({ ...current, customDomain: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Primary Color</label>
                <input
                  className="input-field"
                  placeholder="#7c3aed"
                  value={createForm.primaryColor}
                  onChange={(e) => setCreateForm((current) => ({ ...current, primaryColor: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Logo URL</label>
              <input
                className="input-field"
                placeholder="https://example.com/logo.png"
                value={createForm.logoUrl}
                onChange={(e) => setCreateForm((current) => ({ ...current, logoUrl: e.target.value }))}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" disabled={isCreating} className="btn-primary flex-1 inline-flex items-center justify-center gap-2">
                {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                {isCreating ? "Creating..." : "Create Tenant"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
