import { useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { Mail, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Backend returns 200 regardless of email existence for security
      await api.post("/auth/forgot-password", { email });
      setIsSuccess(true);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to request password reset");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient orbs */}
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-700/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="w-full max-w-md animate-fade-up">
          <div className="glass-card-vivid p-8 text-center relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-green-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center animate-float">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>Check your inbox</h2>
            <p className="text-white/40 mb-8 text-sm">
              We sent a password reset link to <span className="text-white font-medium">{email}</span>. 
              Please check your email and click the link to reset your password.
            </p>
            <Link to="/login" className="btn-secondary w-full">
              Return to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-700/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[300px] h-[300px] bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-fade-up">
        <div className="glass-card-vivid p-8 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-violet-600/15 rounded-full blur-2xl pointer-events-none" />
          
          <div className="text-center mb-8">
            <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600/30 to-cyan-500/20 border border-violet-500/20 flex items-center justify-center animate-float shadow-[0_0_24px_rgba(124,58,237,0.3)]">
              <Mail className="w-6 h-6 text-violet-400" />
            </div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Reset password</h1>
            <p className="text-white/40 mt-2 text-sm">Enter your email and we'll send you a link to reset your password.</p>
          </div>

          {error && (
            <div className="p-3 mb-6 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="input-label" htmlFor="email">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <input
                  id="email"
                  type="email"
                  required
                  className="input-field pl-10"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <div className="flex items-center justify-center gap-2">
                  Send Reset Link <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link to="/login" className="text-sm text-white/30 hover:text-white transition-colors">
              Return to sign in
            </Link>
          </div>
        </div>
        
        <p className="text-center mt-5 text-xs text-white/15 tracking-wider">
          AUTHHUB IDENTITY GATEWAY — SECURED BY RS256
        </p>
      </div>
    </div>
  );
}
