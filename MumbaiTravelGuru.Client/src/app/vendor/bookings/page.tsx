'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { ShoppingBag, Search, X, ExternalLink } from 'lucide-react';

interface VendorBookingItem {
  id: string; vendorListingId: string; listingTitle: string; bookingId: string;
  guestName: string | null; guestContact: string | null; guestEmail: string | null;
  checkIn: string | null; checkOut: string | null; units: number;
  totalAmount: number; commissionAmount: number; netAmount: number;
  currency: string; status: string; createdAt: string;
}

interface VendorBookingListResult {
  items: VendorBookingItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

function fmtDate(d: string | null) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusColor(s: string) {
  switch (s) {
    case 'Confirmed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    case 'Pending': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    case 'Cancelled': return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    case 'Completed': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
    default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  }
}

export default function VendorBookingsPage() {
  const [data, setData] = useState<VendorBookingListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const fetch = async (p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      params.set('page', String(p));
      const d = await apiRequest<VendorBookingListResult>(`/api/v1/vendor/bookings?${params}`);
      setData(d);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetch(page); }, [page, status]);
  useEffect(() => { const t = setTimeout(() => { setPage(1); fetch(1); }, 300); return () => clearTimeout(t); }, [search]);

  const totalPages = data ? Math.ceil(data.totalCount / data.pageSize) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <ShoppingBag className="w-6 h-6 text-emerald-400" /> Bookings
      </h1>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search guest or booking ID..." className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X className="w-3 h-3" /></button>}
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-500">
          <option value="">All Status</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/80 border-b border-slate-800 text-xs text-slate-400 uppercase font-semibold tracking-wider">
              <th className="py-3 px-4">Listing</th>
              <th className="py-3 px-4">Guest</th>
              <th className="py-3 px-4">Dates</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Commission</th>
              <th className="py-3 px-4">Net</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-sm">
            {loading ? (
              <tr><td colSpan={8} className="py-12 text-center text-slate-500">Loading...</td></tr>
            ) : data?.items.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-slate-500">No bookings found.</td></tr>
            ) : data?.items.map(item => (
              <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                <td className="py-3 px-4">
                  <div className="text-white font-medium text-sm">{item.listingTitle}</div>
                  <div className="text-xs text-slate-500">{item.units} unit(s)</div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-white text-sm">{item.guestName || 'N/A'}</div>
                  {item.guestContact && <div className="text-xs text-slate-500">{item.guestContact}</div>}
                </td>
                <td className="py-3 px-4 text-xs text-slate-400">
                  <div>{fmtDate(item.checkIn)}</div>
                  <div>{fmtDate(item.checkOut)}</div>
                </td>
                <td className="py-3 px-4 font-mono text-sm text-white">₹{item.totalAmount.toLocaleString('en-IN')}</td>
                <td className="py-3 px-4 font-mono text-sm text-rose-400">-₹{item.commissionAmount.toLocaleString('en-IN')}</td>
                <td className="py-3 px-4 font-mono text-sm text-emerald-400">₹{item.netAmount.toLocaleString('en-IN')}</td>
                <td className="py-3 px-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${statusColor(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-xs text-slate-500">{fmtDate(item.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
