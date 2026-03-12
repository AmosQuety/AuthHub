import { useEffect, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function VerifyEmail() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Prevent strict mode double execution from triggering token invalidation twice
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No verification token found in URL.");
      return;
    }

    if (hasAttempted.current) return;
    hasAttempted.current = true;

    const verify = async () => {
      try {
        await api.get(`/auth/verify-email/${token}`);
        setStatus("success");
      } catch (err: any) {
        setStatus("error");
        if (err instanceof ApiError) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage("Failed to verify email. The link may have expired or already been used.");
        }
      }
    };

    verify();
  }, [token]);

  return (
    <div className="w-full max-w-md p-8 glass-card text-center">
      {status === "loading" && (
        <div className="py-8 space-y-4 flex flex-col items-center">
          <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
          <h2 className="text-xl font-bold">Verifying your email...</h2>
          <p className="text-gray-400">Please do not close this window.</p>
        </div>
      )}

      {status === "success" && (
        <div className="py-4 space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 text-green-400 mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Email Verified</h2>
            <p className="text-gray-400 mt-2">
              Your email address has been successfully verified. You now have full access to your account.
            </p>
          </div>
          <Link to="/" className="btn-primary w-full inline-flex">
            Continue to Dashboard
          </Link>
        </div>
      )}

      {status === "error" && (
        <div className="py-4 space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 text-red-500 mx-auto">
            <XCircle className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Verification Failed</h2>
            <p className="text-gray-400 mt-2">{errorMessage}</p>
          </div>
          <Link to="/login" className="btn-secondary w-full inline-flex">
            Return to Login
          </Link>
        </div>
      )}
    </div>
  );
}
