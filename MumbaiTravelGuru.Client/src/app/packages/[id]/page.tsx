'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest, getStoredToken } from '@/lib/api';
import {
  Compass, MapPin, Calendar, Sun, Utensils, Home, Check, X,
  ChevronLeft, ChevronRight, Maximize2, Send, AlertCircle, Users,
  Clock, Sparkles, Luggage, Coffee, Camera, Star, ArrowLeft,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PackageItineraryDto {
  dayNumber: number;
  title: string;
  description: string;
  activities: string[];
  meals: string[];
  accommodation?: string;
}

interface PackageInclusionDto { description: string; }
interface PackageExclusionDto { description: string; }

interface FixedDepartureDto {
  id: string;
  startDate: string;
  endDate: string;
  pricePerPerson: number;
  discountedPricePerPerson?: number;
  availableSpots: number;
  totalSpots: number;
  isActive: boolean;
}

interface PriceBreakupDto {
  basePricePerPerson: number;
  discountPerPerson: number;
  taxPercentage: number;
  taxAmount: number;
  totalPerPerson: number;
}

interface AddonOption {
  id: string;
  label: string;
  description: string;
  pricePerPerson: number;
}

const PACKAGE_ADDONS: AddonOption[] = [
  { id: 'extra-night', label: 'Extra night stay', description: 'Add one more night at the same hotel', pricePerPerson: 2499 },
  { id: 'travel-insurance', label: 'Travel insurance', description: 'Coverage for medical emergencies, trip cancellation, lost baggage', pricePerPerson: 999 },
  { id: 'private-transfer', label: 'Private transfers', description: 'Upgrade from shared to private vehicle for all transfers', pricePerPerson: 3499 },
  { id: 'guide', label: 'Local guide', description: 'English-speaking guided tour for all sightseeing days', pricePerPerson: 1999 },
  { id: 'camera', label: 'Photography package', description: 'Professional photographer for 1 day (digital copies included)', pricePerPerson: 2999 },
  { id: 'adventure', label: 'Adventure activities', description: 'Water sports / trekking / wildlife safari add-on', pricePerPerson: 3999 },
];

interface PackageDetailDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  overview: string;
  destination: string;
  theme: string;
  durationDays: number;
  durationNights: number;
  pricePerPerson: number;
  discountedPricePerPerson?: number;
  currency: string;
  photoUrls: string[];
  highlights: string[];
  isFixedDeparture: boolean;
  itineraries: PackageItineraryDto[];
  inclusions: PackageInclusionDto[];
  exclusions: PackageExclusionDto[];
  fixedDepartures: FixedDepartureDto[];
  priceBreakup: PriceBreakupDto;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function priceINR(price: number) {
  return price.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function formatDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ------------------------------------------------------------------ */
/*  Page Entry                                                         */
/* ------------------------------------------------------------------ */

export default function PackageDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-sea-deep flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gate-gold border-t-transparent" />
      </div>
    }>
      <PackageDetailContent />
    </Suspense>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Content                                                       */
/* ------------------------------------------------------------------ */

function PackageDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [pkg, setPkg] = useState<PackageDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* ---- gallery ---- */
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  /* ---- add-ons ---- */
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());

  /* ---- enquiry ---- */
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);
  const [enqName, setEnqName] = useState('');
  const [enqEmail, setEnqEmail] = useState('');
  const [enqPhone, setEnqPhone] = useState('');
  const [enqTravelers, setEnqTravelers] = useState(2);
  const [enqStart, setEnqStart] = useState('');
  const [enqEnd, setEnqEnd] = useState('');
  const [enqMessage, setEnqMessage] = useState('');
  const [enqSubmitting, setEnqSubmitting] = useState(false);
  const [enqResult, setEnqResult] = useState('');

  /* ---- booking ---- */
  const [selectedDeparture, setSelectedDeparture] = useState<string | null>(null);
  const [bookTravelers, setBookTravelers] = useState(2);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiRequest<PackageDetailDto>(`/api/v1/packages/${id}`);
        setPkg(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load package');
      }
      setLoading(false);
    };
    if (id) fetch();
  }, [id]);

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev => {
      const next = new Set(prev);
      if (next.has(addonId)) next.delete(addonId);
      else next.add(addonId);
      return next;
    });
  };

  const addonTotal = useMemo(() => {
    return Array.from(selectedAddons).reduce((sum, id) => {
      const opt = PACKAGE_ADDONS.find(a => a.id === id);
      return sum + (opt?.pricePerPerson ?? 0);
    }, 0);
  }, [selectedAddons]);

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkg) return;
    setEnqSubmitting(true);
    setEnqResult('');
    try {
      const result = await apiRequest<{ succeeded: boolean; error?: string; enquiryId?: string }>(
        `/api/v1/packages/${pkg.id}/enquire`, {
        method: 'POST',
        body: JSON.stringify({
          packageId: pkg.id,
          name: enqName,
          email: enqEmail,
          phone: enqPhone,
          travelers: enqTravelers,
          preferredStartDate: enqStart || null,
          preferredEndDate: enqEnd || null,
          message: enqMessage,
        }),
      });
      if (result.succeeded) {
        setEnqResult('Enquiry submitted successfully! Our team will contact you within 24 hours.');
        setShowEnquiryForm(false);
      } else {
        setEnqResult(result.error || 'Failed to submit enquiry.');
      }
    } catch (err: unknown) {
      setEnqResult(err instanceof Error ? err.message : 'Failed to submit enquiry.');
    }
    setEnqSubmitting(false);
  };

  const handleInitiateBooking = async () => {
    if (!pkg) return;
    if (!getStoredToken()) { router.push('/login'); return; }
    try {
      const result = await apiRequest<{ succeeded: boolean; error?: string; bookingId?: string; totalPrice?: number; initialPayment?: number }>(
        '/api/v1/bookings/package/initiate', {
        method: 'POST',
        body: JSON.stringify({
          packageId: pkg.id,
          fixedDepartureId: selectedDeparture,
          travelers: bookTravelers,
          travelerDetails: [],
        }),
      });
      if (result.succeeded) {
        router.push(`/packages/book/confirm?bookingId=${result.bookingId}&totalPrice=${result.totalPrice}&initialPayment=${result.initialPayment}`);
      } else {
        alert(result.error || 'Booking failed');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Booking failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-sea-deep flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gate-gold border-t-transparent" />
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="min-h-dvh bg-sea-deep flex items-center justify-center p-4">
        <div className="bg-harbour border border-monsoon/60 rounded-xl p-8 text-center max-w-md">
          <AlertCircle className="w-10 h-10 text-gate-gold/60 mx-auto mb-3" />
          <p className="text-sm text-paper/80 mb-1">Package not found</p>
          <p className="text-xs text-sandstone/60 mb-4">{error}</p>
          <Link href="/packages" className="text-xs font-medium text-gate-gold hover:text-gate-gold-dim transition-colors">← Back to packages</Link>
        </div>
      </div>
    );
  }

  const displayPhotos = pkg.photoUrls.length > 0 ? pkg.photoUrls : ['', '', '', ''];
  const selectedFd = selectedDeparture ? pkg.fixedDepartures.find(fd => fd.id === selectedDeparture) : null;
  const pricePerPerson = selectedFd?.discountedPricePerPerson ?? selectedFd?.pricePerPerson ?? pkg.discountedPricePerPerson ?? pkg.pricePerPerson;
  const baseTotal = pricePerPerson * bookTravelers;
  const grandTotal = baseTotal + addonTotal * bookTravelers;

  return (
    <div className="min-h-dvh bg-sea-deep">
      {/* -------- Header -------- */}
      <header className="sticky top-0 z-30 border-b border-monsoon/60 bg-sea-deep/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-sandstone/60 hover:text-paper transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-gate-gold/15 p-1 rounded-lg">
                <Compass className="w-4 h-4 text-gate-gold" />
              </div>
              <span className="font-display text-sm text-paper tracking-wide hidden sm:inline">Mumbai Travel Guru</span>
            </Link>
          </div>
          <nav className="flex items-center gap-2 text-xs text-sandstone/60">
            <Link href="/packages" className="hover:text-sandstone/80 transition-colors">Packages</Link>
            <span>/</span>
            <span className="text-paper/80 truncate max-w-[160px]">{pkg.name}</span>
          </nav>
        </div>
      </header>

      {/* ========== PHOTO GALLERY ========== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 sm:gap-3 rounded-xl overflow-hidden h-[200px] sm:h-[320px] lg:h-[400px]">
          <div
            className="col-span-2 row-span-2 relative cursor-pointer group"
            onClick={() => setLightboxIndex(0)}
          >
            <div className={`absolute inset-0 bg-gradient-to-br from-gate-gold/20 to-sea-deep ${!displayPhotos[0] ? 'bg-harbour' : ''}`} />
            {displayPhotos[0] ? (
              <img src={displayPhotos[0]} alt={pkg.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Compass className="w-12 h-12 text-monsoon-light" /></div>
            )}
          </div>
          {[1, 2, 3].map(idx => (
            <div key={idx} className="relative cursor-pointer group overflow-hidden" onClick={() => setLightboxIndex(idx)}>
              <div className={`absolute inset-0 bg-gradient-to-br from-gate-gold/20 to-sea-deep ${!displayPhotos[idx] ? 'bg-harbour' : ''}`} />
              {displayPhotos[idx] ? (
                <img src={displayPhotos[idx]} alt={`${pkg.name} ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Compass className="w-6 h-6 text-monsoon-light" /></div>
              )}
            </div>
          ))}
          {displayPhotos.length > 4 && (
            <button onClick={() => setLightboxIndex(0)}
              className="absolute bottom-3 right-3 bg-sea-deep/80 backdrop-blur-sm border border-monsoon/50 text-paper text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-sea-deep transition-colors z-10 flex items-center gap-1.5">
              <Maximize2 className="w-3 h-3" /> View all photos
            </button>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8">
          {/* ======== LEFT COLUMN ======== */}
          <div className="space-y-6 sm:space-y-8">
            {/* -------- Package Header -------- */}
            <section>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-sandstone/60 mb-2">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {pkg.destination}</span>
                <span className="text-monsoon">&middot;</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {pkg.durationDays}D / {pkg.durationNights}N</span>
                <span className="text-monsoon">&middot;</span>
                <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                  pkg.isFixedDeparture ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' : 'bg-gate-gold/10 text-gate-gold border border-gate-gold/20'
                }`}>
                  {pkg.isFixedDeparture ? 'Fixed Departure' : 'Customizable'}
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl text-paper leading-tight mb-2">{pkg.name}</h1>
              <p className="text-sm text-sandstone/70 leading-relaxed">{pkg.description}</p>

              {pkg.highlights.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {pkg.highlights.map((h, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-[11px] bg-gate-gold/10 text-gate-gold/90 px-2.5 py-1 rounded-full border border-gate-gold/20">
                      <Sparkles className="w-3 h-3" /> {h}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* -------- Overview -------- */}
            {pkg.overview && (
              <section className="bg-harbour border border-monsoon/50 rounded-xl p-4 sm:p-5">
                <h2 className="text-xs font-semibold text-paper/80 uppercase tracking-wider mb-3">Overview</h2>
                <p className="text-sm text-sandstone/70 leading-relaxed">{pkg.overview}</p>
              </section>
            )}

            {/* -------- Day-wise Itinerary Timeline -------- */}
            {pkg.itineraries.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-paper/80 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gate-gold" /> Itinerary
                </h2>
                <div className="space-y-0">
                  {pkg.itineraries.map((day, i) => (
                    <div key={day.dayNumber} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                          i === 0
                            ? 'bg-gate-gold text-sea-deep border-gate-gold'
                            : 'bg-sea-deep text-sandstone/60 border-monsoon/60'
                        }`}>
                          {day.dayNumber}
                        </div>
                        {i < pkg.itineraries.length - 1 && <div className="w-px flex-1 bg-monsoon/50 my-1" />}
                      </div>
                      <div className="flex-1 pb-6">
                        <h3 className="text-sm font-semibold text-paper">{day.title}</h3>
                        <p className="text-xs text-sandstone/70 mt-1 leading-relaxed">{day.description}</p>
                        {day.activities.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {day.activities.map((a, ai) => (
                              <span key={ai} className="text-[10px] bg-sea-deep/60 border border-monsoon/40 text-sandstone/60 px-2 py-0.5 rounded">{a}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-sandstone/50">
                          {day.meals.length > 0 && (
                            <span className="flex items-center gap-1"><Utensils className="w-3 h-3" /> {day.meals.join(', ')}</span>
                          )}
                          {day.accommodation && (
                            <span className="flex items-center gap-1"><Home className="w-3 h-3" /> {day.accommodation}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* -------- Inclusions & Exclusions -------- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {pkg.inclusions.length > 0 && (
                <div className="bg-harbour border border-monsoon/50 rounded-xl p-4 sm:p-5">
                  <h2 className="text-xs font-semibold text-paper/80 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Inclusions
                  </h2>
                  <ul className="space-y-2">
                    {pkg.inclusions.map((inc, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-sandstone/70">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> {inc.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {pkg.exclusions.length > 0 && (
                <div className="bg-harbour border border-monsoon/50 rounded-xl p-4 sm:p-5">
                  <h2 className="text-xs font-semibold text-paper/80 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <X className="w-3.5 h-3.5 text-sandstone/50" /> Exclusions
                  </h2>
                  <ul className="space-y-2">
                    {pkg.exclusions.map((exc, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-sandstone/70">
                        <X className="w-3.5 h-3.5 text-sandstone/50 shrink-0 mt-0.5" /> {exc.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* ======== RIGHT COLUMN: SIDEBAR ======== */}
          <div className="lg:sticky lg:top-20 self-start space-y-4">
            <div className="bg-harbour border border-monsoon/60 rounded-xl p-4 sm:p-5">
              {/* Price Breakup */}
              <h3 className="text-xs font-semibold text-paper/80 uppercase tracking-wider mb-4">Price Breakup</h3>

              <div className="space-y-1.5 text-xs mb-4 pb-4 border-b border-monsoon/40">
                <div className="flex justify-between text-sandstone/60">
                  <span>Base price (per person)</span>
                  <span className="font-mono text-paper/80">₹{priceINR(pkg.priceBreakup.basePricePerPerson)}</span>
                </div>
                {pkg.priceBreakup.discountPerPerson > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount</span>
                    <span className="font-mono">−₹{priceINR(pkg.priceBreakup.discountPerPerson)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sandstone/60">
                  <span>Tax ({pkg.priceBreakup.taxPercentage}%)</span>
                  <span className="font-mono text-paper/80">₹{priceINR(pkg.priceBreakup.taxAmount)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-1">
                  <span className="text-paper/90">Total per person</span>
                  <span className="font-mono text-gate-gold">₹{priceINR(pkg.priceBreakup.totalPerPerson)}</span>
                </div>
              </div>

              {/* Optional Add-ons */}
              <div className="mb-4 pb-4 border-b border-monsoon/40">
                <h4 className="text-[11px] font-semibold text-paper/70 mb-2 flex items-center gap-1.5">
                  <Luggage className="w-3 h-3 text-gate-gold" /> Optional add-ons
                </h4>
                <div className="space-y-1">
                  {PACKAGE_ADDONS.map(addon => {
                    const isSelected = selectedAddons.has(addon.id);
                    return (
                      <button key={addon.id} type="button" onClick={() => toggleAddon(addon.id)}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                          isSelected ? 'border-gate-gold/30 bg-gate-gold/5' : 'border-monsoon/50 bg-sea-deep/40 hover:border-monsoon-light/60'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                          isSelected ? 'bg-gate-gold border-gate-gold' : 'border-monsoon/60'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 text-sea-deep" />}
                        </div>
                        <span className="text-[10px] text-sandstone/70 flex-1">{addon.label}</span>
                        <span className="font-mono text-[10px] text-gate-gold">₹{priceINR(addon.pricePerPerson)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fixed Departures */}
              {pkg.isFixedDeparture && pkg.fixedDepartures.length > 0 && (
                <div className="mb-4 pb-4 border-b border-monsoon/40">
                  <h4 className="text-[11px] font-semibold text-paper/70 mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-gate-gold" /> Available departures
                  </h4>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto">
                    {pkg.fixedDepartures.filter(fd => fd.isActive).map(fd => (
                      <button key={fd.id} onClick={() => setSelectedDeparture(fd.id)}
                        className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                          selectedDeparture === fd.id
                            ? 'border-gate-gold/40 bg-gate-gold/5'
                            : 'border-monsoon/50 bg-sea-deep/40 hover:border-monsoon-light/60'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-[10px] text-sandstone/60 flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              {formatDate(fd.startDate)} – {formatDate(fd.endDate)}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Users className="w-2.5 h-2.5 text-sandstone/50" />
                              <span className={`text-[9px] ${fd.availableSpots <= 3 ? 'text-gate-gold' : 'text-sandstone/50'}`}>
                                {fd.availableSpots} / {fd.totalSpots} spots
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            {fd.discountedPricePerPerson ? (
                              <div>
                                <span className="text-xs font-bold text-gate-gold">₹{priceINR(fd.discountedPricePerPerson)}</span>
                                <span className="text-[9px] text-sandstone/50 line-through ml-1">₹{priceINR(fd.pricePerPerson)}</span>
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-gate-gold">₹{priceINR(fd.pricePerPerson)}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Total + Book / Enquire */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-paper">Total</span>
                  <div className="text-right">
                    <span className="font-mono text-xl font-bold text-gate-gold">₹{priceINR(grandTotal)}</span>
                    <div className="text-[9px] text-sandstone/50">for {bookTravelers} traveler{bookTravelers > 1 ? 's' : ''}</div>
                  </div>
                </div>

                {pkg.isFixedDeparture ? (
                  <>
                    {/* Traveler count selector */}
                    <div className="flex items-center justify-between bg-sea-deep/60 border border-monsoon/50 rounded-lg p-2.5">
                      <span className="text-xs text-sandstone/70">Travelers</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setBookTravelers(Math.max(1, bookTravelers - 1))}
                          className="min-w-[44px] min-h-[44px] rounded-md border border-monsoon/50 text-sandstone/60 hover:text-paper hover:border-monsoon-light/60 transition-colors flex items-center justify-center text-sm">−</button>
                        <span className="text-sm font-mono text-paper w-6 text-center">{bookTravelers}</span>
                        <button onClick={() => setBookTravelers(Math.min(10, bookTravelers + 1))}
                          className="min-w-[44px] min-h-[44px] rounded-md border border-monsoon/50 text-sandstone/60 hover:text-paper hover:border-monsoon-light/60 transition-colors flex items-center justify-center text-sm">+</button>
                      </div>
                    </div>

                    {/* Book Now */}
                    <button onClick={handleInitiateBooking}
                      disabled={!selectedDeparture}
                      className="w-full bg-gate-gold hover:bg-gate-gold-dim disabled:opacity-40 text-sea-deep font-bold py-3 rounded-xl transition-all text-sm shadow-lg shadow-gate-gold/15 hover:shadow-gate-gold/25"
                    >
                      {selectedDeparture ? `Book Now — ₹${priceINR(grandTotal)}` : 'Select a departure date'}
                    </button>

                    {/* Enquire instead */}
                    <div className="text-center pt-1">
                      <button onClick={() => setShowEnquiryForm(true)}
                        className="text-[11px] text-sandstone/50 hover:text-sandstone/70 transition-colors">
                        Need custom dates? Enquire here →
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between bg-sea-deep/60 border border-monsoon/50 rounded-lg p-2.5">
                      <span className="text-xs text-sandstone/70">Travelers</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setBookTravelers(Math.max(1, bookTravelers - 1))}
                          className="min-w-[44px] min-h-[44px] rounded-md border border-monsoon/50 text-sandstone/60 hover:text-paper hover:border-monsoon-light/60 transition-colors flex items-center justify-center text-sm">−</button>
                        <span className="text-sm font-mono text-paper w-6 text-center">{bookTravelers}</span>
                        <button onClick={() => setBookTravelers(Math.min(10, bookTravelers + 1))}
                          className="min-w-[44px] min-h-[44px] rounded-md border border-monsoon/50 text-sandstone/60 hover:text-paper hover:border-monsoon-light/60 transition-colors flex items-center justify-center text-sm">+</button>
                      </div>
                    </div>

                    <button onClick={() => setShowEnquiryForm(true)}
                      className="w-full bg-gate-gold hover:bg-gate-gold-dim text-sea-deep font-bold py-3 rounded-xl transition-all text-sm shadow-lg shadow-gate-gold/15 hover:shadow-gate-gold/25 flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" /> Enquire for Custom Dates
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Enquiry Form */}
            {showEnquiryForm && (
              <div className="bg-harbour border border-gate-gold/30 rounded-xl p-4 sm:p-5 animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-paper/80 uppercase tracking-wider">Send Enquiry</h3>
                  <button onClick={() => setShowEnquiryForm(false)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-sandstone/50 hover:text-paper transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {enqResult ? (
                  <div className={`text-xs p-3 rounded-lg ${enqResult.includes('success') ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' : 'bg-gate-gold/10 text-gate-gold border border-gate-gold/20'}`}>
                    {enqResult}
                  </div>
                ) : (
                  <form onSubmit={handleEnquirySubmit} className="space-y-2.5">
                    <input required placeholder="Your name" value={enqName} onChange={e => setEnqName(e.target.value)}
                      className="w-full bg-sea-deep border border-monsoon/50 rounded-lg px-3 py-2 text-sm text-paper placeholder-sandstone/30 focus:outline-none focus:border-gate-gold/70" />
                    <input required type="email" placeholder="Email" value={enqEmail} onChange={e => setEnqEmail(e.target.value)}
                      className="w-full bg-sea-deep border border-monsoon/50 rounded-lg px-3 py-2 text-sm text-paper placeholder-sandstone/30 focus:outline-none focus:border-gate-gold/70" />
                    <input required placeholder="Phone" value={enqPhone} onChange={e => setEnqPhone(e.target.value)}
                      className="w-full bg-sea-deep border border-monsoon/50 rounded-lg px-3 py-2 text-sm text-paper placeholder-sandstone/30 focus:outline-none focus:border-gate-gold/70" />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-sandstone/50 mb-1 block">Travelers</label>
                        <input type="number" min={1} value={enqTravelers} onChange={e => setEnqTravelers(Number(e.target.value))}
                          className="w-full bg-sea-deep border border-monsoon/50 rounded-lg px-3 py-2 text-sm text-paper focus:outline-none focus:border-gate-gold/70" />
                      </div>
                      <div className="flex items-end gap-1">
                        <div className="flex-1">
                          <label className="text-[10px] text-sandstone/50 mb-1 block">Start</label>
                          <input type="date" value={enqStart} onChange={e => setEnqStart(e.target.value)}
                            className="w-full bg-sea-deep border border-monsoon/50 rounded-lg px-3 py-2 text-sm text-paper [color-scheme:dark] focus:outline-none focus:border-gate-gold/70" />
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] text-sandstone/50 mb-1 block">End</label>
                          <input type="date" value={enqEnd} onChange={e => setEnqEnd(e.target.value)}
                            className="w-full bg-sea-deep border border-monsoon/50 rounded-lg px-3 py-2 text-sm text-paper [color-scheme:dark] focus:outline-none focus:border-gate-gold/70" />
                        </div>
                      </div>
                    </div>
                    <textarea placeholder="Your message or special requests..." value={enqMessage} onChange={e => setEnqMessage(e.target.value)}
                      className="w-full bg-sea-deep border border-monsoon/50 rounded-lg px-3 py-2 text-sm text-paper placeholder-sandstone/30 focus:outline-none focus:border-gate-gold/70 h-20 resize-none" />
                    <button type="submit" disabled={enqSubmitting}
                      className="w-full bg-gate-gold hover:bg-gate-gold-dim disabled:opacity-50 text-sea-deep font-bold py-2.5 rounded-lg transition-all text-sm">
                      {enqSubmitting ? 'Submitting...' : 'Submit Enquiry'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======== LIGHTBOX ======== */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-sea-deep/95 backdrop-blur-md flex items-center justify-center">
          <button onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-harbour/80 border border-monsoon/60 text-sandstone hover:text-paper transition-colors">
            <X className="w-5 h-5" />
          </button>
          <button onClick={() => setLightboxIndex(i => i === null ? 0 : Math.max(0, i - 1))}
            disabled={lightboxIndex === 0}
            className="absolute left-4 z-10 p-2 rounded-full bg-harbour/80 border border-monsoon/60 text-sandstone hover:text-paper transition-colors disabled:opacity-30">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setLightboxIndex(i => i === null ? 0 : Math.min(displayPhotos.length - 1, i + 1))}
            disabled={lightboxIndex >= displayPhotos.length - 1}
            className="absolute right-4 z-10 p-2 rounded-full bg-harbour/80 border border-monsoon/60 text-sandstone hover:text-paper transition-colors disabled:opacity-30">
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-sandstone/50 z-10">
            {lightboxIndex + 1} / {displayPhotos.length}
          </div>
          <div className="w-full h-full flex items-center justify-center p-16">
            {displayPhotos[lightboxIndex] ? (
              <img src={displayPhotos[lightboxIndex]} alt={`${pkg.name} ${lightboxIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-xl" />
            ) : (
              <div className="bg-harbour rounded-xl w-48 h-48 flex items-center justify-center">
                <Compass className="w-16 h-16 text-monsoon-light" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
