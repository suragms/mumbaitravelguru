'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { Search, Filter, Clock } from 'lucide-react';

interface AuditLogItem {
  id: string; action: string; userId?: string; userEmail?: string;
  details: string; entityType?: string; entityId?: string; createdAt: string;
}

interface AuditLogsResult {
  items: AuditLogItem[]; totalCount: number; page: number; pageSize: number;
}

export default function AdminAuditLogPage() {
  const [data, setData] = useState<AuditLogsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [page, setPage] = useState(1);

  const fetch = async (p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (action) params.set('action', action);
      if (userEmail) params.set('userEmail', userEmail);
      params.set('page', String(p));
      params.set('pageSize', '50');
      const d = await apiRequest<AuditLogsResult>(`/api/v1/admin/audit-logs?${params}`);
      setData(d);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetch(page); }, [page, action]);
  useEffect(() => { const t = setTimeout(() => { setPage(1); fetch(1); }, 300); return () => clearTimeout(t); }, [userEmail]);

  const totalPages = data ? Math.ceil(data.totalCount / data.pageSize) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Audit Log</h1>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-slate-800 rounded-xl px-4 py-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={userEmail} onChange={e => setUserEmail(e.target.value)} placeholder="Filter by email..."
            className="bg-transparent text-sm text-slate-200 focus:outline-none w-full" />
        </div>
        <input value={action} onChange={e => setAction(e.target.value)} placeholder="Filter by action..."
          className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500" /></div>
      ) : !data ? (
        <div className="text-slate-400 text-center py-20">Failed to load.</div>
      ) : (
        <>
          <div className="text-sm text-slate-500">{data.totalCount} log entries</div>
          <div className="space-y-2">
            {data.items.map(log => (
              <div key={log.id} className="metal-card rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-slate-800 p-2 rounded-lg"><Clock className="w-4 h-4 text-indigo-400" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-white bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">{log.action}</span>
                      <span className="text-[10px] text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
                      {log.userEmail && <span className="text-[10px] text-slate-400">by {log.userEmail}</span>}
                    </div>
                    <div className="text-xs text-slate-300 break-words">{log.details}</div>
                    {(log.entityType || log.entityId) && (
                      <div className="text-[10px] text-slate-500 mt-1">
                        {log.entityType && <span>Type: {log.entityType} </span>}
                        {log.entityId && <span>ID: {log.entityId?.toString().slice(0, 8)}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {data.items.length === 0 && <div className="text-slate-500 text-center py-10">No log entries found.</div>}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === p ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
