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
  BookOpen,
  Code,
  Settings
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface OAuthClient {
  clientId: string;
  name: string;
  isPublic: boolean;
  redirectUris: string[];
  tenantId: string | null;
  tenant?: any;
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
  const [createStep, setCreateStep] = useState<'type' | 'form'>('type');
  const [selectedType, setSelectedType] = useState<'api' | 'oauth' | 'm2m' | null>(null);
  const [newClientName, setNewClientName] = useState('');
  const [newClientUris, setNewClientUris] = useState('');
  const [isConfidential, setIsConfidential] = useState(true);
  const [createdClient, setCreatedClient] = useState<{
    clientId: string;
    clientSecret?: string;
    tenantId?: string;
    tenantSlug?: string;   // the slug used as AUTHHUB_CLIENT_ID in .env
  } | null>(null);
  
  const [guideClient, setGuideClient] = useState<OAuthClient | null>(null);
  const [activeGuideTab, setActiveGuideTab] = useState<'api' | 'oauth' | 'm2m'>('api');

  // Tenant Settings state
  const [settingsClient, setSettingsClient] = useState<OAuthClient | null>(null);
  const [settingsTab, setSettingsTab] = useState<'branding' | 'smtp' | 'webhook'>('branding');
  const [settingsForm, setSettingsForm] = useState<any>({});

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
      setCreatedClient({
        clientId:    data.client.clientId,
        clientSecret: data.client.clientSecret,
        tenantId:    data.tenant?.id,
        tenantSlug:  data.tenant?.clientId,  // slug = AUTHHUB_CLIENT_ID in .env
      });
      setClients([...clients, data.client]);
      setNewClientName('');
      setNewClientUris('');
      setShowCreateModal(false);
    } catch (err) {
      alert('Failed to create client. Make sure the app name is unique.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application? This will also permanently delete its isolated tenant space!')) return;
    try {
      const response = await api.delete(`/developer/clients/${id}`);
      if (response.error) {
        alert(response.error);
        return;
      }
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete application');
    }
  };

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsClient?.tenantId) return;
    try {
      const response = await api.patch(`/developer/clients/${settingsClient.clientId}/tenant`, settingsForm);
      if (response.error) {
        alert(response.error);
        return;
      }
      setSettingsClient(null);
      loadData(); // reload to get new tenant config
    } catch (err) {
      console.error(err);
      alert('Failed to save settings');
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
                      {stats.chartData.map((_, index) => (
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
        <div className="mb-10 border border-green-500/30 bg-green-500/5 p-6 rounded-2xl glass-card animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3 mb-2 text-green-400">
            <CheckCircle2 className="w-6 h-6" />
            <h2 className="text-lg font-bold text-white">App Registered — Isolated Tenant Space Provisioned! 🎉</h2>
          </div>
          <p className="text-sm text-gray-300 mb-5">
            Your app now has its own isolated space in AuthHub. All users who sign up through your app will be scoped to this tenant only.
            <span className="text-red-400 font-bold ml-1">Save these credentials now — the secret is shown only once.</span>
          </p>

          {/* .env snippet */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase font-bold text-gray-400">Add to your app's .env</label>
              <button
                onClick={() => copyToClipboard(
                  [
                    `AUTHHUB_URL=http://localhost:3000`,
                    `AUTHHUB_JWKS_URL=http://localhost:3000/api/v1/oidc/.well-known/jwks.json`,
                    `AUTHHUB_CLIENT_ID=${createdClient.tenantSlug ?? ''}`,
                    ...(createdClient.clientSecret ? [`AUTHHUB_CLIENT_SECRET=${createdClient.clientSecret}`] : []),
                    `AUTHHUB_TENANT_ID=${createdClient.tenantId ?? ''}`,
                  ].join('\n'),
                  'env_block'
                )}
                className="flex items-center gap-1.5 text-xs text-brand-primary hover:text-white transition-colors"
              >
                <Copy className={`w-3.5 h-3.5 ${copyStatus['env_block'] ? 'text-green-400' : ''}`} />
                {copyStatus['env_block'] ? 'Copied!' : 'Copy all'}
              </button>
            </div>
            <pre className="bg-black/60 border border-white/8 rounded-xl p-4 text-xs text-gray-300 overflow-x-auto leading-relaxed font-mono">
{`AUTHHUB_URL=http://localhost:3000
AUTHHUB_JWKS_URL=http://localhost:3000/api/v1/oidc/.well-known/jwks.json
AUTHHUB_CLIENT_ID=${createdClient.tenantSlug ?? '(your-tenant-slug)'}
${createdClient.clientSecret ? `AUTHHUB_CLIENT_SECRET=${createdClient.clientSecret}` : '# No secret (public client)'}
AUTHHUB_TENANT_ID=${createdClient.tenantId ?? '(your-tenant-uuid)'}`}
            </pre>
          </div>

          {/* Individual fields */}
          <div className="space-y-2">
            {([
              { label: 'Tenant ID (UUID)',      val: createdClient.tenantId ?? '',  key: 'tid',    hint: 'Unique ID for your isolated space' },
              { label: 'Client ID (slug)',       val: createdClient.tenantSlug ?? '',key: 'slug',   hint: 'Used as AUTHHUB_CLIENT_ID — pass this when registering/logging in users' },
              ...(createdClient.clientSecret ? [{ label: 'Client Secret', val: createdClient.clientSecret, key: 'sec', hint: 'Never shown again — store securely' }] : []),
            ] as { label: string; val: string; key: string; hint: string }[]).map(item => (
              <div key={item.key}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">{item.label}</label>
                  <span className="text-[10px] text-gray-600">{item.hint}</span>
                </div>
                <div className="flex bg-black/40 p-2.5 rounded-lg border border-white/5 items-center justify-between gap-3">
                  <code className="text-brand-primary text-xs truncate flex-1">{item.val}</code>
                  <button onClick={() => copyToClipboard(item.val, item.key)} className="shrink-0">
                    <Copy className={`w-3.5 h-3.5 ${copyStatus[item.key] ? 'text-green-400' : 'text-gray-500'}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setCreatedClient(null)}
            className="mt-6 text-sm text-gray-400 hover:text-white underline"
          >
            ✓ I've saved my credentials
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
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase py-0.5 px-2 rounded-full ${client.isPublic ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                        {client.isPublic ? 'Public Client' : 'Confidential Client'}
                      </span>
                      {client.tenantId && (
                        <span className="text-[10px] font-bold uppercase py-0.5 px-2 rounded-full bg-green-500/15 text-green-400">
                          ✦ Tenant Isolated
                        </span>
                      )}
                      <span className="text-[10px] text-gray-500 font-mono">ID: {client.clientId.slice(0, 8)}...</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setGuideClient(client)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 rounded-lg text-xs font-bold transition-colors"
                    >
                      <Code className="w-3.5 h-3.5" />
                      Integration Guide
                    </button>
                    {client.tenantId && (
                      <button
                        onClick={() => {
                          setSettingsClient(client);
                          setSettingsForm({
                            customDomain: client.tenant?.customDomain || '',
                            logoUrl: client.tenant?.logoUrl || '',
                            primaryColor: client.tenant?.primaryColor || '',
                            emailFrom: client.tenant?.emailFrom || '',
                            smtpHost: client.tenant?.smtpHost || '',
                            smtpPort: client.tenant?.smtpPort || '',
                            smtpUser: client.tenant?.smtpUser || '',
                            smtpPass: '', // never reveal password
                            webhookUrl: client.tenant?.webhookUrl || '',
                          });
                        }}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Configure Workspace"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    )}
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
          <div className="relative glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white rounded-full bg-white/5">✕</button>
            
            {createStep === 'type' ? (
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">How will you integrate?</h2>
                <p className="text-sm text-gray-400 mb-8">Choose the architecture that best fits your application.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => { setSelectedType('api'); setCreateStep('form'); }}
                    className="flex flex-col text-left p-6 rounded-2xl border border-brand-primary/20 bg-brand-primary/5 hover:bg-brand-primary/10 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Code className="w-5 h-5 text-brand-primary" />
                    </div>
                    <h3 className="font-bold text-white mb-2">Direct API (Custom UI)</h3>
                    <p className="text-xs text-gray-400">Total control. Build your own login forms and hit our REST APIs directly.</p>
                  </button>

                  <button 
                    onClick={() => { setSelectedType('oauth'); setCreateStep('form'); }}
                    className="flex flex-col text-left p-6 rounded-2xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Globe className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="font-bold text-white mb-2">OAuth 2.0 Web Flow</h3>
                    <p className="text-xs text-gray-400">Hosted login. Add a "Sign In with AuthHub" button and let us handle passwords.</p>
                  </button>

                  <button 
                    onClick={() => { setSelectedType('m2m'); setIsConfidential(true); setCreateStep('form'); }}
                    className="flex flex-col text-left p-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Activity className="w-5 h-5 text-orange-400" />
                    </div>
                    <h3 className="font-bold text-white mb-2">Machine-to-Machine</h3>
                    <p className="text-xs text-gray-400">Backend services syncing data. No human users involved, just strict API access.</p>
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-in slide-in-from-right-4 duration-300">
                <button 
                  onClick={() => setCreateStep('type')}
                  className="text-xs font-bold text-brand-primary mb-6 hover:underline inline-flex items-center gap-1"
                >
                  ← Back to Integration Types
                </button>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {selectedType === 'api' && 'Register Custom API App'}
                  {selectedType === 'oauth' && 'Register OAuth App'}
                  {selectedType === 'm2m' && 'Register Backend Service'}
                </h2>
                <p className="text-sm text-gray-400 mb-6">
                  {selectedType === 'api' && 'Your app will use its specific client_id to keep its users perfectly isolated.'}
                  {selectedType === 'oauth' && 'We will redirect users securely back to your application after they log in.'}
                  {selectedType === 'm2m' && 'Your backend service will use a Client Secret to securely fetch access tokens.'}
                </p>

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

                  {selectedType !== 'm2m' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Redirect URIs (comma separated)</label>
                      <textarea 
                        required
                        className="input-field min-h-[80px] py-3 text-sm"
                        placeholder="https://myapp.com/callback, http://localhost:4000/auth"
                        value={newClientUris}
                        onChange={e => setNewClientUris(e.target.value)}
                      />
                      <p className="text-[10px] text-gray-500 mt-2">
                        {selectedType === 'api' 
                          ? 'Even for direct API integrations, a callback URI is technically required for OAuth compliance (you can put your backend URL).' 
                          : 'Where AuthHub should send users after log in.'}
                      </p>
                    </div>
                  )}

                  <div className={`flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5 ${selectedType === 'm2m' ? 'opacity-50 pointer-events-none' : ''}`}>
                    <input 
                      id="conf"
                      type="checkbox" 
                      className="w-4 h-4 rounded border-white/10 bg-black text-brand-primary"
                      checked={isConfidential}
                      onChange={e => setIsConfidential(e.target.checked)}
                    />
                    <label htmlFor="conf" className="flex-1 cursor-pointer">
                      <div className="text-sm font-bold text-white">Confidential Client</div>
                      <div className="text-[10px] text-gray-500">
                        {selectedType === 'm2m' 
                          ? 'Machine-to-Machine apps MUST be confidential.' 
                          : 'Enable this if your app has a secure backend to store a client secret.'}
                      </div>
                    </label>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button type="submit" className="w-full btn-primary py-4 text-base">Register Application</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Integration Guide Modal */}
      {guideClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setGuideClient(null)}></div>
          <div className="relative glass-card w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Integration Guide</h2>
                <p className="text-sm text-gray-400">How to connect <span className="text-white font-bold">{guideClient.name}</span> to AuthHub.</p>
              </div>
              <button onClick={() => setGuideClient(null)} className="p-2 text-gray-500 hover:text-white rounded-full bg-white/5">✕</button>
            </div>

            {/* Tabs */}
            <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5 mb-6 overflow-x-auto">
              {[
                { id: 'api', label: 'Direct API (Custom Forms)', icon: Code, desc: 'Total UI Control' },
                { id: 'oauth', label: 'OAuth 2.0 Web Flow', icon: Globe, desc: 'Hosted "Sign In" UI' },
                { id: 'm2m', label: 'Machine-to-Machine', icon: Activity, desc: 'Backend-to-Backend' },
              ].map(tab => {
                const isActive = activeGuideTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveGuideTab(tab.id as any)}
                    className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg transition-all ${isActive ? 'bg-brand-primary text-white shadow-lg' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <Icon className="w-4 h-4" /> {tab.label}
                    </div>
                    <span className={`text-[10px] mt-1 ${isActive ? 'text-white/80' : 'text-gray-500'}`}>{tab.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab: Direct API */}
            {activeGuideTab === 'api' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="bg-brand-primary/10 border border-brand-primary/20 p-4 rounded-xl">
                  <h3 className="text-brand-primary font-bold mb-2">Build Your Own Forms</h3>
                  <p className="text-sm text-gray-300">
                    Use this method if you want 100% control over the user experience (like WhatsApp Copy). 
                    Your users never leave your app. Just pass your <code className="text-white">client_id</code> to immediately scope them to your isolated tenant.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /> 1. Register a User</h4>
                  <pre className="bg-black/60 border border-white/8 rounded-xl p-4 text-xs text-brand-primary overflow-x-auto">
{`POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "client_id": "${guideClient.clientId}"
}`}
                  </pre>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> 2. Login User</h4>
                  <pre className="bg-black/60 border border-white/8 rounded-xl p-4 text-xs text-brand-primary overflow-x-auto">
{`POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123",
  "client_id": "${guideClient.clientId}"
}`}
                  </pre>
                </div>
              </div>
            )}

            {/* Tab: OAuth Hosted */}
            {activeGuideTab === 'oauth' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl">
                  <h3 className="text-purple-400 font-bold mb-2">"Sign In with AuthHub" Button</h3>
                  <p className="text-sm text-gray-300">
                    Use this method (Authorization Code Flow) if you don't want to build login forms or handle passwords.
                    Redirect the user to AuthHub, and we will redirect them back with an authorization code.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white">1. Redirect user to AuthHub</h4>
                  <p className="text-[10px] text-gray-500 block mb-2">Send the browser explicitly to this URL:</p>
                  <pre className="bg-black/60 border border-white/8 rounded-xl p-4 text-xs text-purple-300 overflow-x-auto whitespace-pre-wrap break-all">
{`GET /api/v1/oidc/auth?
client_id=${guideClient.clientId}&
redirect_uri=${guideClient.redirectUris[0] || 'YOUR_REDIRECT_URI'}&
response_type=code&
scope=openid profile email`}
                  </pre>
                </div>

                {!guideClient.isPublic && (
                  <div className="space-y-2 mt-4">
                    <h4 className="text-sm font-bold text-white">2. Exchange Code for Tokens</h4>
                    <p className="text-[10px] text-gray-500 block mb-2">When they return to your app with ?code=XYZ, your backend exchanges it:</p>
                    <pre className="bg-black/60 border border-white/8 rounded-xl p-4 text-xs text-purple-300 overflow-x-auto">
{`POST /api/v1/oidc/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=XYZ&
redirect_uri=${guideClient.redirectUris[0] || 'YOUR_REDIRECT_URI'}&
client_id=${guideClient.clientId}&
client_secret=YOUR_CLIENT_SECRET`}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Tab: M2M */}
            {activeGuideTab === 'm2m' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                {guideClient.isPublic ? (
                  <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl text-center">
                    <h3 className="text-red-400 font-bold mb-2">Not Available</h3>
                    <p className="text-sm text-gray-300">
                      Machine-to-Machine (Client Credentials) flow is only available for <strong>Confidential Clients</strong> because it requires securely storing a Client Secret. This app is a Public Client.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl">
                      <h3 className="text-orange-400 font-bold mb-2">Backend Services</h3>
                      <p className="text-sm text-gray-300">
                        Use this method for background jobs, microservices, or external APIs to authenticate directly with AuthHub without a user present (Client Credentials Flow).
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-white">Get an Access Token</h4>
                      <pre className="bg-black/60 border border-white/8 rounded-xl p-4 text-xs text-orange-300 overflow-x-auto">
{`POST /api/v1/oidc/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&
client_id=${guideClient.clientId}&
client_secret=YOUR_CLIENT_SECRET`}
                      </pre>
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Tenant Settings Modal */}
      {settingsClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSettingsClient(null)}></div>
          <div className="relative glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Tenant Configuration</h2>
                <p className="text-sm text-gray-400">Configure the isolated workspace for <span className="text-white font-bold">{settingsClient.name}</span>.</p>
              </div>
              <button onClick={() => setSettingsClient(null)} className="p-2 text-gray-500 hover:text-white rounded-full bg-white/5">✕</button>
            </div>

            <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5 mb-6">
              <button onClick={() => setSettingsTab('branding')} className={`flex-1 p-2 rounded-lg text-sm font-bold transition-all ${settingsTab === 'branding' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>Branding</button>
              <button onClick={() => setSettingsTab('smtp')} className={`flex-1 p-2 rounded-lg text-sm font-bold transition-all ${settingsTab === 'smtp' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>Email (SMTP)</button>
              <button onClick={() => setSettingsTab('webhook')} className={`flex-1 p-2 rounded-lg text-sm font-bold transition-all ${settingsTab === 'webhook' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>Webhooks</button>
            </div>

            <form onSubmit={handleUpdateTenant} className="space-y-6">
              {settingsTab === 'branding' && (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Custom Domain (Optional)</label>
                    <input 
                      type="text" className="input-field" placeholder="e.g., auth.myapp.com"
                      value={settingsForm.customDomain || ''} onChange={e => setSettingsForm({...settingsForm, customDomain: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Primary Color (Hex)</label>
                      <input 
                        type="text" className="input-field" placeholder="#1bd671"
                        value={settingsForm.primaryColor || ''} onChange={e => setSettingsForm({...settingsForm, primaryColor: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Logo URL (Optional)</label>
                      <input 
                        type="url" className="input-field" placeholder="https://myapp.com/logo.png"
                        value={settingsForm.logoUrl || ''} onChange={e => setSettingsForm({...settingsForm, logoUrl: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'smtp' && (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-brand-primary/10 border border-brand-primary/20 p-4 rounded-xl mb-4">
                    <p className="text-sm text-gray-300">Configure your own SMTP server so AuthHub sends emails (like password resets) from your domain instead of ours.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">"From" Email Address</label>
                    <input 
                      type="email" className="input-field" placeholder="noreply@myapp.com"
                      value={settingsForm.emailFrom || ''} onChange={e => setSettingsForm({...settingsForm, emailFrom: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">SMTP Host</label>
                      <input 
                        type="text" className="input-field" placeholder="smtp.sendgrid.net"
                        value={settingsForm.smtpHost || ''} onChange={e => setSettingsForm({...settingsForm, smtpHost: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Port</label>
                      <input 
                        type="number" className="input-field" placeholder="587"
                        value={settingsForm.smtpPort || ''} onChange={e => setSettingsForm({...settingsForm, smtpPort: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">SMTP Username</label>
                      <input 
                        type="text" className="input-field" placeholder="apikey"
                        value={settingsForm.smtpUser || ''} onChange={e => setSettingsForm({...settingsForm, smtpUser: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">SMTP Password</label>
                      <input 
                        type="password" className="input-field" placeholder="Leave blank to keep current"
                        value={settingsForm.smtpPass || ''} onChange={e => setSettingsForm({...settingsForm, smtpPass: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'webhook' && (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl mb-4">
                    <p className="text-sm text-gray-300">AuthHub will aggressively POST lifecycle events (like <code className="text-white">user.created</code> or <code className="text-white">user.deleted</code>) to this URL so your backend stays perfectly in sync.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Webhook URL</label>
                    <input 
                      type="url" className="input-field" placeholder="https://api.myapp.com/webhooks/authhub"
                      value={settingsForm.webhookUrl || ''} onChange={e => setSettingsForm({...settingsForm, webhookUrl: e.target.value})}
                    />
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-white/5 flex gap-3">
                <button type="button" onClick={() => setSettingsClient(null)} className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 btn-primary">Save Configuration</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

