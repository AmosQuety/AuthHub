import { Code, Globe, Activity } from 'lucide-react';
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface CreateAppModalProps {
  setShowCreateModal: (show: boolean) => void;
  createStep: 'type' | 'form';
  setCreateStep: (step: 'type' | 'form') => void;
  selectedType: 'api' | 'oauth' | 'm2m' | null;
  setSelectedType: (type: 'api' | 'oauth' | 'm2m' | null) => void;
  newClientName: string;
  setNewClientName: (name: string) => void;
  newClientUris: string;
  setNewClientUris: (uris: string) => void;
  isConfidential: boolean;
  setIsConfidential: (confidential: boolean) => void;
  handleCreate: (e: React.FormEvent) => Promise<void>;
  createError?: string;
}

export function CreateAppModal({
  setShowCreateModal,
  createStep,
  setCreateStep,
  selectedType,
  setSelectedType,
  newClientName,
  setNewClientName,
  newClientUris,
  setNewClientUris,
  isConfidential,
  setIsConfidential,
  handleCreate,
  createError
}: CreateAppModalProps) {
  return (
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
              {createError && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  <AlertTriangle className="mt-0.5 w-4 h-4 shrink-0 text-red-300" />
                  <div>{createError}</div>
                </div>
              )}
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
  );
}
