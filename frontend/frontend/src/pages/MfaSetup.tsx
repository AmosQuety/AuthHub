import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { QrCode, ShieldPlus, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function MfaSetup() {
  const [qrCodeUri, setQrCodeUri] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const startEnrollment = async () => {
      try {
        const data = await api.post("/auth/mfa/enroll");
        if (mounted) {
          setQrCodeUri(data.qrCodeDataUri);
          setSecret(data.secret);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || "Failed to start MFA enrollment.");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    startEnrollment();

    return () => {
      mounted = false;
    };
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Please enter a 6-digit code.");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      await api.post("/auth/mfa/verify", { code });
      setSuccess(true);
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message || "Invalid code. Please try again.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 glass-card mx-auto mt-12 md:mt-24">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-gray-400 hover:text-white rounded-lg hover:bg-brand-surface transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1"></div>
      </div>

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-primary/20 text-brand-primary mb-4">
          <ShieldPlus className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold">Secure Your Account</h1>
        <p className="text-gray-400 mt-2">Set up Two-Factor Authentication (TOTP)</p>
      </div>

      {error && (
        <div className="p-3 mb-6 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg">
          {error}
        </div>
      )}

      {success ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-400 mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">MFA Enabled!</h2>
          <p className="text-gray-400">Your account is now protected. Returning to dashboard...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-4 bg-brand-base rounded-xl border border-brand-border text-center">
            <p className="text-sm text-gray-300 mb-4">
              1. Scan this QR code with your authenticator app (like Authy or Google Authenticator).
            </p>
            {qrCodeUri ? (
              <div className="bg-white p-4 inline-block justify-center rounded-xl mx-auto shadow-md">
                <img src={qrCodeUri} alt="MFA QR Code" className="w-48 h-48 mx-auto" />
              </div>
            ) : (
              <div className="w-48 h-48 mx-auto bg-gray-800 rounded-xl flex items-center justify-center">
                <QrCode className="w-12 h-12 text-gray-600" />
              </div>
            )}
            {secret && (
              <div className="mt-4 p-2 bg-brand-surface rounded text-xs text-gray-400 font-mono tracking-wider break-all">
                Manual entry code: <span className="text-white">{secret}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleVerify} className="space-y-4 pt-2">
            <div>
              <label className="input-label">2. Enter the 6-digit code</label>
              <input
                type="text"
                maxLength={6}
                required
                className="input-field text-center tracking-[0.5em] font-mono text-xl"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            
            <button type="submit" disabled={isVerifying || code.length !== 6} className="btn-primary w-full">
              {isVerifying ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Verify and Enable"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
