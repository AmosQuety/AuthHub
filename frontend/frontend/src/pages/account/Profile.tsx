import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { api } from "../../lib/api";
import { 
  User, Mail, Phone, Shield, Lock, Fingerprint, 
  Key, Save, Loader2, Calendar, BadgeCheck, Github, 
  Chrome, Link2Off, AlertTriangle
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Profile() {
  const { user, refreshProfile } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phoneNumber: (user as any)?.phoneNumber || ""
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.patch("/auth/profile", formData);
      await refreshProfile();
      toastSuccess("Profile updated successfully");
    } catch (err: any) {
      toastError(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const initials = (user?.name || user?.email || "U")
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Profile Header Card */}
      <div className="glass-card p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-3xl font-bold text-black shadow-xl shadow-cyan-500/20">
              {initials}
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-[#0d0f14] border border-white/10 flex items-center justify-center text-cyan-400 shadow-lg">
              <BadgeCheck className="w-5 h-5" />
            </div>
          </div>
          
          <div className="text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <h1 className="text-3xl font-bold text-white leading-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {user?.name || "Anonymous User"}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-widest inline-block w-fit mx-auto md:mx-0">
                {user?.roles?.[0] || "User"}
              </span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4 text-white/40 text-sm">
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4" /> {user?.email}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Joined {new Date(user?.createdAt || "").toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info Column */}
        <div className="lg:col-span-2 space-y-8">
          <section className="glass-card p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <User className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">Personal Information</h2>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-cyan-400 transition-colors" />
                    <input 
                      type="text" 
                      className="input-field pl-10" 
                      placeholder="e.g. John Doe"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Phone Number</label>
                  <div className="relative group">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-cyan-400 transition-colors" />
                    <input 
                      type="tel" 
                      className="input-field pl-10" 
                      placeholder="+1 (555) 000-0000"
                      value={formData.phoneNumber}
                      onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="btn-primary !w-auto px-6 flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </form>
          </section>

          <section className="glass-card p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Link2Off className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Connected Accounts</h2>
            </div>
            
            <div className="space-y-4">
              {user?.providers && user.providers.length > 0 ? (
                user.providers.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/60">
                        {p.name === 'github' ? <Github className="w-6 h-6" /> : <Chrome className="w-6 h-6" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white capitalize">{p.name}</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Verified Provider</p>
                      </div>
                    </div>
                    <button className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-widest px-3 py-1.5 rounded-lg border border-red-400/20 hover:bg-red-400/5 transition-all">
                      Disconnect
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-amber-400/60">
                  <AlertTriangle className="w-5 h-5" />
                  <p className="text-sm">No social accounts linked to this identity.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Security Column */}
        <div className="space-y-8">
          <section className="glass-card p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Security Status</h2>
            </div>

            <div className="space-y-6">
              {/* MFA Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${user?.mfaEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/30'}`}>
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Two-Factor Auth</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">{user?.mfaEnabled ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>
                <Link to="/security/mfa" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-widest">Manage</Link>
              </div>

              {/* Passkeys Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5 text-white/30">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Passkeys</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Fingerprint / WebAuthn</p>
                  </div>
                </div>
                <Link to="/security/passkeys" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-widest">Setup</Link>
              </div>

              {/* Password Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${user?.hasPassword ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Password</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">{user?.hasPassword ? 'Set' : 'Not Set'}</p>
                  </div>
                </div>
                <Link to="/change-password" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-widest">Change</Link>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-cyan-400/5 border border-cyan-400/10">
              <p className="text-[10px] text-cyan-400/80 font-medium leading-relaxed">
                Ensuring your security status is "Optimal" protects your platform data and developer resources.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
