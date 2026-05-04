import React, { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning" | "info";
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "danger",
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onCancel}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md glass-card-vivid overflow-hidden border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Progress bar / highlight */}
        <div className={`h-1.5 w-full ${variant === 'danger' ? 'bg-red-500/50' : 'bg-violet-500/50'}`} />
        
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl flex-shrink-0 ${variant === 'danger' ? 'bg-red-500/15 text-red-400' : 'bg-violet-500/15 text-violet-400'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {title}
                </h3>
                <button 
                  onClick={onCancel}
                  className="p-1 rounded-lg text-white/20 hover:text-white hover:bg-white/5 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-white/40 text-sm leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-xl border border-white/5 bg-white/5 text-white/70 text-sm font-semibold hover:bg-white/10 hover:text-white transition-all active:scale-[0.98]"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-[0.98]
                ${variant === 'danger' 
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20' 
                  : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/20'
                }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
