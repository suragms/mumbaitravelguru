'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { Bus, CheckCircle, AlertCircle, ArrowLeft, User, Clock, MapPin, Download } from 'lucide-react';

interface TravelerForm {
  name: string;
  age: string;
  gender: string;
}

interface InitiateResult {
  succeeded: boolean;
  error?: string;
  bookingId?: string;
  fareLockId?: string;
  lockedPrice: number;
  expiresAtUtc: string;
}

interface ConfirmResult {
  succeeded: boolean;
  error?: string;
  bookingId?: string;
  confirmationNumber?: string;
  pnrNumber?: string;
  ticketUrl?: string;
}

function formatTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function priceINR(price: number) {
  return `₹${price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export default function BusConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-sea-deep flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gate-gold border-t-transparent" />
        </div>
      }
    >
      <BusConfirmContent />
    </Suspense>
  );
}

function BusConfirmContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tripId = searchParams.get('tripId') || '';
  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
  const travelDate = searchParams.get('travelDate') || '';
  const seatIds = (searchParams.get('seats') || '').split(',').filter(Boolean);
  const boardingPointId = searchParams.get('boardingPointId') || '';
  const boardingPointName = searchParams.get('boardingPointName') || '';
  const boardingPointTime = searchParams.get('boardingPointTime') || '';
  const droppingPointId = searchParams.get('droppingPointId') || '';
  const droppingPointName = searchParams.get('droppingPointName') || '';
  const droppingPointTime = searchParams.get('droppingPointTime') || '';
  const totalPrice = Number(searchParams.get('totalPrice')) || 0;

  const [travelers, setTravelers] = useState<TravelerForm[]>(
    seatIds.map(() => ({ name: '', age: '', gender: '' }))
  );
  const [step, setStep] = useState<'form' | 'initiating' | 'payment' | 'confirming' | 'done' | 'error'>('form');
  const [error, setError] = useState('');
  const [initResult, setInitResult] = useState<InitiateResult | null>(null);
  const [confirmResult, setConfirmResult] = useState<ConfirmResult | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  const updateTraveler = (idx: number, field: keyof TravelerForm, value: string) => {
    setTravelers(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  useEffect(() => {
    if (!tripId || seatIds.length === 0) router.push('/bus');
  }, [tripId, seatIds, router]);

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('initiating');
    setError('');
    try {
      const result = await apiRequest<InitiateResult>('/api/v1/bus/bookings/initiate', {
        method: 'POST',
        body: JSON.stringify({
          tripId,
          seatIds,
          boardingPointId,
          droppingPointId,
        }),
      });
      if (!result.succeeded) {
        setError(result.error || 'Failed to initiate booking');
        setStep('error');
        return;
      }
      setInitResult(result);
      sessionStorage.setItem('bus_init', JSON.stringify(result));
      setStep('payment');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Initiation failed');
      setStep('error');
    }
  };

  const handleConfirm = async () => {
    setStep('confirming');
    setError('');
    try {
      const result = await apiRequest<ConfirmResult>('/api/v1/bus/bookings/confirm', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: initResult?.bookingId,
          fareLockId: initResult?.fareLockId,
          travelers: travelers.map(t => ({
            name: t.name,
            age: Number(t.age),
            gender: t.gender,
          })),
          paymentMethod,
        }),
      });
      if (result.succeeded) {
        setConfirmResult(result);
        setStep('done');
      } else {
        setError(result.error || 'Confirmation failed');
        setStep('error');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Confirmation failed');
      setStep('error');
    }
  };

  if (step === 'done' && confirmResult) {
    return (
      <div className="min-h-dvh bg-sea-deep flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-harbour border border-monsoon/60 rounded-2xl p-8 text-center animate-fade-in">
          <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-paper mb-2 font-display">Booking Confirmed!</h1>
          <p className="text-sm text-sandstone/70 mb-6">Your bus tickets are booked.</p>

          <div className="bg-sea-deep border border-monsoon/50 rounded-xl p-5 mb-6 space-y-3 text-left">
            <div className="flex justify-between">
              <span className="text-xs text-sandstone/60">PNR Number</span>
              <span className="text-paper font-mono font-bold text-sm">{confirmResult.pnrNumber || confirmResult.confirmationNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-sandstone/60">Booking ID</span>
              <span className="text-paper font-mono text-xs">{confirmResult.bookingId?.slice(0, 12)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-sandstone/60">Route</span>
              <span className="text-paper text-xs font-medium">{origin} &rarr; {destination}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-sandstone/60">Seats</span>
              <span className="text-paper font-mono text-xs">{seatIds.join(', ')}</span>
            </div>
            {confirmResult.ticketUrl && (
              <div className="border-t border-monsoon/40 pt-3 mt-3">
                <Link href={confirmResult.ticketUrl} className="flex items-center justify-center gap-2 text-gate-gold hover:text-gate-gold-dim text-sm font-medium transition-colors">
                  <Download className="w-4 h-4" /> Download Ticket
                </Link>
              </div>
            )}
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
              <Bus className="w-4 h-4 text-gate-gold" />
            </div>
            <span className="font-display text-sm text-paper tracking-wide">Mumbai Travel Guru</span>
          </Link>
          <span className="text-monsoon-light text-xs">/</span>
          <span className="text-sandstone/60 text-xs">{step === 'payment' ? 'Payment' : 'Confirm Booking'}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {(step === 'initiating' || step === 'confirming') && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gate-gold border-t-transparent mb-4" />
            <p className="text-paper/80 text-sm font-medium">
              {step === 'initiating' ? 'Initiating booking...' : 'Confirming your booking...'}
            </p>
            <p className="text-sandstone/50 text-xs mt-2">Processing your booking.</p>
          </div>
        )}

        {(step === 'form' || step === 'error') && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => router.back()} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-sandstone/60 hover:text-paper transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="font-display text-xl text-paper">Complete Booking</h1>
            </div>

            <div className="px-4 py-3 -mx-4 bg-harbour border-b border-monsoon/40 mb-6">
              <p className="text-sm font-medium text-paper">{origin} &rarr; {destination}</p>
              <p className="text-xs text-sandstone/50">{travelDate} &middot; {seatIds.length} seat{seatIds.length > 1 ? 's' : ''} &middot; <span className="font-mono text-gate-gold font-bold">{priceINR(totalPrice)}</span></p>
            </div>

            <div className="bg-harbour border border-monsoon/50 rounded-xl p-4 mb-6 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-xs text-sandstone/50 block">Boarding</span>
                <span className="text-paper font-medium text-xs">{boardingPointName}</span>
                <span className="text-sandstone/50 text-xs block">{formatTime(boardingPointTime)}</span>
              </div>
              <div>
                <span className="text-xs text-sandstone/50 block">Dropping</span>
                <span className="text-paper font-medium text-xs">{droppingPointName}</span>
                <span className="text-sandstone/50 text-xs block">{formatTime(droppingPointTime)}</span>
              </div>
            </div>

            {error && (
              <div className="bg-gate-gold/10 border border-gate-gold/20 text-gate-gold px-4 py-3 rounded-xl mb-4 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleInitiate} className="space-y-5">
              {travelers.map((traveler, idx) => (
                <div key={idx} className="bg-harbour border border-monsoon/50 rounded-xl p-5">
                  <h2 className="text-xs font-semibold text-gate-gold mb-4 flex items-center gap-2 uppercase tracking-wider">
                    <User className="w-3.5 h-3.5" /> Traveler {idx + 1} &mdash; Seat {seatIds[idx]}
                  </h2>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <label className="block text-xs text-sandstone/50 mb-1.5">Name</label>
                      <input value={traveler.name} onChange={e => updateTraveler(idx, 'name', e.target.value)}
                        className="w-full bg-sea-deep border border-monsoon/60 rounded-lg py-2 px-3 text-paper text-xs focus:outline-none focus:border-gate-gold/60 placeholder:text-sandstone/30" required placeholder="Full name" />
                    </div>
                    <div>
                      <label className="block text-xs text-sandstone/50 mb-1.5">Age</label>
                      <input type="number" min={0} max={120} value={traveler.age} onChange={e => updateTraveler(idx, 'age', e.target.value)}
                        className="w-full bg-sea-deep border border-monsoon/60 rounded-lg py-2 px-3 text-paper text-xs focus:outline-none focus:border-gate-gold/60" required />
                    </div>
                    <div>
                      <label className="block text-xs text-sandstone/50 mb-1.5">Gender</label>
                      <select value={traveler.gender} onChange={e => updateTraveler(idx, 'gender', e.target.value)}
                        className="w-full bg-sea-deep border border-monsoon/60 rounded-lg py-2 px-3 text-paper text-xs focus:outline-none focus:border-gate-gold/60">
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              <button type="submit"
                className="w-full bg-gate-gold hover:bg-gate-gold-dim text-sea-deep py-3 rounded-xl font-bold text-sm transition-colors">
                Continue to Payment &mdash; {priceINR(totalPrice)}
              </button>
            </form>
          </>
        )}

        {step === 'payment' && initResult && (
          <div className="max-w-md mx-auto space-y-5">
            <h1 className="font-display text-xl text-paper">Complete Payment</h1>

            {error && (
              <div className="bg-gate-gold/10 border border-gate-gold/20 text-gate-gold px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="bg-harbour border border-monsoon/50 rounded-xl p-5">
              <p className="text-xs text-sandstone/60 mb-1">Total Amount</p>
              <p className="text-3xl font-bold font-mono text-gate-gold">{priceINR(initResult.lockedPrice)}</p>
              {initResult.expiresAtUtc && (
                <p className="text-xs text-sandstone/50 mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Expires at {formatTime(initResult.expiresAtUtc)}
                </p>
              )}
            </div>

            <div className="bg-harbour border border-monsoon/50 rounded-xl p-5">
              <h2 className="text-xs font-semibold text-paper/80 mb-3 uppercase tracking-wider">Payment Method</h2>
              <div className="space-y-2">
                {['UPI', 'CreditCard', 'DebitCard', 'NetBanking', 'Wallet'].map(m => (
                  <label key={m} className="flex items-center gap-3 p-3.5 rounded-lg bg-sea-deep border border-monsoon/50 cursor-pointer hover:border-gate-gold/40 transition-colors">
                    <input type="radio" name="payment" value={m} checked={paymentMethod === m} onChange={e => setPaymentMethod(e.target.value)}
                      className="accent-gate-gold w-4 h-4" />
                    <span className="text-xs text-sandstone/70">{m === 'CreditCard' ? 'Credit Card' : m === 'DebitCard' ? 'Debit Card' : m === 'NetBanking' ? 'Net Banking' : m}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-harbour border border-monsoon/50 rounded-xl p-4 flex items-start gap-3 text-xs text-sandstone/60">
              <MapPin className="w-4 h-4 text-gate-gold shrink-0 mt-0.5" />
              <div>
                <p className="text-paper/80 font-medium text-xs mb-1">Boarding: {boardingPointName}</p>
                <p className="text-xs">Dropping: {droppingPointName}</p>
              </div>
            </div>

            <button onClick={handleConfirm}
              className="w-full bg-gate-gold hover:bg-gate-gold-dim text-sea-deep py-3 rounded-xl font-bold text-sm transition-colors">
              Pay {priceINR(initResult.lockedPrice)}
            </button>

            <p className="text-xs text-sandstone/50 text-center">By clicking Pay, you agree to the cancellation policy and terms of service.</p>
          </div>
        )}
      </main>
    </div>
  );
}
