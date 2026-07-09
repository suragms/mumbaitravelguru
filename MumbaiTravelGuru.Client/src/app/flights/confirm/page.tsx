'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { CheckCircle, AlertCircle, CreditCard, Plane, Download, Clock, Shield } from 'lucide-react';

interface ConfirmResult {
  succeeded: boolean;
  error?: string;
  bookingId?: string;
  confirmationNumber?: string;
  pnrNumber?: string;
  ticketStatus?: string;
  eTicketUrl?: string;
}

export default function FlightConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-sea-deep flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gate-gold border-t-transparent" />
        </div>
      }
    >
      <FlightConfirmContent />
    </Suspense>
  );
}

function FlightConfirmContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const lockId = searchParams.get('lockId') || '';
  const bookingId = searchParams.get('bookingId') || '';

  const [step, setStep] = useState<'payment' | 'confirming' | 'done' | 'error'>('payment');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [result, setResult] = useState<ConfirmResult | null>(null);
  const [error, setError] = useState('');

  const handlePay = async () => {
    setStep('confirming');
    setError('');
    try {
      const res = await apiRequest<ConfirmResult>('/api/v1/bookings/flight/confirm', {
        method: 'POST',
        body: JSON.stringify({ lockId, paymentMethod, paymentTransactionId: `TXN-${Date.now()}` }),
      });
      if (res.succeeded) {
        setResult(res);
        setStep('done');
      } else {
        setError(res.error || 'Confirmation failed');
        setStep('error');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setStep('error');
    }
  };

  const priceInfo = typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem('flight_lock') || '{}') : {};

  if (step === 'done' && result) {
    return (
      <div className="min-h-dvh bg-sea-deep flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-harbour border border-monsoon/60 rounded-2xl p-8 text-center animate-fade-in">
          <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-paper mb-2 font-display">Booking Confirmed!</h1>
          <p className="text-sm text-sandstone/70 mb-6">Your flight has been booked successfully.</p>

          <div className="bg-sea-deep border border-monsoon/50 rounded-xl p-5 mb-6 space-y-3 text-left">
            <div className="flex justify-between">
              <span className="text-xs text-sandstone/60">PNR Number</span>
              <span className="text-paper font-mono font-bold text-sm">{result.pnrNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-sandstone/60">Status</span>
              <span className="text-emerald-400 text-xs font-medium">{result.ticketStatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-sandstone/60">Booking ID</span>
              <span className="text-paper font-mono text-xs">{result.bookingId?.slice(0, 8)}...</span>
            </div>
            <div className="border-t border-monsoon/40 pt-3 mt-3">
              <Link href={result.eTicketUrl || '#'} className="flex items-center justify-center gap-2 text-gate-gold hover:text-gate-gold-dim text-sm font-medium transition-colors">
                <Download className="w-4 h-4" /> Download E-Ticket
              </Link>
            </div>
          </div>

          <p className="text-xs text-sandstone/50 mb-6">Your e-ticket has been issued. Check your email for confirmation.</p>

          <div className="flex gap-3">
            <Link href="/" className="flex-1 bg-monsoon hover:bg-monsoon-light text-paper py-3 rounded-xl font-medium text-sm transition-colors">
              Go to Dashboard
            </Link>
            <button onClick={() => window.print()} className="flex-1 bg-gate-gold hover:bg-gate-gold-dim text-sea-deep py-3 rounded-xl font-bold text-sm transition-colors">
              Print Ticket
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-sea-deep">
      <header className="sticky top-0 z-30 border-b border-monsoon/60 bg-sea-deep/85 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-gate-gold/15 p-1 rounded-lg">
              <Plane className="w-4 h-4 text-gate-gold" />
            </div>
            <span className="font-display text-sm text-paper tracking-wide">Mumbai Travel Guru</span>
          </Link>
          <span className="text-monsoon-light text-xs">/</span>
          <span className="text-sandstone/60 text-xs">Payment</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {step === 'confirming' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gate-gold border-t-transparent mb-4" />
            <p className="text-paper/80 text-sm font-medium">Confirming your booking...</p>
              <p className="text-sandstone/50 text-xs mt-2">Confirming your payment and issuing your ticket.</p>
          </div>
        )}

        {(step === 'payment' || step === 'error') && (
          <div className="max-w-md mx-auto space-y-5">
            <h1 className="font-display text-xl text-paper">Complete Payment</h1>

            {error && (
              <div className="bg-gate-gold/10 border border-gate-gold/20 text-gate-gold px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {priceInfo.lockedPrice && (
              <div className="bg-harbour border border-monsoon/50 rounded-xl p-5">
                <p className="text-xs text-sandstone/60 mb-1">Total Amount</p>
                <p className="text-3xl font-bold font-mono text-gate-gold">₹{Number(priceInfo.lockedPrice).toLocaleString('en-IN')}</p>
                <p className="text-xs text-sandstone/50 mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Expires at {new Date(priceInfo.expiresAtUtc).toLocaleTimeString()}
                </p>
              </div>
            )}

            <div className="bg-harbour border border-monsoon/50 rounded-xl p-5">
              <h2 className="text-xs font-semibold text-paper/80 mb-3 flex items-center gap-2 uppercase tracking-wider">
                <CreditCard className="w-3.5 h-3.5 text-gate-gold" /> Payment Method
              </h2>
              <div className="space-y-2">
                {['UPI', 'CreditCard', 'DebitCard', 'NetBanking', 'Wallet'].map(m => (
                  <label key={m} className="flex items-center gap-3 p-3 rounded-lg bg-sea-deep border border-monsoon/50 cursor-pointer hover:border-gate-gold/40 transition-colors">
                    <input
                      type="radio" name="payment" value={m}
                      checked={paymentMethod === m}
                      onChange={e => setPaymentMethod(e.target.value)}
                      className="accent-gate-gold w-4 h-4"
                    />
                    <span className="text-xs text-sandstone/70">
                      {m === 'CreditCard' ? 'Credit Card' : m === 'DebitCard' ? 'Debit Card' : m === 'NetBanking' ? 'Net Banking' : m}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-harbour border border-monsoon/50 rounded-xl p-4 flex items-start gap-3 text-xs text-sandstone/60">
              <Shield className="w-4 h-4 text-gate-gold shrink-0 mt-0.5" />
              <div>
                <p className="text-paper/80 font-medium text-xs mb-1">Price Guarantee</p>
                <p>This fare is locked and guaranteed for your booking.</p>
              </div>
            </div>

            <button onClick={handlePay}
              className="w-full bg-gate-gold hover:bg-gate-gold-dim text-sea-deep py-3 rounded-xl font-bold text-sm transition-colors">
              Pay ₹{priceInfo.lockedPrice ? Number(priceInfo.lockedPrice).toLocaleString('en-IN') : '...'}
            </button>

            <p className="text-xs text-sandstone/50 text-center">By clicking Pay, you agree to the fare rules and cancellation policy.</p>
          </div>
        )}
      </main>
    </div>
  );
}
