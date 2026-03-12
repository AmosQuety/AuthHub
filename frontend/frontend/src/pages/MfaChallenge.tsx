import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api, ApiError } from "../lib/api";
import { ShieldAlert, Loader2, Fingerprint } from "lucide-react";

export default function MfaChallenge() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // The temporary MFA token passed via React Router state from the Login page
  const mfaToken = location.state?.mfaToken;

  useEffect(() => {
    // Security check: If someone navigates here directly without an MFA token, kick them to login
    if (!mfaToken) {
      navigate("/login", { replace: true });
    }
  }, [mfaToken, navigate]);

  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const data = await api.post("/auth/mfa/totp/challenge", { 
        mfaToken, 
        code 
      });
      
      // Success: backend issues the real tokens now
      login(data.accessToken, data.user);
      navigate("/");
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Invalid authentication code");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeyAuth = async () => {
    // Future WebAuthn integration point
    alert("Passkey authentication will be implemented next!");
  };

  if (!mfaToken) return null; // Avoid rendering flash before redirect

  return (
    <div className="w-full max-w-md p-8 glass-card">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold">Two-Step Verification</h1>
        <p className="text-gray-400 mt-2">Enter the code from your authenticator app</p>
      </div>

      {error && (
        <div className="p-3 mb-6 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleVerifyTotp} className="space-y-6">
        <div>
          <label className="input-label text-center" htmlFor="code">Authentication Code</label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            className="input-field text-center text-2xl tracking-[0.5em] font-mono h-14"
            placeholder="000000"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} // strip non-digits
          />
        </div>

        <button type="submit" disabled={isLoading || code.length !== 6} className="btn-primary">
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Code"}
        </button>
      </form>

      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-brand-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-brand-surface text-gray-400">Other options</span>
          </div>
        </div>

        <div className="mt-6">
          <button type="button" onClick={handlePasskeyAuth} className="btn-secondary">
            <Fingerprint className="w-5 h-5" />
            Use a Passkey instead
          </button>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-gray-400">
        Lost access?{" "}
        <Link to="/recover" className="text-white hover:text-brand-primary transition-colors font-medium">
          Use recovery code
        </Link>
      </p>
    </div>
  );
}
