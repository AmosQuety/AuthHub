import { useState } from "react";
import { 
  Settings2, Shield, Save, Loader2, Globe, 
  Lock, AlertTriangle, Cpu, Radio
} from "lucide-react";

export default function SystemSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState({
    publicRegistration: true,
    maintenanceMode: false,
    globalMfa: false,
    riskScoring: true,
    logLevel: "info",
    platformName: "AuthHub Enterprise",
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1000));
    setIsSaving(false);
    alert("System configuration updated globally.");
  };

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>System Settings</h1>
        <p className="text-sm text-white/50">Global platform configuration · Affects all tenants</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 pb-12">
        {/* Core Platform Section */}
        <section className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Globe className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Platform Availability</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 rounded border-white/10 bg-white/5 text-cyan-400 focus:ring-cyan-400/20" 
                  checked={config.publicRegistration}
                  onChange={e => setConfig({ ...config, publicRegistration: e.target.checked })}
                />
                <div>
                  <p className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">Public Registration</p>
                  <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-wider font-bold">Allow new users to sign up without an invitation.</p>
                </div>
              </label>

              <label className="flex items-start gap-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10 transition-all cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 rounded border-amber-500/20 bg-amber-500/10 text-amber-500 focus:ring-amber-500/20" 
                  checked={config.maintenanceMode}
                  onChange={e => setConfig({ ...config, maintenanceMode: e.target.checked })}
                />
                <div>
                  <p className="text-sm font-bold text-amber-400">Maintenance Mode</p>
                  <p className="text-[10px] text-amber-400/40 leading-relaxed uppercase tracking-wider font-bold">Block all non-admin access to the dashboard and APIs.</p>
                </div>
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Platform Display Name</label>
              <input 
                type="text" 
                className="input-field" 
                value={config.platformName}
                onChange={e => setConfig({ ...config, platformName: e.target.value })}
              />
              <p className="text-[10px] text-white/20">This name appears on the browser title and system emails.</p>
            </div>
          </div>
        </section>

        {/* Security Policies */}
        <section className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Global Security Policies</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4" 
                  checked={config.globalMfa}
                  onChange={e => setConfig({ ...config, globalMfa: e.target.checked })}
                />
                <div>
                  <p className="text-sm font-bold text-white">Mandatory MFA</p>
                  <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-wider font-bold">Enforce MFA for ALL users across all tenants, regardless of tenant settings.</p>
                </div>
              </label>

              <label className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4" 
                  checked={config.riskScoring}
                  onChange={e => setConfig({ ...config, riskScoring: e.target.checked })}
                />
                <div>
                  <p className="text-sm font-bold text-white">Advanced Risk Detection</p>
                  <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-wider font-bold">Enable machine-learning based risk scoring for every login attempt.</p>
                </div>
              </label>
            </div>

            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-red-400/80 leading-relaxed font-medium">
                Caution: Global policies override individual tenant configurations. Changes here may cause login friction for existing users across the entire platform.
              </p>
            </div>
          </div>
        </section>

        {/* System & Debug */}
        <section className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Cpu className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-bold text-white">Infrastructure & Runtime</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Logging Level</label>
              <select 
                className="input-field appearance-none bg-[#0d0f14]"
                value={config.logLevel}
                onChange={e => setConfig({ ...config, logLevel: e.target.value })}
              >
                <option value="debug">DEBUG - Verbose internal tracing</option>
                <option value="info">INFO - Standard operational logs</option>
                <option value="warn">WARN - Non-critical issues only</option>
                <option value="error">ERROR - Critical failures only</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Cache Health</p>
                  <p className="text-xs font-bold text-white">Redis Cluster Online</p>
                </div>
              </div>
              <button type="button" className="text-[9px] font-bold text-cyan-400 border border-cyan-400/20 px-2 py-1 rounded-lg hover:bg-cyan-400/5 transition-all">PURGE ALL</button>
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-4">
          <button type="button" className="btn-secondary !w-auto px-6">Discard</button>
          <button 
            type="submit" 
            disabled={isSaving}
            className="btn-primary !w-auto px-8 flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Global Config
          </button>
        </div>
      </form>
    </div>
  );
}
