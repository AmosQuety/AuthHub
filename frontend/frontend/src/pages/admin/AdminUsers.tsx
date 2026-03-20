import { useState, useEffect, useCallback } from "react";
import { api } from "../../lib/api";
import { Search, ShieldCheck, Trash2, CheckCircle2, XCircle, Users, UserCog, Loader2 } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  emailVerified: boolean;
  roles: string[];
  createdAt: string;
  _count: { sessions: number; mfaMethods: number };
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.append("search", search);
      const data = await api.get(`/auth/admin/users?${params}`);
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch { console.error("Failed to load users"); }
    finally { setIsLoading(false); }
  }, [page, search]);

  useEffect(() => { const t = setTimeout(loadUsers, 300); return () => clearTimeout(t); }, [loadUsers]);

  const handleDelete = async (userId: string, email: string) => {
    if (!confirm(`Permanently delete "${email}"? All sessions will be revoked.`)) return;
    try {
      await api.delete(`/auth/admin/users/${userId}`);
      setUsers(u => u.filter(x => x.id !== userId));
      setTotal(t => t - 1);
    } catch { alert("Failed to delete user."); }
  };

  const handleImpersonate = async (userId: string, email: string) => {
    if (!confirm(`Login as ${email}? This action is audited and the user will be notified.`)) return;
    try {
      const data = await api.post(`/auth/admin/users/${userId}/impersonate`, {});
      if (data?.accessToken) { localStorage.setItem("accessToken", data.accessToken); window.location.href = "/"; }
    } catch { alert("Failed to impersonate user."); }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1 flex items-center gap-2">
            <Users className="w-3 h-3" /> User Management
          </p>
          <h1 className="text-2xl font-bold text-gradient" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {total.toLocaleString()} <span className="text-white/50 text-xl font-medium">Registered Users</span>
          </h1>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by email…"
          className="input-field pl-10"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex flex-col items-center justify-center gap-3 text-white/20">
            <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
            <span className="text-sm">Loading users…</span>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-white/25 text-sm">No users found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {["User", "Status", "Role", "MFA", "Sessions", "Joined", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-white/25">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {users.map((user, i) => (
                <tr
                  key={user.id}
                  className={`group hover:bg-white/2 transition-all duration-150 animate-fade-up stagger-${Math.min(i + 1, 5)}`}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600/30 to-cyan-500/20 flex items-center justify-center text-xs font-bold text-violet-300 flex-shrink-0">
                        {user.email[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-white truncate max-w-[160px]">{user.email}</div>
                        <div className="text-[10px] text-white/20 font-mono truncate max-w-[160px]">{user.id.slice(0, 12)}…</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {user.emailVerified
                      ? <span className="badge badge-green"><CheckCircle2 className="w-3 h-3" />Verified</span>
                      : <span className="badge badge-amber"><XCircle className="w-3 h-3" />Pending</span>
                    }
                  </td>
                  <td className="px-5 py-4">
                    {user.roles.includes("ADMIN")
                      ? <span className="badge badge-violet"><ShieldCheck className="w-3 h-3" />Admin</span>
                      : <span className="text-[11px] text-white/25">User</span>
                    }
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium ${user._count.mfaMethods > 0 ? "text-green-400" : "text-white/20"}`}>
                      {user._count.mfaMethods > 0 ? `${user._count.mfaMethods} active` : "None"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs ${user._count.sessions > 0 ? "text-cyan-400" : "text-white/20"}`}>
                      {user._count.sessions}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[11px] text-white/25">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleImpersonate(user.id, user.email)}
                        className="p-1.5 text-white/25 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors"
                        title="Login as user"
                      >
                        <UserCog className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.email)}
                        className="p-1.5 text-white/25 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between text-sm text-white/30">
          <span>Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}</span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-white/8 hover:bg-white/5 disabled:opacity-30 transition-colors text-xs text-white/50"
            >
              Previous
            </button>
            <button
              disabled={page * 20 >= total}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-white/8 hover:bg-white/5 disabled:opacity-30 transition-colors text-xs text-white/50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
