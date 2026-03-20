import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  Plus, 
  Trash2, 
  RefreshCcw, 
  Eye, 
  EyeOff, 
  Globe, 
  CheckCircle2,
  Copy,
  ExternalLink,
  BarChart3,
  Activity,
  BookOpen
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface OAuthClient {
  clientId: string;
  name: string;
  isPublic: boolean;
  redirectUris: string[];
  createdAt: string;
}

interface StatsData {
  totalLogins: number;
  chartData: { date: string; logins: number }[];
}

export default function DeveloperPortal() {
  const [clients, setClients] = useState<OAuthClient[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientUris, setNewClientUris] = useState('');
  const [isConfidential, setIsConfidential] = useState(true);
  const [createdClient, setCreatedClient] = useState<{ clientId: string; clientSecret?: string } | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, string>>({});
  const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [clientsRes, statsRes] = await Promise.all([
        api.get('/developer/clients'),
        api.get('/developer/stats')
      ]);
      setClients(clientsRes.clients || []);
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to load portal data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const uris = newClientUris.split(',').map(u => u.trim()).filter(Boolean);
      const data = await api.post('/developer/clients', {
        name: newClientName,
        redirectUris: uris,
        isConfidential: isConfidential
      });
      setCreatedClient({ clientId: data.client.clientId, clientSecret: data.client.clientSecret });
      setClients([...clients, data.client]);
      setNewClientName('');
      setNewClientUris('');
      setShowCreateModal(false);
    } catch (err) {
      alert('Failed to create client');
    }
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    try {
      await api.delete(`/developer/clients/${clientId}`);
      setClients(clients.filter(c => c.clientId !== clientId));
    } catch (err) {
      alert('Failed to delete client');
    }
  };

  const handleRotateSecret = async (clientId: string) => {
    if (!confirm('Rotate client secret? Current secret will be immediately invalidated.')) return;
    try {
      const data = await api.post(`/developer/clients/${clientId}/rotate`, {});
      setRevealedSecrets({ ...revealedSecrets, [clientId]: data.clientSecret });
    } catch (err) {
      alert('Failed to rotate secret');
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus({ ...copyStatus, [key]: true });
    setTimeout(() => {
      setCopyStatus({ ...copyStatus, [key]: false });
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Globe className="w-8 h-8 text-brand-primary" />
            Developer Portal
          </h1>
          <p className="text-gray-400 mt-2">Create and manage your OAuth 2.0 applications.</p>
        </div>
        <div className="flex items-center gap-3">
          <a 
            href={`${import.meta.env.VITE_API_URL?.replace('/api/v1','') || 'http://localhost:3000'}/api/v1/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-white font-semibold hover:bg-white/5 transition-colors text-sm"
          >
            <BookOpen className="w-4 h-4" />
            API Docs
          </a>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2 group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            Create New App
          </button>
        </div>
      </header>

      {/* Stats Summary Section */}
      {!isLoading && clients.length > 0 && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
           <div className="lg:col-span-1 glass-card p-6 rounded-2xl flex flex-col justify-center border border-white/5">
              <div className="flex items-center gap-3 text-gray-400 mb-2">
                <Activity className="w-4 h-4 text-brand-primary" />
                <span className="text-xs uppercase font-bold tracking-wider">Total Active Clients</span>
              </div>
              <div className="text-4xl font-bold text-white mb-6">{clients.length}</div>
              
              <div className="flex items-center gap-3 text-gray-400 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-xs uppercase font-bold tracking-wider">Logins (7 Days)</span>
              </div>
              <div className="text-4xl font-bold text-white">{stats.totalLogins}</div>
           </div>

           <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-white/5 h-[200px]">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3 text-gray-400">
                  <BarChart3 className="w-4 h-4 text-brand-primary" />
                  <span className="text-xs uppercase font-bold tracking-wider">Usage Trend</span>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">LATEST 7 DAYS</span>
              </div>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chartData}>
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} 
                    />
                    <Bar dataKey="logins" radius={[4, 4, 0, 0]}>
                      {stats.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#3b82f6" fillOpacity={0.6 + (index / stats.chartData.length) * 0.4} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>
        </div>
      )}

      {createdClient && (
        <div className="mb-10 bg-brand-primary/10 border border-brand-primary/30 p-6 rounded-2xl glass-card animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3 mb-4 text-brand-primary">
            <CheckCircle2 className="w-6 h-6" />
            <h2 className="text-lg font-bold text-white">Application Created Successfully!</h2>
          </div>
          <p className="text-sm text-gray-300 mb-4">
            Save your Client Secret now. <span className="text-red-400 font-bold">It will never be shown again.</span>
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-xs uppercase font-bold text-gray-500 mb-1 block">Client ID</label>
              <div className="flex bg-black/40 p-3 rounded-lg border border-white/5 items-center justify-between">
                <code className="text-brand-primary">{createdClient.clientId}</code>
                <button onClick={() => copyToClipboard(createdClient.clientId, 'created_id')}>
                  <Copy className={`w-4 h-4 ${copyStatus['created_id'] ? 'text-green-400' : 'text-gray-500'}`} />
                </button>
              </div>
            </div>
            {createdClient.clientSecret && (
              <div>
                <label className="text-xs uppercase font-bold text-gray-500 mb-1 block">Client Secret</label>
                <div className="flex bg-black/40 p-3 rounded-lg border border-white/5 items-center justify-between">
                  <code className="text-brand-primary">{createdClient.clientSecret}</code>
                  <button onClick={() => copyToClipboard(createdClient.clientSecret!, 'created_secret')}>
                    <Copy className={`w-4 h-4 ${copyStatus['created_secret'] ? 'text-green-400' : 'text-gray-500'}`} />
                  </button>
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={() => setCreatedClient(null)}
            className="mt-6 text-sm text-gray-400 hover:text-white underline"
          >
            I've saved my credentials
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="h-48 glass-card animate-pulse rounded-2xl"></div>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-3xl border border-white/5 bg-gray-900/40">
          <div className="w-16 h-16 bg-brand-surface rounded-full flex items-center justify-center mx-auto mb-6">
            <Plus className="w-8 h-8 text-gray-500" />
          </div>
          <h2 className="text-xl font-bold text-white">No applications yet</h2>
          <p className="text-gray-400 mt-2 max-w-sm mx-auto">
            Get started by creating your first OAuth client to integrate AuthHub with your app.
          </p>
          <button 
             onClick={() => setShowCreateModal(true)}
             className="mt-8 btn-primary px-10"
          >
             Register Application
          </button>
        </div>
      ) : (
        <>
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            Your Applications
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {clients.map(client => (
              <div key={client.clientId} className="group relative glass-card p-6 rounded-2xl border border-white/5 hover:border-brand-primary/30 transition-all duration-300">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-brand-primary transition-colors">{client.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold uppercase py-0.5 px-2 rounded-full ${client.isPublic ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                        {client.isPublic ? 'Public Client' : 'Confidential Client'}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">ID: {client.clientId.slice(0, 8)}...</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleDelete(client.clientId)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Endpoints</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {client.redirectUris.map((uri, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/10 px-2 py-1 rounded text-xs text-gray-300 flex items-center gap-2">
                          <ExternalLink className="w-3 h-3 text-gray-500" />
                          {uri}
                        </div>
                      ))}
                    </div>
                  </div>

                  {!client.isPublic && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] uppercase font-bold text-gray-500 block">Client Secret</label>
                        <button 
                          onClick={() => handleRotateSecret(client.clientId)}
                          className="text-[10px] text-brand-primary hover:underline flex items-center gap-1"
                        >
                          <RefreshCcw className="w-2.5 h-2.5" />
                          Rotate
                        </button>
                      </div>
                      <div className="flex bg-black/40 p-2.5 rounded-lg border border-white/5 items-center justify-between">
                        <code className="text-xs text-gray-400">
                          {revealedSecrets[client.clientId] || '••••••••••••••••••••••••'}
                        </code>
                        <div className="flex gap-2">
                          {revealedSecrets[client.clientId] && (
                            <button onClick={() => copyToClipboard(revealedSecrets[client.clientId], `sec_${client.clientId}`)}>
                              <Copy className={`w-3.5 h-3.5 ${copyStatus[`sec_${client.clientId}`] ? 'text-green-400' : 'text-gray-500'}`} />
                            </button>
                          )}
                          <button onClick={() => {
                            if (revealedSecrets[client.clientId]) {
                              const ns = { ...revealedSecrets };
                              delete ns[client.clientId];
                              setRevealedSecrets(ns);
                            } else {
                              alert('Reveal secret is strictly logged. Enter password to continue (Coming in next PR)');
                            }
                          }}>
                            {revealedSecrets[client.clientId] ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}></div>
          <div className="relative glass-card w-full max-w-md p-8 rounded-3xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-white mb-6">Register New App</h2>
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Application Name</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  className="input-field"
                  placeholder="e.g., My Awesome App"
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Redirect URIs (comma separated)</label>
                <textarea 
                  required
                  className="input-field min-h-[80px] py-3 text-sm"
                  placeholder="https://myapp.com/callback, http://localhost:4000/auth"
                  value={newClientUris}
                  onChange={e => setNewClientUris(e.target.value)}
                />
                <p className="text-[10px] text-gray-500 mt-2">Where AuthHub should send users after log in.</p>
              </div>

              <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                <input 
                  id="conf"
                  type="checkbox" 
                  className="w-4 h-4 rounded border-white/10 bg-black text-brand-primary"
                  checked={isConfidential}
                  onChange={e => setIsConfidential(e.target.checked)}
                />
                <label htmlFor="conf" className="flex-1 cursor-pointer">
                  <div className="text-sm font-bold text-white">Confidential Client</div>
                  <div className="text-[10px] text-gray-500">Enable this if your app has a backend that can securely store a secret.</div>
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 btn-primary">Create App</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
