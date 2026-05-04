import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Search, Loader2, Eye, Trash2, UserPlus, Filter } from "lucide-react";

interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  roles: string[];
  createdAt: string;
  lastLoginAt?: string;
  _count: { sessions: number; mfaMethods: number };
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      const loadUsers = async () => {
        setIsLoading(true);
        try {
          // Reusing the admin endpoint for now, assuming tenant-scoped in the backend
          const params = new URLSearchParams({ page: String(page), limit: "20" });
          if (search) params.append("search", search);
          const data = await api.get(`/auth/admin/users?${params}`);
          setUsers(data.users || []);
          setTotal(data.total || 0);
        } catch {
          console.error("Failed to load users");
        } finally {
          setIsLoading(false);
        }
      };

      void loadUsers();
    }, 300);

    return () => clearTimeout(timer);
  }, [page, search]);

  const getInitials = (email: string) => {
    const parts = email.split('@')[0].split(/[._-]/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getStatus = (user: User) => {
    if (!user.emailVerified) return { label: "PENDING", class: "status-pending" };
    // Add logic for blocked users if supported by backend
    return { label: "ACTIVE", class: "status-active" };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Users</h1>
          <p className="text-sm text-white/50">{total} total · {users.filter(u => u.emailVerified).length} active</p>
        </div>
        <button className="btn-primary !w-auto text-sm py-2">
          <UserPlus className="w-4 h-4" /> Invite User
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search users..."
            className="input-field pl-9 h-10 text-sm"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <button className="h-10 px-4 rounded-xl border border-white/10 bg-white/[0.02] text-white/70 text-sm font-medium flex items-center gap-2 hover:bg-white/[0.05] hover:text-white transition-colors">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      {/* Table */}
      <div className="data-table-container">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-white/30">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            <span className="text-sm">Loading users...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-white/40 text-sm">
            No users found matching your criteria.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Status</th>
                <th>2FA</th>
                <th>Role</th>
                <th>Last Login</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const status = getStatus(user);
                return (
                  <tr key={user.id} className="group">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/70">
                          {getInitials(user.email)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{user.email.split('@')[0]}</p>
                          <p className="text-[10px] text-white/40">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-dot ${status.class}`}>{status.label}</span>
                    </td>
                    <td>
                      <span className={`text-xs font-medium px-2 py-1 rounded border ${user._count.mfaMethods > 0 ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/10" : "border-white/10 text-white/30 bg-white/5"}`}>
                        {user._count.mfaMethods > 0 ? "2FA" : "None"}
                      </span>
                    </td>
                    <td className="text-xs text-white/70">
                      {user.roles.includes("ADMIN") ? "Admin" : "User"}
                    </td>
                    <td className="text-xs text-white/50">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-white/30 hover:text-cyan-400 rounded transition-colors" title="View details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-white/30 hover:text-red-400 rounded transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between text-xs text-white/40 mt-4">
          <span>Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} results</span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={page * 20 >= total}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
