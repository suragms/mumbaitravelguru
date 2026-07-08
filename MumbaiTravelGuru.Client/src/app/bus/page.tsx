'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { searchCities } from '@/lib/cities';
import { Bus, Filter, ArrowUpDown, Clock, MapPin, Star, Wifi, Tv, Usb, Snowflake, Sofa, AlertCircle } from 'lucide-react';

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
  return `₹${price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="w-3.5 h-3.5" />,
  Wifi: <Wifi className="w-3.5 h-3.5" />,
  AC: <Snowflake className="w-3.5 h-3.5" />,
  'Air Conditioning': <Snowflake className="w-3.5 h-3.5" />,
  'USB Charging': <Usb className="w-3.5 h-3.5" />,
  USB: <Usb className="w-3.5 h-3.5" />,
  TV: <Tv className="w-3.5 h-3.5" />,
  Entertainment: <Tv className="w-3.5 h-3.5" />,
  'Sleeper': <Sofa className="w-3.5 h-3.5" />,
  'Seater': <Bus className="w-3.5 h-3.5" />,
};

function getAmenityIcon(amenity: string) {
  for (const [key, icon] of Object.entries(AMENITY_ICONS)) {
    if (amenity.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return <Bus className="w-3.5 h-3.5" />;
}

export default function BusSearchPage() {
  return <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500" /></div>}>
    <BusSearchContent />
  </Suspense>;
}

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
  const sourceRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);

  const [trips, setTrips] = useState<BusTripDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const [busTypeFilter, setBusTypeFilter] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [departureTimeRange, setDepartureTimeRange] = useState<'all' | 'morning' | 'afternoon' | 'evening' | 'night'>('all');
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('price');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sourceRef.current && !sourceRef.current.contains(e.target as Node)) setShowSource(false);
      if (destRef.current && !destRef.current.contains(e.target as Node)) setShowDest(false);
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
        const prices = data.map(t => t.price);
        setMaxPrice(Math.max(...prices));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Search failed');
    }
    setLoading(false);
  };

  const busTypes = useMemo(() => [...new Set(trips.map(t => t.busType))], [trips]);

  const filtered = useMemo(() => {
    let results = [...trips];
    if (busTypeFilter.length > 0) results = results.filter(t => busTypeFilter.includes(t.busType));
    if (maxPrice < 99999) results = results.filter(t => t.price <= maxPrice);
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
  }, [trips, busTypeFilter, maxPrice, minRating, departureTimeRange, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch();
  };

  const discount = (original: number, price: number) => {
    if (original <= price) return null;
    return Math.round(((original - price) / original) * 100);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-indigo-400 font-bold text-lg">MumbaiTravelGuru</Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300 text-sm">Bus Booking</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <form onSubmit={handleSearch} className="metal-card rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div ref={sourceRef} className="relative">
              <label className="text-xs text-slate-400 mb-1 block">From</label>
              <input value={source} onChange={e => { setSource(e.target.value); setSourceSuggestions(searchCities(e.target.value)); setShowSource(true); }}
                onFocus={() => { if (source) setSourceSuggestions(searchCities(source)); setShowSource(true); }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500" placeholder="Departure city" required />
              {showSource && sourceSuggestions.length > 0 && (
                <div className="absolute z-20 top-full mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {sourceSuggestions.map(c => (
                    <button key={c.name} type="button" onClick={() => { setSource(c.name); setShowSource(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 transition-colors">
                      {c.name}, {c.state}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div ref={destRef} className="relative">
              <label className="text-xs text-slate-400 mb-1 block">To</label>
              <input value={destination} onChange={e => { setDestination(e.target.value); setDestSuggestions(searchCities(e.target.value)); setShowDest(true); }}
                onFocus={() => { if (destination) setDestSuggestions(searchCities(destination)); setShowDest(true); }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500" placeholder="Arrival city" required />
              {showDest && destSuggestions.length > 0 && (
                <div className="absolute z-20 top-full mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {destSuggestions.map(c => (
                    <button key={c.name} type="button" onClick={() => { setDestination(c.name); setShowDest(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 transition-colors">
                      {c.name}, {c.state}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Travel Date</label>
              <input type="date" value={travelDate} onChange={e => setTravelDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]" required />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                <Bus className="w-4 h-4" /> {loading ? 'Searching...' : 'Search Buses'}
              </button>
            </div>
          </div>
        </form>

        {!searched ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bus className="w-16 h-16 text-slate-700 mb-4" />
            <h2 className="text-xl font-semibold text-slate-400 mb-2">Search for Bus Tickets</h2>
            <p className="text-sm text-slate-600">Enter your source, destination, and travel date to find available buses.</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500" />
          </div>
        ) : error ? (
          <div className="metal-card rounded-xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-300">{error}</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="metal-card rounded-xl p-8 text-center">
            <Bus className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No buses found. Try different dates or cities.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            <aside className="hidden lg:block space-y-5">
              <div className="metal-card rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Filter className="w-4 h-4" /> Filters</h3>

                <div className="mb-4">
                  <label className="text-xs text-slate-400 block mb-2">Bus Type</label>
                  <div className="space-y-1.5">
                    {busTypes.map(bt => (
                      <label key={bt} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                        <input type="checkbox" checked={busTypeFilter.includes(bt)}
                          onChange={e => setBusTypeFilter(prev => e.target.checked ? [...prev, bt] : prev.filter(b => b !== bt))}
                          className="accent-indigo-500" />
                        {bt}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-xs text-slate-400 block mb-1">Max Price: {priceINR(maxPrice)}</label>
                  <input type="range" min={100} max={10000} value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-indigo-500" />
                </div>

                <div className="mb-4">
                  <label className="text-xs text-slate-400 block mb-2">Departure Time</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'All', value: 'all' as const },
                      { label: '6AM-12PM', value: 'morning' as const },
                      { label: '12PM-6PM', value: 'afternoon' as const },
                      { label: '6PM-10PM', value: 'evening' as const },
                      { label: '10PM-6AM', value: 'night' as const },
                    ].map(r => (
                      <button key={r.value} onClick={() => setDepartureTimeRange(r.value)}
                        className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${departureTimeRange === r.value ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-2">Min Rating</label>
                  <div className="flex gap-1.5">
                    {[0, 3, 3.5, 4, 4.5].map(r => (
                      <button key={r} onClick={() => setMinRating(r)}
                        className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${minRating === r ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                        {r === 0 ? 'Any' : `${r}+`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-indigo-400" /> {source} → {destination}
                  </h1>
                  <p className="text-sm text-slate-400">{formatDate(travelDate)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-slate-400" />
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500">
                    <option value="price">Cheapest</option>
                    <option value="departure">Departure</option>
                    <option value="duration">Duration</option>
                    <option value="rating">Rating</option>
                  </select>
                  <button onClick={() => setShowFilters(v => !v)} className="lg:hidden bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300">
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="metal-card rounded-xl p-4 lg:hidden space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-2">Bus Type</label>
                    {busTypes.map(bt => (
                      <label key={bt} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer mr-3 inline-flex">
                        <input type="checkbox" checked={busTypeFilter.includes(bt)}
                          onChange={e => setBusTypeFilter(prev => e.target.checked ? [...prev, bt] : prev.filter(b => b !== bt))}
                          className="accent-indigo-500" />
                        {bt}
                      </label>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Max Price: {priceINR(maxPrice)}</label>
                    <input type="range" min={100} max={10000} value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} className="w-full accent-indigo-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-2">Departure</label>
                    {['all', 'morning', 'afternoon', 'evening', 'night'].map(r => (
                      <button key={r} onClick={() => setDepartureTimeRange(r as typeof departureTimeRange)}
                        className={`mr-1.5 px-2.5 py-1 text-xs rounded-lg border transition-colors ${departureTimeRange === r ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-2">Min Rating</label>
                    {[0, 3, 3.5, 4, 4.5].map(r => (
                      <button key={r} onClick={() => setMinRating(r)}
                        className={`mr-1.5 px-2.5 py-1 text-xs rounded-lg border transition-colors ${minRating === r ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                        {r === 0 ? 'Any' : `${r}+`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-sm text-slate-500">{filtered.length} bus{filtered.length > 1 ? 'es' : ''} found</p>

              {filtered.map(trip => {
                const d = discount(trip.originalPrice, trip.price);
                return (
                  <div key={trip.tripId} className="metal-card rounded-xl p-5 hover:border-indigo-500/30 transition-all group">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <div className="text-lg font-bold text-white">{formatTime(trip.departureTime)}</div>
                            <div className="text-xs text-slate-500">{source}</div>
                          </div>
                          <div className="flex-1 px-4">
                            <div className="text-xs text-slate-500 text-center mb-1">{formatDuration(trip.durationMinutes)}</div>
                            <div className="relative">
                              <div className="border-t border-slate-600"></div>
                              <Bus className="w-3 h-3 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-white">{formatTime(trip.arrivalTime)}</div>
                            <div className="text-xs text-slate-500">{destination}</div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                          <span className="text-slate-300 font-medium">{trip.operatorName}</span>
                          <span className="text-slate-500">{trip.busType}</span>
                          <span className="flex items-center gap-1 text-amber-400">
                            <Star className="w-3 h-3 fill-amber-400" /> {trip.rating.toFixed(1)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <span className={`font-medium ${trip.availableSeats <= 5 ? 'text-orange-400' : 'text-emerald-400'}`}>
                            {trip.availableSeats} seat{trip.availableSeats !== 1 ? 's' : ''} left
                          </span>
                          <span className="text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {trip.cancellationPolicy}
                          </span>
                        </div>

                        {trip.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-2 text-slate-400">
                            {trip.amenities.map((a, i) => (
                              <span key={i} className="flex items-center gap-1 bg-slate-800/50 px-2 py-0.5 rounded" title={a}>
                                {getAmenityIcon(a)} <span className="text-[10px]">{a}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="text-right md:border-l md:border-slate-700 md:pl-6">
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-2xl font-bold text-indigo-400">{priceINR(trip.price)}</span>
                          {d && <span className="text-xs text-slate-500 line-through">{priceINR(trip.originalPrice)}</span>}
                        </div>
                        {d && <span className="text-xs text-emerald-400 font-medium">{d}% off</span>}
                        <div className="text-xs text-slate-500">per seat</div>
                        <Link
                          href={`/bus/${trip.tripId}?origin=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&travelDate=${travelDate}`}
                          className="mt-3 block bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors text-center"
                        >
                          Select Seats
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
