import React from 'react';
import type { OAuthClient } from '../types';

interface TenantSettingsModalProps {
  settingsClient: OAuthClient;
  setSettingsClient: (client: OAuthClient | null) => void;
  settingsTab: 'branding' | 'smtp' | 'webhook';
  setSettingsTab: (tab: 'branding' | 'smtp' | 'webhook') => void;
  settingsForm: any;
  setSettingsForm: (form: any) => void;
  handleUpdateTenant: (e: React.FormEvent) => Promise<void>;
}

export function TenantSettingsModal({
  settingsClient,
  setSettingsClient,
  settingsTab,
  setSettingsTab,
  settingsForm,
  setSettingsForm,
  handleUpdateTenant
}: TenantSettingsModalProps) {
  return (
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
                    type="text" className="input-field" placeholder="smtp.mailgun.org"
                    value={settingsForm.smtpHost || ''} onChange={e => setSettingsForm({...settingsForm, smtpHost: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Port</label>
                  <input 
                    type="number" className="input-field" placeholder="587"
                    value={settingsForm.smtpPort || ''} onChange={e => setSettingsForm({...settingsForm, smtpPort: parseInt(e.target.value) || ''})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">SMTP Username</label>
                  <input 
                    type="text" className="input-field" placeholder="postmaster@myapp.com"
                    value={settingsForm.smtpUser || ''} onChange={e => setSettingsForm({...settingsForm, smtpUser: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">SMTP Password</label>
                  <input 
                    type="password" className="input-field" placeholder="••••••••••••"
                    value={settingsForm.smtpPass || ''} onChange={e => setSettingsForm({...settingsForm, smtpPass: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          {settingsTab === 'webhook' && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="bg-brand-primary/10 border border-brand-primary/20 p-4 rounded-xl mb-4">
                <p className="text-sm text-gray-300">Receive real-time HTTP POST requests when events occur in your tenant (e.g., user.created, login.success).</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Webhook Endpoint URL</label>
                <input 
                  type="url" className="input-field" placeholder="https://api.myapp.com/webhooks/authhub"
                  value={settingsForm.webhookUrl || ''} onChange={e => setSettingsForm({...settingsForm, webhookUrl: e.target.value})}
                />
              </div>
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setSettingsClient(null)} className="w-full py-4 text-base rounded-xl border border-white/10 text-white font-semibold hover:bg-white/5">Cancel</button>
            <button type="submit" className="w-full btn-primary py-4 text-base">Save Configuration</button>
          </div>
        </form>
      </div>
    </div>
  );
}
