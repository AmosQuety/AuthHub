import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { BookOpen, Plus } from 'lucide-react';
import { AppList } from './AppList';
import { CreatedAppBanner } from './CreatedAppBanner';
import { CreateAppModal } from './modals/CreateAppModal';
import { IntegrationGuideModal } from './modals/IntegrationGuideModal';
import { TenantSettingsModal } from './modals/TenantSettingsModal';
import type { OAuthClient, CreatedClientData } from './types';

export default function Applications() {
  const [clients, setClients] = useState<OAuthClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState<'type' | 'form'>('type');
  const [selectedType, setSelectedType] = useState<'api' | 'oauth' | 'm2m' | null>(null);
  const [newClientName, setNewClientName] = useState('');
  const [newClientUris, setNewClientUris] = useState('');
  const [isConfidential, setIsConfidential] = useState(true);
  const [createdClient, setCreatedClient] = useState<CreatedClientData | null>(null);
  
  const [guideClient, setGuideClient] = useState<OAuthClient | null>(null);
  const [activeGuideTab, setActiveGuideTab] = useState<'api' | 'oauth' | 'm2m'>('api');

  // Tenant Settings state
  const [settingsClient, setSettingsClient] = useState<OAuthClient | null>(null);
  const [settingsTab, setSettingsTab] = useState<'branding' | 'smtp' | 'webhook'>('branding');
  const [settingsForm, setSettingsForm] = useState<any>({});

  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, string>>({});
  const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({});
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const clientsRes = await api.get('/developer/clients');
      setClients(clientsRes.clients || []);
    } catch (err) {
      console.error('Failed to load portal data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
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
        tenantSlug:  data.tenant?.clientId,
      });
      setClients([...clients, data.client]);
      setNewClientName('');
      setNewClientUris('');
      setShowCreateModal(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create client');
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
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            Applications
          </h1>
          <p className="text-sm text-white/50">OAuth 2.0 / OIDC clients registered in this tenant</p>
        </div>
        <div className="flex items-center gap-3">
          <a 
            href={`${import.meta.env.VITE_API_URL?.replace('/api/v1','') || 'http://localhost:3000'}/api/v1/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-colors text-sm"
          >
            <BookOpen className="w-4 h-4" />
            API Docs
          </a>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-primary !w-auto text-sm py-2 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Application
          </button>
        </div>
      </header>

      {/* Created App Banner */}
      {createdClient && (
        <CreatedAppBanner
          createdClient={createdClient}
          setCreatedClient={setCreatedClient}
          copyToClipboard={copyToClipboard}
          copyStatus={copyStatus}
        />
      )}

      {/* App List */}
      {isLoading ? (
        <div className="data-table-container p-12 text-center text-white/30">
          Loading applications...
        </div>
      ) : (
        <AppList
          clients={clients}
          setShowCreateModal={setShowCreateModal}
          setGuideClient={setGuideClient}
          setSettingsClient={setSettingsClient}
          setSettingsForm={setSettingsForm}
          handleDelete={handleDelete}
          revealedSecrets={revealedSecrets}
          setRevealedSecrets={setRevealedSecrets}
          handleRotateSecret={handleRotateSecret}
          copyToClipboard={copyToClipboard}
          copyStatus={copyStatus}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateAppModal
          setShowCreateModal={setShowCreateModal}
          createStep={createStep}
          setCreateStep={setCreateStep}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          newClientName={newClientName}
          setNewClientName={setNewClientName}
          newClientUris={newClientUris}
          setNewClientUris={setNewClientUris}
          isConfidential={isConfidential}
          setIsConfidential={setIsConfidential}
          handleCreate={handleCreate}
          createError={createError}
        />
      )}

      {/* Integration Guide Modal */}
      {guideClient && (
        <IntegrationGuideModal
          guideClient={guideClient}
          setGuideClient={setGuideClient}
          activeGuideTab={activeGuideTab}
          setActiveGuideTab={setActiveGuideTab}
        />
      )}

      {/* Tenant Settings Modal */}
      {settingsClient && (
        <TenantSettingsModal
          settingsClient={settingsClient}
          setSettingsClient={setSettingsClient}
          settingsTab={settingsTab}
          setSettingsTab={setSettingsTab}
          settingsForm={settingsForm}
          setSettingsForm={setSettingsForm}
          handleUpdateTenant={handleUpdateTenant}
        />
      )}
    </div>
  );
}
