'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import {
  Search, History, ExternalLink, ChevronDown, ChevronRight,
  Eye, EyeOff, Clock, User, FileText, ArrowRight,
  ChevronLeft, ChevronRight as ChevronRightIcon,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AuditLogItem {
  id: string;
  action: string;
  userId?: string;
  userEmail?: string;
  details: string;
  entityType?: string;
  entityId?: string;
  createdAt: string;
  actorRole?: string;
  beforeData?: string;
  afterData?: string;
  ipAddress?: string;
}

interface AuditLogsResult {
  items: AuditLogItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatTimestamp(iso);
}

function actionBadgeClass(action: string): string {
  const lower = action.toLowerCase();
  if (lower.includes('create') || lower.includes('book') || lower.includes('confirm'))
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
  if (lower.includes('cancel') || lower.includes('delete') || lower.includes('refund'))
    return 'bg-rose-500/10 text-rose-400 border-rose-500/25';
  if (lower.includes('update') || lower.includes('edit') || lower.includes('change') || lower.includes('modify'))
    return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
  if (lower.includes('login') || lower.includes('logout') || lower.includes('auth'))
    return 'bg-gate-gold/10 text-gate-gold border-gate-gold/25';
  return 'bg-monsoon/30 text-sandstone/60 border-monsoon/50';
}

function userAvatar(email?: string) {
  if (!email) return <User className="w-3.5 h-3.5" />;
  return <span className="font-mono text-[10px]">{email.charAt(0).toUpperCase()}</span>;
}

/* ------------------------------------------------------------------ */
/*  Diff Viewer                                                        */
/* ------------------------------------------------------------------ */

