'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import {
  ArrowLeft, AlertTriangle, CreditCard, Undo2, Send, Ban,
  User, Calendar, DollarSign, CheckCircle, XCircle, RefreshCw,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatDateTime(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    Confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    Pending: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    Cancelled: 'bg-monsoon/30 text-sandstone/50 border-monsoon/50',
    Failed: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
    Completed: 'bg-gate-gold/10 text-gate-gold border-gate-gold/25',
  };
  return map[status] || 'bg-monsoon/30 text-sandstone/50 border-monsoon/50';
}

function paymentStatusBadge(status: string) {
  const map: Record<string, string> = {
    Captured: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    Authorized: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    Failed: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
    Refunded: 'bg-gate-gold/10 text-gate-gold border-gate-gold/25',
  };
  return map[status] || 'bg-monsoon/30 text-sandstone/50 border-monsoon/50';
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function BookingDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gate-gold border-t-transparent" />
        </div>
      }
    >
      <Content />
    </Suspense>
  );
}

function Content() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const reload = () => {
    if (!id) return;
    apiRequest<BookingDetail>(`/api/v1/admin/bookings/${id}`)
      .then(setData).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, [id]);

  const showResult = (type: 'success' | 'error', message: string) => {
    setActionResult({ type, message });
    setTimeout(() => setActionResult(null), 6000);
  };

  const doCancel = async () => {
    if (!confirm('Cancel this booking? Refunds will be processed.')) return;
    setActionLoading('cancel');
    setActionResult(null);
    try {
      const r = await apiRequest<{ succeeded: boolean; error?: string; refundAmount: number; refundStatus: string }>(
        `/api/v1/admin/bookings/${id}/cancel`, { method: 'POST', body: '{}' });
      if (r.succeeded) {
        showResult('success', `Cancelled. Refund: ${fmt(r.refundAmount)} (${r.refundStatus})`);
        reload();
      } else {
        showResult('error', r.error || 'Cancel failed');
      }
    } catch (err: unknown) {
      showResult('error', err instanceof Error ? err.message : 'Cancel failed');
    }
    setActionLoading('');
  };

  const doRefund = async () => {
    if (!confirm('Issue a refund for this booking?')) return;
    setActionLoading('refund');
    setActionResult(null);
    try {
      const r = await apiRequest<{ succeeded: boolean; error?: string; refundAmount: number; refundStatus: string }>(
        `/api/v1/admin/bookings/${id}/refund`, { method: 'POST', body: '{}' });
      if (r.succeeded) {
        showResult('success', `Refund issued: ${fmt(r.refundAmount)} (${r.refundStatus})`);
        reload();
      } else {
        showResult('error', r.error || 'Refund failed');
      }
    } catch (err: unknown) {
      showResult('error', err instanceof Error ? err.message : 'Refund failed');
    }
    setActionLoading('');
  };

  const doResendVoucher = async () => {
    setActionLoading('voucher');
    setActionResult(null);
    try {
      const r = await apiRequest<{ succeeded: boolean; error?: string }>(
        `/api/v1/admin/bookings/${id}/resend-voucher`, { method: 'POST' });
      if (r.succeeded) {
        showResult('success', 'Voucher resent to customer.');
      } else {
        showResult('error', r.error || 'Resend failed');
      }
    } catch (err: unknown) {
      showResult('error', err instanceof Error ? err.message : 'Resend failed');
    }
    setActionLoading('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gate-gold border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-sandstone/60 text-sm text-center py-20">Booking not found.</div>;
  }

  return (
    <div className="space-y-5 max-w-5xl">
      {/* -------- Header -------- */}
      <div className="flex items-center gap-3">
        <Link href="/admin/bookings" className="text-sandstone/60 hover:text-paper transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display text-xl text-paper">
          Booking <span className="font-mono text-gate-gold">#{data.id.slice(0, 8)}</span>
        </h1>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge(data.status)}`}>
          {data.status}
        </span>
        {data.needsReconciliation && (
          <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" /> Needs Reconciliation
          </span>
        )}
      </div>

      {/* -------- Notification -------- */}
      {actionResult && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-xs ${
          actionResult.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
        }`}>
          {actionResult.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 shrink-0" />
          )}
          {actionResult.message}
        </div>
      )}

      {/* -------- 3-column info grid -------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Booking Info */}
        <section className="bg-harbour border border-monsoon/50 rounded-xl p-4">
          <h2 className="text-xs font-semibold text-paper/80 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-gate-gold" /> Booking Info
          </h2>
          <dl className="space-y-1.5 text-xs">
            <div className="flex justify-between"><dt className="text-sandstone/60">Type</dt><dd className="text-paper/80 font-medium">{data.bookingType}</dd></div>
            <div className="flex justify-between"><dt className="text-sandstone/60">Status</dt><dd className={`text-xs font-semibold ${data.status === 'Confirmed' ? 'text-emerald-400' : data.status === 'Cancelled' ? 'text-sandstone/50' : data.status === 'Failed' ? 'text-rose-400' : 'text-paper/80'}`}>{data.status}</dd></div>
            <div className="flex justify-between"><dt className="text-sandstone/60">Total</dt><dd className="font-mono text-paper/80">{fmt(data.totalAmount)}</dd></div>
            <div className="flex justify-between"><dt className="text-sandstone/60">Paid</dt><dd className="font-mono text-paper/80">{fmt(data.paidAmount)}</dd></div>
            <div className="flex justify-between"><dt className="text-sandstone/60">Confirmation</dt><dd className="font-mono text-xs text-paper/80">{data.confirmationNumber || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-sandstone/60">Created</dt><dd className="text-paper/80">{formatDateTime(data.createdAt)}</dd></div>
            {data.completedAt && <div className="flex justify-between"><dt className="text-sandstone/60">Completed</dt><dd className="text-paper/80">{formatDateTime(data.completedAt)}</dd></div>}
            {data.cancelledAt && <div className="flex justify-between"><dt className="text-sandstone/60">Cancelled</dt><dd className="text-paper/80">{formatDateTime(data.cancelledAt)}</dd></div>}
            {data.cancellationReason && <div className="flex justify-between"><dt className="text-sandstone/60">Reason</dt><dd className="text-paper/80">{data.cancellationReason}</dd></div>}
          </dl>
        </section>

        {/* User */}
        <section className="bg-harbour border border-monsoon/50 rounded-xl p-4">
          <h2 className="text-xs font-semibold text-paper/80 uppercase tracking-wider mb-3 flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-gate-gold" /> User
          </h2>
          <dl className="space-y-1.5 text-xs">
            <div className="flex justify-between"><dt className="text-sandstone/60">Name</dt><dd className="text-paper/80 font-medium">{data.userName}</dd></div>
            <div className="flex justify-between"><dt className="text-sandstone/60">Email</dt><dd className="text-paper/80">{data.userEmail}</dd></div>
            <div className="flex justify-between"><dt className="text-sandstone/60">User ID</dt><dd className="font-mono text-[10px] text-sandstone/50">{data.userId.slice(0, 8)}</dd></div>
          </dl>
        </section>

        {/* Actions */}
        <section className="bg-harbour border border-monsoon/50 rounded-xl p-4">
          <h2 className="text-xs font-semibold text-paper/80 uppercase tracking-wider mb-3 flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-gate-gold" /> Actions
          </h2>
          <div className="flex flex-col gap-2">
            <button
              onClick={doCancel}
              disabled={!!actionLoading || data.status === 'Cancelled'}
              className="flex items-center justify-center gap-2 bg-rose-500/15 hover:bg-rose-500/25 disabled:bg-monsoon/30 text-rose-400 disabled:text-sandstone/50 text-xs font-semibold py-2 px-3 rounded-lg border border-rose-500/25 disabled:border-monsoon/50 transition-colors"
            >
              <Ban className="w-3.5 h-3.5" /> Cancel & Refund
            </button>
            <button
              onClick={doRefund}
              disabled={!!actionLoading}
              className="flex items-center justify-center gap-2 bg-amber-500/15 hover:bg-amber-500/25 disabled:bg-monsoon/30 text-amber-400 disabled:text-sandstone/50 text-xs font-semibold py-2 px-3 rounded-lg border border-amber-500/25 disabled:border-monsoon/50 transition-colors"
            >
              <Undo2 className="w-3.5 h-3.5" /> Issue Refund
            </button>
            <button
              onClick={doResendVoucher}
              disabled={!!actionLoading}
              className="flex items-center justify-center gap-2 bg-gate-gold/15 hover:bg-gate-gold/25 disabled:bg-monsoon/30 text-gate-gold disabled:text-sandstone/50 text-xs font-semibold py-2 px-3 rounded-lg border border-gate-gold/25 disabled:border-monsoon/50 transition-colors"
            >
              <Send className="w-3.5 h-3.5" /> Resend Voucher
            </button>
          </div>
        </section>
      </div>

      {/* -------- Payments + Refunds -------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payments */}
        <section className="bg-harbour border border-monsoon/50 rounded-xl p-4">
          <h2 className="text-xs font-semibold text-paper/80 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5 text-gate-gold" /> Payments
          </h2>
          {data.payments.length === 0 ? (
            <p className="text-xs text-sandstone/50 text-center py-4">No payments recorded.</p>
          ) : (
            <div className="space-y-2">
              {data.payments.map(p => (
                <div key={p.id} className="bg-sea-deep border border-monsoon/50 rounded-lg p-3 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-sandstone/60">Amount</span>
                    <span className="font-mono text-paper/80 font-bold">{fmt(p.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sandstone/60">Method</span>
                    <span className="text-paper/80">{p.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sandstone/60">Status</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${paymentStatusBadge(p.status)}`}>
                      {p.status}
                    </span>
                  </div>
                  {p.gatewayTransactionId && (
                    <div className="flex justify-between">
                      <span className="text-sandstone/60">Gateway Txn</span>
                      <span className="font-mono text-[10px] text-sandstone/50">{p.gatewayTransactionId.slice(0, 16)}...</span>
                    </div>
                  )}
                  {p.processedAt && (
                    <div className="flex justify-between">
                      <span className="text-sandstone/60">Processed</span>
                      <span className="text-sandstone/50 text-[10px]">{formatDateTime(p.processedAt)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Refunds */}
        <section className="bg-harbour border border-monsoon/50 rounded-xl p-4">
          <h2 className="text-xs font-semibold text-paper/80 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Undo2 className="w-3.5 h-3.5 text-amber-400" /> Refunds
          </h2>
          {data.refunds.length === 0 ? (
            <p className="text-xs text-sandstone/50 text-center py-4">No refunds issued.</p>
          ) : (
            <div className="space-y-2">
              {data.refunds.map(r => (
                <div key={r.id} className="bg-sea-deep border border-monsoon/50 rounded-lg p-3 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-sandstone/60">Amount</span>
                    <span className="font-mono text-paper/80 font-bold">{fmt(r.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sandstone/60">Status</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${paymentStatusBadge(r.status)}`}>
                      {r.status}
                    </span>
                  </div>
                  {r.gatewayRefundId && (
                    <div className="flex justify-between">
                      <span className="text-sandstone/60">Gateway Refund</span>
                      <span className="font-mono text-[10px] text-sandstone/50">{r.gatewayRefundId.slice(0, 16)}...</span>
                    </div>
                  )}
                  {r.processedAt && (
                    <div className="flex justify-between">
                      <span className="text-sandstone/60">Processed</span>
                      <span className="text-sandstone/50 text-[10px]">{formatDateTime(r.processedAt)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
