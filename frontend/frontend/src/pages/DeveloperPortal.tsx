import { useState, useEffect } from "react";
import { api, ApiError } from "../lib/api";
import { TableSkeleton } from "../components/ui/TableSkeleton";
import { Plus, Trash2, Loader2, Copy, Check, KeyRound, TerminalSquare } from "lucide-react";

interface OAuthClient {
  clientId: string;
  name: string;
  redirectUris: string[];
  isPublic: boolean;
  createdAt: string;
}

interface NewClientForm {
  name: string;
  redirectUris: string;
  isConfidential: boolean;
}

export default function DeveloperPortal() {
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
      const data = await api.get("/user/clients");
      setClients(data.clients || []);
    } catch (e) {
      console.error("Failed to load clients");
      setError("Failed to load applications");
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
      const data = await api.post("/user/clients", {
        name: form.name,
        redirectUris,
        isConfidential: form.isConfidential,
      });

      setNewSecret({ clientId: data.client.clientId, clientSecret: data.client.clientSecret });
      setForm({ name: "", redirectUris: "", isConfidential: true });
      setShowForm(false);
      loadClients();
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : "Failed to create application");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm(`Delete application "${clientId}"? This cannot be undone and will break any integrations using it.`)) return;
    try {
      await api.delete(`/user/clients/${clientId}`);
      setClients(c => c.filter(x => x.clientId !== clientId));
    } catch (e) {
      alert("Failed to delete application.");
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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TerminalSquare className="w-6 h-6 text-brand-primary" /> 
            Developer Portal
          </h1>
          <p className="text-gray-400 mt-1">Manage your OAuth 2.0 applications and API integrations.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary !w-auto">
          <Plus className="w-4 h-4" /> New Application
        </button>
      </div>

      {error && !showForm && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
              {error}
          </div>
      )}

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
            <input className="input-field" placeholder="My Awesome App" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="input-label">Redirect URIs (one per line)</label>
            <textarea className="input-field h-28 resize-none" placeholder="https://myapp.com/callback" value={form.redirectUris} onChange={e => setForm(f => ({ ...f, redirectUris: e.target.value }))} />
            <p className="text-xs text-gray-500 mt-1">Users will be redirected to these URLs after they authorize your application.</p>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="clientType" checked={form.isConfidential} onChange={() => setForm(f => ({ ...f, isConfidential: true }))} className="w-4 h-4 accent-brand-primary" />
              <div className="text-sm">
                  <span className="text-gray-200 block font-medium">Confidential Client</span>
                  <span className="text-gray-400 text-xs">For server-side applications (Node.js, Python, PHP, etc.) that can securely store a Client Secret.</span>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="clientType" checked={!form.isConfidential} onChange={() => setForm(f => ({ ...f, isConfidential: false }))} className="w-4 h-4 accent-brand-primary" />
                <div className="text-sm">
                    <span className="text-gray-200 block font-medium">Public Client</span>
                    <span className="text-gray-400 text-xs">For SPAs (React, Vue) or mobile apps that cannot securely store a secret. Uses PKCE.</span>
                </div>
            </label>
          </div>
          <div className="flex gap-3 pt-4 border-t border-brand-border mt-2">
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
          <TableSkeleton columns={5} rows={4} />
        ) : clients.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <TerminalSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <h3 className="text-lg font-medium text-gray-300 mb-1">No Applications Yet</h3>
            <p className="text-sm max-w-sm mx-auto">Create your first OAuth 2.0 application to start integrating with AuthHub.</p>
            <button onClick={() => setShowForm(true)} className="btn-primary mt-4 py-1.5 px-4 !w-auto inline-flex">Create Application</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-brand-border bg-brand-surface/30">
                <tr>
                  {["Application", "Client ID", "Type", "Created", ""].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {clients.map(client => (
                  <tr key={client.clientId} className="hover:bg-brand-surface/50 transition-colors">
                    <td className="px-5 py-4">
                        <div className="font-medium text-white">{client.name}</div>
                        <div className="text-gray-400 text-xs mt-0.5 truncate max-w-[200px]" title={client.redirectUris.join(", ")}>
                            {client.redirectUris.length} callback {client.redirectUris.length === 1 ? 'URL' : 'URLs'}
                        </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-gray-400">{client.clientId}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${client.isPublic ? 'bg-blue-500/15 text-blue-400' : 'bg-purple-500/15 text-purple-400'}`}>
                        <KeyRound className="w-3 h-3" />
                        {client.isPublic ? "Public" : "Confidential"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{new Date(client.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => handleDelete(client.clientId)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Delete Application">
                        <Trash2 className="w-4 h-4" />
                      </button>
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
