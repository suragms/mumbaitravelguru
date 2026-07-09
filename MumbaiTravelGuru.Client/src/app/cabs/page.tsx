'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import {
  Car, MapPin, Clock, Users, Luggage, AlertCircle, Check,
  Fuel, ShieldCheck, Banknote, Wrench, ArrowRightLeft, SlidersHorizontal, X,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type TripType = 'City' | 'Outstation' | 'Airport';

interface CabFareDetail {
  label: string;
  amount: number;
  included: boolean;
}

interface CabOfferDto {
  vehicleType: string;
  vehicleName: string;
  capacity: number;
  luggageCapacity: string;
  estimatedFare: number;
  currency: string;
  baseFare: number;
  distanceKm: number;
  durationMinutes: number;
  fareDetails: CabFareDetail[];
  imageUrl?: string;
  description: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function priceINR(price: number) {
  return price.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

const VEHICLE_ICONS: Record<string, React.ElementType> = {
  Hatchback: Car,
  Sedan: Car,
  SUV: Car,
};

const VEHICLE_COLORS: Record<string, string> = {
  Hatchback: 'from-emerald-900/40 to-sea-deep/90',
  Sedan: 'from-blue-900/40 to-sea-deep/90',
  SUV: 'from-amber-900/40 to-sea-deep/90',
};

/* ------------------------------------------------------------------ */
/*  Page Entry                                                         */
/* ------------------------------------------------------------------ */
export default function CabSearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-sea-deep flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gate-gold border-t-transparent" />
      </div>
    }>
      <CabSearchContent />
    </Suspense>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Content                                                       */
/* ------------------------------------------------------------------ */
function CabSearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [pickup, setPickup] = useState(searchParams.get('pickup') || '');
  const [drop, setDrop] = useState(searchParams.get('drop') || '');
  const [date, setDate] = useState(searchParams.get('date') || '');
  const [time, setTime] = useState(searchParams.get('time') || '');
  const [tripType, setTripType] = useState<TripType>((searchParams.get('tripType') as TripType) || 'City');

