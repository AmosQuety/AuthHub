import { useState, useEffect } from "react";
import { api, ApiError } from "../../lib/api";
import { TableSkeleton } from "../../components/ui/TableSkeleton";
import { Plus, Trash2, Copy, Check, KeyRound, Globe, Loader2 } from "lucide-react";

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
    } catch (e) {
      console.error("Failed to load clients");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadClients(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError("");
    setNewSecret(null);

    try {
      const redirectUris = form.redirectUris.split("\n").map(u => u.trim()).filter(Boolean);
      const data = await api.post("/auth/admin/clients", {
        name: form.name,
        redirectUris,
        isConfidential: form.isConfidential,
      });

      setNewSecret({ clientId: data.client.clientId, clientSecret: data.client.clientSecret });
      setForm({ name: "", redirectUris: "", isConfidential: true });
      setShowForm(false);
      loadClients();
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : "Failed to create client");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm(`Delete client "${clientId}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/auth/admin/clients/${clientId}`);
      setClients(c => c.filter(x => x.clientId !== clientId));
    } catch (e) {
      alert("Failed to delete client.");
    }
  };

  const copyToClipboard = (text: string, key: "id" | "secret") => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Application Registry</h1>
          <p className="text-gray-400 mt-1">Manage OAuth 2.0 client applications connected to AuthHub.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary !w-auto">
          <Plus className="w-4 h-4" /> New Application
        </button>
      </div>

      {/* One-time secret reveal */}
      {newSecret && (
        <div className="p-5 bg-green-500/10 border border-green-500/30 rounded-xl space-y-3">
          <p className="font-semibold text-green-400 text-sm flex items-center gap-2">
            <Check className="w-4 h-4" /> Application created — save these credentials now. The secret is only shown once.
          </p>
          {[{ label: "Client ID", val: newSecret.clientId, key: "id" as const }, 
            ...(newSecret.clientSecret ? [{ label: "Client Secret", val: newSecret.clientSecret, key: "secret" as const }] : [])
          ].map(item => (
            <div key={item.key} className="flex items-center gap-3 p-3 bg-brand-surface rounded-lg font-mono text-sm border border-brand-border">
              <span className="text-gray-400 w-24 shrink-0">{item.label}</span>
              <span className="text-white flex-1 truncate">{item.val}</span>
              <button onClick={() => copyToClipboard(item.val, item.key)} className="text-gray-400 hover:text-white p-1 rounded">
                {copied === item.key ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="p-6 glass-card space-y-4">
          <h2 className="font-semibold text-lg">Register New Application</h2>
          {error && <p className="text-sm text-red-400 bg-red-400/10 p-3 rounded-lg">{error}</p>}
          <div>
            <label className="input-label">Application Name</label>
            <input className="input-field" placeholder="My App" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="input-label">Redirect URIs (one per line)</label>
            <textarea className="input-field h-28 resize-none" placeholder="https://myapp.com/callback" value={form.redirectUris} onChange={e => setForm(f => ({ ...f, redirectUris: e.target.value }))} />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="isConf" checked={form.isConfidential} onChange={e => setForm(f => ({ ...f, isConfidential: e.target.checked }))} className="w-4 h-4 accent-brand-primary" />
            <label htmlFor="isConf" className="text-sm text-gray-300">Confidential client (server-side app with a Client Secret)</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 !w-auto">Cancel</button>
            <button type="submit" disabled={isCreating} className="btn-primary flex-1">
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Create Application"}
            </button>
          </div>
        </form>
      )}

      {/* Client List */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <TableSkeleton columns={6} rows={5} />
        ) : clients.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Globe className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p>No applications registered yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-brand-border">
              <tr>
                {["Name", "Client ID", "Type", "Redirect URIs", "Created", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {clients.map(client => (
                <tr key={client.clientId} className="hover:bg-brand-surface/50 transition-colors">
                  <td className="px-5 py-4 font-medium text-white">{client.name}</td>
                  <td className="px-5 py-4 font-mono text-xs text-gray-400 max-w-[140px] truncate">{client.clientId}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${client.isPublic ? 'bg-blue-500/15 text-blue-400' : 'bg-purple-500/15 text-purple-400'}`}>
                      <KeyRound className="w-3 h-3" />
                      {client.isPublic ? "Public" : "Confidential"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-400 text-xs">{client.redirectUris.slice(0, 2).join(", ")}{client.redirectUris.length > 2 ? " …" : ""}</td>
                  <td className="px-5 py-4 text-gray-500 text-xs">{new Date(client.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => handleDelete(client.clientId)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
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
