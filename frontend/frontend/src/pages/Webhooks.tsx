import { useState, useEffect } from "react";
import { Webhook, Network, Plus, Trash2, ExternalLink, ShieldCheck, Clock, AlertCircle, CheckCircle2, ChevronRight, X, Loader2 } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { useToast } from "../contexts/ToastContext";

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  _count?: { deliveries: number };
}

interface WebhookDelivery {
  id: string;
  event: string;
  statusCode: number | null;
  durationMs: number | null;
  errorMessage: string | null;
  createdAt: string;
}

export default function Webhooks() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<WebhookEndpoint | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { success, error } = useToast();

  // Form State
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState<string[]>(["user.created", "login.success"]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableEvents = [
    { id: "user.created", label: "User Created", desc: "When a new user signs up" },
    { id: "login.success", label: "Login Success", desc: "When a user logs in successfully" },
    { id: "session.revoked", label: "Session Revoked", desc: "When a logout occurs" },
    { id: "mfa.enabled", label: "MFA Enabled", desc: "When a user activates 2FA" },
  ];

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const fetchEndpoints = async () => {
    try {
      const data = await api.get("/webhooks/mgmt");
      setEndpoints(data);
    } catch (err: any) {
      error("Failed to load webhooks");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeliveries = async (endpointId: string) => {
    try {
      const data = await api.get(`/webhooks/mgmt/${endpointId}/deliveries`);
      setDeliveries(data);
    } catch (err) {
      error("Failed to load delivery logs");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/webhooks/mgmt", {
        url: newUrl,
        events: newEvents,
        description: "Primary Webhook"
      });
      success("Webhook created successfully");
      setIsModalOpen(false);
      setNewUrl("");
      fetchEndpoints();
    } catch (err: any) {
      error(err.message || "Failed to create webhook");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this webhook?")) return;
    try {
      await api.delete(`/webhooks/mgmt/${id}`);
      success("Webhook deleted");
      setEndpoints(prev => prev.filter(e => e.id !== id));
      if (selectedEndpoint?.id === id) setSelectedEndpoint(null);
    } catch (err) {
      error("Failed to delete webhook");
    }
  };

  const toggleEvent = (eventId: string) => {
    setNewEvents(prev => 
      prev.includes(eventId) ? prev.filter(e => e !== eventId) : [...prev, eventId]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-up pt-10 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Webhooks</h1>
          <p className="text-sm text-white/50">Real-time event streaming for your applications.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary !w-auto text-sm py-2 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Endpoint
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Endpoints Table (Left Side) */}
        <div className="lg:col-span-7">
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Endpoint URL</th>
                  <th>Status</th>
                  <th>Events</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {endpoints.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-white/30">
                      No webhooks configured yet.
                    </td>
                  </tr>
                ) : (
                  endpoints.map(endpoint => (
                    <tr 
                      key={endpoint.id}
                      onClick={() => {
                        setSelectedEndpoint(endpoint);
                        fetchDeliveries(endpoint.id);
                      }}
                      className={`cursor-pointer transition-colors ${
                        selectedEndpoint?.id === endpoint.id ? "bg-white/5" : "hover:bg-white/[0.02]"
                      }`}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded border flex items-center justify-center ${
                            selectedEndpoint?.id === endpoint.id 
                              ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" 
                              : "bg-white/5 border-white/10 text-white/40"
                          }`}>
                            <Webhook className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white truncate max-w-[200px]">{endpoint.url}</p>
                            <p className="text-[10px] text-white/40">{new Date(endpoint.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="status-dot status-active">ACTIVE</span>
                      </td>
                      <td>
                        <span className="text-xs text-white/70">{endpoint.events.length} subscribed</span>
                      </td>
                      <td>
                        <div className="flex justify-end">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(endpoint.id);
                            }}
                            className="p-1.5 text-white/30 hover:text-red-400 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details & Logs (Right Side) */}
        <div className="lg:col-span-5">
          {selectedEndpoint ? (
            <div className="space-y-6 animate-fade-in">
              {/* Endpoint Secret Info */}
              <div className="glass-card p-5 border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" /> Endpoint Secret
                  </h3>
                </div>
                <p className="text-white/40 text-xs mb-3">Verify the <code className="text-white">X-AuthHub-Signature</code> header using this secret.</p>
                <div className="bg-black/40 border border-white/5 p-3 rounded-lg flex items-center justify-between group">
                  <code className="text-xs text-white/60 font-mono">{selectedEndpoint.secret}</code>
                  <button className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Copy</button>
                </div>
              </div>

              {/* Log Table */}
              <div className="data-table-container">
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <h3 className="text-sm font-bold text-white">Recent Deliveries</h3>
                  <button 
                    onClick={() => fetchDeliveries(selectedEndpoint.id)}
                    className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest hover:text-cyan-300"
                  >
                    Refresh
                  </button>
                </div>
                <table className="data-table">
                  <tbody>
                    {deliveries.length === 0 ? (
                      <tr>
                        <td className="text-center py-8 text-white/30 italic text-xs">
                          No delivery history found.
                        </td>
                      </tr>
                    ) : (
                      deliveries.map(log => (
                        <tr key={log.id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${
                                log.statusCode && log.statusCode < 300 ? "bg-emerald-500" : "bg-red-500"
                              }`} />
                              <div>
                                <p className="text-xs font-medium text-white">{log.event}</p>
                                <p className="text-[10px] text-white/30">{new Date(log.createdAt).toLocaleString()}</p>
                              </div>
                            </div>
                          </td>
                          <td className="text-right">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                              log.statusCode && log.statusCode < 300 ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"
                            }`}>
                              {log.statusCode || "ERR"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="glass-card h-full flex flex-col items-center justify-center p-12 text-center opacity-50 border-dashed border-white/10">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <ChevronRight className="w-6 h-6 text-white/10" />
              </div>
              <p className="text-white/20 text-sm max-w-[200px]">Select a webhook to view its configuration and delivery logs.</p>
            </div>
          )}
        </div>
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#06080f]/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="glass-card-vivid w-full max-w-md p-8 relative z-10 animate-scale-in">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-white/20 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>New Webhook</h2>
              <p className="text-white/40 text-sm">Subscribe your application to real-time events.</p>
            </div>

            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="input-label">Payload URL</label>
                <input 
                  type="url" 
                  required
                  placeholder="https://your-app.com/webhooks"
                  className="input-field"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="input-label mb-3">Event Subscriptions</label>
                <div className="grid grid-cols-1 gap-2">
                  {availableEvents.map(event => (
                    <div 
                      key={event.id}
                      onClick={() => toggleEvent(event.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        newEvents.includes(event.id)
                          ? "bg-cyan-500/10 border-cyan-500/30 ring-1 ring-cyan-500/20"
                          : "bg-white/5 border-white/5 hover:border-white/10"
                      }`}
                    >
                      <div>
                        <p className={`text-xs font-bold ${newEvents.includes(event.id) ? "text-cyan-400" : "text-white/60"}`}>
                          {event.label}
                        </p>
                        <p className="text-[10px] text-white/30">{event.desc}</p>
                      </div>
                      {newEvents.includes(event.id) && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                    </div>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting || !newUrl}
                className="btn-primary w-full h-12 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Webhook"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
