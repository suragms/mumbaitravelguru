'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { Bus, CheckCircle, AlertCircle, User, Clock, MapPin, Download } from 'lucide-react';

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
  return <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500" /></div>}>
    <BusConfirmContent />
  </Suspense>;
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-lg w-full metal-card rounded-2xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h1>
          <p className="text-slate-400 mb-6">Your bus tickets have been booked successfully.</p>

          <div className="bg-slate-900 rounded-xl p-5 mb-6 space-y-3 text-left">
            <div className="flex justify-between">
              <span className="text-slate-400">PNR Number</span>
              <span className="text-white font-mono font-bold">{confirmResult.pnrNumber || confirmResult.confirmationNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Booking ID</span>
              <span className="text-white text-sm">{confirmResult.bookingId?.slice(0, 12)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Route</span>
              <span className="text-white text-sm">{origin} → {destination}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Seats</span>
              <span className="text-white text-sm">{seatIds.join(', ')}</span>
            </div>
            {confirmResult.ticketUrl && (
              <div className="border-t border-slate-700 pt-3 mt-3">
                <Link href={confirmResult.ticketUrl} className="flex items-center justify-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors">
                  <Download className="w-4 h-4" /> Download Ticket
                </Link>
              </div>
            )}
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
          <span className="text-slate-300 text-sm">{step === 'payment' ? 'Payment' : 'Confirm Booking'}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {(step === 'initiating' || step === 'confirming') && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500 mb-4" />
            <p className="text-slate-300 text-lg">
              {step === 'initiating' ? 'Initiating booking...' : 'Confirming your booking...'}
            </p>
            <p className="text-slate-500 text-sm mt-2">Please wait while we process your request.</p>
          </div>
        )}

        {(step === 'form' || step === 'error') && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => router.back()} className="text-slate-400 hover:text-white"><span className="w-5 h-5 inline-flex items-center justify-center">←</span></button>
              <h1 className="text-xl font-bold text-white">Complete Booking</h1>
            </div>

            <div className="metal-card rounded-xl p-4 mb-6 flex items-center gap-4">
              <Bus className="w-8 h-8 text-indigo-400" />
              <div className="flex-1">
                <p className="text-white font-medium">{origin} → {destination}</p>
                <p className="text-sm text-slate-400">{travelDate} • {seatIds.length} seat{seatIds.length > 1 ? 's' : ''}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-indigo-400">{priceINR(totalPrice)}</div>
              </div>
            </div>

            <div className="metal-card rounded-xl p-4 mb-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-400 block">Boarding</span>
                <span className="text-white font-medium">{boardingPointName}</span>
                <span className="text-slate-500 text-xs block">{formatTime(boardingPointTime)}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Dropping</span>
                <span className="text-white font-medium">{droppingPointName}</span>
                <span className="text-slate-500 text-xs block">{formatTime(droppingPointTime)}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleInitiate} className="space-y-6">
              {travelers.map((traveler, idx) => (
                <div key={idx} className="metal-card rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-indigo-400 mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" /> Traveler {idx + 1} — Seat {seatIds[idx]}
                  </h2>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <label className="block text-xs text-slate-400 mb-1">Name</label>
                      <input value={traveler.name} onChange={e => updateTraveler(idx, 'name', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500" required />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Age</label>
                      <input type="number" min={0} max={120} value={traveler.age} onChange={e => updateTraveler(idx, 'age', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500" required />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Gender</label>
                      <select value={traveler.gender} onChange={e => updateTraveler(idx, 'gender', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500">
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
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-semibold transition-colors text-lg">
                Continue to Payment — {priceINR(totalPrice)}
              </button>
            </form>
          </>
        )}

        {step === 'payment' && initResult && (
          <div className="max-w-md mx-auto space-y-6">
            <h1 className="text-xl font-bold text-white">Complete Payment</h1>

            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="metal-card rounded-xl p-5">
              <p className="text-sm text-slate-400 mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-indigo-400">{priceINR(initResult.lockedPrice)}</p>
              {initResult.expiresAtUtc && (
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Expires at {formatTime(initResult.expiresAtUtc)}
                </p>
              )}
            </div>

            <div className="metal-card rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-3">Payment Method</h2>
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
              <MapPin className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium mb-1">Boarding: {boardingPointName}</p>
                <p className="text-xs">Dropping: {droppingPointName}</p>
              </div>
            </div>

            <button onClick={handleConfirm}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-semibold transition-colors text-lg">
              Pay {priceINR(initResult.lockedPrice)}
            </button>

            <p className="text-xs text-slate-500 text-center">By clicking Pay, you agree to the cancellation policy and terms of service.</p>
          </div>
        )}
      </main>
    </div>
  );
}
