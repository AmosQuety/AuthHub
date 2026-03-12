import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { LogOut, Laptop, Smartphone, Trash2, Loader2, KeyRound, ShieldCheck } from "lucide-react";

interface Session {
  id: string;
  ipAddress: string | null;
  deviceInfo: {
    browser?: string;
    os?: string;
    isMobile?: boolean;
  };
  expiresAt: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  const fetchSessions = async () => {
    try {
      const data = await api.get("/auth/sessions"); // Assumes this endpoint exists or will exist
      setSessions(data.sessions || []);
    } catch (e) {
      console.error("Failed to load sessions");
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      setSessions(s => s.filter(x => x.id !== sessionId));
    } catch (e) {
      console.error("Failed to revoke session");
    }
  };

  return (
    <div className="min-h-screen w-full p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-4xl space-y-6">
        
        {/* Header Header */}
        <header className="glass-card p-6 flex flex-col md:flex-row items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Account Dashboard</h1>
            <p className="text-gray-400 mt-1">Manage your security and active sessions.</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-4">
            <span className="px-3 py-1 bg-brand-surface rounded-full text-sm font-medium border border-brand-border">
              {user?.email}
            </span>
            <button onClick={logout} className="btn-secondary !w-auto !py-2 text-red-400 hover:text-red-300">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Column: Security Status */}
          <div className="glass-card p-6 md:col-span-1 h-fit space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-primary" /> Security Status
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-brand-surface/50 rounded-xl border border-brand-border">
                <div className="flex items-center gap-3">
                  <KeyRound className="w-5 h-5 text-gray-400" />
                  <div>
                    <h3 className="text-sm font-medium">Password</h3>
                    <p className="text-xs text-gray-500">Last changed recently</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-brand-surface/50 rounded-xl border border-brand-border">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-gray-400" />
                  <div>
                    <h3 className="text-sm font-medium">Two-Factor Auth</h3>
                    <p className="text-xs text-yellow-500">Not configured</p>
                  </div>
                </div>
                <button className="text-xs font-medium text-brand-primary hover:text-brand-primary-hover transition-colors">Setup</button>
              </div>
            </div>
          </div>

          {/* Right Column: Active Sessions */}
          <div className="glass-card p-6 md:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Laptop className="w-5 h-5 text-brand-primary" /> Active Sessions
              </h2>
            </div>
            
            {isLoadingSessions ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No active sessions found.</p>
                <p className="text-sm mt-1">This is likely because the `/auth/sessions` endpoint hasn't been implemented yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-brand-surface rounded-xl border border-brand-border">
                    <div className="flex items-center gap-4">
                      {session.deviceInfo?.isMobile ? (
                        <Smartphone className="w-6 h-6 text-gray-400" />
                      ) : (
                        <Laptop className="w-6 h-6 text-gray-400" />
                      )}
                      <div>
                        <h3 className="font-medium">
                          {session.deviceInfo?.os || "Unknown OS"} • {session.deviceInfo?.browser || "Unknown Browser"}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                          {session.ipAddress || "Unknown IP"} • Expires {new Date(session.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRevokeSession(session.id)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Revoke session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
