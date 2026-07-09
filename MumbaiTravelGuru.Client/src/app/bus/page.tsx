'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { searchCities } from '@/lib/cities';
import {
  Bus, Filter, Clock, MapPin, Star, Wifi, Tv, Usb, Snowflake, Sofa,
  AlertCircle, ArrowUpDown, SlidersHorizontal, X, Plane, Check,
} from 'lucide-react';
import { SkeletonBusCard } from '@/components/Skeleton';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface BusTripDto {
  tripId: string;
  operatorName: string;
  busType: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  price: number;
  originalPrice: number;
  currency: string;
  availableSeats: number;
  rating: number;
  amenities: string[];
  cancellationPolicy: string;
  boardingPoints: { id: string; name: string; time: string; address: string }[];
  droppingPoints: { id: string; name: string; time: string; address: string }[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(iso: string) {
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

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="w-3 h-3" />,
  Wifi: <Wifi className="w-3 h-3" />,
  AC: <Snowflake className="w-3 h-3" />,
  'Air Conditioning': <Snowflake className="w-3 h-3" />,
  'USB Charging': <Usb className="w-3 h-3" />,
  USB: <Usb className="w-3 h-3" />,
  TV: <Tv className="w-3 h-3" />,
  Entertainment: <Tv className="w-3 h-3" />,
  Sleeper: <Sofa className="w-3 h-3" />,
  Seater: <Bus className="w-3 h-3" />,
};

function getAmenityIcon(amenity: string) {
  for (const [key, icon] of Object.entries(AMENITY_ICONS)) {
    if (amenity.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return <Bus className="w-3 h-3" />;
}

/* ------------------------------------------------------------------ */
/*  Page Entry                                                         */
/* ------------------------------------------------------------------ */
export default function BusSearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-sea-deep flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gate-gold border-t-transparent" />
      </div>
    }>
      <BusSearchContent />
    </Suspense>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Content                                                       */
/* ------------------------------------------------------------------ */
function BusSearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [source, setSource] = useState(searchParams.get('origin') || '');
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [travelDate, setTravelDate] = useState(searchParams.get('travelDate') || '');

  const [sourceSuggestions, setSourceSuggestions] = useState<ReturnType<typeof searchCities>>([]);
  const [destSuggestions, setDestSuggestions] = useState<ReturnType<typeof searchCities>>([]);
  const [showSource, setShowSource] = useState(false);
  const [showDest, setShowDest] = useState(false);

  const [trips, setTrips] = useState<BusTripDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const [busTypeFilter, setBusTypeFilter] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [departureTimeRange, setDepartureTimeRange] = useState<'all' | 'morning' | 'afternoon' | 'evening' | 'night'>('all');
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('price');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!(e.target as Element).closest('#source-autocomplete')) setShowSource(false);
      if (!(e.target as Element).closest('#dest-autocomplete')) setShowDest(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const doSearch = async () => {
    if (!source || !destination || !travelDate) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const data = await apiRequest<BusTripDto[]>(
        `/api/v1/bus/search?origin=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&travelDate=${travelDate}`
      );
      setTrips(data);
      if (data.length > 0) {
        setMaxPrice(Math.max(...data.map(t => t.price)));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Search failed');
    }
    setLoading(false);
  };

  const busTypes = useMemo(() => [...new Set(trips.map(t => t.busType))], [trips]);
  const priceRange = useMemo(() => {
    const prices = trips.map(t => t.price);
    return { min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 0 };
  }, [trips]);
  const absoluteMaxPrice = useMemo(() => Math.max(priceRange.max, 5000), [priceRange.max]);
  const hasActiveFilters = busTypeFilter.length > 0 || maxPrice < absoluteMaxPrice || departureTimeRange !== 'all' || minRating > 0;

  const filtered = useMemo(() => {
    let results = [...trips];
    if (busTypeFilter.length > 0) results = results.filter(t => busTypeFilter.includes(t.busType));
    if (maxPrice < absoluteMaxPrice) results = results.filter(t => t.price <= maxPrice);
    if (minRating > 0) results = results.filter(t => t.rating >= minRating);
    if (departureTimeRange !== 'all') {
      results = results.filter(t => {
        const h = new Date(t.departureTime).getHours();
        switch (departureTimeRange) {
          case 'morning': return h >= 6 && h < 12;
          case 'afternoon': return h >= 12 && h < 18;
          case 'evening': return h >= 18 && h < 22;
          case 'night': return h >= 22 || h < 6;
          default: return true;
        }
      });
    }
    if (sortBy === 'price') results.sort((a, b) => a.price - b.price);
    else if (sortBy === 'departure') results.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
    else if (sortBy === 'duration') results.sort((a, b) => a.durationMinutes - b.durationMinutes);
    else if (sortBy === 'rating') results.sort((a, b) => b.rating - a.rating);
    return results;
  }, [trips, busTypeFilter, maxPrice, absoluteMaxPrice, minRating, departureTimeRange, sortBy]);

  const clearFilters = () => {
    setBusTypeFilter([]);
    setMaxPrice(absoluteMaxPrice);
    setDepartureTimeRange('all');
    setMinRating(0);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch();
  };

  const discount = (original: number, price: number) => {
    if (original <= price) return null;
    return Math.round(((original - price) / original) * 100);
  };

  return (
    <div className="min-h-dvh bg-sea-deep">
      {/* -------- Header -------- */}
      <header className="sticky top-0 z-30 border-b border-monsoon/60 bg-sea-deep/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-gate-gold/15 p-1 rounded-lg">
              <Bus className="w-4 h-4 text-gate-gold" />
            </div>
            <span className="font-display text-sm text-paper tracking-wide hidden sm:inline">Mumbai Travel Guru</span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-sandstone/70">
            {searched && (
              <>
                <span className="font-medium text-paper/80">{source}</span>
                <MapPin className="w-3 h-3 text-sandstone/40" />
                <span className="font-medium text-paper/80">{destination}</span>
                <span className="hidden sm:inline mx-1 text-sandstone/40">&middot;</span>
                <span className="hidden sm:inline text-sandstone/50">{formatDate(travelDate)}</span>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* -------- Search form -------- */}
        <form onSubmit={handleSearch} className="bg-harbour border border-monsoon/60 rounded-xl p-4 sm:p-5 mb-5 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div id="source-autocomplete" className="relative">
              <label className="text-xs text-sandstone/60 mb-1 block font-medium">From</label>
              <input
                value={source}
                onChange={e => { setSource(e.target.value); setSourceSuggestions(searchCities(e.target.value)); setShowSource(true); }}
                onFocus={() => { if (source) setSourceSuggestions(searchCities(source)); setShowSource(true); }}
                className="w-full bg-sea-deep border border-monsoon/50 rounded-lg py-2 px-3 text-paper text-sm placeholder-sandstone/30 focus:outline-none focus:border-gate-gold/70"
                placeholder="Departure city" required
              />
              {showSource && sourceSuggestions.length > 0 && (
                <div className="absolute z-20 top-full mt-1 w-full bg-harbour border border-monsoon/60 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {sourceSuggestions.map(c => (
                    <button key={c.name} type="button" onClick={() => { setSource(c.name); setShowSource(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-paper/70 hover:bg-sea-deep/50 transition-colors">
                      {c.name}, {c.state}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div id="dest-autocomplete" className="relative">
              <label className="text-xs text-sandstone/60 mb-1 block font-medium">To</label>
              <input
                value={destination}
                onChange={e => { setDestination(e.target.value); setDestSuggestions(searchCities(e.target.value)); setShowDest(true); }}
                onFocus={() => { if (destination) setDestSuggestions(searchCities(destination)); setShowDest(true); }}
                className="w-full bg-sea-deep border border-monsoon/50 rounded-lg py-2 px-3 text-paper text-sm placeholder-sandstone/30 focus:outline-none focus:border-gate-gold/70"
                placeholder="Arrival city" required
              />
              {showDest && destSuggestions.length > 0 && (
                <div className="absolute z-20 top-full mt-1 w-full bg-harbour border border-monsoon/60 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {destSuggestions.map(c => (
                    <button key={c.name} type="button" onClick={() => { setDestination(c.name); setShowDest(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-paper/70 hover:bg-sea-deep/50 transition-colors">
                      {c.name}, {c.state}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-sandstone/60 mb-1 block font-medium">Travel Date</label>
              <input type="date" value={travelDate} onChange={e => setTravelDate(e.target.value)}
                className="w-full bg-sea-deep border border-monsoon/50 rounded-lg py-2 px-3 text-paper text-sm focus:outline-none focus:border-gate-gold/70 [color-scheme:dark]" required />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={loading}
                className="w-full bg-gate-gold hover:bg-gate-gold-dim text-sea-deep font-bold py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                <Bus className="w-4 h-4" /> {loading ? 'Searching...' : 'Search Buses'}
              </button>
            </div>
          </div>
        </form>

        {!searched ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-gate-gold/10 rounded-full w-14 h-14 flex items-center justify-center mb-4">
              <Bus className="w-6 h-6 text-gate-gold/60" />
            </div>
            <h2 className="text-base font-semibold text-paper mb-2">Search for Bus Tickets</h2>
            <p className="text-xs text-sandstone/60">Enter your source, destination, and travel date to find available buses.</p>
          </div>
        ) : loading ? (
          <div className="space-y-3 sm:space-y-4 py-4">
            {[1, 2, 3, 4].map(i => <SkeletonBusCard key={i} />)}
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
        ) : trips.length === 0 ? (
          <div className="bg-harbour border border-monsoon/60 rounded-xl p-8 text-center max-w-lg mx-auto">
            <div className="bg-gate-gold/10 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
              <Bus className="w-6 h-6 text-gate-gold/60" />
            </div>
            <p className="text-sm text-paper/80 mb-2">No buses found</p>
            <p className="text-xs text-sandstone/60">Try different dates or cities.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5 lg:gap-6 items-start">
            {/* ======== FILTER SIDEBAR ======== */}
            <FilterPanel
              busTypes={busTypes}
              busTypeFilter={busTypeFilter}
              setBusTypeFilter={setBusTypeFilter}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              priceRange={priceRange}
              absoluteMaxPrice={absoluteMaxPrice}
              departureTimeRange={departureTimeRange}
              setDepartureTimeRange={setDepartureTimeRange}
              minRating={minRating}
              setMinRating={setMinRating}
              hasActiveFilters={hasActiveFilters}
              clearFilters={clearFilters}
              className="hidden lg:block"
            />

            {/* ======== RESULTS ======== */}
            <div className="space-y-3 sm:space-y-4 min-w-0">
              <div className="sticky top-14 z-20 -mx-4 sm:mx-0 px-4 sm:px-0 py-2 bg-sea-deep/90 backdrop-blur-sm border-b border-monsoon/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 sm:gap-3">
                  <span className="text-xs sm:text-sm font-medium text-paper/80 whitespace-nowrap">
                    {filtered.length} bus{filtered.length !== 1 ? 'es' : ''}
                  </span>
                  <div className="flex bg-harbour border border-monsoon/50 rounded-lg p-0.5">
                    {([
                      { id: 'price', label: 'Cheapest' },
                      { id: 'departure', label: 'Departure' },
                      { id: 'duration', label: 'Duration' },
                      { id: 'rating', label: 'Rating' },
                    ] as const).map(s => (
                      <button key={s.id} onClick={() => setSortBy(s.id)}
                        className={`px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium rounded-md transition-all ${
                          sortBy === s.id ? 'bg-gate-gold/15 text-gate-gold' : 'text-sandstone/50 hover:text-sandstone/80'
                        }`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-sandstone/60 hover:text-sandstone border border-monsoon/50 rounded-lg transition-colors"
                  aria-label="Filters"
                >
                  <Filter className="w-4 h-4" />
                </button>
              </div>

              {/* Empty state */}
              {filtered.length === 0 && (
                <div className="bg-harbour border border-monsoon/60 rounded-xl p-8 sm:p-10 text-center max-w-lg mx-auto">
                  <div className="bg-gate-gold/10 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                    <Bus className="w-6 h-6 text-gate-gold/60" />
                  </div>
                  <h2 className="text-base font-semibold text-paper mb-2">No buses match these filters</h2>
                  <p className="text-xs text-sandstone/60 leading-relaxed mb-5">
                    We found {trips.length} bus{trips.length !== 1 ? 'es' : ''} on this route,
                    {' '}but none match your current filters. Try widening the price range, removing bus type filters, or choosing a different time.
                  </p>
                  {hasActiveFilters && (
                    <button onClick={clearFilters}
                      className="text-xs font-medium bg-gate-gold/10 text-gate-gold border border-gate-gold/20 hover:bg-gate-gold/20 rounded-lg px-4 py-2 transition-colors">
                      Clear all filters
                    </button>
                  )}
                </div>
              )}

              {/* Results list */}
              {filtered.length > 0 && (
                <div className="space-y-3 sm:space-y-4">
                  {filtered.map(trip => {
                    const d = discount(trip.originalPrice, trip.price);
                    return (
                      <div key={trip.tripId} className="bg-harbour border border-monsoon/50 hover:border-monsoon-light/60 rounded-xl transition-all">
                        <div className="p-4 sm:p-5">
                          {/* Operator + rating */}
                          <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="flex items-center gap-2.5">
                              <div className="bg-gate-gold/10 rounded-lg w-8 h-8 flex items-center justify-center shrink-0">
                                <Bus className="w-4 h-4 text-gate-gold" />
                              </div>
                              <div>
                                <span className="text-sm font-semibold text-paper">{trip.operatorName}</span>
                                <span className="text-[10px] text-sandstone/50 block">{trip.busType}</span>
                              </div>
                            </div>
                            <span className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                              <Star className="w-3 h-3 fill-amber-400" /> {trip.rating.toFixed(1)}
                            </span>
                          </div>

                          {/* Route visualization */}
                          <div className="grid grid-cols-[auto_1fr_auto] gap-3 sm:gap-4 items-center mb-3">
                            <div className="text-center min-w-[60px] sm:min-w-[72px]">
                              <div className="font-mono text-lg sm:text-xl font-bold text-paper">{formatTime(trip.departureTime)}</div>
                              <div className="text-[11px] text-sandstone/60">{source}</div>
                            </div>
                            <div className="flex flex-col items-center px-1 sm:px-2">
                              <div className="text-[10px] text-sandstone/50 mb-1 font-mono">{formatDuration(trip.durationMinutes)}</div>
                              <div className="relative w-full flex items-center">
                                <div className="h-px flex-1 bg-monsoon/60" />
                                <div className="mx-1 w-2 h-2 rounded-full border border-monsoon-light bg-sea-deep shrink-0" />
                                <div className="h-px flex-1 bg-monsoon/60" />
                              </div>
                            </div>
                            <div className="text-center min-w-[60px] sm:min-w-[72px]">
                              <div className="font-mono text-lg sm:text-xl font-bold text-paper">{formatTime(trip.arrivalTime)}</div>
                              <div className="text-[11px] text-sandstone/60">{destination}</div>
                            </div>
                          </div>

                          {/* Amenities */}
                          {trip.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {trip.amenities.map((a, i) => (
                                <span key={i} className="inline-flex items-center gap-1 bg-sea-deep/60 border border-monsoon/40 px-2 py-0.5 rounded text-[10px] text-sandstone/60" title={a}>
                                  {getAmenityIcon(a)} {a}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Seats + cancellation */}
                          <div className="flex flex-wrap items-center gap-2.5 mb-3">
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                              trip.availableSeats <= 5
                                ? 'text-gate-gold border-gate-gold/30 bg-gate-gold/10'
                                : 'text-sandstone/50 border-monsoon/50'
                            }`}>
                              {trip.availableSeats} seat{trip.availableSeats !== 1 ? 's' : ''} left
                            </span>
                            <span className="text-[10px] text-sandstone/40 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {trip.cancellationPolicy}
                            </span>
                          </div>

                          {/* Bottom: fare + CTA */}
                          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-3 border-t border-monsoon/40">
                            <div />
                            <div className="flex items-center gap-3 sm:gap-4 sm:text-right">
                              <div>
                                <div className="font-mono text-xl sm:text-2xl font-bold text-gate-gold tracking-tight">
                                  <span className="text-sm sm:text-base font-body text-sandstone/50">₹</span>
                                  {priceINR(trip.price)}
                                </div>
                                <div className="flex items-center gap-2 justify-end">
                                  {d && <span className="text-[10px] text-sandstone/50 line-through">{priceINR(trip.originalPrice)}</span>}
                                  {d && <span className="text-[10px] text-emerald-400 font-medium">{d}% off</span>}
                                  <span className="text-[10px] text-sandstone/50">per seat</span>
                                </div>
                              </div>
                              <Link
                                href={`/bus/${trip.tripId}?origin=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&travelDate=${travelDate}`}
                                className="inline-block bg-gate-gold hover:bg-gate-gold-dim text-sea-deep font-bold text-sm px-5 py-3 rounded-lg transition-colors whitespace-nowrap"
                              >
                                View Seats
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ======== MOBILE FILTER DRAWER ======== */}
      {showMobileFilters && (
        <MobileFilterDrawer onClose={() => setShowMobileFilters(false)}>
          <FilterPanel
            busTypes={busTypes}
            busTypeFilter={busTypeFilter}
            setBusTypeFilter={setBusTypeFilter}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
            priceRange={priceRange}
            absoluteMaxPrice={absoluteMaxPrice}
            departureTimeRange={departureTimeRange}
            setDepartureTimeRange={setDepartureTimeRange}
            minRating={minRating}
            setMinRating={setMinRating}
            hasActiveFilters={hasActiveFilters}
            clearFilters={clearFilters}
          />
        </MobileFilterDrawer>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Filter Panel                                                       */
/* ------------------------------------------------------------------ */
function FilterPanel({
  busTypes, busTypeFilter, setBusTypeFilter,
  maxPrice, setMaxPrice, priceRange, absoluteMaxPrice,
  departureTimeRange, setDepartureTimeRange,
  minRating, setMinRating,
  hasActiveFilters, clearFilters, className,
}: {
  busTypes: string[]; busTypeFilter: string[]; setBusTypeFilter: (v: string[] | ((prev: string[]) => string[])) => void;
  maxPrice: number; setMaxPrice: (v: number) => void; priceRange: { min: number; max: number }; absoluteMaxPrice: number;
  departureTimeRange: string; setDepartureTimeRange: (v: 'all' | 'morning' | 'afternoon' | 'evening' | 'night') => void;
  minRating: number; setMinRating: (v: number) => void;
  hasActiveFilters: boolean; clearFilters: () => void;
  className?: string;
}) {
  return (
    <aside className={`space-y-4 sm:space-y-5 ${className ?? ''}`}>
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

      <div className="bg-harbour border border-monsoon/50 rounded-xl p-4">
        <span className="text-xs text-sandstone/70 font-medium block mb-2.5">Bus Type</span>
        <div className="space-y-1.5">
          {busTypes.map(bt => (
            <label key={bt} className="flex items-center gap-2.5 px-1 py-1.5 rounded-md cursor-pointer hover:bg-sea-deep/50 transition-colors">
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                  busTypeFilter.includes(bt) ? 'bg-gate-gold border-gate-gold' : 'border-monsoon/60 bg-transparent'
                }`}
              >
                {busTypeFilter.includes(bt) && <Check className="w-3 h-3 text-sea-deep" />}
              </div>
              <input type="checkbox" checked={busTypeFilter.includes(bt)}
                onChange={e => setBusTypeFilter(prev => e.target.checked ? [...prev, bt] : prev.filter(b => b !== bt))}
                className="sr-only" />
              <span className="text-xs text-sandstone/70">{bt}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-harbour border border-monsoon/50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-sandstone/70 font-medium">Max price</span>
          <span className="font-mono text-sm font-bold text-gate-gold">₹{priceINR(maxPrice)}</span>
        </div>
        <input type="range" min={priceRange.min} max={absoluteMaxPrice} step={50} value={maxPrice}
          onChange={e => setMaxPrice(Number(e.target.value))}
          className="w-full accent-gate-gold h-1.5 rounded-full appearance-none bg-monsoon/60 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gate-gold [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-sea-deep [&::-webkit-slider-thumb]:shadow-md" />
        <div className="flex justify-between text-[10px] text-sandstone/40 mt-1">
          <span>₹{priceINR(priceRange.min)}</span>
          <span>₹{priceINR(absoluteMaxPrice)}+</span>
        </div>
      </div>

      <div className="bg-harbour border border-monsoon/50 rounded-xl p-4">
        <span className="text-xs text-sandstone/70 font-medium block mb-2.5">Departure Time</span>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: 'All', value: 'all' as const },
            { label: '6AM–12PM', value: 'morning' as const },
            { label: '12PM–6PM', value: 'afternoon' as const },
            { label: '6PM–10PM', value: 'evening' as const },
            { label: '10PM–6AM', value: 'night' as const },
          ].map(r => (
            <button key={r.value} onClick={() => setDepartureTimeRange(r.value)}
              className={`px-3 py-2 text-[11px] font-medium rounded-lg border transition-colors ${
                departureTimeRange === r.value
                  ? 'bg-gate-gold/15 border-gate-gold/40 text-gate-gold'
                  : 'bg-sea-deep border-monsoon/50 text-sandstone/60 hover:border-monsoon-light/60'
              }`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-harbour border border-monsoon/50 rounded-xl p-4">
        <span className="text-xs text-sandstone/70 font-medium block mb-2.5">Min Rating</span>
        <div className="flex flex-wrap gap-1.5">
          {[0, 3, 3.5, 4, 4.5].map(r => (
            <button key={r} onClick={() => setMinRating(r)}
              className={`px-3 py-2 text-[11px] font-medium rounded-lg border transition-colors ${
                minRating === r
                  ? 'bg-gate-gold/15 border-gate-gold/40 text-gate-gold'
                  : 'bg-sea-deep border-monsoon/50 text-sandstone/60 hover:border-monsoon-light/60'
              }`}>
              {r === 0 ? 'Any' : `${r}+`}
            </button>
          ))}
        </div>
      </div>
    </aside>
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
