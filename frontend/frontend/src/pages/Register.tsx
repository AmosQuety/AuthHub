import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { useToast } from "../contexts/ToastContext";
import { Mail, Lock, Loader2, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { SocialLoginButtons } from "../components/SocialLoginButtons";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /[0-9]/.test(password) },
  ];
  const strength = checks.filter(c => c.ok).length;
  const bars = [
    "bg-red-500",
    "bg-amber-500",
    "bg-green-500",
  ];

  if (!password) return null;

  return (
    <div className="mt-2.5 space-y-2">
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${i < strength ? bars[strength - 1] : "bg-white/8"}`}
          />
        ))}
      </div>
      <div className="flex gap-3 flex-wrap">
        {checks.map(({ label, ok }) => (
          <span key={label} className={`flex items-center gap-1 text-[10px] font-medium transition-colors ${ok ? "text-green-400" : "text-white/25"}`}>
            <CheckCircle2 className={`w-3 h-3 ${ok ? "text-green-400" : "text-white/15"}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setIsLoading(true);
    try {
      await api.post("/auth/register", { email, password });
      success("Account created! Please sign in.");
      navigate("/login");
    } catch (err: any) {
      const msg = err instanceof ApiError
        ? (err.data?.details?.map((d: any) => d.message).join(" • ") || err.message)
        : "An unexpected error occurred";
      setError(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"}/auth/google?mode=register`;
  };
  const handleGithubRegister = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"}/auth/github?mode=register`;
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 relative">
      {/* Ambient orbs */}
      <div className="fixed top-1/3 right-1/3 w-[500px] h-[350px] bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 left-1/4 w-[300px] h-[300px] bg-violet-700/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-fade-up">
        <div className="glass-card-vivid p-8 relative overflow-hidden">
          {/* Corner glow */}
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="text-center mb-7">
            <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/25 to-violet-600/20 border border-cyan-500/20 flex items-center justify-center animate-float shadow-[0_0_24px_rgba(6,182,212,0.2)]">
              <Sparkles className="w-6 h-6 text-cyan-300" />
            </div>
            <h1 className="text-3xl font-bold text-gradient" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Get started
            </h1>
            <p className="text-white/40 mt-2 text-sm">Create your AuthHub account — free forever.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 mb-5 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label" htmlFor="email">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <input id="email" type="email" required className="input-field pl-10"
                  placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="input-label" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <input id="password" type="password" required className="input-field pl-10"
                  placeholder="Minimum 8 characters" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <PasswordStrength password={password} />
            </div>

            <div>
              <label className="input-label" htmlFor="confirm_password">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <input id="confirm_password" type="password" required className="input-field pl-10"
                  placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full mt-2">
              {isLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>

          <SocialLoginButtons onGoogleLogin={handleGoogleRegister} onGithubLogin={handleGithubRegister} />

          <p className="mt-6 text-center text-sm text-white/30">
            Already have an account?{" "}
            <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">Sign in</Link>
          </p>
        </div>

        <p className="text-center mt-5 text-xs text-white/15 tracking-wider">
          SECURED BY AUTHHUB — RS256 · PKCE · ZERO-TRUST
        </p>
      </div>
    </div>
  );
}
