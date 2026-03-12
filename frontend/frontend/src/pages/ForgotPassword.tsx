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
      <div className="w-full max-w-md p-8 glass-card text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-400 mb-6">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Check your inbox</h2>
        <p className="text-gray-400 mb-8">
          We sent a password reset link to <span className="text-white font-medium">{email}</span>. 
          Please check your email and click the link to reset your password.
        </p>
        <Link to="/login" className="btn-secondary">
          Return to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 glass-card">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="text-gray-400 mt-2">Enter your email and we'll send you a link to reset your password.</p>
      </div>

      {error && (
        <div className="p-3 mb-6 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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

        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>Send Reset Link <ArrowRight className="w-4 h-4 ml-1" /></>
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
          Return to sign in
        </Link>
      </div>
    </div>
  );
}
