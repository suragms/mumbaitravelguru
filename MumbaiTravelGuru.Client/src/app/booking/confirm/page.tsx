'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import {
  CheckCircle, AlertCircle, Plane, Bus, Hotel, Compass,
  Download, Calendar, Clock, MapPin, Users, ChevronRight,
  ArrowLeft, CreditCard, Ticket, Phone, Smartphone,
  RefreshCw, ArrowRight, ShieldCheck, Luggage,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BookingDetailDto {
  id: string;
  type: 'flight' | 'bus' | 'hotel' | 'package';
  status: string;
  pnrNumber?: string;
  confirmationNumber?: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  travelerCount: number;
  eTicketUrl?: string;
  // Flight-specific
  flightDetails?: {
    airline: string;
    flightNumber: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    durationMinutes: number;
  };
  // Bus-specific
  busDetails?: {
    operatorName: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    durationMinutes: number;
    seatLabels: string[];
  };
  // Hotel-specific
  hotelDetails?: {
    name: string;
    checkIn: string;
    checkOut: string;
    roomType: string;
    address: string;
    nights: number;
  };
  // Package-specific
  packageDetails?: {
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    durationDays: number;
    durationNights: number;
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDuration(minutes?: number) {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function priceINR(price: number) {
  return price.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function getServiceIcon(type: string) {
  switch (type) {
    case 'flight': return Plane;
    case 'bus': return Bus;
    case 'hotel': return Hotel;
    case 'package': return Compass;
    default: return Ticket;
  }
}

function getServiceLabel(type: string) {
  switch (type) {
    case 'flight': return 'Flight';
    case 'bus': return 'Bus';
    case 'hotel': return 'Hotel';
    case 'package': return 'Package';
    default: return 'Booking';
  }
}

/* ------------------------------------------------------------------ */
/*  Page Entry                                                         */
/* ------------------------------------------------------------------ */

export default function BookingConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-sea-deep flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gate-gold border-t-transparent" />
        </div>
      }
    >
      <BookingConfirmContent />
    </Suspense>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Content                                                       */
/* ------------------------------------------------------------------ */

function BookingConfirmContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const bookingId = searchParams.get('bookingId') || '';
  const status = searchParams.get('status') || 'success';
  const paymentId = searchParams.get('paymentId') || '';
  const orderId = searchParams.get('orderId') || '';
  const bookingType = (searchParams.get('type') || 'booking') as BookingDetailDto['type'];
  const errorMessage = searchParams.get('error') || '';

  const [booking, setBooking] = useState<BookingDetailDto | null>(null);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState('');

  /* ---- fetch booking details ---- */
  const fetchBooking = useCallback(async () => {
    if (!bookingId) {
      setFetching(false);
      return;
    }
    setFetching(true);
    setFetchError('');
    try {
      const data = await apiRequest<BookingDetailDto>(`/api/v1/bookings/${bookingId}`);
      setBooking(data);
    } catch {
      setFetchError('Could not load booking details right now.');
    }
    setFetching(false);
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  /* ---- booking-type helpers ---- */
  const ServiceIcon = booking ? getServiceIcon(booking.type) : getServiceIcon(bookingType);
  const serviceLabel = booking ? getServiceLabel(booking.type) : getServiceLabel(bookingType);

  /* ------------------------------------------------------------------ */
  /*  SUCCESS STATE                                                      */
  /* ------------------------------------------------------------------ */
  if (status === 'success') {
    return (
      <div className="min-h-dvh bg-sea-deep">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-monsoon/60 bg-sea-deep/85 backdrop-blur-md">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-gate-gold/15 p-1 rounded-lg">
                <ServiceIcon className="w-4 h-4 text-gate-gold" />
              </div>
              <span className="font-display text-sm text-paper tracking-wide">Mumbai Travel Guru</span>
            </Link>
            <Link href="/profile" className="text-xs text-gate-gold hover:text-gate-gold-dim font-medium transition-colors">
              My Bookings
            </Link>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
          {/* Hero success mark */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/25">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl text-paper mb-1">
              Your {serviceLabel} is confirmed
            </h1>
            <p className="text-sm text-sandstone/60">
              Booking reference: <span className="font-mono text-gate-gold font-bold">{booking?.pnrNumber || booking?.confirmationNumber || bookingId?.slice(0, 8)}</span>
            </p>
            {booking?.createdAt && (
              <p className="text-xs text-sandstone/50 mt-1">
                Confirmed on {formatDate(booking.createdAt)}
              </p>
            )}
          </div>

          {fetching && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gate-gold border-t-transparent" />
            </div>
          )}

          {/* Booking detail card */}
          {!fetching && (
            <div className="space-y-5 animate-slide-up max-w-lg mx-auto">
              {/* What was booked */}
              <section className="bg-harbour border border-monsoon/50 rounded-xl p-5">
                <h2 className="text-xs font-semibold text-paper/80 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-gate-gold" />
                  Trip details
                </h2>

                {booking?.flightDetails && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 pb-3 border-b border-monsoon/30">
                      <div className="bg-gate-gold/10 rounded-lg w-10 h-10 flex items-center justify-center shrink-0">
                        <Plane className="w-5 h-5 text-gate-gold" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-paper">{booking.flightDetails.airline}</p>
                        <p className="text-xs text-sandstone/50">{booking.flightDetails.flightNumber}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-center">
                      <div className="text-center">
                        <div className="font-mono text-lg font-bold text-paper">{formatTime(booking.flightDetails.departureTime)}</div>
                        <div className="text-xs text-sandstone/50">{booking.flightDetails.origin}</div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="text-[10px] text-sandstone/50 font-mono">{formatDuration(booking.flightDetails.durationMinutes)}</div>
                        <div className="relative w-full flex items-center">
                          <div className="h-px flex-1 bg-monsoon/50" />
                          <div className="mx-1 w-2 h-2 rounded-full border border-monsoon-light bg-sea-deep shrink-0" />
                          <div className="h-px flex-1 bg-monsoon/50" />
                        </div>
                        <div className="text-[10px] text-sandstone/50">Non-stop</div>
                      </div>
                      <div className="text-center">
                        <div className="font-mono text-lg font-bold text-paper">{formatTime(booking.flightDetails.arrivalTime)}</div>
                        <div className="text-xs text-sandstone/50">{booking.flightDetails.destination}</div>
                      </div>
                    </div>
                  </div>
                )}

                {booking?.busDetails && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 pb-3 border-b border-monsoon/30">
                      <div className="bg-gate-gold/10 rounded-lg w-10 h-10 flex items-center justify-center shrink-0">
                        <Bus className="w-5 h-5 text-gate-gold" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-paper">{booking.busDetails.operatorName}</p>
                        <p className="text-xs text-sandstone/50">
                          Seat{booking.busDetails.seatLabels?.length > 1 ? 's' : ''}: {booking.busDetails.seatLabels?.join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-center">
                      <div className="text-center">
                        <div className="font-mono text-lg font-bold text-paper">{formatTime(booking.busDetails.departureTime)}</div>
                        <div className="text-xs text-sandstone/50">{booking.busDetails.origin}</div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="text-[10px] text-sandstone/50 font-mono">{formatDuration(booking.busDetails.durationMinutes)}</div>
                        <div className="relative w-full flex items-center">
                          <div className="h-px flex-1 bg-monsoon/50" />
                          <div className="mx-1 w-2 h-2 rounded-full border border-monsoon-light bg-sea-deep shrink-0" />
                          <div className="h-px flex-1 bg-monsoon/50" />
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-mono text-lg font-bold text-paper">{formatTime(booking.busDetails.arrivalTime)}</div>
                        <div className="text-xs text-sandstone/50">{booking.busDetails.destination}</div>
                      </div>
                    </div>
                  </div>
                )}

                {booking?.hotelDetails && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 pb-3 border-b border-monsoon/30">
                      <div className="bg-gate-gold/10 rounded-lg w-10 h-10 flex items-center justify-center shrink-0">
                        <Hotel className="w-5 h-5 text-gate-gold" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-paper">{booking.hotelDetails.name}</p>
                        <p className="text-xs text-sandstone/50">{booking.hotelDetails.roomType}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-xs text-sandstone/50 block">Check-in</span>
                        <span className="text-paper font-medium">{formatDate(booking.hotelDetails.checkIn)}</span>
                      </div>
                      <div>
                        <span className="text-xs text-sandstone/50 block">Check-out</span>
                        <span className="text-paper font-medium">{formatDate(booking.hotelDetails.checkOut)}</span>
                      </div>
                      {booking.hotelDetails.nights && (
                        <div className="col-span-2">
                          <span className="text-xs text-sandstone/50 block">Duration</span>
                          <span className="text-paper font-medium">{booking.hotelDetails.nights} night{booking.hotelDetails.nights > 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-sandstone/50">{booking.hotelDetails.address}</p>
                  </div>
                )}

                {booking?.packageDetails && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 pb-3 border-b border-monsoon/30">
                      <div className="bg-gate-gold/10 rounded-lg w-10 h-10 flex items-center justify-center shrink-0">
                        <Compass className="w-5 h-5 text-gate-gold" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-paper">{booking.packageDetails.name}</p>
                        <p className="text-xs text-sandstone/50">{booking.packageDetails.destination}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-xs text-sandstone/50 block">Start date</span>
                        <span className="text-paper font-medium">{formatDate(booking.packageDetails.startDate)}</span>
                      </div>
                      <div>
                        <span className="text-xs text-sandstone/50 block">End date</span>
                        <span className="text-paper font-medium">{formatDate(booking.packageDetails.endDate)}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs text-sandstone/50 block">Duration</span>
                        <span className="text-paper font-medium">{booking.packageDetails.durationDays}D / {booking.packageDetails.durationNights}N</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fallback when no structured details */}
                {!booking?.flightDetails && !booking?.busDetails && !booking?.hotelDetails && !booking?.packageDetails && (
                  <div className="text-sm text-sandstone/60 py-4 text-center">
                    {fetchError ? (
                      <p>{fetchError}</p>
                    ) : (
                      <p>Booking #{bookingId?.slice(0, 8)} has been recorded. Details will appear here once processed.</p>
                    )}
                  </div>
                )}
              </section>

              {/* Payment info */}
              <section className="bg-harbour border border-monsoon/50 rounded-xl p-5">
                <h2 className="text-xs font-semibold text-paper/80 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-gate-gold" />
                  Payment
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-sandstone/60">Total charged</span>
                    <span className="font-mono text-gate-gold font-bold">
                      ₹{booking?.totalAmount ? priceINR(booking.totalAmount) : '—'}
                    </span>
                  </div>
                  {paymentId && (
                    <div className="flex justify-between">
                      <span className="text-sandstone/60">Payment ID</span>
                      <span className="font-mono text-xs text-sandstone/50">{paymentId.slice(0, 16)}...</span>
                    </div>
                  )}
                  {booking?.pnrNumber && (
                    <div className="flex justify-between">
                      <span className="text-sandstone/60">PNR</span>
                      <span className="font-mono text-xs text-paper/80">{booking.pnrNumber}</span>
                    </div>
                  )}
                  {booking?.id && (
                    <div className="flex justify-between">
                      <span className="text-sandstone/60">Booking ID</span>
                      <span className="font-mono text-xs text-paper/80">{booking.id.slice(0, 12)}...</span>
                    </div>
                  )}
                </div>
              </section>

              {/* E-ticket download */}
              {(booking?.eTicketUrl) && (
                <section className="bg-harbour border border-monsoon/50 rounded-xl p-5">
                  <h2 className="text-xs font-semibold text-paper/80 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Download className="w-3.5 h-3.5 text-gate-gold" />
                    Your e-ticket
                  </h2>
                  <Link
                    href={booking.eTicketUrl}
                    target="_blank"
                    className="flex items-center justify-center gap-2 w-full bg-gate-gold hover:bg-gate-gold-dim text-sea-deep py-3 rounded-xl font-bold text-sm transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download e-ticket
                  </Link>
                  <p className="text-xs text-sandstone/50 text-center mt-2">
                    A copy has been sent to your email address.
                  </p>
                </section>
              )}

              {/* What's next guidance */}
              <section className="bg-harbour border border-monsoon/50 rounded-xl p-5">
                <h2 className="text-xs font-semibold text-paper/80 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gate-gold" />
                  What&rsquo;s next
                </h2>
                <ul className="space-y-3">
                  {(booking?.type === 'flight' || !booking?.type) && (
                    <>
                      <li className="flex gap-3 text-sm">
                        <div className="w-6 h-6 rounded-full bg-gate-gold/10 border border-gate-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-gate-gold">1</span>
                        </div>
                        <div>
                          <p className="text-paper/80 font-medium">Check in online</p>
                          <p className="text-xs text-sandstone/50">
                            Web check-in opens 48 hours before departure. You can select seats and download your boarding pass.
                          </p>
                        </div>
                      </li>
                      <li className="flex gap-3 text-sm">
                        <div className="w-6 h-6 rounded-full bg-gate-gold/10 border border-gate-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-gate-gold">2</span>
                        </div>
                        <div>
                          <p className="text-paper/80 font-medium">Reach the airport early</p>
                          <p className="text-xs text-sandstone/50">
                            Domestic: arrive 2 hours before. International: arrive 3 hours before. Carry a printed or digital copy of your e-ticket.
                          </p>
                        </div>
                      </li>
                    </>
                  )}
                  {(booking?.type === 'bus' || !booking?.type) && (
                    <li className="flex gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-gate-gold/10 border border-gate-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-gate-gold">1</span>
                      </div>
                      <div>
                        <p className="text-paper/80 font-medium">Reach the boarding point</p>
                        <p className="text-xs text-sandstone/50">
                          Arrive at your selected boarding point 15 minutes before departure. Show the e-ticket on your phone or a printout.
                        </p>
                      </div>
                    </li>
                  )}
                  {booking?.type === 'hotel' && (
                    <li className="flex gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-gate-gold/10 border border-gate-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-gate-gold">1</span>
                      </div>
                      <div>
                        <p className="text-paper/80 font-medium">Check in at the hotel</p>
                        <p className="text-xs text-sandstone/50">
                          Present your booking confirmation and a valid government ID at check-in. Standard check-in time is usually 2 PM.
                        </p>
                      </div>
                    </li>
                  )}
                  {booking?.type === 'package' && (
                    <li className="flex gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-gate-gold/10 border border-gate-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-gate-gold">1</span>
                      </div>
                      <div>
                        <p className="text-paper/80 font-medium">Prepare for your trip</p>
                        <p className="text-xs text-sandstone/50">
                          Your itinerary details, hotel vouchers, and contact information for your tour manager will be sent to your email.
                        </p>
                      </div>
                    </li>
                  )}
                  <li className="flex gap-3 text-sm">
                    <div className="w-6 h-6 rounded-full bg-gate-gold/10 border border-gate-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Smartphone className="w-3.5 h-3.5 text-gate-gold" />
                    </div>
                    <div>
                      <p className="text-paper/80 font-medium">Manage your booking</p>
                      <p className="text-xs text-sandstone/50">
                        View, modify, or cancel your booking anytime from your profile. Download the Mumbai Travel Guru app for quick access on the go.
                      </p>
                    </div>
                  </li>
                </ul>
              </section>

              {/* CTA actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href="/profile"
                  className="flex-1 bg-gate-gold hover:bg-gate-gold-dim text-sea-deep py-3 rounded-xl font-bold text-sm transition-colors text-center flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" /> Manage this booking
                </Link>
                <Link
                  href="/"
                  className="flex-1 bg-monsoon hover:bg-monsoon-light text-paper py-3 rounded-xl font-medium text-sm transition-colors text-center flex items-center justify-center gap-2"
                >
                  <Compass className="w-4 h-4" /> Book another trip
                </Link>
              </div>

              <p className="text-xs text-sandstone/50 text-center pt-2">
                Need help? Contact our support team at <span className="font-mono text-sandstone/70">support@mumbaitravelguru.com</span> or call <span className="font-mono text-sandstone/70">+91 22 6888 9999</span>
              </p>
            </div>
          )}
        </main>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  FAILURE STATE                                                      */
  /* ------------------------------------------------------------------ */
  return (
    <div className="min-h-dvh bg-sea-deep">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-monsoon/60 bg-sea-deep/85 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-gate-gold/15 p-1 rounded-lg">
              <ServiceIcon className="w-4 h-4 text-gate-gold" />
            </div>
            <span className="font-display text-sm text-paper tracking-wide">Mumbai Travel Guru</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <div className="animate-fade-in max-w-lg mx-auto">
          {/* Calm failure mark */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
              <AlertCircle className="w-8 h-8 text-amber-400" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl text-paper mb-2">
              Payment didn&rsquo;t go through
            </h1>
            <p className="text-sandstone/60 text-sm max-w-sm mx-auto">
              Your {serviceLabel.toLowerCase()} booking is saved but hasn&rsquo;t been confirmed yet because the payment was declined.
            </p>
          </div>

          {/* What happened */}
          <section className="bg-harbour border border-monsoon/50 rounded-xl p-5 mb-4">
            <h2 className="text-xs font-semibold text-paper/80 uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              What happened
            </h2>
            <div className="text-sm space-y-2">
              {errorMessage ? (
                <p className="text-sandstone/70">{errorMessage}</p>
              ) : (
                <p className="text-sandstone/70">
                  Your bank declined the transaction. This can happen due to insufficient funds, a temporary block on your card, or a network timeout.
                </p>
              )}
              {bookingId && (
                <div className="flex justify-between pt-2 border-t border-monsoon/30">
                  <span className="text-sandstone/60 text-xs">Booking reference</span>
                  <span className="font-mono text-xs text-sandstone/50">{bookingId.slice(0, 8)}</span>
                </div>
              )}
            </div>
          </section>

          {/* What to do */}
          <section className="bg-harbour border border-monsoon/50 rounded-xl p-5 mb-6">
            <h2 className="text-xs font-semibold text-paper/80 uppercase tracking-wider mb-3 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-gate-gold" />
              What to do next
            </h2>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-gate-gold/10 border border-gate-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-gate-gold">1</span>
                </div>
                <div>
                  <p className="text-paper/80 font-medium">Try again with a different card or UPI</p>
                  <p className="text-xs text-sandstone/50">Some banks block large or international transactions on first attempt. A different payment method often works.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-gate-gold/10 border border-gate-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-gate-gold">2</span>
                </div>
                <div>
                  <p className="text-paper/80 font-medium">Check with your bank</p>
                  <p className="text-xs text-sandstone/50">Contact your bank to confirm there are no blocks on online or international payments, then retry.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div>
                  <p className="text-paper/80 font-medium">If the amount was deducted</p>
                  <p className="text-xs text-sandstone/50">
                    If the amount was debited from your account but the booking wasn&rsquo;t confirmed, don&rsquo;t worry. The amount is held by your bank and will be auto-refunded within 5&ndash;7 business days. Contact us if it doesn&rsquo;t show up.
                  </p>
                </div>
              </li>
            </ul>
          </section>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push(`/checkout?bookingId=${bookingId}`)}
              className="flex-1 bg-gate-gold hover:bg-gate-gold-dim text-sea-deep py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Try again
            </button>
            <a
              href="tel:+912268889999"
              className="flex-1 bg-monsoon hover:bg-monsoon-light text-paper py-3 rounded-xl font-medium text-sm transition-colors text-center flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" /> Contact support
            </a>
          </div>

          <p className="text-xs text-sandstone/50 text-center mt-6">
            Your payment details are processed securely through Razorpay. We never store your card information.
          </p>
        </div>
      </main>
    </div>
  );
}
