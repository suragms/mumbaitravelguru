'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { IndianRupee, Calendar, Download, ChevronDown, ChevronUp, TrendingUp, ArrowRight } from 'lucide-react';

interface VendorBookingItem {
  id: string; listingTitle: string; guestName: string | null;
  totalAmount: number; commissionAmount: number; netAmount: number;
  currency: string; status: string; createdAt: string;
}

interface CommissionStatement {
  periodStart: string; periodEnd: string;
  totalBookings: number; totalRevenue: number;
  totalCommission: number; netRevenue: number;
  bookings: VendorBookingItem[];
}

interface VendorPayoutItem {
  id: string; amount: number; commissionAmount: number; netAmount: number;
  currency: string; periodStart: string; periodEnd: string;
  status: string; paidAt: string | null; transactionReference: string | null;
  createdAt: string;
}

interface VendorPayoutListResult {
  items: VendorPayoutItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtCurrency(n: number) { return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`; }

export default function VendorFinancePage() {
  const [tab, setTab] = useState<'statement' | 'payouts'>('statement');
  const [statement, setStatement] = useState<CommissionStatement | null>(null);
  const [payouts, setPayouts] = useState<VendorPayoutListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [payoutPage, setPayoutPage] = useState(1);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);

  useEffect(() => {
    if (tab === 'statement') {
      setLoading(true);
      const [y, m] = month.split('-').map(Number);
      const from = new Date(y, m - 1, 1).toISOString();
      const to = new Date(y, m, 0).toISOString();
      apiRequest<CommissionStatement>(`/api/v1/vendor/commission-statement?from=${from}&to=${to}`)
        .then(d => setStatement(d))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [tab, month]);

  useEffect(() => {
    if (tab === 'payouts') {
      setLoading(true);
      apiRequest<VendorPayoutListResult>(`/api/v1/vendor/payouts?page=${payoutPage}&pageSize=20`)
        .then(d => setPayouts(d))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [tab, payoutPage]);

  const payoutsTotalPages = payouts ? Math.ceil(payouts.totalCount / payouts.pageSize) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <IndianRupee className="w-6 h-6 text-emerald-400" /> Finance
      </h1>

      <div className="flex gap-4 border-b border-slate-800 pb-1">
        <button onClick={() => setTab('statement')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${tab === 'statement' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
          <TrendingUp className="w-4 h-4 inline mr-1.5" /> Commission Statement
        </button>
        <button onClick={() => setTab('payouts')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${tab === 'payouts' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
          <IndianRupee className="w-4 h-4 inline mr-1.5" /> Payout History
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500" /></div>
      ) : tab === 'statement' && statement ? (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input type="month" value={month} onChange={e => setMonth(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="metal-card rounded-2xl p-5">
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Total Revenue</div>
              <div className="text-2xl font-extrabold text-white">{fmtCurrency(statement.totalRevenue)}</div>
              <div className="text-xs text-slate-500 mt-1">{statement.totalBookings} booking(s)</div>
            </div>
            <div className="metal-card rounded-2xl p-5">
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Commission</div>
              <div className="text-2xl font-extrabold text-rose-400">{fmtCurrency(statement.totalCommission)}</div>
              <div className="text-xs text-slate-500 mt-1">{((statement.totalCommission / (statement.totalRevenue || 1)) * 100).toFixed(1)}% rate</div>
            </div>
            <div className="metal-card rounded-2xl p-5">
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Net Revenue</div>
              <div className="text-2xl font-extrabold text-emerald-400">{fmtCurrency(statement.netRevenue)}</div>
              <div className="text-xs text-slate-500 mt-1">Your earnings</div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Booking Details</h3>
            {statement.bookings.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No bookings in this period.</div>
            ) : (
              <div className="space-y-3">
                {statement.bookings.map(b => (
                  <div key={b.id} className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                    <button onClick={() => setExpandedBooking(expandedBooking === b.id ? null : b.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <div className="text-sm font-semibold text-white">{b.listingTitle}</div>
                          <div className="text-xs text-slate-400">{b.guestName || 'N/A'} • {fmtDate(b.createdAt)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-bold text-white">{fmtCurrency(b.totalAmount)}</div>
                          <div className="text-xs text-emerald-400">Net: {fmtCurrency(b.netAmount)}</div>
                        </div>
                        {expandedBooking === b.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>
                    {expandedBooking === b.id && (
                      <div className="px-4 pb-4 grid grid-cols-3 gap-3 text-xs border-t border-slate-800 pt-3">
                        <div><span className="text-slate-500">Booking Amount:</span> <span className="text-white font-mono">{fmtCurrency(b.totalAmount)}</span></div>
                        <div><span className="text-slate-500">Commission:</span> <span className="text-rose-400 font-mono">-{fmtCurrency(b.commissionAmount)}</span></div>
                        <div><span className="text-slate-500">Net:</span> <span className="text-emerald-400 font-mono">{fmtCurrency(b.netAmount)}</span></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : tab === 'payouts' ? (
        <div className="space-y-4">
          {payouts?.items.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <IndianRupee className="w-16 h-16 mx-auto mb-4 text-slate-700" />
              <p className="text-lg font-medium">No payouts yet</p>
              <p className="text-sm mt-1">Payouts are processed at the end of each billing cycle.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-xs text-slate-400 uppercase font-semibold tracking-wider">
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Commission</th>
                    <th className="py-3 px-4">Net Payout</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Paid On</th>
                    <th className="py-3 px-4">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {payouts?.items.map(p => (
                    <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 text-slate-300">
                        {fmtDate(p.periodStart)} - {fmtDate(p.periodEnd)}
                      </td>
                      <td className="py-3 px-4 font-mono text-white">{fmtCurrency(p.amount)}</td>
                      <td className="py-3 px-4 font-mono text-rose-400">-{fmtCurrency(p.commissionAmount)}</td>
                      <td className="py-3 px-4 font-mono text-emerald-400 font-bold">{fmtCurrency(p.netAmount)}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                          p.status === 'Processed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          p.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>{p.status}</span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">{p.paidAt ? fmtDate(p.paidAt) : '-'}</td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-500">{p.transactionReference || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {payoutsTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: payoutsTotalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPayoutPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === payoutPage ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
