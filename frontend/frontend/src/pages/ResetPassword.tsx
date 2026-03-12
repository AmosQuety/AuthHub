import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      // Backend validates token, rehashes password, and kills all active sessions
      await api.post("/auth/reset-password", { token, newPassword: password });
      setIsSuccess(true);
      
      // Auto redirect to login after 3 seconds
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to reset password. The token may be expired or invalid.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-md p-8 glass-card text-center">
        <h2 className="text-xl font-bold text-red-500 mb-2">Invalid Link</h2>
        <p className="text-gray-400 mb-6">No reset token was found in the URL.</p>
        <Link to="/forgot-password" className="btn-primary">Request New Link</Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="w-full max-w-md p-8 glass-card text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-400 mb-6">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Password Reset</h2>
        <p className="text-gray-400 mb-8">
          Your password has been successfully updated. All your other sessions have been signed out.
        </p>
        <p className="text-sm text-gray-500">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 glass-card">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Create new password</h1>
        <p className="text-gray-400 mt-2">Enter your new strong password below.</p>
      </div>

      {error && (
        <div className="p-3 mb-6 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="input-label" htmlFor="password">New Password</label>
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

        <div>
          <label className="input-label" htmlFor="confirm_password">Confirm New Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              id="confirm_password"
              type="password"
              required
              className="input-field pl-10"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary mt-2">
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
