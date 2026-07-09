'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import {
  Hotel, MapPin, Star, ChevronDown, X, SlidersHorizontal, ArrowUpDown,
  LayoutGrid, List, MapIcon, Wifi, Waves, Coffee, Car, Dumbbell,
  Utensils, Snowflake, Wind, Monitor, Check, AlertCircle, Users, Calendar,
} from 'lucide-react';
import { SkeletonHotelCard } from '@/components/Skeleton';

/* ------------------------------------------------------------------ */
/*  Types (matching backend HotelOfferDto / HotelRoomOfferDto)         */
/* ------------------------------------------------------------------ */
interface HotelRoomOfferDto {
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

interface HotelOfferDto {
  offerId: string;
  hotelId: string;
  name: string;
  description: string;
  city: string;
  country: string;
  address: string;
  latitude: number;
  longitude: number;
  starRating: number;
  guestRating: number;
  reviewCount: number;
  photoUrls: string[];
  amenities: string[];
  policies: string[];
  rooms: HotelRoomOfferDto[];
  totalPrice: number;
  currency: string;
  priceExpiryUtc: string;
}

type SortMode = 'price-asc' | 'price-desc' | 'rating' | 'stars';
type ViewMode = 'grid' | 'list';
type PropertyType = 'hotel' | 'resort' | 'apartment' | 'hostel' | 'boutique';

const AMENITY_ICONS: Record<string, React.ElementType> = {
  Pool: Waves,
  Spa: Wind,
  'Free WiFi': Wifi,
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
};

const PROPERTY_TYPES: { id: PropertyType; label: string }[] = [
  { id: 'hotel', label: 'Hotel' },
  { id: 'resort', label: 'Resort' },
  { id: 'apartment', label: 'Apartment' },
  { id: 'hostel', label: 'Hostel' },
  { id: 'boutique', label: 'Boutique' },
];

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

function formatDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function priceINR(price: number) {
  return price.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function inferPropertyType(name: string, amenities: string[]): PropertyType {
  const n = name.toLowerCase();
  const a = amenities.map((x) => x.toLowerCase());
  if (n.includes('resort') || a.includes('beach access') || a.includes('water sports')) return 'resort';
  if (n.includes('hostel') || n.includes('backpacker')) return 'hostel';
  if (n.includes('apartment') || n.includes('service apartment')) return 'apartment';
  if (n.includes('boutique') || a.includes('butler service')) return 'boutique';
  return 'hotel';
}

/* ------------------------------------------------------------------ */
/*  Page Entry                                                         */
/* ------------------------------------------------------------------ */
export default function HotelSearchPage() {
  return (
    <div className="min-h-dvh bg-sea-deep">
      <Suspense fallback={<div className="p-8 text-center text-sandstone/60 text-sm">Loading search results...</div>}>
        <HotelSearchContent />
      </Suspense>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Content                                                       */
/* ------------------------------------------------------------------ */
function HotelSearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const city = searchParams.get('city') || '';
  const checkin = searchParams.get('checkin') || '';
  const checkout = searchParams.get('checkout') || '';
  const roomsParam = Number(searchParams.get('rooms')) || 1;
  const guests = Number(searchParams.get('guests')) || 2;

  /* ---- data ---- */
  const [offers, setOffers] = useState<HotelOfferDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* ---- filters ---- */
  const [priceMax, setPriceMax] = useState(50000);
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [minGuestRating, setMinGuestRating] = useState<number | null>(null);
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<PropertyType | null>(null);
  const [amenityFilter, setAmenityFilter] = useState<Set<string>>(new Set());
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  /* ---- view state ---- */
  const [sortMode, setSortMode] = useState<SortMode>('price-asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showMap, setShowMap] = useState(false);

  /* ---- fetch ---- */
  useEffect(() => {
    const fetchHotels = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ city, checkIn: checkin, checkOut: checkout });
        if (roomsParam > 1) params.set('rooms', String(roomsParam));
        if (guests > 1) params.set('adults', String(guests));
        const data = await apiRequest<HotelOfferDto[]>(`/api/v1/hotels/search?${params}`);
        setOffers(data);
        if (data.length > 0) {
          setPriceMax(Math.max(...data.map((o) => o.totalPrice)));
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Search failed');
      }
      setLoading(false);
    };
    if (city) fetchHotels();
    else setLoading(false);
  }, [city, checkin, checkout, roomsParam, guests]);

  /* ---- derived ---- */
  const maxPrice = useMemo(
    () => Math.max(...offers.map((o) => o.totalPrice), 99999),
    [offers],
  );
  const amenityOptions = useMemo(() => {
    const all = new Set<string>();
    offers.forEach((o) => o.amenities.forEach((a) => all.add(a)));
    return [...all].sort();
  }, [offers]);

  const toggleAmenity = useCallback((a: string) => {
    setAmenityFilter((prev) => {
      const next = new Set(prev);
      if (next.has(a)) next.delete(a);
      else next.add(a);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setPriceMax(maxPrice);
    setStarFilter(null);
    setMinGuestRating(null);
    setPropertyTypeFilter(null);
    setAmenityFilter(new Set());
  }, [maxPrice]);

  const hasActiveFilters =
    starFilter !== null ||
    minGuestRating !== null ||
    propertyTypeFilter !== null ||
    amenityFilter.size > 0 ||
    priceMax < maxPrice;

  /* ---- filter & sort ---- */
  const filtered = useMemo(() => {
    let results = [...offers];

    if (priceMax < maxPrice) results = results.filter((o) => o.totalPrice <= priceMax);
    if (starFilter !== null) results = results.filter((o) => o.starRating === starFilter);
    if (minGuestRating !== null) results = results.filter((o) => o.guestRating >= minGuestRating);
    if (propertyTypeFilter !== null) {
      results = results.filter(
        (o) => inferPropertyType(o.name, o.amenities) === propertyTypeFilter,
      );
    }
    if (amenityFilter.size > 0) {
      results = results.filter((o) =>
        [...amenityFilter].every((a) => o.amenities.includes(a)),
      );
    }

    if (sortMode === 'price-asc') results.sort((a, b) => a.totalPrice - b.totalPrice);
    else if (sortMode === 'price-desc') results.sort((a, b) => b.totalPrice - a.totalPrice);
    else if (sortMode === 'rating') results.sort((a, b) => b.guestRating - a.guestRating);
    else if (sortMode === 'stars') results.sort((a, b) => b.starRating - a.starRating);

    return results;
  }, [offers, priceMax, maxPrice, starFilter, minGuestRating, propertyTypeFilter, amenityFilter, sortMode]);

  /* ---- map bounds ---- */
  const mapBounds = useMemo(() => {
    if (filtered.length === 0) return null;
    const lats = filtered.map((o) => o.latitude);
    const lngs = filtered.map((o) => o.longitude);
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
      padding: 0.05,
    };
  }, [filtered]);

  return (
    <>
      {/* -------- Header -------- */}
      <header className="sticky top-0 z-30 border-b border-monsoon/60 bg-sea-deep/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-gate-gold/15 p-1 rounded-lg">
              <Hotel className="w-4 h-4 text-gate-gold" />
            </div>
            <span className="font-display text-sm text-paper tracking-wide hidden sm:inline">
              Mumbai Travel Guru
            </span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-sandstone/70">
            <MapPin className="w-3 h-3 text-gate-gold" />
            <span className="font-medium text-paper/80">{city}</span>
            <span className="hidden sm:inline text-sandstone/40">&middot;</span>
            <span className="hidden sm:inline text-sandstone/50">
              {formatDate(checkin)} – {formatDate(checkout)}
            </span>
            <span className="hidden sm:inline text-sandstone/40">&middot;</span>
            <span className="hidden sm:inline text-sandstone/50">
              {roomsParam} room{roomsParam > 1 ? 's' : ''}, {guests} guest{guests > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* -------- Page title -------- */}
        <div className="mb-4 sm:mb-5">
          <h1 className="font-display text-xl sm:text-2xl text-paper">
            Hotels in {city}
          </h1>
          <p className="text-xs sm:text-sm text-sandstone/60 mt-0.5">
            {formatDate(checkin)} – {formatDate(checkout)}
            {' '}&middot; {roomsParam} room{roomsParam > 1 ? 's' : ''}, {guests} guest{guests > 1 ? 's' : ''}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5 lg:gap-6 items-start">
          {/* ======== FILTER SIDEBAR ======== */}
          <FilterPanel
            priceMax={priceMax}
            setPriceMax={setPriceMax}
            maxPrice={maxPrice}
            starFilter={starFilter}
            setStarFilter={setStarFilter}
            minGuestRating={minGuestRating}
            setMinGuestRating={setMinGuestRating}
            propertyTypeFilter={propertyTypeFilter}
            setPropertyTypeFilter={setPropertyTypeFilter}
            amenityOptions={amenityOptions}
            amenityFilter={amenityFilter}
            toggleAmenity={toggleAmenity}
            hasActiveFilters={hasActiveFilters}
            clearFilters={clearFilters}
            className="hidden lg:block"
          />

          {/* ======== RESULTS ======== */}
          <div className="space-y-3 sm:space-y-4 min-w-0">
            {/* Sort bar */}
            <SortBar
              totalCount={filtered.length}
              sortMode={sortMode}
              setSortMode={setSortMode}
              viewMode={viewMode}
              setViewMode={setViewMode}
              showMap={showMap}
              setShowMap={setShowMap}
              onToggleMobileFilters={() => setShowMobileFilters(true)}
            />

            {/* Loading */}
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 py-4">
                {[1, 2, 3, 4].map(i => <SkeletonHotelCard key={i} />)}
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="bg-harbour border border-monsoon/60 rounded-xl p-8 text-center max-w-lg mx-auto">
                <AlertCircle className="w-10 h-10 text-gate-gold/60 mx-auto mb-3" />
                <p className="text-sm text-paper/80 mb-1">Search failed</p>
                <p className="text-xs text-sandstone/60">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 text-xs font-medium text-gate-gold hover:text-gate-gold-dim transition-colors"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && filtered.length === 0 && (
              <div className="bg-harbour border border-monsoon/60 rounded-xl p-8 sm:p-10 text-center max-w-lg mx-auto">
                <div className="bg-gate-gold/10 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                  <Hotel className="w-6 h-6 text-gate-gold/60" />
                </div>
                <h2 className="text-base font-semibold text-paper mb-2">No hotels match these filters</h2>
                <p className="text-xs text-sandstone/60 leading-relaxed mb-5">
                  {offers.length > 0
                    ? `We found ${offers.length} hotel${offers.length !== 1 ? 's' : ''} in ${city}, but none match your current filters. Try adjusting your price range or star rating.`
                    : `We couldn't find any hotels in ${city} for these dates. Try a different city or check back later.`}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {hasActiveFilters && (
                    <button onClick={clearFilters}
                      className="text-xs font-medium bg-gate-gold/10 text-gate-gold border border-gate-gold/20 hover:bg-gate-gold/20 rounded-lg px-4 py-2 transition-colors">
                      Clear all filters
                    </button>
                  )}
                  {offers.length === 0 && (
                    <Link href="/hotels"
                      className="text-xs font-medium text-sandstone/60 border border-monsoon/50 hover:border-monsoon-light/60 rounded-lg px-4 py-2 transition-colors">
                      Modify search
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Map view */}
            {!loading && !error && showMap && filtered.length > 0 && mapBounds && (
              <div className="mb-4">
                <SimpleMap offers={filtered} bounds={mapBounds} />
              </div>
            )}

            {/* Results */}
            {!loading && !error && filtered.length > 0 && (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'
                    : 'space-y-3 sm:space-y-4'
                }
              >
                {filtered.map((offer) => (
                  <HotelCard
                    key={offer.offerId}
                    offer={offer}
                    viewMode={viewMode}
                    checkin={checkin}
                    checkout={checkout}
                    rooms={roomsParam}
                    guests={guests}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile filter drawer */}
      {showMobileFilters && (
        <MobileFilterDrawer onClose={() => setShowMobileFilters(false)}>
          <FilterPanel
            priceMax={priceMax}
            setPriceMax={setPriceMax}
            maxPrice={maxPrice}
            starFilter={starFilter}
            setStarFilter={setStarFilter}
            minGuestRating={minGuestRating}
            setMinGuestRating={setMinGuestRating}
            propertyTypeFilter={propertyTypeFilter}
            setPropertyTypeFilter={setPropertyTypeFilter}
            amenityOptions={amenityOptions}
            amenityFilter={amenityFilter}
            toggleAmenity={toggleAmenity}
            hasActiveFilters={hasActiveFilters}
            clearFilters={clearFilters}
          />
        </MobileFilterDrawer>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Filter Panel                                                       */
/* ------------------------------------------------------------------ */
function FilterPanel({
  priceMax, setPriceMax, maxPrice,
  starFilter, setStarFilter,
  minGuestRating, setMinGuestRating,
  propertyTypeFilter, setPropertyTypeFilter,
  amenityOptions, amenityFilter, toggleAmenity,
  hasActiveFilters, clearFilters, className,
}: {
  priceMax: number; setPriceMax: (v: number) => void; maxPrice: number;
  starFilter: number | null; setStarFilter: (v: number | null) => void;
  minGuestRating: number | null; setMinGuestRating: (v: number | null) => void;
  propertyTypeFilter: PropertyType | null; setPropertyTypeFilter: (v: PropertyType | null) => void;
  amenityOptions: string[]; amenityFilter: Set<string>; toggleAmenity: (v: string) => void;
  hasActiveFilters: boolean; clearFilters: () => void;
  className?: string;
}) {
  return (
    <aside className={`space-y-4 ${className ?? ''}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-paper/80 uppercase tracking-wider flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-gate-gold" /> Filters
        </h3>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-[10px] text-gate-gold hover:text-gate-gold-dim font-medium transition-colors">
            Clear all
          </button>
        )}
      </div>

      {/* Price */}
      <div className="bg-harbour border border-monsoon/50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-sandstone/70 font-medium">Price per night</span>
          <span className="font-mono text-sm font-bold text-gate-gold">₹{priceINR(priceMax)}</span>
        </div>
        <input type="range" min={500} max={maxPrice} step={500} value={priceMax}
          onChange={(e) => setPriceMax(Number(e.target.value))}
          className="w-full accent-gate-gold h-1.5 rounded-full appearance-none bg-monsoon/60
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gate-gold
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-sea-deep [&::-webkit-slider-thumb]:shadow-md"
        />
        <div className="flex justify-between text-[10px] text-sandstone/40 mt-1">
          <span>₹500</span>
          <span>₹{priceINR(maxPrice)}+</span>
        </div>
      </div>

      {/* Star rating */}
      <div className="bg-harbour border border-monsoon/50 rounded-xl p-4">
        <span className="text-xs text-sandstone/70 font-medium block mb-2.5">Star rating</span>
        <div className="flex flex-wrap gap-1.5">
          {[5, 4, 3, 2, 1].map((n) => (
            <button key={n} onClick={() => setStarFilter(starFilter === n ? null : n)}
              className={`px-3 py-2 text-[11px] font-medium rounded-lg border transition-colors flex items-center gap-1 ${
                starFilter === n
                  ? 'bg-gate-gold/15 border-gate-gold/40 text-gate-gold'
                  : 'bg-sea-deep border-monsoon/50 text-sandstone/60 hover:border-monsoon-light/60'
              }`}
            >
              {n} <Star className="w-3 h-3 fill-current" />
            </button>
          ))}
        </div>
      </div>

      {/* Guest rating */}
      <div className="bg-harbour border border-monsoon/50 rounded-xl p-4">
        <span className="text-xs text-sandstone/70 font-medium block mb-2.5">Guest rating</span>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: '6+ Good', value: 6 },
            { label: '7+ Very Good', value: 7 },
            { label: '8+ Excellent', value: 8 },
            { label: '9+ Outstanding', value: 9 },
          ].map((r) => (
            <button key={r.value} onClick={() => setMinGuestRating(minGuestRating === r.value ? null : r.value)}
              className={`px-3 py-2 text-[11px] font-medium rounded-lg border transition-colors ${
                minGuestRating === r.value
                  ? 'bg-gate-gold/15 border-gate-gold/40 text-gate-gold'
                  : 'bg-sea-deep border-monsoon/50 text-sandstone/60 hover:border-monsoon-light/60'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Property type */}
      <div className="bg-harbour border border-monsoon/50 rounded-xl p-4">
        <span className="text-xs text-sandstone/70 font-medium block mb-2.5">Property type</span>
        <div className="flex flex-wrap gap-1.5">
          {PROPERTY_TYPES.map((t) => (
            <button key={t.id} onClick={() => setPropertyTypeFilter(propertyTypeFilter === t.id ? null : t.id)}
              className={`px-3 py-2 text-[11px] font-medium rounded-lg border transition-colors ${
                propertyTypeFilter === t.id
                  ? 'bg-gate-gold/15 border-gate-gold/40 text-gate-gold'
                  : 'bg-sea-deep border-monsoon/50 text-sandstone/60 hover:border-monsoon-light/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Amenities */}
      {amenityOptions.length > 0 && (
        <div className="bg-harbour border border-monsoon/50 rounded-xl p-4">
          <span className="text-xs text-sandstone/70 font-medium block mb-2.5">Amenities</span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {amenityOptions.map((name) => (
              <label key={name}
                className="flex items-center gap-2.5 px-1 py-1.5 rounded-md cursor-pointer hover:bg-sea-deep/50 transition-colors"
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                  amenityFilter.has(name) ? 'bg-gate-gold border-gate-gold' : 'border-monsoon/60 bg-transparent'
                }`}>
                  {amenityFilter.has(name) && <Check className="w-3 h-3 text-sea-deep" />}
                </div>
                <input type="checkbox" checked={amenityFilter.has(name)}
                  onChange={() => toggleAmenity(name)} className="sr-only" />
                <span className="text-xs text-sandstone/70">{name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/*  Sort Bar                                                           */
/* ------------------------------------------------------------------ */
function SortBar({
  totalCount, sortMode, setSortMode, viewMode, setViewMode,
  showMap, setShowMap, onToggleMobileFilters,
}: {
  totalCount: number; sortMode: SortMode; setSortMode: (m: SortMode) => void;
  viewMode: ViewMode; setViewMode: (v: ViewMode) => void;
  showMap: boolean; setShowMap: (v: boolean | ((prev: boolean) => boolean)) => void;
  onToggleMobileFilters: () => void;
}) {
  return (
    <div className="sticky top-14 z-20 -mx-4 sm:mx-0 px-4 sm:px-0 py-2 bg-sea-deep/90 backdrop-blur-sm border-b border-monsoon/30 flex items-center justify-between gap-3">
      <div className="flex items-center gap-1.5 sm:gap-3">
        <span className="text-xs sm:text-sm font-medium text-paper/80 whitespace-nowrap">
          {totalCount} hotel{totalCount !== 1 ? 's' : ''}
        </span>
        <div className="hidden sm:flex items-center gap-1 bg-harbour border border-monsoon/50 rounded-lg p-0.5">
          {([
            { id: 'price-asc' as SortMode, label: 'Price: Low' },
            { id: 'price-desc' as SortMode, label: 'Price: High' },
            { id: 'rating' as SortMode, label: 'Guest Rating' },
            { id: 'stars' as SortMode, label: 'Star Rating' },
          ]).map((s) => (
            <button key={s.id} onClick={() => setSortMode(s.id)}
              className={`px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-all ${
                sortMode === s.id ? 'bg-gate-gold/15 text-gate-gold' : 'text-sandstone/50 hover:text-sandstone/80'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="flex bg-harbour border border-monsoon/50 rounded-lg p-0.5">
          <button onClick={() => setViewMode('grid')}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md transition-all ${viewMode === 'grid' ? 'bg-gate-gold/15 text-gate-gold' : 'text-sandstone/50 hover:text-sandstone/80'}`}
            aria-label="Grid view">
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('list')}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md transition-all ${viewMode === 'list' ? 'bg-gate-gold/15 text-gate-gold' : 'text-sandstone/50 hover:text-sandstone/80'}`}
            aria-label="List view">
            <List className="w-4 h-4" />
          </button>
        </div>
        <button onClick={() => setShowMap((v) => !v)}
          className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border transition-all ${
            showMap
              ? 'bg-gate-gold/15 border-gate-gold/40 text-gate-gold'
              : 'border-monsoon/50 text-sandstone/50 hover:text-sandstone/80'
          }`}
          aria-label="Toggle map">
          <MapIcon className="w-4 h-4" />
        </button>
        <button onClick={onToggleMobileFilters}
          className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-sandstone/60 hover:text-sandstone border border-monsoon/50 rounded-lg transition-colors"
          aria-label="Filters">
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hotel Card                                                         */
/* ------------------------------------------------------------------ */
function HotelCard({
  offer, viewMode, checkin, checkout, rooms, guests,
}: {
  offer: HotelOfferDto; viewMode: ViewMode;
  checkin: string; checkout: string; rooms: number; guests: number;
}) {
  const firstRoom = offer.rooms[0];
  const pricePerNight = firstRoom?.pricePerNight ?? offer.totalPrice;
  const propertyType = inferPropertyType(offer.name, offer.amenities);
  const nights = checkout && checkin
    ? Math.max(1, (new Date(checkout).getTime() - new Date(checkin).getTime()) / (1000 * 60 * 60 * 24))
    : 1;

  const cardContent = (
    <div className="flex flex-col h-full">
      {/* Photo area */}
      <div className={`relative ${viewMode === 'grid' ? 'h-36 sm:h-44' : 'h-28 sm:h-36'} rounded-t-xl overflow-hidden bg-gradient-to-br from-harbour-light/60 to-sea-deep`}>
        {offer.photoUrls.length > 0 ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${offer.photoUrls[0]})` }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Hotel className="w-10 h-10 text-monsoon-light/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-sea-deep/70 via-transparent to-transparent" />
        {/* Property type badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className="text-[10px] font-medium text-paper/80 bg-sea-deep/70 border border-monsoon/50 rounded-md px-2 py-0.5 uppercase tracking-wider">
            {propertyType}
          </span>
        </div>
        {/* Star rating */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className={`w-3 h-3 ${i < offer.starRating ? 'text-gate-gold fill-gate-gold' : 'text-monsoon-light/50'}`} />
          ))}
        </div>
        {/* Price overlay (mobile) */}
        <div className={`absolute bottom-2.5 right-2.5 ${viewMode === 'grid' ? '' : 'sm:hidden'}`}>
          <div className="text-right">
            <div className="font-mono text-lg font-bold text-gate-gold drop-shadow-lg">
              ₹{priceINR(pricePerNight)}
            </div>
            <div className="text-[9px] text-paper/70 drop-shadow">per night</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className={`flex-1 p-3 sm:p-4 flex flex-col ${viewMode === 'list' ? 'sm:flex-row sm:gap-4' : ''}`}>
        <div className={`flex-1 ${viewMode === 'list' ? 'sm:flex sm:flex-col sm:justify-center' : ''}`}>
          {/* Name + locality */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-semibold text-paper leading-snug line-clamp-1">{offer.name}</h3>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-sandstone/50 mb-2">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{offer.address}</span>
          </div>

          {/* Guest rating */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${getRatingColor(offer.guestRating)}`}>
              {offer.guestRating.toFixed(1)}
            </span>
            <div>
              <span className="text-[11px] font-medium text-paper/80">{getRatingLabel(offer.guestRating)}</span>
              <span className="text-[10px] text-sandstone/50 ml-1">({offer.reviewCount} reviews)</span>
            </div>
          </div>

          {/* Amenities chips */}
          <div className="flex flex-wrap gap-1 mb-2">
            {offer.amenities.slice(0, 4).map((a) => (
              <span key={a} className="text-[9px] text-sandstone/60 bg-sea-deep border border-monsoon/50 rounded px-1.5 py-0.5 flex items-center gap-1">
                {AMENITY_ICONS[a] && React.createElement(AMENITY_ICONS[a], { className: 'w-2.5 h-2.5' })}
                {a}
              </span>
            ))}
            {offer.amenities.length > 4 && (
              <span className="text-[9px] text-sandstone/50">+{offer.amenities.length - 4}</span>
            )}
          </div>

          {/* Room type hint */}
          {firstRoom && (
            <div className="text-[10px] text-sandstone/50 mb-2">
              {firstRoom.roomType}
              {firstRoom.boardType !== 'Room Only' && ` · ${firstRoom.boardType}`}
              {firstRoom.isRefundable && ' · Free cancellation'}
            </div>
          )}
        </div>

        {/* Price + CTA */}
        <div className={`flex items-center justify-between sm:flex-col sm:items-end sm:justify-end sm:min-w-[120px] gap-2 ${
          viewMode === 'list' ? 'sm:border-l sm:border-monsoon/40 sm:pl-4' : 'border-t border-monsoon/30 pt-3 mt-auto'
        }`}>
          <div className={`${viewMode === 'grid' ? 'hidden sm:block' : 'sm:block'}`}>
            <div className="text-right">
              <div className="font-mono text-xl sm:text-2xl font-bold text-gate-gold tracking-tight">
                <span className="text-sm font-body text-sandstone/50">₹</span>
                {priceINR(pricePerNight)}
              </div>
              <div className="text-[10px] text-sandstone/50">per night</div>
              <div className="text-[9px] text-sandstone/40">
                ₹{priceINR(pricePerNight * nights)} total
                {firstRoom?.roomAmenities.includes('Breakfast') ? '' : ' · taxes excluded'}
              </div>
            </div>
          </div>
          <Link
            href={`/hotels/${offer.hotelId}?checkin=${checkin}&checkout=${checkout}&rooms=${rooms}&guests=${guests}`}
            className="inline-block bg-gate-gold hover:bg-gate-gold-dim text-sea-deep font-bold text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap text-center"
          >
            View details
          </Link>
        </div>
      </div>
    </div>
  );

  if (viewMode === 'list') {
    return (
      <div className="bg-harbour border border-monsoon/50 hover:border-monsoon-light/60 rounded-xl overflow-hidden transition-all">
        <div className="flex flex-col sm:flex-row">
          <div className={`sm:w-48 lg:w-56 shrink-0 ${viewMode === 'list' ? 'rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none' : ''}`}>
            {/* Photo area for list view */}
            <div className="h-full min-h-[120px] bg-gradient-to-br from-harbour-light/60 to-sea-deep relative overflow-hidden">
              {offer.photoUrls.length > 0 ? (
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${offer.photoUrls[0]})` }} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Hotel className="w-8 h-8 text-monsoon-light/50" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-sea-deep/50 via-transparent to-transparent" />
              <div className="absolute top-2 left-2">
                <span className="text-[10px] font-medium text-paper/80 bg-sea-deep/70 border border-monsoon/50 rounded-md px-2 py-0.5 uppercase tracking-wider">
                  {propertyType}
                </span>
              </div>
              <div className="absolute top-2 right-2 flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className={`w-2.5 h-2.5 ${i < offer.starRating ? 'text-gate-gold fill-gate-gold' : 'text-monsoon-light/50'}`} />
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col sm:flex-row">
            <div className="flex-1 p-3 sm:p-4">
              <h3 className="text-sm font-semibold text-paper leading-snug mb-1">{offer.name}</h3>
              <div className="flex items-center gap-1 text-[10px] text-sandstone/50 mb-2">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{offer.address}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${getRatingColor(offer.guestRating)}`}>
                  {offer.guestRating.toFixed(1)}
                </span>
                <div>
                  <span className="text-[11px] font-medium text-paper/80">{getRatingLabel(offer.guestRating)}</span>
                  <span className="text-[10px] text-sandstone/50 ml-1">({offer.reviewCount} reviews)</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {offer.amenities.slice(0, 3).map((a) => (
                  <span key={a} className="text-[9px] text-sandstone/60 bg-sea-deep border border-monsoon/50 rounded px-1.5 py-0.5">{a}</span>
                ))}
                {offer.amenities.length > 3 && <span className="text-[9px] text-sandstone/50">+{offer.amenities.length - 3}</span>}
              </div>
            </div>
            <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-2 p-3 sm:p-4 sm:border-l sm:border-monsoon/40 sm:min-w-[140px]">
              <div className="text-right">
                <div className="font-mono text-lg sm:text-xl font-bold text-gate-gold">
                  <span className="text-xs font-body text-sandstone/50">₹</span>
                  {priceINR(pricePerNight)}
                </div>
                <div className="text-[10px] text-sandstone/50">per night</div>
              </div>
              <Link               href={`/hotels/${offer.hotelId}?checkin=${checkin}&checkout=${checkout}&rooms=${rooms}&guests=${guests}`}
                className="inline-block bg-gate-gold hover:bg-gate-gold-dim text-sea-deep font-bold text-xs px-5 py-2.5 rounded-lg transition-colors text-center">
                View details
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link href={`/hotels/${offer.hotelId}?checkin=${checkin}&checkout=${checkout}&rooms=${rooms}&guests=${guests}`}
      className="bg-harbour border border-monsoon/50 hover:border-monsoon-light/60 rounded-xl overflow-hidden transition-all block group">
      {cardContent}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Simple Map (lat/lng pin visualization)                             */
/* ------------------------------------------------------------------ */
function SimpleMap({ offers, bounds }: { offers: HotelOfferDto[]; bounds: NonNullable<ReturnType<typeof useMemo<{ minLat: number; maxLat: number; minLng: number; maxLng: number; padding: number }>>>; }) {
  const pad = bounds.padding;
  const latRange = bounds.maxLat - bounds.minLat + pad * 2 || 1;
  const lngRange = bounds.maxLng - bounds.minLng + pad * 2 || 1;

  const toX = (lng: number) => ((lng - (bounds.minLng - pad)) / lngRange) * 100;
  const toY = (lat: number) => ((bounds.maxLat + pad - lat) / latRange) * 100;

  return (
    <div className="bg-harbour border border-monsoon/50 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-monsoon/40 flex items-center gap-2">
        <MapIcon className="w-3.5 h-3.5 text-gate-gold" />
        <span className="text-xs font-medium text-paper/80">Map view</span>
        <span className="text-[10px] text-sandstone/50 ml-auto">{offers.length} hotel{offers.length !== 1 ? 's' : ''} shown</span>
      </div>
      <div className="relative w-full h-[300px] sm:h-[400px] bg-gradient-to-b from-harbour-light/30 to-sea-deep overflow-hidden">
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="25" y1="0" x2="25" y2="100" stroke="rgba(42,61,77,0.3)" strokeWidth="0.3" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(42,61,77,0.3)" strokeWidth="0.3" />
          <line x1="75" y1="0" x2="75" y2="100" stroke="rgba(42,61,77,0.3)" strokeWidth="0.3" />
          <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(42,61,77,0.3)" strokeWidth="0.3" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(42,61,77,0.3)" strokeWidth="0.3" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(42,61,77,0.3)" strokeWidth="0.3" />
        </svg>

        {/* Pins */}
        {offers.map((o) => {
          const x = toX(o.longitude);
          const y = toY(o.latitude);
          return (
            <div
              key={o.offerId}
              className="absolute -translate-x-1/2 -translate-y-full transition-transform hover:scale-110"
              style={{ left: `${x}%`, top: `${y}%` }}
              title={`${o.name} — ₹${priceINR(o.rooms[0]?.pricePerNight ?? o.totalPrice)}/night`}
            >
              <div className="flex flex-col items-center">
                <div className="bg-gate-gold text-sea-deep text-[9px] font-bold px-2 py-0.5 rounded shadow-lg border border-gate-gold/50 whitespace-nowrap mb-0.5">
                  ₹{priceINR(o.rooms[0]?.pricePerNight ?? o.totalPrice)}
                </div>
                <div className="w-3 h-3 bg-gate-gold rounded-full border-2 border-sea-deep shadow-md" />
              </div>
            </div>
          );
        })}

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-sea-deep to-transparent" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile Filter Drawer                                               */
/* ------------------------------------------------------------------ */
function MobileFilterDrawer({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-sea-deep/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] bg-sea-deep border-t border-monsoon/60 rounded-t-2xl overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-sea-deep border-b border-monsoon/40 px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-paper">Filters</span>
          <button onClick={onClose} className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-monsoon/50 text-sandstone/60 hover:text-sandstone transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

/* Need React for createElement in amenity icons */
import React from 'react';
