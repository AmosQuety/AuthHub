import { useState, useEffect } from "react";
import { api, ApiError } from "../../lib/api";
import { Plus, Trash2, Copy, Check, KeyRound, Globe, Loader2, ExternalLink } from "lucide-react";

interface OAuthClient {
  clientId: string;
  name: string;
  redirectUris: string[];
  isPublic: boolean;
  tenantId: string | null;
  createdAt: string;
}

interface NewClientForm {
  name: string;
  redirectUris: string;
  isConfidential: boolean;
}

export default function AdminClients() {
  const [clients, setClients] = useState<OAuthClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewClientForm>({ name: "", redirectUris: "", isConfidential: true });
  const [isCreating, setIsCreating] = useState(false);
  const [newSecret, setNewSecret] = useState<{ clientId: string; clientSecret: string | null } | null>(null);
  const [copied, setCopied] = useState<"id" | "secret" | null>(null);
  const [error, setError] = useState("");

  const loadClients = async () => {
    try {
      const data = await api.get("/auth/admin/clients");
      setClients(data.clients || []);
    } catch { console.error("Failed to load clients"); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { loadClients(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true); setError(""); setNewSecret(null);
    try {
      const redirectUris = form.redirectUris.split("\n").map(u => u.trim()).filter(Boolean);
      const data = await api.post("/auth/admin/clients", { name: form.name, redirectUris, isConfidential: form.isConfidential });
      setNewSecret({ clientId: data.client.clientId, clientSecret: data.client.clientSecret });
      setForm({ name: "", redirectUris: "", isConfidential: true });
      setShowForm(false);
      loadClients();
    } catch (err: any) { setError(err instanceof ApiError ? err.message : "Failed to create client"); }
    finally { setIsCreating(false); }
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm(`Delete client "${clientId}"? This cannot be undone.`)) return;
    try { await api.delete(`/auth/admin/clients/${clientId}`); setClients(c => c.filter(x => x.clientId !== clientId)); }
    catch { alert("Failed to delete client."); }
  };

  const copyToClipboard = (text: string, key: "id" | "secret") => {
    navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1 flex items-center gap-2">
            <Globe className="w-3 h-3" /> Application Registry
          </p>
          <h1 className="text-2xl font-bold text-gradient" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {clients.length} <span className="text-white/50 text-xl font-medium">OAuth Clients</span>
          </h1>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary flex items-center gap-2 group" style={{ width: "auto" }}>
          <Plus className={`w-4 h-4 transition-transform duration-300 ${showForm ? "rotate-45" : "group-hover:rotate-90"}`} />
          {showForm ? "Cancel" : "New Application"}
        </button>
      </div>

      {/* One-time credentials reveal */}
      {newSecret && (
        <div className="p-5 rounded-2xl border border-green-500/25 bg-green-500/5 space-y-3 animate-fade-up">
          <p className="text-sm font-semibold text-green-400 flex items-center gap-2">
            <Check className="w-4 h-4" /> Application created — save these credentials. The secret is shown once only.
          </p>
          {[
            { label: "Client ID", val: newSecret.clientId, key: "id" as const },
            ...(newSecret.clientSecret ? [{ label: "Client Secret", val: newSecret.clientSecret, key: "secret" as const }] : [])
          ].map(item => (
            <div key={item.key} className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/6 font-mono text-sm">
              <span className="text-white/30 w-24 shrink-0 text-xs">{item.label}</span>
              <span className="text-violet-300 flex-1 truncate">{item.val}</span>
              <button onClick={() => copyToClipboard(item.val, item.key)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                {copied === item.key ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-white/30" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="glass-card p-6 space-y-5 animate-fade-up border border-violet-500/15">
          <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Register New Application</h2>
          {error && <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">{error}</p>}
          <div>
            <label className="input-label">Application Name</label>
            <input className="input-field" placeholder="My Production App" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="input-label">Redirect URIs (one per line)</label>
            <textarea className="input-field h-24 resize-none text-sm" placeholder={"https://myapp.com/callback\nhttp://localhost:3001/auth"} value={form.redirectUris} onChange={e => setForm(f => ({ ...f, redirectUris: e.target.value }))} />
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-white/3 border border-white/6">
            <input type="checkbox" id="isConf" checked={form.isConfidential} onChange={e => setForm(f => ({ ...f, isConfidential: e.target.checked }))} className="w-4 h-4 mt-0.5 accent-violet-500" />
            <label htmlFor="isConf" className="flex-1 cursor-pointer">
              <div className="text-sm font-bold text-white">Confidential Client</div>
              <div className="text-[11px] text-white/30 mt-0.5">Enable for server-side apps that can securely store a client secret.</div>
            </label>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={isCreating} className="btn-primary flex-1">
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Application"}
            </button>
          </div>
        </form>
      )}

      {/* Client table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex flex-col items-center gap-3 text-white/20">
            <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
            <span className="text-sm">Loading clients…</span>
          </div>
        ) : clients.length === 0 ? (
          <div className="py-16 text-center">
            <Globe className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-white/25 text-sm">No applications registered yet.</p>
            <button onClick={() => setShowForm(true)} className="mt-4 text-violet-400 text-sm hover:text-violet-300 transition-colors">Register your first app →</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {["Application", "Client ID", "Type", "Redirect URIs", "Created", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-white/25">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {clients.map((client, i) => (
                <tr key={client.clientId} className={`group hover:bg-white/2 transition-all duration-150 animate-fade-up stagger-${Math.min(i + 1, 5)}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600/25 to-cyan-500/15 border border-violet-500/15 flex items-center justify-center flex-shrink-0">
                        <Globe className="w-3.5 h-3.5 text-violet-400" />
                      </div>
                      <span className="font-semibold text-white">{client.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs text-white/35 bg-white/4 px-2 py-1 rounded-md">{client.clientId.slice(0, 16)}…</span>
                  </td>
                  <td className="px-5 py-4">
                    {client.isPublic
                      ? <span className="badge badge-cyan"><KeyRound className="w-3 h-3" />Public</span>
                      : <span className="badge badge-violet"><KeyRound className="w-3 h-3" />Confidential</span>
                    }
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      {client.redirectUris.slice(0, 2).map((uri, j) => (
                        <span key={j} className="text-[10px] text-white/30 flex items-center gap-1">
                          <ExternalLink className="w-2.5 h-2.5" />{uri.length > 40 ? uri.slice(0, 40) + "…" : uri}
                        </span>
                      ))}
                      {client.redirectUris.length > 2 && <span className="text-[10px] text-white/20">+{client.redirectUris.length - 2} more</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[11px] text-white/25">{new Date(client.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDelete(client.clientId)}
                        className="p-1.5 text-white/25 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Delete client"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
