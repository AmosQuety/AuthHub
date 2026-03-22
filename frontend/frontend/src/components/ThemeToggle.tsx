import { useTheme } from "../contexts/ThemeContext";
import { Sun, Moon, Monitor } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start" ref={menuRef}>
      {/* Dropup menu */}
      {isOpen && (
        <div className="glass-card mb-2 overflow-hidden w-36 animate-fade-in origin-bottom-left" style={{ animationDuration: "150ms" }}>
          {([
            { id: "light", label: "Light", icon: Sun },
            { id: "dark", label: "Dark", icon: Moon },
            { id: "system", label: "System", icon: Monitor },
          ] as const).map((t) => {
            const Icon = t.icon;
            const isActive = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium transition-colors
                  ${isActive ? "bg-white/10 text-white" : "text-white/60 hover:text-white/90 hover:bg-white/5"}
                `}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-violet-400" : "text-white/40"}`} />
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass-card hover:bg-white/10 p-3 rounded-full text-white/70 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-xl border-white/10 flex items-center justify-center"
        aria-label="Toggle theme"
      >
        {resolvedTheme === "dark" ? (
          <Moon className="w-5 h-5 text-violet-300" />
        ) : (
          <Sun className="w-5 h-5 text-amber-500" />
        )}
      </button>
    </div>
  );
}