  const [offers, setOffers] = useState<CabOfferDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const doSearch = async () => {
    if (!pickup || !drop || !date) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const data = await apiRequest<CabOfferDto[]>(
        `/api/v1/cabs/search?pickup=${encodeURIComponent(pickup)}&drop=${encodeURIComponent(drop)}&date=${date}&time=${encodeURIComponent(time)}&tripType=${tripType}`
      );
      setOffers(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Search failed');
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch();
  };

  return (
    <div className="min-h-dvh bg-sea-deep">
      {/* -------- Header -------- */}
      <header className="sticky top-0 z-30 border-b border-monsoon/60 bg-sea-deep/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-gate-gold/15 p-1 rounded-lg">
              <Car className="w-4 h-4 text-gate-gold" />
            </div>
            <span className="font-display text-sm text-paper tracking-wide hidden sm:inline">Mumbai Travel Guru</span>
          </Link>
          {searched && (
            <div className="flex items-center gap-2 text-xs text-sandstone/70">
              <span className="font-medium text-paper/80">{pickup}</span>
              <ArrowRightLeft className="w-3 h-3 text-sandstone/40" />
              <span className="font-medium text-paper/80">{drop}</span>
              <span className="hidden sm:inline mx-1 text-sandstone/40">&middot;</span>
              <span className="hidden sm:inline text-sandstone/50">{date}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* -------- Search form -------- */}
        <form onSubmit={handleSearch} className="bg-harbour border border-monsoon/60 rounded-xl p-4 sm:p-5 mb-5 sm:mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="flex bg-sea-deep border border-monsoon/50 rounded-lg p-0.5">
              {(['City', 'Outstation', 'Airport'] as TripType[]).map(t => (
                  <button key={t} type="button" onClick={() => setTripType(t)}
                    className={`px-4 py-2 text-xs font-medium rounded-md transition-all ${
                      tripType === t ? 'bg-gate-gold/15 text-gate-gold' : 'text-sandstone/50 hover:text-sandstone/80'
                    }`}>
                  {t === 'City' ? 'City' : t === 'Outstation' ? 'Outstation' : 'Airport'}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-sandstone/60 mb-1 block font-medium">Pickup location</label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sandstone/40" />
                <input value={pickup} onChange={e => setPickup(e.target.value)}
                  className="w-full bg-sea-deep border border-monsoon/50 rounded-lg py-2 pl-8 pr-3 text-paper text-sm placeholder-sandstone/30 focus:outline-none focus:border-gate-gold/70"
                  placeholder="Pickup point" required />
              </div>
            </div>
            <div>
              <label className="text-xs text-sandstone/60 mb-1 block font-medium">Drop location</label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sandstone/40" />
                <input value={drop} onChange={e => setDrop(e.target.value)}
                  className="w-full bg-sea-deep border border-monsoon/50 rounded-lg py-2 pl-8 pr-3 text-paper text-sm placeholder-sandstone/30 focus:outline-none focus:border-gate-gold/70"
                  placeholder="Drop point" required />
              </div>
            </div>
            <div>
              <label className="text-xs text-sandstone/60 mb-1 block font-medium">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full bg-sea-deep border border-monsoon/50 rounded-lg py-2 px-3 text-paper text-sm focus:outline-none focus:border-gate-gold/70 [color-scheme:dark]" required />
            </div>
            <div>
              <label className="text-xs text-sandstone/60 mb-1 block font-medium">Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="w-full bg-sea-deep border border-monsoon/50 rounded-lg py-2 px-3 text-paper text-sm focus:outline-none focus:border-gate-gold/70 [color-scheme:dark]" />
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="mt-4 w-full bg-gate-gold hover:bg-gate-gold-dim text-sea-deep font-bold py-3 rounded-lg transition-all text-sm tracking-wide shadow-lg shadow-gate-gold/15 hover:shadow-gate-gold/25 disabled:opacity-50 flex items-center justify-center gap-2">
            <Car className="w-4 h-4" /> {loading ? 'Searching...' : `Search ${tripType === 'City' ? 'City' : tripType === 'Outstation' ? 'Outstation' : 'Airport'} Cabs`}
          </button>
        </form>

        {!searched ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-gate-gold/10 rounded-full w-14 h-14 flex items-center justify-center mb-4">
              <Car className="w-6 h-6 text-gate-gold/60" />
            </div>
            <h2 className="text-base font-semibold text-paper mb-2">Book a Cab</h2>
            <p className="text-xs text-sandstone/60">Enter pickup and drop locations to see available cabs with transparent pricing.</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gate-gold border-t-transparent" />
            <span className="text-xs text-sandstone/50">Finding cabs...</span>
          </div>
        ) : error ? (
          <div className="bg-harbour border border-monsoon/60 rounded-xl p-8 text-center max-w-lg mx-auto">
            <AlertCircle className="w-10 h-10 text-gate-gold/60 mx-auto mb-3" />
            <p className="text-sm text-paper/80 mb-1">Search failed</p>
            <p className="text-xs text-sandstone/60">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 text-xs font-medium text-gate-gold hover:text-gate-gold-dim transition-colors">
              Try again
            </button>
          </div>
        ) : offers.length === 0 ? (
          <div className="bg-harbour border border-monsoon/60 rounded-xl p-8 text-center max-w-lg mx-auto">
            <div className="bg-gate-gold/10 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
              <Car className="w-6 h-6 text-gate-gold/60" />
            </div>
            <p className="text-sm text-paper/80 mb-2">No cabs available</p>
            <p className="text-xs text-sandstone/60">Try different locations or dates.</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gate-gold" />
              <h1 className="font-display text-lg sm:text-xl text-paper">
                {pickup} <span className="text-sandstone/50">to</span> {drop}
              </h1>
              <span className="text-xs text-sandstone/50 ml-auto">{offers.length} vehicle{offers.length !== 1 ? 's' : ''} available</span>
            </div>

            {offers.map((offer, idx) => {
              const Icon = VEHICLE_ICONS[offer.vehicleType] || Car;
              const gradient = VEHICLE_COLORS[offer.vehicleType] || 'from-slate-900/40 to-sea-deep/90';
              const inclusions = offer.fareDetails.filter(f => f.included);
              const exclusions = offer.fareDetails.filter(f => !f.included);

              return (
                <div key={idx} className="bg-harbour border border-monsoon/50 hover:border-monsoon-light/60 rounded-xl overflow-hidden transition-all">
                  <div className="p-4 sm:p-5">
                    {/* Header: vehicle type + fare */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center border border-monsoon/50`}>
                          <Icon className="w-6 h-6 text-paper" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-paper">{offer.vehicleName}</h3>
                          <span className="text-[11px] text-sandstone/60">{offer.vehicleType} &middot; {offer.description}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-2xl font-bold text-gate-gold tracking-tight">
                          <span className="text-sm font-body text-sandstone/50">₹</span>
                          {priceINR(offer.estimatedFare)}
                        </div>
                        <div className="text-[10px] text-sandstone/50">estimated fare</div>
                      </div>
                    </div>

                    {/* Capacity + luggage + distance chips */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="inline-flex items-center gap-1 text-[11px] text-sandstone/60 bg-sea-deep/60 border border-monsoon/40 px-2.5 py-1 rounded-full">
                        <Users className="w-3 h-3" /> {offer.capacity} seats
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-sandstone/60 bg-sea-deep/60 border border-monsoon/40 px-2.5 py-1 rounded-full">
                        <Luggage className="w-3 h-3" /> {offer.luggageCapacity}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-sandstone/60 bg-sea-deep/60 border border-monsoon/40 px-2.5 py-1 rounded-full">
                        <MapPin className="w-3 h-3" /> {offer.distanceKm} km
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-sandstone/60 bg-sea-deep/60 border border-monsoon/40 px-2.5 py-1 rounded-full">
                        <Clock className="w-3 h-3" /> {Math.floor(offer.durationMinutes / 60)}h {offer.durationMinutes % 60}m
                      </span>
                    </div>

                    {/* Fare breakdown — itemized inclusions */}
                    <div className="border-t border-monsoon/40 pt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                        {inclusions.map((detail, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="text-sandstone/70">{detail.label}</span>
                            {detail.amount > 0 && (
                              <span className="font-mono text-paper/80 ml-auto">
                                {detail.label.toLowerCase().includes('fare') || detail.label.toLowerCase().includes('total')
                                  ? `₹${priceINR(detail.amount)}`
                                  : detail.label.toLowerCase().includes('per') ? `₹${priceINR(detail.amount)}` : ''}
                              </span>
                            )}
                          </div>
                        ))}
                        {exclusions.map((detail, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-sandstone/50">
                            <span className="w-3.5 h-3.5 shrink-0 inline-flex items-center justify-center text-[10px]">—</span>
                            <span>{detail.label}</span>
                            {detail.amount > 0 && (
                              <span className="font-mono ml-auto">₹{priceINR(detail.amount)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Base fare note */}
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] text-sandstone/40">
                      <Banknote className="w-3 h-3" />
                      Base fare ₹{priceINR(offer.baseFare)} &middot; Distance {offer.distanceKm} km &middot; All taxes included
                    </div>

                    {/* CTA */}
                    <div className="mt-4 pt-3 border-t border-monsoon/40 flex justify-end">
                      <Link
                        href={`/cabs/book?pickup=${encodeURIComponent(pickup)}&drop=${encodeURIComponent(drop)}&date=${date}&time=${encodeURIComponent(time)}&tripType=${tripType}&vehicleType=${offer.vehicleType}&fare=${offer.estimatedFare}`}
                        className="inline-block bg-gate-gold hover:bg-gate-gold-dim text-sea-deep font-bold text-sm px-6 py-3 rounded-lg transition-colors"
                      >
                        Book Cab — ₹{priceINR(offer.estimatedFare)}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
