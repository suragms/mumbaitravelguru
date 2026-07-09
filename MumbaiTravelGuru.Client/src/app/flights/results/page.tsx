'use client';

import { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { getAirport } from '@/lib/airports';
import {
  Plane, Filter, Clock, AlertCircle, ChevronDown, X, SlidersHorizontal,
  ArrowRightLeft, Luggage, Wifi, Utensils, ArrowUpDown, Check,
} from 'lucide-react';
import { SkeletonCard } from '@/components/Skeleton';

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

type SortMode = 'cheapest' | 'fastest' | 'best';
type TimeBucket = 'morning' | 'afternoon' | 'evening' | 'night';
type DurationBucket = 'short' | 'medium' | 'long' | 'xlong';

const TIME_BUCKETS: { id: TimeBucket; label: string; range: [number, number] }[] = [
  { id: 'morning', label: 'Morning', range: [6, 12] },
  { id: 'afternoon', label: 'Afternoon', range: [12, 18] },
  { id: 'evening', label: 'Evening', range: [18, 24] },
  { id: 'night', label: 'Night', range: [0, 6] },
];

const DURATION_BUCKETS: { id: DurationBucket; label: string; max: number }[] = [
  { id: 'short', label: 'Under 2h', max: 120 },
  { id: 'medium', label: '2h – 4h', max: 240 },
  { id: 'long', label: '4h – 6h', max: 360 },
  { id: 'xlong', label: '6h+', max: Infinity },
];

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

function getTimeBucket(iso: string): TimeBucket {
  const h = new Date(iso).getHours();
  const b = TIME_BUCKETS.find((b) => h >= b.range[0] && h < b.range[1]);
  return b?.id ?? 'morning';
}

function getDurationBucket(minutes: number): DurationBucket {
  const b = DURATION_BUCKETS.find((b) => minutes < b.max);
  return b?.id ?? 'xlong';
}

/* ------------------------------------------------------------------ */
/*  Page Entry                                                         */
/* ------------------------------------------------------------------ */
export default function FlightResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-sea-deep flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gate-gold border-t-transparent" />
        </div>
      }
    >
      <FlightResultsContent />
    </Suspense>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Results Content                                               */
