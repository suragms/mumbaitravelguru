'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { getStoredToken } from '@/lib/api';
import {
  Compass, MapPin, Calendar, Sun, Moon, Utensils, Home, CheckCircle, XCircle,
  IndianRupee, ChevronDown, ChevronUp, Send, AlertCircle, Users, Clock, Sparkles
} from 'lucide-react';

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

function priceINR(price: number) {
  return `₹${price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export default function PackageDetailPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <PackageDetailContent />
    </div>
  );
}

function PackageDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [pkg, setPkg] = useState<PackageDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);

  // Enquiry form state
  const [enqName, setEnqName] = useState('');
  const [enqEmail, setEnqEmail] = useState('');
  const [enqPhone, setEnqPhone] = useState('');
  const [enqTravelers, setEnqTravelers] = useState(1);
  const [enqStart, setEnqStart] = useState('');
  const [enqEnd, setEnqEnd] = useState('');
  const [enqMessage, setEnqMessage] = useState('');
  const [enqSubmitting, setEnqSubmitting] = useState(false);
  const [enqResult, setEnqResult] = useState('');

  // Booking flow
  const [selectedDeparture, setSelectedDeparture] = useState<string | null>(null);
  const [bookTravelers, setBookTravelers] = useState(1);

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
    if (!getStoredToken()) {
      router.push('/login');
      return;
    }
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
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500" />
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-red-300">{error || 'Package not found'}</p>
        <Link href="/packages" className="text-indigo-400 hover:underline mt-4 inline-block">← Back to Packages</Link>
      </div>
    );
  }

  const discount = pkg.discountedPricePerPerson
    ? pkg.pricePerPerson - pkg.discountedPricePerPerson
    : 0;

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-indigo-400 font-bold text-lg">MumbaiTravelGuru</Link>
          <span className="text-slate-600">/</span>
          <Link href="/packages" className="text-slate-400 hover:text-slate-200 text-sm">Packages</Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300 text-sm truncate">{pkg.name}</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Hero */}
        <div className="metal-card rounded-2xl overflow-hidden mb-8">
          <div className="h-64 bg-gradient-to-br from-indigo-900/40 via-slate-900 to-purple-900/40 relative flex items-end">
            <div className="absolute inset-0 flex items-center justify-center">
              <Compass className="w-32 h-32 text-indigo-500/20" />
            </div>
            <div className="relative z-10 p-8 w-full bg-gradient-to-t from-slate-950/90 to-transparent">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {pkg.destination}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {pkg.durationDays} Days / {pkg.durationNights} Nights</span>
                <span className={`px-2 py-0.5 rounded-full font-semibold ${pkg.isFixedDeparture ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {pkg.isFixedDeparture ? 'Fixed Departure' : 'Customizable'}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white">{pkg.name}</h1>
              <p className="text-slate-300 mt-2 max-w-2xl">{pkg.description}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Overview */}
            <div className="metal-card rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-3">Overview</h2>
              <p className="text-slate-300 text-sm leading-relaxed">{pkg.overview}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {pkg.highlights.map((h, i) => (
                  <span key={i} className="flex items-center gap-1 text-xs bg-indigo-500/10 text-indigo-300 px-3 py-1.5 rounded-full border border-indigo-500/20">
                    <Sparkles className="w-3 h-3" /> {h}
                  </span>
                ))}
              </div>
            </div>

            {/* Itinerary Timeline */}
            <div className="metal-card rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" /> Itinerary
              </h2>
              <div className="space-y-0">
                {pkg.itineraries.map((day, i) => (
                  <div key={day.dayNumber} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                        {day.dayNumber}
                      </div>
                      {i < pkg.itineraries.length - 1 && <div className="w-px flex-1 bg-slate-700 my-1"></div>}
                    </div>
                    <div className="flex-1 pb-6">
                      <h3 className="text-base font-semibold text-white">{day.title}</h3>
                      <p className="text-sm text-slate-400 mt-1">{day.description}</p>
                      {day.activities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {day.activities.map((a, ai) => (
                            <span key={ai} className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-lg">{a}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
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
            </div>

            {/* Inclusions & Exclusions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="metal-card rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" /> Inclusions
                </h2>
                <ul className="space-y-2">
                  {pkg.inclusions.map((inc, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> {inc.description}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="metal-card rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-400" /> Exclusions
                </h2>
                <ul className="space-y-2">
                  {pkg.exclusions.map((exc, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" /> {exc.description}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Price Card */}
            <div className="metal-card rounded-xl p-6 sticky top-24">
              <h2 className="text-lg font-bold text-white mb-4">Price Breakup</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Base Price (per person)</span>
                  <span>{priceINR(pkg.priceBreakup.basePricePerPerson)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount</span>
                    <span>-{priceINR(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>Tax ({pkg.priceBreakup.taxPercentage}%)</span>
                  <span>{priceINR(pkg.priceBreakup.taxAmount)}</span>
                </div>
                <div className="border-t border-slate-700 my-2"></div>
                <div className="flex justify-between text-white font-bold text-lg">
                  <span>Total per person</span>
                  <span className="text-indigo-400">{priceINR(pkg.priceBreakup.totalPerPerson)}</span>
                </div>
              </div>

              {/* Fixed Departures */}
              {pkg.isFixedDeparture && pkg.fixedDepartures.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-white mb-3">Available Departures</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {pkg.fixedDepartures.map(fd => (
                      <button key={fd.id} onClick={() => setSelectedDeparture(fd.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${selectedDeparture === fd.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-xs text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(fd.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {' - '}
                              {new Date(fd.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Users className="w-3 h-3 text-slate-500" />
                              <span className={`text-xs ${fd.availableSpots <= 3 ? 'text-rose-400' : 'text-slate-400'}`}>
                                {fd.availableSpots} / {fd.totalSpots} spots left
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            {fd.discountedPricePerPerson ? (
                              <div>
                                <span className="text-sm font-bold text-indigo-400">{priceINR(fd.discountedPricePerPerson)}</span>
                                <span className="text-xs text-slate-500 line-through ml-1">{priceINR(fd.pricePerPerson)}</span>
                              </div>
                            ) : (
                              <span className="text-sm font-bold text-indigo-400">{priceINR(fd.pricePerPerson)}</span>
                            )}
                            <div className="text-[10px] text-slate-500">per person</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 space-y-3">
                {pkg.isFixedDeparture ? (
                  <>
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-slate-400">Travelers:</label>
                      <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-1.5">
                        <button onClick={() => setBookTravelers(Math.max(1, bookTravelers - 1))}
                          className="text-slate-400 hover:text-white text-lg leading-none">−</button>
                        <span className="text-sm text-white font-medium w-6 text-center">{bookTravelers}</span>
                        <button onClick={() => setBookTravelers(Math.min(10, bookTravelers + 1))}
                          className="text-slate-400 hover:text-white text-lg leading-none">+</button>
                      </div>
                    </div>
                    <button onClick={handleInitiateBooking}
                      disabled={!selectedDeparture}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-3 px-4 rounded-xl transition-all">
                      Book Now — {priceINR((selectedDeparture
                        ? (pkg.fixedDepartures.find(fd => fd.id === selectedDeparture)?.discountedPricePerPerson ?? pkg.fixedDepartures.find(fd => fd.id === selectedDeparture)?.pricePerPerson ?? 0)
                        : pkg.pricePerPerson) * bookTravelers)}
                    </button>
                  </>
                ) : (
                  <button onClick={() => setShowEnquiryForm(true)}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" /> Enquire for Custom Dates
                  </button>
                )}
              </div>

              {/* Enquiry Form */}
              {showEnquiryForm && (
                <div className="mt-4 metal-card rounded-xl p-4 border border-amber-500/30">
                  <h3 className="text-sm font-bold text-white mb-3">Send Enquiry</h3>
                  {enqResult ? (
                    <div className={`text-sm p-3 rounded-xl ${enqResult.includes('success') ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                      {enqResult}
                    </div>
                  ) : (
                    <form onSubmit={handleEnquirySubmit} className="space-y-3">
                      <input required placeholder="Your Name" value={enqName} onChange={e => setEnqName(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                      <input required type="email" placeholder="Email" value={enqEmail} onChange={e => setEnqEmail(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                      <input required placeholder="Phone" value={enqPhone} onChange={e => setEnqPhone(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400">Travelers:</label>
                        <input type="number" min={1} value={enqTravelers} onChange={e => setEnqTravelers(Number(e.target.value))}
                          className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="date" placeholder="Start Date" value={enqStart} onChange={e => setEnqStart(e.target.value)}
                          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                        <input type="date" placeholder="End Date" value={enqEnd} onChange={e => setEnqEnd(e.target.value)}
                          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                      </div>
                      <textarea placeholder="Your message or special requests..." value={enqMessage} onChange={e => setEnqMessage(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 h-20" />
                      <button type="submit" disabled={enqSubmitting}
                        className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 text-white font-semibold py-2 px-4 rounded-xl transition-all text-sm">
                        {enqSubmitting ? 'Submitting...' : 'Submit Enquiry'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
