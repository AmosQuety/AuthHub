import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { X, CheckCircle2, AlertTriangle, Info, ShieldAlert } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextData {
  addToast: (message: string, type: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextData | undefined>(undefined);

const toastStyles = {
  success: {
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    iconColor: "text-emerald-400",
    Icon: CheckCircle2
  },
  error: {
    bg: "bg-rose-500/15",
    border: "border-rose-500/30",
    iconColor: "text-rose-400",
    Icon: ShieldAlert
  },
  warning: {
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
    iconColor: "text-amber-400",
    Icon: AlertTriangle
  },
  info: {
    bg: "bg-cyan-500/15",
    border: "border-cyan-500/30",
    iconColor: "text-cyan-400",
    Icon: Info
  }
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const success = useCallback((message: string) => addToast(message, 'success'), [addToast]);
  const error = useCallback((message: string) => addToast(message, 'error'), [addToast]);
  const info = useCallback((message: string) => addToast(message, 'info'), [addToast]);
  const warning = useCallback((message: string) => addToast(message, 'warning'), [addToast]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, success, error, info, warning }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => {
          const style = toastStyles[toast.type] || toastStyles.info;
          const { Icon } = style;

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 w-80 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl animate-fade-up transition-all duration-300 ${style.bg} ${style.border}`}
              style={{
                background: `linear-gradient(135deg, rgba(12,12,24,0.85) 0%, rgba(7,7,16,0.95) 100%), var(--tw-gradient-stops)`,
              }}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${style.iconColor}`} />
              
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium leading-relaxed">
                  {toast.message}
                </p>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 -mr-1 -mt-1 text-white/40 hover:text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
