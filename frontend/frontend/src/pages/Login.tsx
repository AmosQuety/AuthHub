import { useActionState, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthActions } from "../contexts/AuthContext";
import { useTenantState } from "../contexts/TenantContext";
import { useToast } from "../contexts/ToastContext";
import { api, ApiError } from "../lib/api";
import { SocialLoginButtons } from "../components/SocialLoginButtons";
import { Mail, Lock, Loader2, ShieldCheck } from "lucide-react";

interface LoginProps {
  onIntentPrefetchDashboard?: () => void;
}

interface LoginActionState {
  error: string;
}

export default function Login({ onIntentPrefetchDashboard }: LoginProps) {
  const [oauthError, setOauthError] = useState("");
  const submitButtonRef = useRef<HTMLButtonElement | null>(null);
  const { login } = useAuthActions();
  const navigate = useNavigate();
  const location = useLocation();
  const { tenant } = useTenantState();
  const { success, error: toastError } = useToast();

  const from = location.state?.from?.pathname + location.state?.from?.search || "/";

  const [actionState, submitLogin, isPending] = useActionState<LoginActionState, FormData>(
    async (_previousState, formData) => {
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");

      if (!email || !password) {
        return { error: "Email and password are required" };
      }

      try {
        const data = await api.post("/auth/login", { email, password });
        if (data.mfaRequired) {
          navigate("/mfa-challenge", { state: { mfaToken: data.mfaToken } });
          return { error: "" };
        }
        login(data.accessToken, data.user);
        success("Logged in successfully");
        navigate(from, { replace: true });
        return { error: "" };
      } catch (err: any) {
        const msg = err instanceof ApiError ? err.message : "An unexpected error occurred";
        toastError(msg);
        return { error: msg };
      }
    },
    { error: "" },
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorParam = params.get("error");
    if (errorParam) {
      if (errorParam === "account_not_found") setOauthError("No account found with this social provider. Please register first.");
      else if (errorParam === "oauth_failed") setOauthError("Social login failed. Please try again.");
      else setOauthError("An error occurred during authentication.");
    } else {
      setOauthError("");
    }
  }, [location]);

  useEffect(() => {
    if (!onIntentPrefetchDashboard || !submitButtonRef.current || !("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onIntentPrefetchDashboard();
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: "120px",
        threshold: 0.01,
      },
    );

    observer.observe(submitButtonRef.current);
    return () => observer.disconnect();
  }, [onIntentPrefetchDashboard]);

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"}/auth/google?mode=login`;
  };
  const handleGithubLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"}/auth/github?mode=login`;
  };

  const errorMessage = oauthError || actionState.error;

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 relative">
      {/* Ambient orbs behind the card */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-700/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[300px] h-[300px] bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-fade-up">
        {/* Card */}
        <div className="glass-card-vivid p-8 overflow-hidden relative">
          {/* Top right corner glow */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-violet-600/15 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="text-center mb-8">
            {tenant?.logoUrl ? (
              <img src={tenant.logoUrl} alt={tenant.name} className="h-10 mx-auto mb-5 object-contain" />
            ) : (
              <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600/30 to-cyan-500/20 border border-violet-500/20 flex items-center justify-center animate-float shadow-[0_0_24px_rgba(124,58,237,0.3)]">
                <ShieldCheck className="w-7 h-7 text-violet-400" />
              </div>
            )}
            <h1 className="text-3xl font-bold text-gradient" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Welcome back
            </h1>
            <p className="text-white/40 mt-2 text-sm">
              {tenant ? `Sign in to ${tenant.name}` : "Sign in to your AuthHub account"}
            </p>
          </div>

          {/* Error */}
          {errorMessage && (
            <div className="p-3 mb-6 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form action={submitLogin} className="space-y-4">
            <div>
              <label className="input-label" htmlFor="email">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="input-field pl-10"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="input-label !mb-0" htmlFor="password">Password</label>
                <Link to="/forgot-password" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="input-field pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              ref={submitButtonRef}
              type="submit"
              disabled={isPending}
              className="btn-primary w-full mt-2"
              onMouseEnter={onIntentPrefetchDashboard}
              onFocus={onIntentPrefetchDashboard}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in"}
            </button>
          </form>

          <SocialLoginButtons onGoogleLogin={handleGoogleLogin} onGithubLogin={handleGithubLogin} />

          <p className="mt-6 text-center text-sm text-white/30">
            Don't have an account?{" "}
            <Link to="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Sign up for free
            </Link>
          </p>
        </div>

        {/* Footer tagline */}
        <p className="text-center mt-5 text-xs text-white/15 tracking-wider">
          SECURED BY AUTHHUB — RS256 · PKCE · ZERO-TRUST
        </p>
      </div>
    </div>
  );
}
