import { Plus, Trash2, RefreshCcw, Eye, EyeOff, ExternalLink, Code, Settings, Copy } from 'lucide-react';
import type { OAuthClient } from './types';

interface AppListProps {
  clients: OAuthClient[];
  setShowCreateModal: (show: boolean) => void;
  setGuideClient: (client: OAuthClient) => void;
  setSettingsClient: (client: OAuthClient) => void;
  setSettingsForm: (form: any) => void;
  handleDelete: (id: string) => void;
  revealedSecrets: Record<string, string>;
  setRevealedSecrets: (secrets: Record<string, string>) => void;
  handleRotateSecret: (id: string) => void;
  copyToClipboard: (text: string, key: string) => void;
  copyStatus: Record<string, boolean>;
}

export function AppList({
  clients,
  setShowCreateModal,
  setGuideClient,
  setSettingsClient,
  setSettingsForm,
  handleDelete,
  revealedSecrets,
  setRevealedSecrets,
  handleRotateSecret,
  copyToClipboard,
  copyStatus
}: AppListProps) {
  if (clients.length === 0) {
    return (
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
    );
  }

  return (
    <>
      <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        Your Applications
      </h2>
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Application</th>
              <th>Type</th>
              <th>Client ID</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(client => (
              <tr key={client.clientId} className="group">
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                      <Code className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{client.name}</p>
                      {client.tenantId && (
                        <p className="text-[9px] text-green-400 uppercase tracking-widest font-bold mt-0.5">Tenant Isolated</p>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${client.isPublic ? 'badge-cyan' : 'badge-violet'}`}>
                    {client.isPublic ? 'SPA' : 'M2M / WEB'}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2 group/copy">
                    <code className="text-xs text-white/50 font-mono">
                      {client.clientId.substring(0, 15)}...
                    </code>
                    <button 
                      onClick={() => copyToClipboard(client.clientId, `id_${client.clientId}`)}
                      className="opacity-0 group-hover/copy:opacity-100 transition-opacity"
                    >
                      <Copy className={`w-3 h-3 ${copyStatus[`id_${client.clientId}`] ? 'text-green-400' : 'text-white/30 hover:text-white'}`} />
                    </button>
                  </div>
                </td>
                <td>
                  <span className="status-dot status-active">ACTIVE</span>
                </td>
                <td>
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setGuideClient(client)}
                      className="p-1.5 text-white/30 hover:text-cyan-400 rounded transition-colors"
                      title="Integration Guide"
                    >
                      <ExternalLink className="w-4 h-4" />
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
                            smtpPass: '',
                            webhookUrl: client.tenant?.webhookUrl || '',
                          });
                        }}
                        className="p-1.5 text-white/30 hover:text-white rounded transition-colors"
                        title="Settings"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(client.clientId)}
                      className="p-1.5 text-white/30 hover:text-red-400 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
