import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTenant } from "../contexts/TenantContext";
import { useToast } from "../contexts/ToastContext";
import { api, ApiError } from "../lib/api";
import { SocialLoginButtons } from "../components/SocialLoginButtons";
import { Mail, Lock, Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { tenant } = useTenant();
  const { success } = useToast();

  const from = location.state?.from?.pathname + location.state?.from?.search || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const data = await api.post("/auth/login", { email, password });
      
      // If the backend requires MFA, it will return mfaRequired: true instead of tokens
      if (data.mfaRequired) {
        // Redirect to MFA challenge screen, passing the temporary mfaToken
        navigate("/mfa-challenge", { state: { mfaToken: data.mfaToken } });
        return;
      }

      // Standard login success
      login(data.accessToken, data.user);
      success("Logged in successfully");
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:3000/api/v1/auth/google";
  };

  const handleGithubLogin = () => {
    window.location.href = "http://localhost:3000/api/v1/auth/github";
  };

  return (
    <div className="w-full max-w-md p-8 glass-card">
      <div className="text-center mb-8">
        {tenant?.logoUrl ? (
          <img src={tenant.logoUrl} alt={tenant.name} className="h-10 mx-auto mb-4 object-contain" />
        ) : (
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-primary/20 text-brand-primary mb-4">
            <Lock className="w-6 h-6" />
          </div>
        )}
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-gray-400 mt-2">
          {tenant ? `Sign in to your ${tenant.name} account` : "Sign in to your AuthHub account"}
        </p>
      </div>

      {error && (
        <div className="p-3 mb-6 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="input-label" htmlFor="email">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
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

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="input-label !mb-0" htmlFor="password">Password</label>
            <Link to="/forgot-password" className="text-sm text-brand-primary hover:text-brand-primary-hover transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              id="password"
              type="password"
              required
              className="input-field pl-10"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary mt-2">
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign in"}
        </button>
      </form>

      <SocialLoginButtons onGoogleLogin={handleGoogleLogin} onGithubLogin={handleGithubLogin} />

      <p className="mt-8 text-center text-sm text-gray-400">
        Don't have an account?{" "}
        <Link to="/register" className="text-white hover:text-brand-primary transition-colors font-medium">
          Sign up
        </Link>
      </p>
    </div>
  );
}
