import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { useToast } from "../contexts/ToastContext";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();
  const { success } = useToast();

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
      await api.post("/auth/register", { email, password });
      
      // Navigate to login on successful creation
      // Note: Backend doesn't auto-login currently, it just returns 201
      success("Account created successfully. Please log in.");
      navigate("/login");
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.data?.details && Array.isArray(err.data.details)) {
          const messages = err.data.details.map((d: any) => d.message).join(" • ");
          setError(messages);
        } else {
          setError(err.message);
        }
      } else {
        setError("An unexpected error occurred during registration");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 glass-card">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="text-gray-400 mt-2">Join AuthHub today</p>
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
          <label className="input-label" htmlFor="password">Password</label>
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
          <label className="input-label" htmlFor="confirm_password">Confirm Password</label>
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

        <button type="submit" disabled={isLoading} className="btn-primary mt-4">
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>Create Account <ArrowRight className="w-4 h-4 ml-1" /></>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-400">
        Already have an account?{" "}
        <Link to="/login" className="text-white hover:text-brand-primary transition-colors font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
