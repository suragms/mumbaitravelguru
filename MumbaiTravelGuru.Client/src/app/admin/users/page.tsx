'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { Search, Shield, CheckCircle, XCircle } from 'lucide-react';

interface UserItem {
  id: string; email: string; firstName: string; lastName: string;
  phoneNumber?: string; isEmailVerified: boolean;
  lastLoginAt?: string; createdAt: string; roles: string[];
}

interface UsersResult {
  items: UserItem[]; totalCount: number; page: number; pageSize: number;
}

const availableRoles = ['Customer', 'Admin', 'Ops', 'Finance', 'ContentManager'];

export default function AdminUsersPage() {
  const [data, setData] = useState<UsersResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [assigning, setAssigning] = useState('');
  const [assignResult, setAssignResult] = useState('');

  const fetch = async (p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('page', String(p));
      const d = await apiRequest<UsersResult>(`/api/v1/admin/users?${params}`);
      setData(d);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetch(page); }, [page]);
  useEffect(() => { const t = setTimeout(() => { setPage(1); fetch(1); }, 300); return () => clearTimeout(t); }, [search]);

  const assignRole = async (userId: string, role: string) => {
    setAssigning(userId);
    setAssignResult('');
    try {
      const r = await apiRequest<{ succeeded: boolean; error?: string }>('/api/v1/admin/users/assign-role', {
        method: 'POST', body: JSON.stringify({ userId, role }),
      });
      setAssignResult(r.succeeded ? `Role ${role} assigned` : r.error || 'Failed');
      if (r.succeeded) fetch(page);
    } catch (err: unknown) {
      setAssignResult(err instanceof Error ? err.message : 'Failed');
    }
    setAssigning('');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">User Management</h1>

      <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-4 py-2 max-w-md">
        <Search className="w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
          className="bg-transparent text-sm text-slate-200 focus:outline-none w-full" />
      </div>

      {assignResult && (
        <div className="text-sm text-slate-300 bg-slate-800 rounded-xl p-3">{assignResult}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500" /></div>
      ) : !data ? (
        <div className="text-slate-400 text-center py-20">Failed to load.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900 text-xs text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Verified</th>
                <th className="py-3 px-4">Roles</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4">Assign Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {data.items.map(u => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="text-white text-xs">{u.firstName} {u.lastName}</div>
                    <div className="text-slate-500 text-[10px]">{u.email}</div>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-400">{u.phoneNumber || '-'}</td>
                  <td className="py-3 px-4">{u.isEmailVerified ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-slate-600" />}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map(r => (
                        <span key={r} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${r === 'Admin' || r === 'SuperAdmin' ? 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' : 'text-slate-300 border-slate-600 bg-slate-800'}`}>{r}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-400">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '-'}</td>
                  <td className="py-3 px-4">
                    <select onChange={e => { if (e.target.value) assignRole(u.id, e.target.value); e.target.value = ''; }}
                      disabled={assigning === u.id}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
                      <option value="">Assign...</option>
                      {availableRoles.filter(r => !u.roles.includes(r)).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
