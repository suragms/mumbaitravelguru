'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { ArrowLeft, AlertTriangle, CreditCard, Undo2, Send } from 'lucide-react';

interface BookingDetail {
  id: string; userId: string; userEmail: string; userName: string;
  bookingType: string; status: string;
  totalAmount: number; paidAmount: number; currency: string;
  confirmationNumber?: string; cancellationReason?: string;
  cancelledAt?: string; completedAt?: string; createdAt: string;
  needsReconciliation: boolean;
  payments: { id: string; method: string; status: string; amount: number; currency: string; gatewayOrderId?: string; gatewayTransactionId?: string; processedAt?: string }[];
  refunds: { id: string; amount: number; status: string; gatewayRefundId?: string; processedAt?: string }[];
}

function fmt(n: number) { return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`; }

export default function BookingDetailPage() {
  return <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500" /></div>}>
    <Content />
  </Suspense>;
}

function Content() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [actionResult, setActionResult] = useState('');

  useEffect(() => {
    if (!id) return;
    apiRequest<BookingDetail>(`/api/v1/admin/bookings/${id}`)
      .then(setData).catch(() => { }).finally(() => setLoading(false));
  }, [id]);

  const doCancel = async () => {
    if (!confirm('Cancel this booking? Refunds will be processed.')) return;
    setActionLoading('cancel');
    setActionResult('');
    try {
      const r = await apiRequest<{ succeeded: boolean; error?: string; refundAmount: number; refundStatus: string }>(
        `/api/v1/admin/bookings/${id}/cancel`, { method: 'POST', body: '{}' });
      setActionResult(r.succeeded ? `Cancelled. Refund: ${fmt(r.refundAmount)} (${r.refundStatus})` : r.error || 'Failed');
      if (r.succeeded) {
        apiRequest<BookingDetail>(`/api/v1/admin/bookings/${id}`).then(setData);
      }
    } catch (err: unknown) {
      setActionResult(err instanceof Error ? err.message : 'Failed');
    }
    setActionLoading('');
  };

  const doResendVoucher = async () => {
    setActionLoading('voucher');
    setActionResult('');
    try {
      const r = await apiRequest<{ succeeded: boolean; error?: string; voucherUrl?: string; bookingType?: string }>(
        `/api/v1/admin/bookings/${id}/resend-voucher`, { method: 'POST' });
      setActionResult(r.succeeded ? `Voucher URL: ${r.voucherUrl || 'N/A'}` : r.error || 'Failed');
    } catch (err: unknown) {
      setActionResult(err instanceof Error ? err.message : 'Failed');
    }
    setActionLoading('');
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500" /></div>;
  if (!data) return <div className="text-slate-400 text-center py-20">Not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/bookings" className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-2xl font-bold text-white">Booking #{data.id.slice(0, 8)}</h1>
        {data.needsReconciliation && (
          <span className="flex items-center gap-1 text-xs text-rose-400 bg-rose-500/10 px-2 py-1 rounded-full border border-rose-500/20">
            <AlertTriangle className="w-3 h-3" /> Needs Reconciliation
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="metal-card rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-white">Booking Info</h2>
          <div className="text-xs space-y-2">
            <div className="flex justify-between"><span className="text-slate-400">Type</span><span className="text-white">{data.bookingType}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Status</span><span className={`text-white ${data.status === 'Confirmed' ? 'text-emerald-400' : ''}`}>{data.status}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Total</span><span className="text-white font-mono">{fmt(data.totalAmount)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Paid</span><span className="text-white font-mono">{fmt(data.paidAmount)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Confirmation</span><span className="text-white text-[10px]">{data.confirmationNumber || '-'}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Created</span><span className="text-white">{new Date(data.createdAt).toLocaleString()}</span></div>
            {data.completedAt && <div className="flex justify-between"><span className="text-slate-400">Completed</span><span className="text-white">{new Date(data.completedAt).toLocaleString()}</span></div>}
            {data.cancelledAt && <div className="flex justify-between"><span className="text-slate-400">Cancelled</span><span className="text-white">{new Date(data.cancelledAt).toLocaleString()}</span></div>}
            {data.cancellationReason && <div className="flex justify-between"><span className="text-slate-400">Reason</span><span className="text-white">{data.cancellationReason}</span></div>}
          </div>
        </div>

        <div className="metal-card rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-white">User</h2>
          <div className="text-xs space-y-2">
            <div className="flex justify-between"><span className="text-slate-400">Name</span><span className="text-white">{data.userName}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Email</span><span className="text-white">{data.userEmail}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">User ID</span><span className="text-white font-mono text-[10px]">{data.userId.slice(0, 8)}</span></div>
          </div>
        </div>

        <div className="metal-card rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-white">Actions</h2>
          <div className="flex flex-col gap-2">
            <button onClick={doCancel} disabled={!!actionLoading}
              className="bg-rose-600 hover:bg-rose-500 disabled:bg-slate-700 text-white text-sm py-2 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
              <Undo2 className="w-4 h-4" /> Cancel & Refund
            </button>
            <button onClick={doResendVoucher} disabled={!!actionLoading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white text-sm py-2 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> Resend Voucher
            </button>
            {actionResult && (
              <div className="text-xs text-slate-300 bg-slate-800 rounded-lg p-2 mt-2">{actionResult}</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="metal-card rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-indigo-400" /> Payments</h2>
          {data.payments.length === 0 ? <div className="text-xs text-slate-500">No payments</div> : (
            <div className="space-y-2">
              {data.payments.map(p => (
                <div key={p.id} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700 text-xs">
                  <div className="flex justify-between mb-1"><span className="text-slate-400">Amount</span><span className="text-white font-mono">{fmt(p.amount)}</span></div>
                  <div className="flex justify-between mb-1"><span className="text-slate-400">Method / Status</span><span className="text-white">{p.method} / {p.status}</span></div>
                  {p.gatewayTransactionId && <div className="flex justify-between"><span className="text-slate-400">Gateway Txn</span><span className="text-white font-mono text-[10px]">{p.gatewayTransactionId.slice(0, 16)}</span></div>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="metal-card rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Undo2 className="w-4 h-4 text-amber-400" /> Refunds</h2>
          {data.refunds.length === 0 ? <div className="text-xs text-slate-500">No refunds</div> : (
            <div className="space-y-2">
              {data.refunds.map(r => (
                <div key={r.id} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700 text-xs">
                  <div className="flex justify-between mb-1"><span className="text-slate-400">Amount</span><span className="text-white font-mono">{fmt(r.amount)}</span></div>
                  <div className="flex justify-between mb-1"><span className="text-slate-400">Status</span><span className="text-white">{r.status}</span></div>
                  {r.gatewayRefundId && <div className="flex justify-between"><span className="text-slate-400">Gateway Refund</span><span className="text-white font-mono text-[10px]">{r.gatewayRefundId.slice(0, 16)}</span></div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
