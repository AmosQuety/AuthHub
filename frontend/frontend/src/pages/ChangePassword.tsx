import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { KeyRound, ShieldAlert, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

const calculateStrength = (pwd: string) => {
  let score = 0;
  if (!pwd) return 0;
  if (pwd.length >= 8) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score; // 0 to 4
};

export default function ChangePassword() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  const hasPassword = user?.hasPassword;
  const providers = user?.providers || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toastError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      toastError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.put("/auth/update-password", {
        currentPassword: hasPassword ? currentPassword : undefined,
        newPassword
      });
      
      setSuccess(true);
      toastSuccess("Password updated successfully.");
      // Refresh the profile so the hasPassword flag updates in the context
      await (user as any).refreshProfile?.(); 
      setTimeout(() => navigate("/"), 2000);
    } catch (err: any) {
      toastError(err.message || "Failed to update password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 relative">
      <div className="fixed top-1/4 left-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-fade-up">
        <button 
          onClick={() => navigate(-1)} 
          className="group flex items-center gap-2 text-white/40 hover:text-white mb-6 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </button>

        <div className="glass-card-vivid p-8 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-violet-500/15 rounded-full blur-2xl pointer-events-none" />

          {success ? (
            <div className="py-10 text-center animate-fade-in">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6 animate-float">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>Success!</h2>
              <p className="text-white/40 text-sm">Your credentials have been updated. Redirecting...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center">
                  <KeyRound className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    {hasPassword ? "Change Password" : "Set Password"}
                  </h1>
                  <p className="text-white/40 text-xs mt-1">
                    {hasPassword 
                      ? "Keep your account secure with a strong password."
                      : "Add a password to your account for direct login."}
                  </p>
                </div>
              </div>

              {!hasPassword && providers.length > 0 && (
                <div className="mb-6 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10 flex gap-3">
                  <ShieldAlert className="w-5 h-5 text-cyan-400 shrink-0" />
                  <p className="text-[11px] text-cyan-200/60 leading-relaxed">
                    You currently log in via <span className="text-cyan-300 font-bold capitalize">{providers.map(p => p.name).join(" & ")}</span>. 
                    Setting a password allows you to log in with your email directly too.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {hasPassword && (
                  <div>
                    <label className="input-label">Current Password</label>
                    <input
                      type="password"
                      required
                      className="input-field"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                )}

                <div>
                  <label className="input-label">New Password</label>
                  <input
                    type="password"
                    required
                    className="input-field"
                    placeholder="Min 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  {/* Strength Meter */}
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-1.5 h-1">
                      {[1, 2, 3, 4].map((step) => {
                        const strength = calculateStrength(newPassword);
                        const isActive = step <= strength;
                        return (
                          <div
                            key={step}
                            className={`flex-1 rounded-full transition-all duration-500 ${
                              isActive
                                ? strength <= 1
                                  ? "bg-red-500"
                                  : strength === 2
                                  ? "bg-amber-500"
                                  : strength === 3
                                  ? "bg-blue-500"
                                  : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                                : "bg-white/5"
                            }`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between items-center px-0.5">
                      <p className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${
                        calculateStrength(newPassword) <= 1 ? "text-red-400" : 
                        calculateStrength(newPassword) === 2 ? "text-amber-400" :
                        calculateStrength(newPassword) === 3 ? "text-blue-400" : "text-emerald-400"
                      }`}>
                        {newPassword ? [
                          "Very Weak",
                          "Weak",
                          "Medium",
                          "Strong",
                          "Very Strong"
                        ][calculateStrength(newPassword)] : "Enter a password"}
                      </p>
                      <p className="text-[10px] text-white/20">Use symbols & numbers</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="input-label">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    className="input-field"
                    placeholder="Match new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="btn-primary w-full h-12 mt-4"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (hasPassword ? "Update Password" : "Set Password")}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