/* ------------------------------------------------------------------ */
function FlightResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
  const departDate = searchParams.get('departDate') || '';
  const returnDate = searchParams.get('returnDate') || '';
  const tripType = searchParams.get('tripType') || 'OneWay';
  const adults = Number(searchParams.get('adults')) || 1;
  const cabinClass = searchParams.get('cabinClass') || 'Economy';

  /* ---- data ---- */
  const [offers, setOffers] = useState<FlightOfferDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* ---- filters ---- */
  const [priceMax, setPriceMax] = useState(99999);
  const [stopsFilter, setStopsFilter] = useState<number | null>(null);
  const [airlineFilters, setAirlineFilters] = useState<Set<string>>(new Set());
  const [timeBuckets, setTimeBuckets] = useState<Set<TimeBucket>>(new Set());
  const [durationBuckets, setDurationBuckets] = useState<Set<DurationBucket>>(new Set());
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  /* ---- sort & compare ---- */
  const [sortMode, setSortMode] = useState<SortMode>('cheapest');
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);

  /* ---- fetch ---- */
  useEffect(() => {
    const fetchFlights = async () => {
      setLoading(true);
      setError('');
      try {
        const destinations = destination;
        const departureDates = departDate + (returnDate ? `,${returnDate}` : '');
        const data = await apiRequest<FlightOfferDto[]>(
          `/api/v1/flights/search?origin=${origin}&destinations=${destinations}&departureDates=${departureDates}&adults=${adults}&cabinClass=${cabinClass}&tripType=${tripType}`
        );
        setOffers(data);
        if (data.length > 0) {
          const prices = data.map((o) => o.totalPrice);
          setPriceMax(Math.max(...prices));
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Search failed');
      }
      setLoading(false);
      setCompareIds(new Set());
      setShowCompare(false);
    };
    if (origin && destination) fetchFlights();
    else setLoading(false);
  }, [origin, destination, departDate, returnDate, tripType, adults, cabinClass]);

  /* ---- derived ---- */
  const airlines = useMemo(() => [...new Set(offers.map((o) => o.airline))].sort(), [offers]);
  const priceRange = useMemo(() => {
    const prices = offers.map((o) => o.totalPrice);
    return { min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 99999 };
  }, [offers]);
  const absoluteMaxPrice = useMemo(() => Math.max(priceRange.max, 99999), [priceRange.max]);

  const toggleAirline = useCallback((name: string) => {
    setAirlineFilters((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const toggleTimeBucket = useCallback((b: TimeBucket) => {
    setTimeBuckets((prev) => {
      const next = new Set(prev);
      if (next.has(b)) next.delete(b);
      else next.add(b);
      return next;
    });
  }, []);

  const toggleDurationBucket = useCallback((b: DurationBucket) => {
    setDurationBuckets((prev) => {
      const next = new Set(prev);
      if (next.has(b)) next.delete(b);
      else next.add(b);
      return next;
    });
  }, []);

  const toggleCompare = useCallback((id: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 3) next.add(id);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setPriceMax(absoluteMaxPrice);
    setStopsFilter(null);
    setAirlineFilters(new Set());
    setTimeBuckets(new Set());
    setDurationBuckets(new Set());
  }, [absoluteMaxPrice]);

  const hasActiveFilters = stopsFilter !== null || airlineFilters.size > 0 || timeBuckets.size > 0 || durationBuckets.size > 0 || priceMax < absoluteMaxPrice;

  /* ---- filter + sort ---- */
  const filtered = useMemo(() => {
    let results = [...offers];

    if (priceMax < absoluteMaxPrice) results = results.filter((o) => o.totalPrice <= priceMax);
    if (stopsFilter !== null) results = results.filter((o) => o.totalStops === stopsFilter || (stopsFilter === 2 && o.totalStops >= 2));
    if (airlineFilters.size > 0) results = results.filter((o) => airlineFilters.has(o.airline));
    if (timeBuckets.size > 0) {
      results = results.filter((o) => {
        const bucket = getTimeBucket(o.outboundSegments[0]?.departureTime);
        return timeBuckets.has(bucket);
      });
    }
    if (durationBuckets.size > 0) {
      results = results.filter((o) => {
        const bucket = getDurationBucket(o.totalDurationMinutes);
        return durationBuckets.has(bucket);
      });
    }

    if (sortMode === 'cheapest') results.sort((a, b) => a.totalPrice - b.totalPrice);
    else if (sortMode === 'fastest') results.sort((a, b) => a.totalDurationMinutes - b.totalDurationMinutes);
    else if (sortMode === 'best') {
      const avgPrice = results.reduce((s, o) => s + o.totalPrice, 0) / results.length || 1;
      const avgDur = results.reduce((s, o) => s + o.totalDurationMinutes, 0) / results.length || 1;
      results.sort((a, b) => {
        const sa = a.totalPrice / avgPrice * 0.5 + a.totalDurationMinutes / avgDur * 0.5;
        const sb = b.totalPrice / avgPrice * 0.5 + b.totalDurationMinutes / avgDur * 0.5;
        return sa - sb;
      });
    }
    return results;
  }, [offers, priceMax, absoluteMaxPrice, stopsFilter, airlineFilters, timeBuckets, durationBuckets, sortMode]);

  const fromAirport = getAirport(origin);
  const toAirport = getAirport(destination);
  const compareOffers = useMemo(() => offers.filter((o) => compareIds.has(o.offerId)), [offers, compareIds]);

  /* ============================= RENDER ============================= */
  return (
    <div className="min-h-dvh bg-sea-deep">
      {/* -------- Header -------- */}
      <header className="sticky top-0 z-30 border-b border-monsoon/60 bg-sea-deep/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-gate-gold/15 p-1 rounded-lg">
              <Plane className="w-4 h-4 text-gate-gold" />
            </div>
            <span className="font-display text-sm text-paper tracking-wide hidden sm:inline">Mumbai Travel Guru</span>
          </Link>
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
        {/* -------- Route title -------- */}
        <div className="mb-4 sm:mb-5">
          <h1 className="font-display text-xl sm:text-2xl text-paper">
            {fromAirport?.city || origin} to {toAirport?.city || destination}
          </h1>
          <p className="text-xs sm:text-sm text-sandstone/60 mt-0.5">
            {formatDate(departDate)}{returnDate ? ` — ${formatDate(returnDate)}` : ''}
            {' '}&middot; {adults} adult{adults > 1 ? 's' : ''} &middot; {cabinClass}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5 lg:gap-6 items-start">
          {/* ======== FILTER SIDEBAR (desktop) ======== */}
          <FilterPanel
            priceMax={priceMax}
            setPriceMax={setPriceMax}
            priceRange={priceRange}
            absoluteMaxPrice={absoluteMaxPrice}
            stopsFilter={stopsFilter}
            setStopsFilter={setStopsFilter}
            airlines={airlines}
            airlineFilters={airlineFilters}
            toggleAirline={toggleAirline}
            timeBuckets={timeBuckets}
            toggleTimeBucket={toggleTimeBucket}
            durationBuckets={durationBuckets}
            toggleDurationBucket={toggleDurationBucket}
            hasActiveFilters={hasActiveFilters}
            clearFilters={clearFilters}
            className="hidden lg:block"
          />

          {/* ======== RESULTS ======== */}
          <div className="space-y-3 sm:space-y-4 min-w-0">
            {/* Sticky sort bar */}
            <SortBar
              totalCount={filtered.length}
              sortMode={sortMode}
              setSortMode={setSortMode}
              compareCount={compareIds.size}
              onOpenCompare={() => setShowCompare(true)}
              onToggleMobileFilters={() => setShowMobileFilters(true)}
            />

            {/* Loading state */}
            {loading && (
              <div className="space-y-3 sm:space-y-4 py-4">
                {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}
              </div>
            )}

            {/* Error state */}
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

            {/* Empty state */}
            {!loading && !error && filtered.length === 0 && (
              <div className="bg-harbour border border-monsoon/60 rounded-xl p-8 sm:p-10 text-center max-w-lg mx-auto">
                <div className="bg-gate-gold/10 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                  <Plane className="w-6 h-6 text-gate-gold/60" />
                </div>
                <h2 className="text-base font-semibold text-paper mb-2">No flights match these filters</h2>
                <p className="text-xs text-sandstone/60 leading-relaxed mb-5">
                  We found {offers.length} flight{offers.length !== 1 ? 's' : ''} on this route,
                  {' '}but none match your current filters. Try widening your price range, removing
                  airline or stop preferences, or searching a different date.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-xs font-medium bg-gate-gold/10 text-gate-gold border border-gate-gold/20 hover:bg-gate-gold/20 rounded-lg px-4 py-2 transition-colors"
                    >
                      Clear all filters
                    </button>
                  )}
                  <Link
                    href="/flights"
                    className="text-xs font-medium text-sandstone/60 border border-monsoon/50 hover:border-monsoon-light/60 rounded-lg px-4 py-2 transition-colors"
                  >
                    Modify search
                  </Link>
                </div>
              </div>
            )}

            {/* Results list */}
            {!loading && !error && filtered.length > 0 && (
              <div className="space-y-3 sm:space-y-4">
                {filtered.map((offer) => (
                  <FlightCard
                    key={offer.offerId}
                    offer={offer}
                    isSelected={compareIds.has(offer.offerId)}
                    onToggleCompare={toggleCompare}
                    origin={origin}
                    destination={destination}
                    departDate={departDate}
                    adults={adults}
                    cabinClass={cabinClass}
                    tripType={tripType}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ======== MOBILE FILTER DRAWER ======== */}
      {showMobileFilters && (
        <MobileFilterDrawer onClose={() => setShowMobileFilters(false)}>
          <FilterPanel
            priceMax={priceMax}
            setPriceMax={setPriceMax}
            priceRange={priceRange}
            absoluteMaxPrice={absoluteMaxPrice}
            stopsFilter={stopsFilter}
            setStopsFilter={setStopsFilter}
            airlines={airlines}
            airlineFilters={airlineFilters}
            toggleAirline={toggleAirline}
            timeBuckets={timeBuckets}
            toggleTimeBucket={toggleTimeBucket}
            durationBuckets={durationBuckets}
            toggleDurationBucket={toggleDurationBucket}
            hasActiveFilters={hasActiveFilters}
            clearFilters={clearFilters}
          />
        </MobileFilterDrawer>
      )}

      {/* ======== COMPARE MODAL ======== */}
      {showCompare && compareOffers.length >= 2 && (
        <CompareModal
          offers={compareOffers}
          onClose={() => setShowCompare(false)}
          origin={origin}
          destination={destination}
          departDate={departDate}
          adults={adults}
          cabinClass={cabinClass}
          tripType={tripType}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Filter Panel                                                        */
/* ------------------------------------------------------------------ */
function FilterPanel({
  priceMax, setPriceMax, priceRange, absoluteMaxPrice,
  stopsFilter, setStopsFilter,
  airlines, airlineFilters, toggleAirline,
  timeBuckets, toggleTimeBucket,
  durationBuckets, toggleDurationBucket,
  hasActiveFilters, clearFilters, className,
}: {
  priceMax: number; setPriceMax: (v: number) => void;
  priceRange: { min: number; max: number }; absoluteMaxPrice: number;
  stopsFilter: number | null; setStopsFilter: (v: number | null) => void;
  airlines: string[]; airlineFilters: Set<string>; toggleAirline: (v: string) => void;
  timeBuckets: Set<TimeBucket>; toggleTimeBucket: (v: TimeBucket) => void;
  durationBuckets: Set<DurationBucket>; toggleDurationBucket: (v: DurationBucket) => void;
  hasActiveFilters: boolean; clearFilters: () => void;
  className?: string;
}) {
  return (
    <aside className={`space-y-4 sm:space-y-5 ${className ?? ''}`}>
      {/* Header */}
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

      {/* Price range */}
      <div className="bg-harbour border border-monsoon/50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-sandstone/70 font-medium">Max price</span>
          <span className="font-mono text-sm font-bold text-gate-gold">
            ₹{priceINR(priceMax)}
          </span>
        </div>
        <input
          type="range"
          min={priceRange.min}
          max={absoluteMaxPrice}
          step={500}
          value={priceMax}
          onChange={(e) => setPriceMax(Number(e.target.value))}
          className="w-full accent-gate-gold h-1.5 rounded-full appearance-none bg-monsoon/60 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gate-gold [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-sea-deep [&::-webkit-slider-thumb]:shadow-md"
        />
        <div className="flex justify-between text-[10px] text-sandstone/40 mt-1">
          <span>₹{priceINR(priceRange.min)}</span>
          <span>₹{priceINR(absoluteMaxPrice)}+</span>
        </div>
      </div>

      {/* Stops */}
      <div className="bg-harbour border border-monsoon/50 rounded-xl p-4">
        <span className="text-xs text-sandstone/70 font-medium block mb-2.5">Stops</span>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: 'Any', value: null },
            { label: 'Non-stop', value: 0 },
            { label: '1 stop', value: 1 },
            { label: '2+ stops', value: 2 },
          ].map((s) => (
            <button
              key={String(s.value)}
              onClick={() => setStopsFilter(stopsFilter === s.value ? null : s.value)}
              className={`px-3 py-2 text-[11px] font-medium rounded-lg border transition-colors ${
                stopsFilter === s.value
                  ? 'bg-gate-gold/15 border-gate-gold/40 text-gate-gold'
                  : 'bg-sea-deep border-monsoon/50 text-sandstone/60 hover:border-monsoon-light/60'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Airlines */}
      <div className="bg-harbour border border-monsoon/50 rounded-xl p-4">
        <span className="text-xs text-sandstone/70 font-medium block mb-2.5">Airlines</span>
        <div className="space-y-1.5 max-h-44 overflow-y-auto">
          {airlines.map((name) => (
            <label
              key={name}
              className="flex items-center gap-2.5 px-1 py-1.5 rounded-md cursor-pointer hover:bg-sea-deep/50 transition-colors"
            >
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                  airlineFilters.has(name)
                    ? 'bg-gate-gold border-gate-gold'
                    : 'border-monsoon/60 bg-transparent'
                }`}
              >
                {airlineFilters.has(name) && <Check className="w-3 h-3 text-sea-deep" />}
              </div>
              <input
                type="checkbox"
                checked={airlineFilters.has(name)}
                onChange={() => toggleAirline(name)}
                className="sr-only"
              />
              <span className="text-xs text-sandstone/70">{name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Departure time */}
      <div className="bg-harbour border border-monsoon/50 rounded-xl p-4">
        <span className="text-xs text-sandstone/70 font-medium block mb-2.5">Departure time</span>
        <div className="flex flex-wrap gap-1.5">
          {TIME_BUCKETS.map((b) => (
            <button
              key={b.id}
              onClick={() => toggleTimeBucket(b.id)}
              className={`px-3 py-2 text-[11px] font-medium rounded-lg border transition-colors ${
                timeBuckets.has(b.id)
                  ? 'bg-gate-gold/15 border-gate-gold/40 text-gate-gold'
                  : 'bg-sea-deep border-monsoon/50 text-sandstone/60 hover:border-monsoon-light/60'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="bg-harbour border border-monsoon/50 rounded-xl p-4">
        <span className="text-xs text-sandstone/70 font-medium block mb-2.5">Duration</span>
        <div className="flex flex-wrap gap-1.5">
          {DURATION_BUCKETS.map((b) => (
            <button
              key={b.id}
              onClick={() => toggleDurationBucket(b.id)}
              className={`px-3 py-2 text-[11px] font-medium rounded-lg border transition-colors ${
                durationBuckets.has(b.id)
                  ? 'bg-gate-gold/15 border-gate-gold/40 text-gate-gold'
                  : 'bg-sea-deep border-monsoon/50 text-sandstone/60 hover:border-monsoon-light/60'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/*  Sticky Sort Bar                                                     */
/* ------------------------------------------------------------------ */
function SortBar({
  totalCount, sortMode, setSortMode, compareCount, onOpenCompare, onToggleMobileFilters,
}: {
  totalCount: number; sortMode: SortMode; setSortMode: (m: SortMode) => void;
  compareCount: number; onOpenCompare: () => void; onToggleMobileFilters: () => void;
}) {
  return (
    <div className="sticky top-14 z-20 -mx-4 sm:mx-0 px-4 sm:px-0 py-2 bg-sea-deep/90 backdrop-blur-sm border-b border-monsoon/30 flex items-center justify-between gap-3">
      <div className="flex items-center gap-1.5 sm:gap-3">
        <span className="text-xs sm:text-sm font-medium text-paper/80 whitespace-nowrap">
          {totalCount} flight{totalCount !== 1 ? 's' : ''}
        </span>
        <div className="flex bg-harbour border border-monsoon/50 rounded-lg p-0.5">
          {([
            { id: 'cheapest' as SortMode, label: 'Cheapest' },
            { id: 'fastest' as SortMode, label: 'Fastest' },
            { id: 'best' as SortMode, label: 'Best' },
          ]).map((s) => (
            <button
              key={s.id}
              onClick={() => setSortMode(s.id)}
              className={`px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium rounded-md transition-all ${
                sortMode === s.id
                  ? 'bg-gate-gold/15 text-gate-gold'
                  : 'text-sandstone/50 hover:text-sandstone/80'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {compareCount >= 2 && (
          <button
            onClick={onOpenCompare}
            className="text-[11px] sm:text-xs font-medium text-gate-gold border border-gate-gold/30 hover:bg-gate-gold/10 rounded-lg px-2.5 py-1.5 transition-colors flex items-center gap-1"
          >
            Compare ({compareCount})
          </button>
        )}
        <button
          onClick={onToggleMobileFilters}
          className="lg:hidden text-sandstone/60 hover:text-sandstone min-w-[44px] min-h-[44px] flex items-center justify-center border border-monsoon/50 rounded-lg transition-colors"
          aria-label="Filters"
        >
          <Filter className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Flight Card                                                         */
/* ------------------------------------------------------------------ */
function FlightCard({
  offer, isSelected, onToggleCompare,
  origin, destination, departDate, adults, cabinClass, tripType,
}: {
  offer: FlightOfferDto;
  isSelected: boolean;
  onToggleCompare: (id: string) => void;
  origin: string; destination: string; departDate: string;
  adults: number; cabinClass: string; tripType: string;
}) {
  const seg = offer.outboundSegments[0];
  const lastSeg = offer.outboundSegments[offer.outboundSegments.length - 1];
  const hasReturn = offer.returnSegments.length > 0;

  return (
    <div
      className={`bg-harbour border rounded-xl transition-all ${
        isSelected ? 'border-gate-gold/50 ring-1 ring-gate-gold/20' : 'border-monsoon/50 hover:border-monsoon-light/60'
      }`}
    >
      <div className="p-4 sm:p-5">
        {/* Top row: airline + route summary */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-gate-gold/10 rounded-lg w-8 h-8 flex items-center justify-center shrink-0">
              <Plane className="w-4 h-4 text-gate-gold" />
            </div>
            <div>
              <span className="text-sm font-semibold text-paper">{offer.airline}</span>
              <span className="text-[10px] text-sandstone/50 block">{seg?.flightNumber} &middot; {offer.fareClass}</span>
            </div>
          </div>

          {/* Compare checkbox */}
          <button
            onClick={() => onToggleCompare(offer.offerId)}
            className={`flex items-center gap-1.5 text-[11px] font-medium rounded-lg px-3 py-2 border transition-colors ${
              isSelected
                ? 'bg-gate-gold/15 border-gate-gold/40 text-gate-gold'
                : 'bg-sea-deep border-monsoon/50 text-sandstone/50 hover:text-sandstone/70'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-all ${
                isSelected ? 'bg-gate-gold border-gate-gold' : 'border-monsoon/60'
              }`}
            >
              {isSelected && <Check className="w-2.5 h-2.5 text-sea-deep" />}
            </div>
            Compare
          </button>
        </div>

        {/* Route visualization */}
        <div className="grid grid-cols-[auto_1fr_auto] gap-3 sm:gap-4 items-center mb-3">
          {/* Departure */}
          <div className="text-center min-w-[60px] sm:min-w-[72px]">
            <div className="font-mono text-lg sm:text-xl font-bold text-paper">
              {formatTime(seg?.departureTime ?? '')}
            </div>
            <div className="text-[11px] text-sandstone/60">{seg?.departureAirportCode}</div>
          </div>

          {/* Duration line */}
          <div className="flex flex-col items-center px-1 sm:px-2">
            <div className="text-[10px] text-sandstone/50 mb-1 font-mono">
              {formatDuration(offer.totalDurationMinutes)}
            </div>
            <div className="relative w-full flex items-center">
              <div className="h-px flex-1 bg-monsoon/60" />
              <div className="mx-1 w-2 h-2 rounded-full border border-monsoon-light bg-sea-deep shrink-0" />
              <div className="h-px flex-1 bg-monsoon/60" />
            </div>
            <div className="text-[10px] text-sandstone/50 mt-1">
              {offer.totalStops === 0 ? 'Non-stop' : `${offer.totalStops} stop${offer.totalStops > 1 ? 's' : ''}`}
            </div>
          </div>

          {/* Arrival */}
          <div className="text-center min-w-[60px] sm:min-w-[72px]">
            <div className="font-mono text-lg sm:text-xl font-bold text-paper">
              {formatTime(lastSeg?.arrivalTime ?? '')}
            </div>
            <div className="text-[11px] text-sandstone/60">{lastSeg?.arrivalAirportCode}</div>
          </div>
        </div>

        {/* Connecting segments if multi-stop */}
        {offer.outboundSegments.length > 1 && (
          <details className="mb-3">
            <summary className="text-[10px] text-sandstone/50 cursor-pointer hover:text-sandstone/70 transition-colors">
              {offer.outboundSegments.length - 1} connection{offer.outboundSegments.length > 2 ? 's' : ''} &middot; View details
            </summary>
            <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-monsoon/40">
              {offer.outboundSegments.map((s, i) => (
                <div key={i} className="text-[11px] text-sandstone/60">
                  <span className="font-mono text-paper/80">{formatTime(s.departureTime)}</span>
                  {' '}{s.departureAirportCode} &rarr;{' '}
                  <span className="font-mono text-paper/80">{formatTime(s.arrivalTime)}</span>
                  {' '}{s.arrivalAirportCode}
                  <span className="text-sandstone/40 mx-1">&middot;</span>
                  {s.airline} {s.flightNumber}
                  <span className="text-sandstone/40 mx-1">&middot;</span>
                  {formatDuration(s.durationMinutes)}
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Return trip indicator */}
        {hasReturn && (
          <div className="mb-3 flex items-center gap-1.5 text-[11px] text-sandstone/50 bg-sea-deep/50 rounded-lg px-3 py-1.5">
            <ArrowRightLeft className="w-3 h-3" />
            Return flight included &middot; {offer.returnSegments.length} segment{offer.returnSegments.length > 1 ? 's' : ''}
          </div>
        )}

        {/* Bottom row: amenities + seats + pricing */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-3 border-t border-monsoon/40">
          {/* Left: meta */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
              offer.seatsAvailable <= 3
                ? 'text-gate-gold border-gate-gold/30 bg-gate-gold/10'
                : 'text-sandstone/50 border-monsoon/50'
            }`}>
              {offer.seatsAvailable} seat{offer.seatsAvailable !== 1 ? 's' : ''} left
            </span>
            {offer.fareRules && (
              <span className="text-[10px] text-sandstone/40 flex items-center gap-1">
                <Luggage className="w-3 h-3" /> Baggage info
              </span>
            )}
          </div>

          {/* Right: fare + CTA */}
          <div className="flex items-center gap-3 sm:gap-4 sm:text-right">
            <div>
              <div className="font-mono text-xl sm:text-2xl font-bold text-gate-gold tracking-tight">
                <span className="text-sm sm:text-base font-body text-sandstone/50">₹</span>
                {priceINR(offer.totalPrice)}
              </div>
              <div className="text-[10px] sm:text-[11px] text-sandstone/50">
                per person &middot; taxes included
              </div>
            </div>
            <Link
              href={`/flights/book?offerId=${offer.offerId}&origin=${origin}&destination=${destination}&departDate=${departDate}&adults=${adults}&cabinClass=${cabinClass}&tripType=${tripType}`}
              className="inline-block bg-gate-gold hover:bg-gate-gold-dim text-sea-deep font-bold text-sm px-5 py-3 rounded-lg transition-colors whitespace-nowrap"
            >
              Select
            </Link>
          </div>
        </div>
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
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Compare Modal                                                      */
/* ------------------------------------------------------------------ */
function CompareModal({
  offers, onClose,
  origin, destination, departDate, adults, cabinClass, tripType,
}: {
  offers: FlightOfferDto[];
  onClose: () => void;
  origin: string; destination: string; departDate: string;
  adults: number; cabinClass: string; tripType: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-sea-deep/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-harbour border border-monsoon/60 rounded-xl w-full max-w-4xl max-h-[85vh] overflow-y-auto shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 bg-harbour border-b border-monsoon/40 px-5 py-3.5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-paper flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gate-gold" />
            Compare flights
          </h3>
          <button onClick={onClose} className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-monsoon/50 text-sandstone/60 hover:text-sandstone transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comparison table */}
        <div className="p-5 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-monsoon/40">
                <th className="py-2.5 pr-4 text-sandstone/50 font-medium w-[100px]"> </th>
                {offers.map((o) => (
                  <th key={o.offerId} className="py-2.5 px-3 text-center min-w-[180px]">
                    <div className="font-semibold text-paper text-sm">{o.airline}</div>
                    <div className="text-[10px] text-sandstone/50">{o.outboundSegments[0]?.flightNumber}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-monsoon/30">
              {/* Price */}
              <Row label="Price">
                {offers.map((o) => (
                  <td key={o.offerId} className="py-3 px-3 text-center">
                    <div className="font-mono text-lg font-bold text-gate-gold">₹{priceINR(o.totalPrice)}</div>
                    <div className="text-[10px] text-sandstone/50">per person</div>
                  </td>
                ))}
              </Row>
              {/* Duration */}
              <Row label="Duration">
                {offers.map((o) => (
                  <td key={o.offerId} className="py-3 px-3 text-center font-mono text-paper/80">
                    {formatDuration(o.totalDurationMinutes)}
                  </td>
                ))}
              </Row>
              {/* Stops */}
              <Row label="Stops">
                {offers.map((o) => (
                  <td key={o.offerId} className="py-3 px-3 text-center text-paper/80">
                    {o.totalStops === 0 ? 'Non-stop' : `${o.totalStops} stop${o.totalStops > 1 ? 's' : ''}`}
                  </td>
                ))}
              </Row>
              {/* Departure / Arrival */}
              <Row label="Departure">
                {offers.map((o) => {
                  const s = o.outboundSegments[0];
                  return (
                    <td key={o.offerId} className="py-3 px-3 text-center">
                      <div className="font-mono text-paper/90">{formatTime(s?.departureTime ?? '')}</div>
                      <div className="text-[10px] text-sandstone/50">{s?.departureAirportCode}</div>
                    </td>
                  );
                })}
              </Row>
              <Row label="Arrival">
                {offers.map((o) => {
                  const s = o.outboundSegments[o.outboundSegments.length - 1];
                  return (
                    <td key={o.offerId} className="py-3 px-3 text-center">
                      <div className="font-mono text-paper/90">{formatTime(s?.arrivalTime ?? '')}</div>
                      <div className="text-[10px] text-sandstone/50">{s?.arrivalAirportCode}</div>
                    </td>
                  );
                })}
              </Row>
              {/* Fare class */}
              <Row label="Cabin">
                {offers.map((o) => (
                  <td key={o.offerId} className="py-3 px-3 text-center text-paper/80">{o.fareClass}</td>
                ))}
              </Row>
              {/* Seats */}
              <Row label="Seats left">
                {offers.map((o) => (
                  <td key={o.offerId} className="py-3 px-3 text-center">
                    <span className={o.seatsAvailable <= 3 ? 'text-gate-gold font-medium' : 'text-paper/80'}>
                      {o.seatsAvailable}
                    </span>
                  </td>
                ))}
              </Row>
              {/* CTA */}
              <Row label="">
                {offers.map((o) => (
                  <td key={o.offerId} className="py-3 px-3 text-center">
                    <Link
                      href={`/flights/book?offerId=${o.offerId}&origin=${origin}&destination=${destination}&departDate=${departDate}&adults=${adults}&cabinClass=${cabinClass}&tripType=${tripType}`}
                      className="inline-block bg-gate-gold hover:bg-gate-gold-dim text-sea-deep font-bold text-xs px-5 py-2.5 rounded-lg transition-colors"
                    >
                      Select
                    </Link>
                  </td>
                ))}
              </Row>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr>
      <td className="py-3 pr-4 text-sandstone/50 font-medium align-middle">{label}</td>
      {children}
    </tr>
  );
}
