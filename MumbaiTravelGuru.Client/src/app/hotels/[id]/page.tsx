'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import {
  Hotel, MapPin, Star, ChevronLeft, ChevronRight, X, Check, Clock,
  Wifi, Waves, Coffee, Car, Dumbbell, Utensils, Snowflake, Wind, Monitor,
  Users, Luggage, ShieldCheck, AlertCircle, ArrowLeft, Calendar,
  ChevronDown, ChevronUp, Maximize2,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RoomDto {
  roomId: string;
  roomType: string;
  description: string;
  maxAdults: number;
  maxChildren: number;
  totalRoomsAvailable: number;
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  boardType: string;
  isRefundable: boolean;
  cancellationPolicy?: string;
  roomAmenities: string[];
}

interface ReviewDto {
  id: string;
  authorName: string;
  authorAvatar?: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  travelerType: string;
}

interface HotelDetailDto {
  hotelId: string;
  name: string;
  description: string;
  longDescription: string;
  city: string;
  country: string;
  address: string;
  locality: string;
  latitude: number;
  longitude: number;
  starRating: number;
  guestRating: number;
  reviewCount: number;
  checkInTime: string;
  checkOutTime: string;
  photoUrls: string[];
  amenities: string[];
  policies: string[];
  rooms: RoomDto[];
  reviews: ReviewDto[];
  currency: string;
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
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function getRatingLabel(rating: number): string {
  if (rating >= 9) return 'Outstanding';
  if (rating >= 8) return 'Excellent';
  if (rating >= 7) return 'Very Good';
  if (rating >= 6) return 'Good';
  if (rating >= 4) return 'Average';
  return 'Poor';
}

function getRatingColor(rating: number): string {
  if (rating >= 8) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  if (rating >= 6) return 'bg-gate-gold/15 text-gate-gold border-gate-gold/30';
  return 'bg-sandstone/10 text-sandstone/60 border-sandstone/30';
}

const AMENITY_ICONS: Record<string, React.ElementType> = {
  Pool: Waves,
  Spa: Wind,
  'Free WiFi': Wifi,
  'Free Wi-Fi': Wifi,
  WiFi: Wifi,
  Wifi: Wifi,
  Restaurant: Utensils,
  Gym: Dumbbell,
  Parking: Car,
  'Room Service': Coffee,
  'Beach Access': Waves,
  'Airport Shuttle': Car,
  'Business Center': Monitor,
  'Kids Club': Users,
  'Breakfast included': Coffee,
  'Free cancellation': Check,
  'Air Conditioning': Snowflake,
  AC: Snowflake,
  'Room service': Coffee,
  Laundry: Coffee,
};

function getAmenityIcon(amenity: string): React.ElementType {
  for (const [key, icon] of Object.entries(AMENITY_ICONS)) {
    if (amenity.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return Check;
}

/* ------------------------------------------------------------------ */
/*  Page Entry                                                         */
/* ------------------------------------------------------------------ */

export default function HotelDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-sea-deep flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gate-gold border-t-transparent" />
      </div>
    }>
      <HotelDetailContent />
    </Suspense>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Content                                                       */
/* ------------------------------------------------------------------ */

function HotelDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const hotelId = params.id as string;

  const checkin = searchParams.get('checkin') || '';
  const checkout = searchParams.get('checkout') || '';
  const roomsParam = Number(searchParams.get('rooms')) || 1;
  const guests = Number(searchParams.get('guests')) || 2;

  const [data, setData] = useState<HotelDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [expandedAmenities, setExpandedAmenities] = useState(false);
  const [expandedPolicies, setExpandedPolicies] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const [roomSelection, setRoomSelection] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await apiRequest<HotelDetailDto>(
          `/api/v1/hotels/${hotelId}?checkin=${checkin}&checkout=${checkout}&rooms=${roomsParam}&guests=${guests}`
        );
        setData(result);
        const initial: Record<string, number> = {};
        result.rooms.forEach(r => { initial[r.roomId] = 0; });
        setRoomSelection(initial);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load hotel details');
      }
      setLoading(false);
    };
    if (hotelId) fetchDetail();
  }, [hotelId, checkin, checkout, roomsParam, guests]);

  const updateRoomCount = (roomId: string, delta: number) => {
    setRoomSelection(prev => {
      const current = prev[roomId] || 0;
      const next = Math.max(0, Math.min(current + delta, 9));
      return { ...prev, [roomId]: next };
    });
  };

  const selectedRooms = useMemo(() => {
    if (!data) return [];
    return data.rooms.filter(r => (roomSelection[r.roomId] || 0) > 0);
  }, [data, roomSelection]);

  const totalSelectedPrice = useMemo(() => {
    return selectedRooms.reduce((sum, r) => sum + r.totalPrice * (roomSelection[r.roomId] || 0), 0);
  }, [selectedRooms, roomSelection]);

  const totalNights = useMemo(() => {
    if (!checkin || !checkout) return 1;
    const diff = new Date(checkout).getTime() - new Date(checkin).getTime();
    return Math.max(1, Math.round(diff / 86400000));
  }, [checkin, checkout]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-sea-deep flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gate-gold border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-dvh bg-sea-deep flex items-center justify-center p-4">
        <div className="bg-harbour border border-monsoon/60 rounded-xl p-8 text-center max-w-md">
          <AlertCircle className="w-10 h-10 text-gate-gold/60 mx-auto mb-3" />
          <p className="text-sm text-paper/80 mb-1">Could not load hotel details</p>
          <p className="text-xs text-sandstone/60 mb-4">{error || 'Hotel not found'}</p>
          <button onClick={() => router.back()} className="text-xs font-medium text-gate-gold hover:text-gate-gold-dim transition-colors">
            Go back
          </button>
        </div>
      </div>
    );
  }

  const displayPhotos = data.photoUrls.length > 0
    ? data.photoUrls
    : ['', '', '', '', ''];

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
                <Hotel className="w-4 h-4 text-gate-gold" />
              </div>
              <span className="font-display text-sm text-paper tracking-wide hidden sm:inline">Mumbai Travel Guru</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 text-xs text-sandstone/70">
            <span className="font-medium text-paper/80 truncate max-w-[160px] sm:max-w-xs">{data.name}</span>
          </div>
        </div>
      </header>

      {/* ========== PHOTO GALLERY ========== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 sm:gap-3 rounded-xl overflow-hidden h-[200px] sm:h-[320px] lg:h-[400px]">
          {/* Main large photo (first) */}
          <div
            className="col-span-2 row-span-2 relative cursor-pointer group"
            onClick={() => setLightboxIndex(0)}
          >
            <div className={`absolute inset-0 bg-gradient-to-br from-gate-gold/20 to-sea-deep ${!displayPhotos[0] ? 'bg-harbour' : ''}`} />
            {displayPhotos[0] ? (
              <img src={displayPhotos[0]} alt={data.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Hotel className="w-12 h-12 text-monsoon-light" />
              </div>
            )}
          </div>
          {/* Photos 2, 3, 4 */}
          {[1, 2, 3].map(idx => (
            <div
              key={idx}
              className="relative cursor-pointer group overflow-hidden"
              onClick={() => setLightboxIndex(idx)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br from-gate-gold/20 to-sea-deep ${!displayPhotos[idx] ? 'bg-harbour' : ''}`} />
              {displayPhotos[idx] ? (
                <img src={displayPhotos[idx]} alt={`${data.name} ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Hotel className="w-6 h-6 text-monsoon-light" />
                </div>
              )}
            </div>
          ))}
          {/* View all overlay */}
          {displayPhotos.length > 4 && (
            <button
              onClick={() => setLightboxIndex(0)}
              className="absolute bottom-3 right-3 bg-sea-deep/80 backdrop-blur-sm border border-monsoon/50 text-paper text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-sea-deep transition-colors z-10 flex items-center gap-1.5"
            >
              <Maximize2 className="w-3 h-3" /> View all photos
            </button>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:gap-8">
          {/* ======== LEFT COLUMN ======== */}
          <div className="space-y-6 sm:space-y-8">
            {/* -------- Hotel Header -------- */}
            <section>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl text-paper leading-tight">{data.name}</h1>
                  <div className="flex items-center gap-1.5 mt-1 text-sandstone/60 text-sm">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{data.address}, {data.city}</span>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${getRatingColor(data.guestRating)}`}>
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-bold text-sm">{data.guestRating.toFixed(1)}</span>
                  <span className="text-[10px] opacity-80">{getRatingLabel(data.guestRating)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-sandstone/50">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < data.starRating ? 'text-gate-gold fill-gate-gold' : 'text-monsoon'}`} />
                  ))}
                </div>
                <span className="text-sandstone/40">&middot;</span>
                <span>{data.reviewCount} review{data.reviewCount !== 1 ? 's' : ''}</span>
                <span className="text-sandstone/40">&middot;</span>
                <span>{data.locality}</span>
              </div>
            </section>

            {/* -------- Description -------- */}
            {data.longDescription && (
              <section>
                <p className="text-sm text-sandstone/70 leading-relaxed">{data.longDescription}</p>
              </section>
            )}

            {/* -------- Amenities -------- */}
            {data.amenities.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-paper mb-3 flex items-center gap-2">
                  <Check className="w-4 h-4 text-gate-gold" /> Amenities
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(expandedAmenities ? data.amenities : data.amenities.slice(0, 9)).map((a, i) => {
                    const Icon = getAmenityIcon(a);
                    return (
                      <div key={i} className="flex items-center gap-2.5 bg-harbour border border-monsoon/50 rounded-lg px-3 py-2.5">
                        <Icon className="w-4 h-4 text-gate-gold shrink-0" />
                        <span className="text-xs text-sandstone/70">{a}</span>
                      </div>
                    );
                  })}
                </div>
                {data.amenities.length > 9 && (
                  <button onClick={() => setExpandedAmenities(v => !v)}
                    className="mt-2 text-xs font-medium text-gate-gold hover:text-gate-gold-dim transition-colors flex items-center gap-1">
                    {expandedAmenities ? 'Show less' : `Show all ${data.amenities.length} amenities`}
                    {expandedAmenities ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </section>
            )}

            {/* -------- Map -------- */}
            <section>
              <h2 className="text-sm font-semibold text-paper mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gate-gold" /> Location
              </h2>
              <div className="bg-harbour border border-monsoon/50 rounded-xl overflow-hidden">
                <SimpleHotelMap latitude={data.latitude} longitude={data.longitude} name={data.name} />
                <div className="px-4 py-3 text-xs text-sandstone/60">
                  <span className="text-paper/80 font-medium">{data.address}</span>
                  <br />
                  {data.city}, {data.country} &middot; {data.locality}
                </div>
              </div>
            </section>

            {/* -------- Policies -------- */}
            <section>
              <h2 className="text-sm font-semibold text-paper mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gate-gold" /> Policies
              </h2>
              <div className="bg-harbour border border-monsoon/50 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-sandstone/50 uppercase tracking-wider font-medium">Check-in</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock className="w-3.5 h-3.5 text-gate-gold" />
                      <span className="text-sm text-paper/80">{data.checkInTime || '2:00 PM'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-sandstone/50 uppercase tracking-wider font-medium">Check-out</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock className="w-3.5 h-3.5 text-gate-gold" />
                      <span className="text-sm text-paper/80">{data.checkOutTime || '11:00 AM'}</span>
                    </div>
                  </div>
                </div>
                {data.policies.length > 0 && (
                  <div className="border-t border-monsoon/40 pt-3">
                    <span className="text-[10px] text-sandstone/50 uppercase tracking-wider font-medium block mb-2">Additional Policies</span>
                    <div className="space-y-1.5">
                      {(expandedPolicies ? data.policies : data.policies.slice(0, 3)).map((p, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-sandstone/70">
                          <ShieldCheck className="w-3.5 h-3.5 text-gate-gold shrink-0 mt-0.5" />
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                    {data.policies.length > 3 && (
                      <button onClick={() => setExpandedPolicies(v => !v)}
                        className="mt-2 text-xs font-medium text-gate-gold hover:text-gate-gold-dim transition-colors flex items-center gap-1">
                        {expandedPolicies ? 'Show less' : `Show all ${data.policies.length} policies`}
                        {expandedPolicies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* -------- Guest Reviews -------- */}
            {data.reviews.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-paper mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-gate-gold" /> Guest Reviews
                </h2>

                {/* Rating summary */}
                <div className="bg-harbour border border-monsoon/50 rounded-xl p-4 sm:p-5 mb-4">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="text-center">
                      <div className="text-3xl sm:text-4xl font-bold text-paper">{data.guestRating.toFixed(1)}</div>
                      <div className="text-[10px] text-sandstone/50 mt-0.5">{getRatingLabel(data.guestRating)}</div>
                    </div>
                    <div className="flex-1 space-y-1">
                      {[5, 4, 3, 2, 1].map(star => {
                        const count = data.reviews.filter(r => Math.round(r.rating) === star).length;
                        const pct = data.reviews.length > 0 ? (count / data.reviews.length) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 text-xs">
                            <span className="text-sandstone/50 w-4 text-right">{star}</span>
                            <Star className="w-3 h-3 text-gate-gold fill-gate-gold" />
                            <div className="flex-1 h-1.5 bg-monsoon/60 rounded-full overflow-hidden">
                              <div className="h-full bg-gate-gold rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-sandstone/50 w-6 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-xs text-sandstone/50 mt-3 pt-3 border-t border-monsoon/40">
                    Based on {data.reviewCount} review{data.reviewCount !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Written reviews */}
                <div className="space-y-3">
                  {(showAllReviews ? data.reviews : data.reviews.slice(0, 3)).map(review => (
                    <div key={review.id} className="bg-harbour border border-monsoon/50 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gate-gold/20 border border-gate-gold/30 flex items-center justify-center text-xs font-bold text-gate-gold">
                            {review.authorName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-sm font-medium text-paper">{review.authorName}</span>
                            <span className="text-[10px] text-sandstone/50 block">{review.travelerType} &middot; {formatDate(review.date)}</span>
                          </div>
                        </div>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${getRatingColor(review.rating)}`}>
                          <Star className="w-2.5 h-2.5 fill-current" /> {review.rating.toFixed(1)}
                        </span>
                      </div>
                      {review.title && (
                        <h4 className="text-sm font-medium text-paper/90 mb-1">{review.title}</h4>
                      )}
                      <p className="text-xs text-sandstone/70 leading-relaxed">{review.body}</p>
                    </div>
                  ))}
                </div>

                {data.reviews.length > 3 && (
                  <button onClick={() => setShowAllReviews(v => !v)}
                    className="mt-3 text-xs font-medium text-gate-gold hover:text-gate-gold-dim transition-colors flex items-center gap-1">
                    {showAllReviews ? 'Show fewer reviews' : `Read all ${data.reviews.length} reviews`}
                    {showAllReviews ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </section>
            )}
          </div>

          {/* ======== RIGHT COLUMN: Room Selection + Booking Summary ======== */}
          <div className="lg:sticky lg:top-20 self-start space-y-4">
            {/* Room selection cards */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-paper flex items-center gap-2">
                <Hotel className="w-4 h-4 text-gate-gold" /> Select Rooms
              </h2>
              {data.rooms.map(room => {
                const count = roomSelection[room.roomId] || 0;
                return (
                  <div key={room.roomId} className={`bg-harbour border rounded-xl transition-all ${count > 0 ? 'border-gate-gold/50 ring-1 ring-gate-gold/20' : 'border-monsoon/50 hover:border-monsoon-light/60'}`}>
                    <div className="p-4">
                      {/* Room type header */}
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-sm font-semibold text-paper">{room.roomType}</h3>
                          <p className="text-xs text-sandstone/60 mt-0.5">{room.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-base font-bold text-gate-gold">
                            <span className="text-[10px] font-body text-sandstone/50">₹</span>
                            {priceINR(room.totalPrice)}
                          </div>
                          <div className="text-[10px] text-sandstone/50">
                            ₹{priceINR(room.pricePerNight)}/night &middot; {totalNights} night{totalNights > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>

                      {/* Occupancy + inclusions */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 text-[10px] text-sandstone/60 bg-sea-deep/50 border border-monsoon/40 px-2 py-0.5 rounded">
                          <Users className="w-3 h-3" /> {room.maxAdults}{room.maxChildren > 0 ? ` + ${room.maxChildren} child` : ''}
                        </span>
                        {room.boardType && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-sandstone/60 bg-sea-deep/50 border border-monsoon/40 px-2 py-0.5 rounded">
                            <Coffee className="w-3 h-3" /> {room.boardType}
                          </span>
                        )}
                        {room.isRefundable && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded">
                            <Check className="w-3 h-3" /> Free cancellation
                          </span>
                        )}
                        {room.totalRoomsAvailable <= 3 && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-gate-gold bg-gate-gold/10 border border-gate-gold/20 px-2 py-0.5 rounded">
                            Only {room.totalRoomsAvailable} left
                          </span>
                        )}
                      </div>

                      {/* Room amenities */}
                      {room.roomAmenities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {room.roomAmenities.map((a, i) => {
                            const Icon = getAmenityIcon(a);
                            return (
                              <span key={i} className="inline-flex items-center gap-1 text-[9px] text-sandstone/50 bg-sea-deep/30 border border-monsoon/30 px-1.5 py-0.5 rounded" title={a}>
                                <Icon className="w-2.5 h-2.5" /> {a}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Cancellation policy */}
                      {room.cancellationPolicy && (
                        <div className="text-[10px] text-sandstone/50 flex items-center gap-1 mb-3">
                          <ShieldCheck className="w-3 h-3" /> {room.cancellationPolicy}
                        </div>
                      )}

                      {/* Quantity selector */}
                      <div className="flex items-center justify-between pt-3 border-t border-monsoon/40">
                        <span className="text-xs text-sandstone/70">
                          {count > 0 ? `${count} room${count > 1 ? 's' : ''} selected` : 'Select rooms'}
                        </span>
                        <div className="flex items-center gap-1">
          <button
            onClick={() => updateRoomCount(room.roomId, -1)}
            disabled={count === 0}
            className="min-w-[44px] min-h-[44px] rounded-lg border border-monsoon/50 text-sandstone/60 hover:text-paper hover:border-monsoon-light/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-lg font-medium"
          >
                            –
                          </button>
                          <span className="w-8 text-center text-sm font-mono text-paper">{count}</span>
          <button
            onClick={() => updateRoomCount(room.roomId, 1)}
            disabled={count >= 9 || count >= room.totalRoomsAvailable}
            className="min-w-[44px] min-h-[44px] rounded-lg border border-monsoon/50 text-sandstone/60 hover:text-paper hover:border-monsoon-light/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-lg font-medium"
          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Booking summary */}
            <div className="bg-harbour border border-monsoon/60 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-paper/80 uppercase tracking-wider mb-3">Booking Summary</h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-sandstone/60">
                  <span>Check-in</span>
                  <span className="text-paper/80 font-medium">{checkin ? formatDate(checkin) : '—'}</span>
                </div>
                <div className="flex justify-between text-sandstone/60">
                  <span>Check-out</span>
                  <span className="text-paper/80 font-medium">{checkout ? formatDate(checkout) : '—'}</span>
                </div>
                <div className="flex justify-between text-sandstone/60">
                  <span>Nights</span>
                  <span className="text-paper/80 font-medium">{totalNights}</span>
                </div>
                <div className="flex justify-between text-sandstone/60">
                  <span>Guests</span>
                  <span className="text-paper/80 font-medium">{guests}</span>
                </div>
              </div>

              {selectedRooms.length > 0 && (
                <div className="mt-3 pt-3 border-t border-monsoon/40 space-y-1.5">
                  {selectedRooms.map(r => (
                    <div key={r.roomId} className="flex justify-between text-xs text-sandstone/60">
                      <span className="truncate max-w-[180px]">{r.roomType} × {roomSelection[r.roomId]}</span>
                      <span className="font-mono text-paper/80">₹{priceINR(r.totalPrice * (roomSelection[r.roomId] || 0))}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-monsoon/40">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-paper">Total</span>
                  <span className="font-mono text-xl font-bold text-gate-gold">₹{priceINR(totalSelectedPrice)}</span>
                </div>
                <div className="text-[10px] text-sandstone/50 mt-0.5">
                  Taxes and fees included
                </div>
              </div>

              <Link
                href={`/hotels/book?hotelId=${data.hotelId}&checkin=${checkin}&checkout=${checkout}&guests=${guests}&rooms=${selectedRooms.map(r => `${r.roomId}:${roomSelection[r.roomId]}`).join(',')}&totalPrice=${totalSelectedPrice}`}
                className={`mt-4 w-full block text-center bg-gate-gold hover:bg-gate-gold-dim text-sea-deep font-bold py-3 rounded-lg transition-colors text-sm ${totalSelectedPrice === 0 ? 'pointer-events-none opacity-40' : ''}`}
                aria-disabled={totalSelectedPrice === 0}
                onClick={e => { if (totalSelectedPrice === 0) e.preventDefault(); }}
              >
                {totalSelectedPrice === 0 ? 'Select a room to continue' : `Proceed to booking — ₹${priceINR(totalSelectedPrice)}`}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ======== LIGHTBOX ======== */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-sea-deep/95 backdrop-blur-md flex items-center justify-center">
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-harbour/80 border border-monsoon/60 text-sandstone hover:text-paper transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <button
            onClick={() => setLightboxIndex(i => i === null ? 0 : Math.max(0, i - 1))}
            disabled={lightboxIndex === 0}
            className="absolute left-4 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-harbour/80 border border-monsoon/60 text-sandstone hover:text-paper transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => setLightboxIndex(i => i === null ? 0 : Math.min(displayPhotos.length - 1, i + 1))}
            disabled={lightboxIndex >= displayPhotos.length - 1}
            className="absolute right-4 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-harbour/80 border border-monsoon/60 text-sandstone hover:text-paper transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-sandstone/50 z-10">
            {lightboxIndex + 1} / {displayPhotos.length}
          </div>

          <div className="w-full h-full flex items-center justify-center p-16">
            {displayPhotos[lightboxIndex] ? (
              <img src={displayPhotos[lightboxIndex]} alt={`${data.name} ${lightboxIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-xl" />
            ) : (
              <div className="bg-harbour rounded-xl w-48 h-48 flex items-center justify-center">
                <Hotel className="w-16 h-16 text-monsoon-light" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Simple Hotel Map (inline SVG)                                      */
/* ------------------------------------------------------------------ */
function SimpleHotelMap({ latitude, longitude, name }: { latitude: number; longitude: number; name: string }) {
  const toX = (lng: number) => ((lng - (longitude - 0.02)) / 0.04) * 100;
  const toY = (lat: number) => ((latitude + 0.02 - lat) / 0.04) * 100;

  return (
    <div className="relative w-full h-[200px] sm:h-[250px] bg-gradient-to-b from-harbour-light/30 to-sea-deep overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line x1="25" y1="0" x2="25" y2="100" stroke="rgba(42,61,77,0.3)" strokeWidth="0.3" />
        <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(42,61,77,0.3)" strokeWidth="0.3" />
        <line x1="75" y1="0" x2="75" y2="100" stroke="rgba(42,61,77,0.3)" strokeWidth="0.3" />
        <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(42,61,77,0.3)" strokeWidth="0.3" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(42,61,77,0.3)" strokeWidth="0.3" />
        <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(42,61,77,0.3)" strokeWidth="0.3" />
      </svg>
      <div
        className="absolute -translate-x-1/2 -translate-y-full transition-transform hover:scale-110"
        style={{ left: `${toX(longitude)}%`, top: `${toY(latitude)}%` }}
      >
        <div className="flex flex-col items-center">
          <div className="bg-gate-gold text-sea-deep text-[9px] font-bold px-2 py-0.5 rounded shadow-lg border border-gate-gold/50 whitespace-nowrap mb-0.5">
            {name}
          </div>
          <div className="w-3 h-3 bg-gate-gold rounded-full border-2 border-sea-deep shadow-md" />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-sea-deep to-transparent" />
    </div>
  );
}
