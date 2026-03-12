import { useState, useEffect, useCallback } from "react";
import { api } from "../../lib/api";
import { TableSkeleton } from "../../components/ui/TableSkeleton";
import { Search, ShieldCheck, Trash2, CheckCircle2, XCircle, Users } from "lucide-react";

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
    } catch (e) {
      console.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(loadUsers, 300);
    return () => clearTimeout(t);
  }, [loadUsers]);

  const handleDelete = async (userId: string, email: string) => {
    if (!confirm(`Permanently delete user "${email}"? All their sessions will be revoked.`)) return;
    try {
      await api.delete(`/auth/admin/users/${userId}`);
      setUsers(u => u.filter(x => x.id !== userId));
      setTotal(t => t - 1);
    } catch {
      alert("Failed to delete user.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-400 mt-1">{total} registered users</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search by email..."
          className="input-field pl-10"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <TableSkeleton columns={7} rows={5} />
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p>No users found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-brand-border">
              <tr>
                {["Email", "Verified", "Role", "MFA Methods", "Sessions", "Joined", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-brand-surface/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-white">{user.email}</div>
                    <div className="text-xs text-gray-600 mt-0.5 truncate max-w-[180px]">{user.id}</div>
                  </td>
                  <td className="px-5 py-4">
                    {user.emailVerified
                      ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                      : <XCircle className="w-4 h-4 text-yellow-500" />
                    }
                  </td>
                  <td className="px-5 py-4">
                    {user.roles.includes("ADMIN") ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/15 text-purple-400">
                        <ShieldCheck className="w-3 h-3" /> Admin
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">User</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-gray-400 text-xs">{user._count.mfaMethods > 0 ? `${user._count.mfaMethods} active` : "None"}</td>
                  <td className="px-5 py-4 text-gray-400 text-xs">{user._count.sessions}</td>
                  <td className="px-5 py-4 text-gray-500 text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleDelete(user.id, user.email)}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Delete user"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded-lg border border-brand-border hover:bg-brand-surface disabled:opacity-40 transition-colors">Previous</button>
            <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded-lg border border-brand-border hover:bg-brand-surface disabled:opacity-40 transition-colors">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
