'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { Search, Filter, AlertTriangle, ExternalLink } from 'lucide-react';

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

function fmt(n: number) { return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`; }
function statusColor(s: string) {
  switch (s) {
    case 'Confirmed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    case 'Pending': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    case 'Cancelled': return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    case 'Failed': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    case 'Completed': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
    default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  }
}

export default function AdminBookingsPage() {
  const [data, setData] = useState<BookingsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bookingType, setBookingType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

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
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetch(page); }, [page, bookingType, status]);
  useEffect(() => { const t = setTimeout(() => { setPage(1); fetch(1); }, 300); return () => clearTimeout(t); }, [search]);

  const totalPages = data ? Math.ceil(data.totalCount / data.pageSize) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Bookings</h1>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-slate-800 rounded-xl px-4 py-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID, email, confirmation..."
            className="bg-transparent text-sm text-slate-200 focus:outline-none w-full" />
        </div>
        <select value={bookingType} onChange={e => { setBookingType(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500">
          <option value="">All Types</option>
          <option value="Flight">Flight</option>
          <option value="Hotel">Hotel</option>
          <option value="Package">Package</option>
        </select>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500">
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Completed">Completed</option>
          <option value="Failed">Failed</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500" /></div>
      ) : !data ? (
        <div className="text-slate-400 text-center py-20">Failed to load.</div>
      ) : (
        <>
          <div className="text-sm text-slate-500">{data.totalCount} booking{data.totalCount !== 1 ? 's' : ''} found</div>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900 text-xs text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Booking ID</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Confirmation</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {data.items.map(b => (
                  <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-300">{b.id.slice(0, 8)}</td>
                    <td className="py-3 px-4">
                      <div className="text-white text-xs">{b.userName}</div>
                      <div className="text-slate-500 text-[10px]">{b.userEmail}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{b.bookingType}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColor(b.status)}`}>{b.status}</span>
                        {b.needsReconciliation && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-white font-mono text-xs">{fmt(b.totalAmount)}</div>
                      {b.paidAmount > 0 && <div className="text-slate-500 text-[10px]">Paid: {fmt(b.paidAmount)}</div>}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">{b.confirmationNumber || '-'}</td>
                    <td className="py-3 px-4 text-xs text-slate-400">{new Date(b.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-4">
                      <Link href={`/admin/bookings/${b.id}`}
                        className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1">
                        View <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
