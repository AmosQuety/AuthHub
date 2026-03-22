import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { useToast } from "../contexts/ToastContext";
import { QrCode, ShieldPlus, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function MfaSetup() {
  const [qrCodeUri, setQrCodeUri] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  useEffect(() => {
    let mounted = true;
    const startEnrollment = async () => {
      try {
        const data = await api.post("/auth/mfa/enroll");
        if (mounted) { setQrCodeUri(data.qrCodeDataUri); setSecret(data.secret); }
      } catch (err: any) {
        if (mounted) toastError(err.message || "Failed to start MFA enrollment.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    startEnrollment();
    return () => { mounted = false; };
  }, [toastError]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) { toastError("Please enter a 6-digit code."); return; }

    setIsVerifying(true);
    try {
      await api.post("/auth/mfa/verify", { code });
      setSuccess(true);
      toastSuccess("MFA Enabled successfully");
      setTimeout(() => navigate("/", { replace: true }), 2000);
    } catch (err: any) {
      toastError(err instanceof ApiError ? (err.message || "Invalid code.") : "An unexpected error occurred.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center animate-glow-pulse">
            <ShieldPlus className="w-5 h-5 text-violet-400" />
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 relative">
      <div className="fixed top-1/4 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 left-1/4 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-fade-up">
        {/* Back Button */}
        <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-white/40 hover:text-white mb-6 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Security
        </button>

        <div className="glass-card-vivid p-8 relative overflow-hidden text-center border-violet-500/15">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

          {success ? (
            <div className="py-10 animate-fade-in">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)] mb-6 animate-float">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>Secure & Ready</h2>
              <p className="text-white/40 text-sm">Two-Factor Authentication is fully enabled. Redirecting...</p>
            </div>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600/20 to-cyan-500/10 border border-violet-500/20 mb-5 shadow-[0_0_24px_rgba(124,58,237,0.2)]">
                <ShieldPlus className="w-7 h-7 text-violet-400" />
              </div>
              <h1 className="text-2xl font-bold text-gradient mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>Secure Your Account</h1>
              <p className="text-white/40 text-sm px-4">Scan the QR code with an authenticator app to enable TOTP.</p>

              <div className="mt-8 mb-6 relative">
                <div className="absolute inset-0 bg-white/5 rounded-2xl blur"></div>
                <div className="relative p-6 bg-[#0c0c16] border border-white/10 rounded-2xl">
                  {qrCodeUri ? (
                    <div className="bg-white p-3 rounded-xl mx-auto inline-block shadow-lg">
                      <img src={qrCodeUri} alt="MFA QR Code" className="w-40 h-40" />
                    </div>
                  ) : (
                    <div className="w-40 h-40 mx-auto bg-white/5 rounded-xl border border-white/5 flex items-center justify-center">
                      <QrCode className="w-10 h-10 text-white/20" />
                    </div>
                  )}
                  {secret && (
                    <div className="mt-5 p-2.5 bg-black/40 border border-white/5 rounded-lg text-xs font-mono text-violet-300 break-all select-all">
                      {secret}
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleVerify}>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    required
                    className="input-field text-center tracking-[0.75em] font-mono text-2xl h-14 !pl-4 focus:ring-0"
                    placeholder="••••••"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                
                <button type="submit" disabled={isVerifying || code.length !== 6} className="btn-primary w-full mt-4 h-12">
                  {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Enable"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
