'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';
import { getAirport } from '@/lib/airports';
import { Plane, User, Shield, Clock, ArrowLeft } from 'lucide-react';

interface TravelerForm {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  passportNumber: string;
  nationality: string;
}

interface InitiateResult {
  succeeded: boolean;
  error?: string;
  lockId?: string;
  lockedPrice: number;
  currency: string;
  expiresAtUtc: string;
  bookingId?: string;
}

export default function FlightBookPage() {
  return <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500" /></div>}>
    <FlightBookContent />
  </Suspense>;
}

function FlightBookContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const offerId = searchParams.get('offerId') || '';
  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
  const adults = Number(searchParams.get('adults')) || 1;

  const [travelers, setTravelers] = useState<TravelerForm[]>(
    Array.from({ length: adults }, () => ({
      firstName: '', lastName: '', phoneNumber: '', email: '',
      gender: '', dateOfBirth: '', passportNumber: '', nationality: 'IN',
    }))
  );
  const [initiating, setInitiating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!offerId) router.push('/flights/results');
  }, [offerId, router]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/flights/book?offerId=${offerId}&origin=${origin}&destination=${destination}&adults=${adults}`);
    }
  }, [isAuthenticated, offerId, origin, destination, adults, router]);

  const updateTraveler = (idx: number, field: keyof TravelerForm, value: string) => {
    setTravelers(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInitiating(true);
    setError('');
    try {
      const result = await apiRequest<InitiateResult>('/api/v1/bookings/flight/initiate', {
        method: 'POST',
        body: JSON.stringify({
          offerId,
          travelers: travelers.map(t => ({
            ...t,
            dateOfBirth: t.dateOfBirth || null,
          })),
        }),
      });

      if (!result.succeeded) {
        setError(result.error || 'Booking initiation failed');
        setInitiating(false);
        return;
      }

      // Store lock info for confirmation and redirect to payment/confirm
      sessionStorage.setItem('flight_lock', JSON.stringify(result));
      router.push(`/flights/confirm?lockId=${result.lockId}&bookingId=${result.bookingId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Booking failed');
      setInitiating(false);
    }
  };

  const fromAirport = getAirport(origin);
  const toAirport = getAirport(destination);

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-indigo-400 font-bold">MumbaiTravelGuru</Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300 text-sm">Traveler Details</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-xl font-bold text-white">Traveler Details</h1>
        </div>

        <div className="metal-card rounded-xl p-4 mb-6 flex items-center gap-4">
          <Plane className="w-8 h-8 text-indigo-400" />
          <div>
            <p className="text-white font-medium">{fromAirport?.city || origin} → {toAirport?.city || destination}</p>
            <p className="text-sm text-slate-400">{adults} Adult{adults > 1 ? 's' : ''}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {travelers.map((traveler, idx) => (
            <div key={idx} className="metal-card rounded-xl p-5">
              <h2 className="text-sm font-semibold text-indigo-400 mb-4 flex items-center gap-2">
                <User className="w-4 h-4" /> Traveler {idx + 1}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">First Name</label>
                  <input value={traveler.firstName} onChange={e => updateTraveler(idx, 'firstName', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500" required />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Last Name</label>
                  <input value={traveler.lastName} onChange={e => updateTraveler(idx, 'lastName', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500" required />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Phone</label>
                  <input value={traveler.phoneNumber} onChange={e => updateTraveler(idx, 'phoneNumber', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500" required />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Email</label>
                  <input type="email" value={traveler.email} onChange={e => updateTraveler(idx, 'email', e.target.value)}
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
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Date of Birth</label>
                  <input type="date" value={traveler.dateOfBirth} onChange={e => updateTraveler(idx, 'dateOfBirth', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Passport Number</label>
                  <input value={traveler.passportNumber} onChange={e => updateTraveler(idx, 'passportNumber', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nationality</label>
                  <input value={traveler.nationality} onChange={e => updateTraveler(idx, 'nationality', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
            </div>
          ))}

          <div className="metal-card rounded-xl p-4 flex items-center gap-3 text-sm text-slate-400">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Price will be re-validated server-side before payment. The fare shown during search is subject to availability.</span>
          </div>

          <button type="submit" disabled={initiating}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 text-lg">
            {initiating ? 'Checking Availability...' : 'Continue to Payment'}
          </button>
        </form>
      </main>
    </div>
  );
}
