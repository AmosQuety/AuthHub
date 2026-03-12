import { useState, useEffect } from "react";
import { api, ApiError } from "../../lib/api";
import { Settings, Save, Loader2, Palette, ShieldCheck, Image as ImageIcon } from "lucide-react";

interface TenantConfig {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  requireMfa: boolean;
  allowPasskeys: boolean;
}

export default function AdminTenantConfig() {
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // In a real application, the admin would select the tenant they are editing.
  // For AuthHub's current demo, we'll assume there's a primary tenant we can edit.
  // We'll use a hardcoded fallback "default" or fetch the first one.
  const [tenantId] = useState("default");

  useEffect(() => {
    // In a full implementation we'd first list tenants.
    // Assuming 'default' tenant exists for now based on previous context.
    const loadConfig = async () => {
      try {
        const data = await api.get(`/auth/tenant/${tenantId}/config`);
        setConfig(data.tenant);
      } catch (e: any) {
        if (e.status === 404) {
          setError("Tenant 'default' not found. Please ensure the database is seeded.");
        } else {
          setError("Failed to load tenant configuration.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadConfig();
  }, [tenantId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.put(`/auth/tenant/${tenantId}/config`, config);
      setSuccess("Tenant configuration updated successfully.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : "Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6 text-brand-primary" /> 
            Tenant Configuration
          </h1>
          <p className="text-gray-400 mt-1">Customize branding and enforce security policies for your tenant.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400">
            {success}
        </div>
      )}

      {config && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="glass-card p-6 space-y-6">
            <h2 className="text-lg font-semibold border-b border-brand-border pb-3 flex items-center gap-2">
              <Palette className="w-5 h-5 text-gray-400" /> Branding
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="input-label">Tenant / Organization Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={config.name} 
                  onChange={e => setConfig({ ...config, name: e.target.value })} 
                  required 
                />
              </div>

              <div>
                <label className="input-label flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-gray-400" /> Logo URL
                </label>
                <input 
                  type="url" 
                  className="input-field" 
                  placeholder="https://example.com/logo.png"
                  value={config.logoUrl || ""} 
                  onChange={e => setConfig({ ...config, logoUrl: e.target.value })} 
                />
              </div>

              <div>
                <label className="input-label">Primary Color (Hex)</label>
                <div className="flex gap-3">
                  <input 
                    type="color" 
                    className="h-10 w-10 rounded cursor-pointer bg-transparent border-0 p-0" 
                    value={config.primaryColor || "#3b82f6"} 
                    onChange={e => setConfig({ ...config, primaryColor: e.target.value })} 
                  />
                  <input 
                    type="text" 
                    className="input-field flex-1 font-mono uppercase" 
                    placeholder="#3B82F6"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    value={config.primaryColor || ""} 
                    onChange={e => setConfig({ ...config, primaryColor: e.target.value })} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 space-y-6">
            <h2 className="text-lg font-semibold border-b border-brand-border pb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-gray-400" /> Security Policies
            </h2>
            
            <div className="space-y-4">
              <label className="flex items-start gap-3 p-3 bg-brand-surface/50 border border-brand-border rounded-xl cursor-pointer hover:bg-brand-surface transition-colors">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 accent-brand-primary" 
                  checked={config.requireMfa}
                  onChange={e => setConfig({ ...config, requireMfa: e.target.checked })}
                />
                <div>
                  <div className="font-medium text-white">Enforce Two-Factor Authentication (MFA)</div>
                  <div className="text-xs text-gray-400 mt-0.5">Require all users in this tenant to set up MFA.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-brand-surface/50 border border-brand-border rounded-xl cursor-pointer hover:bg-brand-surface transition-colors">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 accent-brand-primary" 
                  checked={config.allowPasskeys}
                  onChange={e => setConfig({ ...config, allowPasskeys: e.target.checked })}
                />
                <div>
                  <div className="font-medium text-white">Allow Passkeys (WebAuthn)</div>
                  <div className="text-xs text-gray-400 mt-0.5">Allow users to log in using biometric passkeys (Touch ID, Face ID, Windows Hello).</div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={isSaving} className="btn-primary !w-auto min-w-[120px]">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
