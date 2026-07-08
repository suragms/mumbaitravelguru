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
  return <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500" /></div>}>
    <FlightConfirmContent />
  </Suspense>;
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-lg w-full metal-card rounded-2xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h1>
          <p className="text-slate-400 mb-6">Your flight has been booked successfully.</p>

          <div className="bg-slate-900 rounded-xl p-5 mb-6 space-y-3 text-left">
            <div className="flex justify-between">
              <span className="text-slate-400">PNR Number</span>
              <span className="text-white font-mono font-bold">{result.pnrNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status</span>
              <span className="text-green-400">{result.ticketStatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Booking ID</span>
              <span className="text-white text-sm">{result.bookingId?.slice(0, 8)}...</span>
            </div>
            <div className="border-t border-slate-700 pt-3 mt-3">
              <Link href={result.eTicketUrl || '#'} className="flex items-center justify-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors">
                <Download className="w-4 h-4" /> Download E-Ticket
              </Link>
            </div>
          </div>

          <p className="text-xs text-slate-500 mb-6">Your e-ticket has been issued. Please check your email for the booking confirmation.</p>

          <div className="flex gap-3">
            <Link href="/" className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium transition-colors">
              Go to Dashboard
            </Link>
            <button onClick={() => window.print()} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-medium transition-colors">
              Print Ticket
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-indigo-400 font-bold">MumbaiTravelGuru</Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300 text-sm">Payment</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {step === 'confirming' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500 mb-4" />
            <p className="text-slate-300 text-lg">Confirming your booking...</p>
            <p className="text-slate-500 text-sm mt-2">Please wait while we process your payment and issue the ticket.</p>
          </div>
        )}

        {(step === 'payment' || step === 'error') && (
          <div className="max-w-md mx-auto space-y-6">
            <h1 className="text-xl font-bold text-white">Complete Payment</h1>

            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {priceInfo.lockedPrice && (
              <div className="metal-card rounded-xl p-5">
                <p className="text-sm text-slate-400 mb-1">Total Amount</p>
                <p className="text-3xl font-bold text-indigo-400">₹{Number(priceInfo.lockedPrice).toLocaleString('en-IN')}</p>
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Expires at {new Date(priceInfo.expiresAtUtc).toLocaleTimeString()}
                </p>
              </div>
            )}

            <div className="metal-card rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-400" /> Payment Method
              </h2>
              <div className="space-y-2">
                {['UPI', 'CreditCard', 'DebitCard', 'NetBanking', 'Wallet'].map(m => (
                  <label key={m} className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-700 cursor-pointer hover:border-indigo-500 transition-colors">
                    <input type="radio" name="payment" value={m} checked={paymentMethod === m} onChange={e => setPaymentMethod(e.target.value)}
                      className="accent-indigo-500" />
                    <span className="text-sm text-slate-200">{m === 'CreditCard' ? 'Credit Card' : m === 'DebitCard' ? 'Debit Card' : m === 'NetBanking' ? 'Net Banking' : m}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="metal-card rounded-xl p-4 flex items-start gap-3 text-sm text-slate-400">
              <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium mb-1">Price Guarantee</p>
                <p>The price has been re-validated server-side. The amount shown is the final locked fare.</p>
              </div>
            </div>

            <button onClick={handlePay}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-semibold transition-colors text-lg">
              Pay ₹{priceInfo.lockedPrice ? Number(priceInfo.lockedPrice).toLocaleString('en-IN') : '...'}
            </button>

            <p className="text-xs text-slate-500 text-center">By clicking Pay, you agree to the fare rules and cancellation policy.</p>
          </div>
        )}
      </main>
    </div>
  );
}
