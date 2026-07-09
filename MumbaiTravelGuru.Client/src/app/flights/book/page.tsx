'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { getAirport } from '@/lib/airports';
import { useAuth } from '@/context/AuthContext';
import {
  Plane, User, Clock, AlertCircle, ArrowLeft, ArrowRightLeft,
  Check, Luggage, Utensils, Sofa, ShieldCheck, Wallet,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FlightSegmentDto {
  departureAirportCode: string;
  arrivalAirportCode: string;
  departureTime: string;
  arrivalTime: string;
  airline: string;
  flightNumber: string;
  cabin: string;
  durationMinutes: number;
}

interface FlightOfferDto {
  offerId: string;
  tripType: string;
  outboundSegments: FlightSegmentDto[];
  returnSegments: FlightSegmentDto[];
  totalPrice: number;
  baseFare: number;
  taxes: number;
  otherCharges: number;
  currency: string;
  totalStops: number;
  totalDurationMinutes: number;
  airline: string;
  seatsAvailable: number;
  priceExpiryUtc: string;
  fareClass: string;
  fareRules: string[];
}

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

interface SavedTravelerDto {
  id: string;
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

type AddonType = 'seat' | 'meal' | 'baggage';

interface AddonOption {
  id: string;
  type: AddonType;
  label: string;
  description: string;
  pricePerPerson: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function priceINR(price: number) {
  return price.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

const ADDON_OPTIONS: AddonOption[] = [
  { id: 'seat-aisle', type: 'seat', label: 'Aisle seat', description: 'Pre-book an aisle seat for easy access', pricePerPerson: 299 },
  { id: 'seat-window', type: 'seat', label: 'Window seat', description: 'Guarantee a window seat with a view', pricePerPerson: 399 },
  { id: 'seat-extra-legroom', type: 'seat', label: 'Extra legroom', description: 'Front-row or exit-row with more legroom', pricePerPerson: 799 },
  { id: 'meal-veg', type: 'meal', label: 'Vegetarian meal', description: 'Indian vegetarian meal served hot', pricePerPerson: 499 },
  { id: 'meal-nonveg', type: 'meal', label: 'Non-vegetarian meal', description: 'Chicken or fish with rice and bread', pricePerPerson: 599 },
  { id: 'meal-special', type: 'meal', label: 'Special meal', description: 'Jain / Kosher / Vegan / Gluten-free', pricePerPerson: 699 },
  { id: 'baggage-5kg', type: 'baggage', label: 'Extra 5 kg baggage', description: 'Add 5 kg to your checked baggage allowance', pricePerPerson: 899 },
  { id: 'baggage-10kg', type: 'baggage', label: 'Extra 10 kg baggage', description: 'Add 10 kg to your checked baggage allowance', pricePerPerson: 1499 },
  { id: 'baggage-sports', type: 'baggage', label: 'Sports equipment', description: 'Carry golf clubs / skis / surfboard', pricePerPerson: 1999 },
];

const ADDON_ICONS: Record<AddonType, React.ElementType> = {
  seat: Sofa,
  meal: Utensils,
  baggage: Luggage,
};

/* ------------------------------------------------------------------ */
/*  Page Entry                                                         */
/* ------------------------------------------------------------------ */

export default function FlightBookPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-sea-deep flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gate-gold border-t-transparent" />
      </div>
    }>
      <FlightBookContent />
    </Suspense>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Content                                                       */
/* ------------------------------------------------------------------ */

function FlightBookContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user: authUser, isAuthenticated } = useAuth();

  const offerId = searchParams.get('offerId') || '';
  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
  const departDate = searchParams.get('departDate') || '';
  const returnDate = searchParams.get('returnDate') || '';
  const tripType = searchParams.get('tripType') || 'OneWay';
  const adults = Number(searchParams.get('adults')) || 1;
  const cabinClass = searchParams.get('cabinClass') || 'Economy';

  /* ---- offer data ---- */
  const [offer, setOffer] = useState<FlightOfferDto | null>(null);
  const [offerLoading, setOfferLoading] = useState(true);
  const [offerError, setOfferError] = useState('');

  /* ---- saved travelers ---- */
  const [savedTravelers, setSavedTravelers] = useState<SavedTravelerDto[]>([]);

  /* ---- traveler forms ---- */
  const emptyTraveler = (): TravelerForm => ({
    firstName: '', lastName: '', phoneNumber: '', email: '',
    gender: '', dateOfBirth: '', passportNumber: '', nationality: 'IN',
  });

  const [travelers, setTravelers] = useState<TravelerForm[]>(
    Array.from({ length: adults }, () => emptyTraveler())
  );

  /* ---- add-ons ---- */
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());

  /* ---- submission ---- */
  const [initiating, setInitiating] = useState(false);
  const [error, setError] = useState('');

  /* ---- fetch offer ---- */
  useEffect(() => {
    const fetchOffer = async () => {
      if (!offerId) { router.push('/flights/results'); return; }
      setOfferLoading(true);
      setOfferError('');
      try {
        const data = await apiRequest<FlightOfferDto>(`/api/v1/flights/offers/${offerId}`);
        setOffer(data);
      } catch (err: unknown) {
        setOfferError(err instanceof Error ? err.message : 'Failed to load fare details');
      }
      setOfferLoading(false);
    };
    fetchOffer();
  }, [offerId, router]);

  /* ---- fetch saved travelers ---- */
  useEffect(() => {
    const fetchSaved = async () => {
      if (!isAuthenticated) return;
      try {
        const data = await apiRequest<SavedTravelerDto[]>('/api/v1/saved-travelers');
        setSavedTravelers(data);
      } catch { /* not critical if fails */ }
    };
    fetchSaved();
  }, [isAuthenticated]);

  /* ---- helpers ---- */
  const updateTraveler = (idx: number, field: keyof TravelerForm, value: string) => {
    setTravelers(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const applySavedTraveler = (saved: SavedTravelerDto, targetIdx: number) => {
    setTravelers(prev => {
      const next = [...prev];
      next[targetIdx] = {
        firstName: saved.firstName,
        lastName: saved.lastName,
        phoneNumber: saved.phoneNumber,
        email: saved.email,
        gender: saved.gender,
        dateOfBirth: saved.dateOfBirth,
        passportNumber: saved.passportNumber,
        nationality: saved.nationality || 'IN',
      };
      return next;
    });
  };

  const fillFromAuthUser = () => {
    if (!authUser) return;
    const val: Partial<TravelerForm> = {
      firstName: authUser.firstName || '',
      lastName: authUser.lastName || '',
      email: authUser.email || '',
      phoneNumber: authUser.phoneNumber || '',
    };
    setTravelers(prev => prev.map(t => ({ ...t, ...val })));
  };

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ---- totals ---- */
  const addonTotal = useMemo(() => {
    return Array.from(selectedAddons).reduce((sum, id) => {
      const opt = ADDON_OPTIONS.find(a => a.id === id);
      return sum + (opt?.pricePerPerson ?? 0) * adults;
    }, 0);
  }, [selectedAddons, adults]);

  const grandTotal = (offer?.totalPrice ?? 0) + addonTotal;

  /* ---- submit ---- */
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
          addons: Array.from(selectedAddons),
          addonTotal,
        }),
      });

      if (!result.succeeded) {
        setError(result.error || 'Booking initiation failed');
        setInitiating(false);
        return;
      }

      sessionStorage.setItem('flight_lock', JSON.stringify(result));
      router.push(`/flights/confirm?lockId=${result.lockId}&bookingId=${result.bookingId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Booking failed');
      setInitiating(false);
    }
  };

  const fromAirport = getAirport(origin);
  const toAirport = getAirport(destination);
  const seg = offer?.outboundSegments[0];
  const lastSeg = offer?.outboundSegments[offer.outboundSegments.length - 1];

  if (offerLoading) {
    return (
      <div className="min-h-dvh bg-sea-deep flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gate-gold border-t-transparent" />
      </div>
    );
  }

  if (offerError || !offer) {
    return (
      <div className="min-h-dvh bg-sea-deep flex items-center justify-center p-4">
        <div className="bg-harbour border border-monsoon/60 rounded-xl p-8 text-center max-w-md">
          <AlertCircle className="w-10 h-10 text-gate-gold/60 mx-auto mb-3" />
          <p className="text-sm text-paper/80 mb-1">Unable to load fare</p>
          <p className="text-xs text-sandstone/60 mb-4">{offerError || 'Offer not found'}</p>
          <button onClick={() => router.back()} className="text-xs font-medium text-gate-gold hover:text-gate-gold-dim transition-colors">
            Go back to search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-sea-deep">
      {/* -------- Header -------- */}
      <header className="sticky top-0 z-30 border-b border-monsoon/60 bg-sea-deep/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-sandstone/60 hover:text-paper transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-gate-gold/15 p-1 rounded-lg">
                <Plane className="w-4 h-4 text-gate-gold" />
              </div>
              <span className="font-display text-sm text-paper tracking-wide hidden sm:inline">Mumbai Travel Guru</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 text-xs text-sandstone/70">
            <span className="font-medium text-paper/80">{origin}</span>
            <ArrowRightLeft className="w-3 h-3" />
            <span className="font-medium text-paper/80">{destination}</span>
            <span className="hidden sm:inline mx-1 text-sandstone/40">&middot;</span>
            <span className="hidden sm:inline text-sandstone/50">{formatDate(departDate)}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* -------- Title -------- */}
        <div className="mb-5">
          <h1 className="font-display text-xl sm:text-2xl text-paper">Complete your booking</h1>
          <p className="text-xs text-sandstone/60 mt-0.5">
            {fromAirport?.city || origin} → {toAirport?.city || destination}
            {' '}&middot; {formatDate(departDate)}{returnDate ? ` — ${formatDate(returnDate)}` : ''}
            {' '}&middot; {adults} adult{adults > 1 ? 's' : ''} &middot; {cabinClass}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:gap-8 items-start">
          {/* ======== LEFT: FORM ======== */}
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* -------- Fare Summary Card -------- */}
            <section className="bg-harbour border border-monsoon/50 rounded-xl p-4 sm:p-5">
              <h2 className="text-xs font-semibold text-paper/80 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-gate-gold" /> Fare Summary
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-sandstone/70">
                  <span>Base fare ({adults} adult{adults > 1 ? 's' : ''})</span>
                  <span className="font-mono text-paper/90">₹{priceINR(offer.baseFare)}</span>
                </div>
                <div className="flex justify-between text-sandstone/70">
                  <span>Taxes & fees</span>
                  <span className="font-mono text-paper/90">₹{priceINR(offer.taxes)}</span>
                </div>
                {offer.otherCharges > 0 && (
                  <div className="flex justify-between text-sandstone/70">
                    <span>Other charges</span>
                    <span className="font-mono text-paper/90">₹{priceINR(offer.otherCharges)}</span>
                  </div>
                )}
                <div className="border-t border-monsoon/40 pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-paper/90">Subtotal (fare only)</span>
                    <span className="font-mono text-gate-gold">₹{priceINR(offer.totalPrice)}</span>
                  </div>
                  <div className="text-[10px] text-sandstone/50 mt-0.5">
                    {offer.seatsAvailable <= 3 && (
                      <span className="text-gate-gold">Only {offer.seatsAvailable} seats left at this price &middot; </span>
                    )}
                    Price expires {offer.priceExpiryUtc ? formatDate(offer.priceExpiryUtc) : 'soon'}
                  </div>
                </div>
              </div>
              {offer.fareRules.length > 0 && (
                <details className="mt-3 pt-3 border-t border-monsoon/40">
                  <summary className="text-[11px] text-sandstone/50 cursor-pointer hover:text-sandstone/70 transition-colors">
                    Fare rules & cancellation policy
                  </summary>
                  <div className="mt-2 space-y-1">
                    {offer.fareRules.map((rule, i) => (
                      <p key={i} className="text-[11px] text-sandstone/60 leading-relaxed">{rule}</p>
                    ))}
                  </div>
                </details>
              )}
            </section>

            {/* -------- Add-ons -------- */}
            <section className="bg-harbour border border-monsoon/50 rounded-xl p-4 sm:p-5">
              <h2 className="text-xs font-semibold text-paper/80 uppercase tracking-wider mb-3">
                Optional add-ons
              </h2>
              <p className="text-[11px] text-sandstone/50 mb-4">
                Enhance your trip with seat selection, meals, or extra baggage.
                Prices shown are per person. Selected add-ons will be added to your total.
              </p>

              {(['seat', 'meal', 'baggage'] as AddonType[]).map(type => {
                const options = ADDON_OPTIONS.filter(a => a.type === type);
                const Icon = ADDON_ICONS[type];
                return (
                  <div key={type} className="mb-4 last:mb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-gate-gold" />
                      <span className="text-xs font-semibold text-paper/80 capitalize">{type} preferences</span>
                    </div>
                    <div className="space-y-1.5">
                      {options.map(opt => {
                        const isSelected = selectedAddons.has(opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => toggleAddon(opt.id)}
                            className={`w-full flex items-center gap-3 p-3.5 rounded-lg border text-left transition-all ${
                              isSelected
                                ? 'border-gate-gold/40 bg-gate-gold/5'
                                : 'border-monsoon/50 bg-sea-deep/50 hover:border-monsoon-light/60'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                                isSelected ? 'bg-gate-gold border-gate-gold' : 'border-monsoon/60'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 text-sea-deep" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-medium text-paper/90">{opt.label}</span>
                              <p className="text-[10px] text-sandstone/50 truncate">{opt.description}</p>
                            </div>
                            <span className="font-mono text-xs font-bold text-gate-gold shrink-0">
                              ₹{priceINR(opt.pricePerPerson)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </section>

            {/* -------- Traveler Details -------- */}
            <section className="bg-harbour border border-monsoon/50 rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-paper/80 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gate-gold" /> Traveler Details
                </h2>

                {/* Quick-fill from profile */}
                {isAuthenticated && authUser && (
                  <button
                    type="button"
                    onClick={fillFromAuthUser}
                    className="text-[10px] font-medium text-gate-gold hover:text-gate-gold-dim transition-colors flex items-center gap-1"
                  >
                    <User className="w-3 h-3" /> Fill from profile
                  </button>
                )}
              </div>

              {travelers.map((traveler, idx) => (
                <div key={idx} className="mb-5 last:mb-0 pb-5 last:pb-0 border-b last:border-b-0 border-monsoon/40">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-paper">Traveler {idx + 1}</span>

                    {/* Saved traveler quick-select */}
                    {savedTravelers.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-sandstone/50 mr-1">Saved:</span>
                        <select
                          onChange={e => {
                            const s = savedTravelers.find(t => t.id === e.target.value);
                            if (s) applySavedTraveler(s, idx);
                          }}
                          defaultValue=""
                          className="text-[10px] bg-sea-deep border border-monsoon/50 rounded px-2 py-1 text-paper focus:outline-none focus:border-gate-gold/70"
                        >
                          <option value="">Select traveler</option>
                          {savedTravelers.map(s => (
                            <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-sandstone/60 mb-1 font-medium">First name</label>
                      <input value={traveler.firstName} onChange={e => updateTraveler(idx, 'firstName', e.target.value)}
                        className="w-full bg-sea-deep border border-monsoon/50 rounded-lg py-2 px-3 text-paper text-sm placeholder-sandstone/30 focus:outline-none focus:border-gate-gold/70" required />
                    </div>
                    <div>
                      <label className="block text-[10px] text-sandstone/60 mb-1 font-medium">Last name</label>
                      <input value={traveler.lastName} onChange={e => updateTraveler(idx, 'lastName', e.target.value)}
                        className="w-full bg-sea-deep border border-monsoon/50 rounded-lg py-2 px-3 text-paper text-sm placeholder-sandstone/30 focus:outline-none focus:border-gate-gold/70" required />
                    </div>
                    <div>
                      <label className="block text-[10px] text-sandstone/60 mb-1 font-medium">Phone</label>
                      <input type="tel" value={traveler.phoneNumber} onChange={e => updateTraveler(idx, 'phoneNumber', e.target.value)}
                        className="w-full bg-sea-deep border border-monsoon/50 rounded-lg py-2 px-3 text-paper text-sm placeholder-sandstone/30 focus:outline-none focus:border-gate-gold/70" required />
                    </div>
                    <div>
                      <label className="block text-[10px] text-sandstone/60 mb-1 font-medium">Email</label>
                      <input type="email" value={traveler.email} onChange={e => updateTraveler(idx, 'email', e.target.value)}
                        className="w-full bg-sea-deep border border-monsoon/50 rounded-lg py-2 px-3 text-paper text-sm placeholder-sandstone/30 focus:outline-none focus:border-gate-gold/70" required />
                    </div>
                    <div>
                      <label className="block text-[10px] text-sandstone/60 mb-1 font-medium">Gender</label>
                      <select value={traveler.gender} onChange={e => updateTraveler(idx, 'gender', e.target.value)}
                        className="w-full bg-sea-deep border border-monsoon/50 rounded-lg py-2 px-3 text-paper text-sm focus:outline-none focus:border-gate-gold/70">
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-sandstone/60 mb-1 font-medium">Date of birth</label>
                      <input type="date" value={traveler.dateOfBirth} onChange={e => updateTraveler(idx, 'dateOfBirth', e.target.value)}
                        className="w-full bg-sea-deep border border-monsoon/50 rounded-lg py-2 px-3 text-paper text-sm focus:outline-none focus:border-gate-gold/70 [color-scheme:dark]" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-sandstone/60 mb-1 font-medium">Passport number</label>
                      <input value={traveler.passportNumber} onChange={e => updateTraveler(idx, 'passportNumber', e.target.value)}
                        className="w-full bg-sea-deep border border-monsoon/50 rounded-lg py-2 px-3 text-paper text-sm placeholder-sandstone/30 focus:outline-none focus:border-gate-gold/70 font-mono uppercase" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-sandstone/60 mb-1 font-medium">Nationality</label>
                      <input value={traveler.nationality} onChange={e => updateTraveler(idx, 'nationality', e.target.value)}
                        className="w-full bg-sea-deep border border-monsoon/50 rounded-lg py-2 px-3 text-paper text-sm placeholder-sandstone/30 focus:outline-none focus:border-gate-gold/70 font-mono uppercase" />
                    </div>
                  </div>
                </div>
              ))}
            </section>

            {/* Error message */}
            {error && (
              <div className="bg-gate-gold/10 border border-gate-gold/20 rounded-xl p-3 text-xs text-gate-gold flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={initiating}
              className="w-full bg-gate-gold hover:bg-gate-gold-dim text-sea-deep font-bold py-3 rounded-xl transition-colors text-sm disabled:opacity-50 shadow-lg shadow-gate-gold/15 hover:shadow-gate-gold/25"
            >
              {initiating ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-sea-deep border-t-transparent" />
                  Checking availability...
                </span>
              ) : (
                `Continue to payment — ₹${priceINR(grandTotal)}`
              )}
            </button>
          </form>

          {/* ======== RIGHT: STICKY SUMMARY SIDEBAR ======== */}
          <div className="lg:sticky lg:top-20 self-start space-y-4">
            <div className="bg-harbour border border-monsoon/60 rounded-xl p-4 sm:p-5">
              <h3 className="text-xs font-semibold text-paper/80 uppercase tracking-wider mb-4">
                Booking Summary
              </h3>

              {/* Flight route */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-monsoon/40">
                <div className="bg-gate-gold/10 rounded-lg w-9 h-9 flex items-center justify-center shrink-0">
                  <Plane className="w-4 h-4 text-gate-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-paper block truncate">{offer.airline}</span>
                  <span className="text-[10px] text-sandstone/50">{seg?.flightNumber} &middot; {cabinClass}</span>
                </div>
              </div>

              {/* Route visualization */}
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-monsoon/40">
                <div className="text-center">
                  <div className="font-mono text-sm font-bold text-paper">{seg ? formatTime(seg.departureTime) : '—'}</div>
                  <div className="text-[10px] text-sandstone/50">{origin}</div>
                </div>
                <div className="flex-1 flex flex-col items-center px-1">
                  <div className="text-[9px] text-sandstone/40 font-mono">{formatDuration(offer.totalDurationMinutes)}</div>
                  <div className="relative w-full flex items-center my-0.5">
                    <div className="h-px flex-1 bg-monsoon/50" />
                    <div className="mx-1 w-1.5 h-1.5 rounded-full border border-monsoon-light bg-sea-deep shrink-0" />
                    <div className="h-px flex-1 bg-monsoon/50" />
                  </div>
                  <div className="text-[9px] text-sandstone/40">{offer.totalStops === 0 ? 'Non-stop' : `${offer.totalStops} stop${offer.totalStops > 1 ? 's' : ''}`}</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-sm font-bold text-paper">{lastSeg ? formatTime(lastSeg.arrivalTime) : '—'}</div>
                  <div className="text-[10px] text-sandstone/50">{destination}</div>
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-1.5 text-xs mb-4 pb-4 border-b border-monsoon/40">
                <div className="flex justify-between text-sandstone/60">
                  <span>Departure</span>
                  <span className="text-paper/80">{formatDate(departDate)}</span>
                </div>
                {returnDate && (
                  <div className="flex justify-between text-sandstone/60">
                    <span>Return</span>
                    <span className="text-paper/80">{formatDate(returnDate)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sandstone/60">
                  <span>Travelers</span>
                  <span className="text-paper/80">{adults} adult{adults > 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="space-y-1.5 text-xs mb-4 pb-4 border-b border-monsoon/40">
                <div className="flex justify-between text-sandstone/60">
                  <span>Fare</span>
                  <span className="font-mono text-paper/80">₹{priceINR(offer.totalPrice)}</span>
                </div>
                {selectedAddons.size > 0 && (
                  <div className="flex justify-between text-sandstone/60">
                    <span>Add-ons ({selectedAddons.size})</span>
                    <span className="font-mono text-paper/80">₹{priceINR(addonTotal)}</span>
                  </div>
                )}
              </div>

              {/* Grand total */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-semibold text-paper">Total</span>
                <span className="font-mono text-xl font-bold text-gate-gold">₹{priceINR(grandTotal)}</span>
              </div>

              {offer.priceExpiryUtc && (
                <div className="flex items-center gap-1.5 text-[10px] text-sandstone/50 bg-sea-deep/50 rounded-lg px-3 py-2">
                  <Clock className="w-3 h-3" />
                  <span>Price expires at {new Date(offer.priceExpiryUtc).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}

              <div className="flex items-start gap-2 text-[10px] text-sandstone/50 mt-3 pt-3 border-t border-monsoon/40">
                <ShieldCheck className="w-3 h-3 shrink-0 mt-0.5" />
                <span>We&rsquo;ll confirm the final price before you pay. Fares may change until then.</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
