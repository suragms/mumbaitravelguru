'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import {
  Search, ExternalLink, Undo2, Send, Ban, AlertTriangle,
  Plane, Hotel, Bus, Compass, ChevronLeft, ChevronRight,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BookingItem {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  bookingType: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  confirmationNumber?: string;
  createdAt: string;
  needsReconciliation: boolean;
}

interface BookingsResult {
  items: BookingItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

/* ------------------------------------------------------------------ */
/*  Status helper — always returns color + text label                  */
/* ------------------------------------------------------------------ */

interface StatusStyle { label: string; classes: string }

function statusStyle(s: string): StatusStyle {
  switch (s) {
    case 'Confirmed': return { label: 'Confirmed', classes: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' };
    case 'Pending': return { label: 'Pending', classes: 'text-amber-400 bg-amber-500/10 border-amber-500/25' };
    case 'Cancelled': return { label: 'Cancelled', classes: 'text-sandstone/50 bg-monsoon/30 border-monsoon/50' };
    case 'Failed': return { label: 'Failed', classes: 'text-rose-400 bg-rose-500/10 border-rose-500/25' };
    case 'Completed': return { label: 'Completed', classes: 'text-gate-gold bg-gate-gold/10 border-gate-gold/25' };
    default: return { label: s, classes: 'text-sandstone/50 bg-monsoon/30 border-monsoon/50' };
  }
}

function verticalIcon(type: string) {
  switch (type) {
    case 'Flight': return <Plane className="w-3.5 h-3.5" />;
    case 'Hotel': return <Hotel className="w-3.5 h-3.5" />;
    case 'Bus': return <Bus className="w-3.5 h-3.5" />;
    case 'Package': return <Compass className="w-3.5 h-3.5" />;
    default: return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Action helpers                                                     */
/* ------------------------------------------------------------------ */

async function doCancel(id: string, onDone: () => void) {
  if (!confirm('Cancel this booking? Refunds will be processed.')) return;
  try {
    await apiRequest(`/api/v1/admin/bookings/${id}/cancel`, { method: 'POST', body: '{}' });
    onDone();
  } catch { /* silent */ }
}

async function doRefund(id: string, onDone: () => void) {
  if (!confirm('Issue a refund for this booking?')) return;
  try {
    await apiRequest(`/api/v1/admin/bookings/${id}/refund`, { method: 'POST', body: '{}' });
    onDone();
  } catch { /* silent */ }
}

async function doResendVoucher(id: string, onDone: () => void) {
  if (!confirm('Resend voucher to the customer?')) return;
  try {
    await apiRequest(`/api/v1/admin/bookings/${id}/resend-voucher`, { method: 'POST' });
    onDone();
  } catch { /* silent */ }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminBookingsPage() {
  const router = useRouter();
  const [data, setData] = useState<BookingsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bookingType, setBookingType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const fetch = async (p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (bookingType) params.set('bookingType', bookingType);
      if (status) params.set('status', status);
      params.set('page', String(p));
      const d = await apiRequest<BookingsResult>(`/api/v1/admin/bookings?${params}`);
      setData(d);
    } catch { /* silent */ }
    setLoading(false);
    setActionBusy(null);
  };

  useEffect(() => { fetch(page); }, [page, bookingType, status]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetch(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const totalPages = data ? Math.ceil(data.totalCount / data.pageSize) : 0;

  return (
    <div className="space-y-4">
      {/* -------- Title -------- */}
      <h1 className="font-display text-xl text-paper">Bookings</h1>

      {/* -------- Filters -------- */}
      <div className="flex flex-wrap gap-2.5">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-harbour border border-monsoon/50 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-sandstone/50 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by ID, email, confirmation..."
            className="bg-transparent text-xs text-paper/80 focus:outline-none w-full placeholder:text-sandstone/30"
          />
        </div>
        <select
          value={bookingType}
          onChange={e => { setBookingType(e.target.value); setPage(1); }}
          className="bg-harbour border border-monsoon/50 rounded-lg px-3 py-2 text-xs text-paper/80 focus:outline-none focus:border-gate-gold/60"
        >
          <option value="">All Verticals</option>
          <option value="Flight">Flight</option>
          <option value="Hotel">Hotel</option>
          <option value="Bus">Bus</option>
          <option value="Package">Package</option>
        </select>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="bg-harbour border border-monsoon/50 rounded-lg px-3 py-2 text-xs text-paper/80 focus:outline-none focus:border-gate-gold/60"
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Completed">Completed</option>
          <option value="Failed">Failed</option>
        </select>
      </div>

      {/* -------- Content -------- */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gate-gold border-t-transparent" />
        </div>
      ) : !data ? (
        <div className="text-sandstone/60 text-sm text-center py-20">Could not load bookings.</div>
      ) : (
        <>
          {/* Result count */}
          <div className="text-xs text-sandstone/50">
            {data.totalCount} booking{data.totalCount !== 1 ? 's' : ''} found
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-monsoon/50">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-harbour text-[10px] text-sandstone/50 uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Booking</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Confirmation</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-monsoon/30 text-xs">
                {data.items.map(b => {
                  const st = statusStyle(b.status);
                  return (
                    <tr key={b.id} className="hover:bg-gate-gold/5 transition-colors">
                      {/* Booking ID */}
                      <td className="py-2.5 px-3">
                        <Link
                          href={`/admin/bookings/${b.id}`}
                          className="font-mono text-xs text-gate-gold hover:text-gate-gold-dim transition-colors"
                        >
                          {b.id.slice(0, 8)}
                        </Link>
                      </td>
                      {/* User */}
                      <td className="py-2.5 px-3">
                        <div className="text-paper/80 text-xs font-medium">{b.userName}</div>
                        <div className="text-sandstone/50 text-[10px]">{b.userEmail}</div>
                      </td>
                      {/* Type */}
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 text-sandstone/60 text-xs">
                          {verticalIcon(b.bookingType)} {b.bookingType}
                        </span>
                      </td>
                      {/* Status — color + text label */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${st.classes}`}>
                            {st.label}
                          </span>
                          {b.needsReconciliation && (
                            <span className="relative" title="Needs reconciliation"><AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" /></span>
                          )}
                        </div>
                      </td>
                      {/* Amount */}
                      <td className="py-2.5 px-3">
                        <div className="font-mono text-xs text-paper/80">{fmt(b.totalAmount)}</div>
                        {b.paidAmount > 0 && (
                          <div className="text-sandstone/50 text-[10px]">Paid: {fmt(b.paidAmount)}</div>
                        )}
                      </td>
                      {/* Confirmation */}
                      <td className="py-2.5 px-3 text-[10px] text-sandstone/50 font-mono">
                        {b.confirmationNumber || '—'}
                      </td>
                      {/* Date */}
                      <td className="py-2.5 px-3 text-[10px] text-sandstone/60 whitespace-nowrap">
                        {formatDate(b.createdAt)}
                      </td>
                      {/* Row actions */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/bookings/${b.id}`}
                            className="p-1.5 rounded-md border border-monsoon/50 text-sandstone/50 hover:text-paper hover:border-monsoon-light transition-colors"
                            title="View details"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          {b.status === 'Confirmed' && (
                            <>
                              <button
                                onClick={async () => { setActionBusy(b.id); await doCancel(b.id, () => fetch(page)); }}
                                disabled={actionBusy === b.id}
                                className="p-1.5 rounded-md border border-rose-500/30 text-rose-400/70 hover:text-rose-400 hover:border-rose-500/50 transition-colors disabled:opacity-40"
                                title="Cancel & refund"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={async () => { setActionBusy(b.id); await doResendVoucher(b.id, () => fetch(page)); }}
                                disabled={actionBusy === b.id}
                                className="p-1.5 rounded-md border border-gate-gold/30 text-gate-gold/70 hover:text-gate-gold hover:border-gate-gold/50 transition-colors disabled:opacity-40"
                                title="Resend voucher"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {b.status === 'Pending' && (
                            <button
                              onClick={async () => { setActionBusy(b.id); await doRefund(b.id, () => fetch(page)); }}
                              disabled={actionBusy === b.id}
                              className="p-1.5 rounded-md border border-amber-500/30 text-amber-400/70 hover:text-amber-400 hover:border-amber-500/50 transition-colors disabled:opacity-40"
                              title="Issue refund"
                            >
                              <Undo2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
