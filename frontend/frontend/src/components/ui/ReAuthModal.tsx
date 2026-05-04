import { useState } from "react";
import { ShieldAlert, Loader2, KeyRound } from "lucide-react";
import { api } from "../../lib/api";
import { useToast } from "../../contexts/ToastContext";

interface ReAuthModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
}

export function ReAuthModal({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  title = "Confirm Password", 
  message = "Please enter your password to confirm this sensitive action."
}: ReAuthModalProps) {
  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const { error: toastError } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
      await api.post("/auth/verify-password", { password });
      setPassword("");
      onConfirm();
    } catch (err: any) {
      toastError(err.message || "Incorrect password.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm glass-card-vivid overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="h-1.5 w-full bg-violet-500/50" />
        
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>{title}</h3>
              <p className="text-[11px] text-white/40 mt-1">{message}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2 block">
                Your Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  autoFocus
                  required
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <KeyRound className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-sm font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isVerifying}
                className="flex-[2] px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold shadow-lg shadow-violet-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Confirm Access"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