function DiffViewer({ before, after }: { before: string; after: string }) {
  const [open, setOpen] = useState(false);

  let beforeObj: Record<string, unknown> | null = null;
  let afterObj: Record<string, unknown> | null = null;
  try { beforeObj = JSON.parse(before); } catch { /* not json */ }
  try { afterObj = JSON.parse(after); } catch { /* not json */ }

  const allKeys = beforeObj && afterObj
    ? [...new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)])].sort()
    : [];

  return (
    <div className="mt-2 border border-monsoon/40 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 w-full px-3 py-1.5 text-[10px] text-sandstone/60 hover:text-sandstone bg-sea-deep/50 transition-colors"
      >
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <Eye className="w-3 h-3" /> View changes
        {!open && beforeObj && afterObj && (
          <span className="ml-auto text-gate-gold">
            {allKeys.filter(k => JSON.stringify(beforeObj![k]) !== JSON.stringify(afterObj![k])).length} field{allKeys.filter(k => JSON.stringify(beforeObj![k]) !== JSON.stringify(afterObj![k])).length !== 1 ? 's' : ''} changed
          </span>
        )}
      </button>
      {open && beforeObj && afterObj && (
        <div className="divide-y divide-monsoon/30 text-[10px]">
          {allKeys.map(key => {
            const bVal = JSON.stringify(beforeObj![key]);
            const aVal = JSON.stringify(afterObj![key]);
            const changed = bVal !== aVal;
            return (
              <div key={key} className={`grid grid-cols-[80px_1fr_1fr] gap-2 px-3 py-1.5 ${changed ? 'bg-amber-500/5' : ''}`}>
                <span className="text-sandstone/50 font-mono truncate">{key}</span>
                <span className={`font-mono truncate ${changed ? 'text-rose-400 line-through' : 'text-sandstone/50'}`}>
                  {changed ? (beforeObj![key] !== null && beforeObj![key] !== undefined ? String(beforeObj![key]) : '—') : String(beforeObj![key] ?? '—')}
                </span>
                <span className={`font-mono truncate ${changed ? 'text-emerald-400' : 'text-sandstone/50'}`}>
                  {changed ? (afterObj![key] !== null && afterObj![key] !== undefined ? String(afterObj![key]) : '—') : String(afterObj![key] ?? '—')}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {open && (!beforeObj || !afterObj) && (
        <div className="px-3 py-2 text-[10px] text-sandstone/50 space-y-1">
          {before && <div><span className="text-sandstone/60 font-medium">Before:</span> <span className="font-mono text-rose-400/70">{before}</span></div>}
          {after && <div><span className="text-sandstone/60 font-medium">After:</span> <span className="font-mono text-emerald-400/70">{after}</span></div>}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

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
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetch(page); }, [page, action]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetch(1); }, 300);
    return () => clearTimeout(t);
  }, [userEmail]);

  const totalPages = data ? Math.ceil(data.totalCount / data.pageSize) : 0;

  return (
    <div className="space-y-4">
      {/* -------- Title -------- */}
      <h1 className="font-display text-xl text-paper flex items-center gap-2">
        <History className="w-5 h-5 text-gate-gold" /> Audit Log
      </h1>

      {/* -------- Filters -------- */}
      <div className="flex flex-wrap gap-2.5">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-harbour border border-monsoon/50 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-sandstone/50 shrink-0" />
          <input
            value={userEmail}
            onChange={e => setUserEmail(e.target.value)}
            placeholder="Filter by actor email..."
            className="bg-transparent text-xs text-paper/80 focus:outline-none w-full placeholder:text-sandstone/30"
          />
        </div>
        <input
          value={action}
          onChange={e => setAction(e.target.value)}
          placeholder="Filter by action..."
          className="bg-harbour border border-monsoon/50 rounded-lg px-3 py-2 text-xs text-paper/80 focus:outline-none focus:border-gate-gold/60 placeholder:text-sandstone/30 min-w-[140px]"
        />
      </div>

      {/* -------- Content -------- */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gate-gold border-t-transparent" />
        </div>
      ) : !data ? (
        <div className="text-sandstone/60 text-sm text-center py-20">Could not load audit logs.</div>
      ) : (
        <>
          <div className="text-xs text-sandstone/50">{data.totalCount} log entr{data.totalCount !== 1 ? 'ies' : 'y'}</div>

          {/* Log entries as a compact list */}
          <div className="space-y-2">
            {data.items.map(log => (
              <div key={log.id} className="bg-harbour border border-monsoon/50 rounded-xl p-3.5 hover:border-monsoon-light/60 transition-colors">
                <div className="flex items-start gap-3">
                  {/* Actor avatar */}
                  <div className="w-7 h-7 rounded-full bg-gate-gold/10 border border-gate-gold/20 flex items-center justify-center shrink-0 text-gate-gold text-xs font-bold">
                    {log.userEmail ? log.userEmail.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Top row: action badge + timestamp + actor */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${actionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="text-[10px] text-sandstone/50 font-mono" title={formatTimestamp(log.createdAt)}>
                        {formatRelative(log.createdAt)}
                      </span>
                      {log.userEmail && (
                        <span className="text-[10px] text-sandstone/50 flex items-center gap-1">
                          <User className="w-3 h-3" /> {log.userEmail}
                        </span>
                      )}
                      {log.actorRole && (
                        <span className="text-[10px] text-sandstone/40 bg-monsoon/20 px-1.5 py-0.5 rounded border border-monsoon/30">
                          {log.actorRole}
                        </span>
                      )}
                      {log.ipAddress && (
                        <span className="text-[10px] text-sandstone/30 font-mono">({log.ipAddress})</span>
                      )}
                    </div>

                    {/* Details / description */}
                    <div className="text-xs text-sandstone/70 leading-relaxed">
                      {log.details}
                    </div>

                    {/* Entity reference */}
                    {(log.entityType || log.entityId) && (
                      <div className="text-[10px] text-sandstone/50 flex items-center gap-2">
                        <FileText className="w-3 h-3" />
                        {log.entityType && <span>{log.entityType}</span>}
                        {log.entityId && <span className="font-mono text-sandstone/40">ID: {log.entityId.slice(0, 12)}</span>}
                      </div>
                    )}

                    {/* Before / After diff */}
                    {(log.beforeData || log.afterData) && (
                      <DiffViewer
                        before={log.beforeData || '{}'}
                        after={log.afterData || '{}'}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {data.items.length === 0 && (
              <div className="text-sandstone/50 text-xs text-center py-10 border border-dashed border-monsoon/40 rounded-xl">
                No log entries match your filters.
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-md border border-monsoon/50 text-sandstone/50 hover:text-paper hover:border-monsoon-light transition-colors disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-md text-xs font-medium transition-colors ${
                    page === p
                      ? 'bg-gate-gold/15 text-gate-gold border border-gate-gold/30'
                      : 'bg-sea-deep border border-monsoon/50 text-sandstone/50 hover:text-sandstone hover:border-monsoon-light'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-md border border-monsoon/50 text-sandstone/50 hover:text-paper hover:border-monsoon-light transition-colors disabled:opacity-30"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
