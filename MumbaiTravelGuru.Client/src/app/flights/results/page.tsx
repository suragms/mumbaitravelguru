'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { getAirport } from '@/lib/airports';
import { Plane, Filter, ArrowUpDown, Clock, AlertCircle } from 'lucide-react';

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

export default function FlightResultsPage() {
  return <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500" /></div>}>
    <FlightResultsContent />
  </Suspense>;
}

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

  const [offers, setOffers] = useState<FlightOfferDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [maxPrice, setMaxPrice] = useState(50000);
  const [stopsFilter, setStopsFilter] = useState<number | null>(null);
  const [airlineFilter, setAirlineFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState('price');
  const [showFilters, setShowFilters] = useState(false);

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
          const prices = data.map(o => o.totalPrice);
          setMaxPrice(Math.max(...prices));
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Search failed');
      }
      setLoading(false);
    };
    if (origin && destination) fetchFlights();
    else setLoading(false);
  }, [origin, destination, departDate, returnDate, tripType, adults, cabinClass]);

  const airlines = useMemo(() => [...new Set(offers.map(o => o.airline))], [offers]);

  const filtered = useMemo(() => {
    let results = [...offers];
    if (maxPrice < 99999) results = results.filter(o => o.totalPrice <= maxPrice);
    if (stopsFilter !== null) results = results.filter(o => o.totalStops === stopsFilter);
    if (airlineFilter) results = results.filter(o => o.airline === airlineFilter);

    if (sortBy === 'price') results.sort((a, b) => a.totalPrice - b.totalPrice);
    else if (sortBy === 'duration') results.sort((a, b) => a.totalDurationMinutes - b.totalDurationMinutes);
    else if (sortBy === 'departure') {
      results.sort((a, b) => new Date(a.outboundSegments[0]?.departureTime).getTime() - new Date(b.outboundSegments[0]?.departureTime).getTime());
    }
    return results;
  }, [offers, maxPrice, stopsFilter, airlineFilter, sortBy]);

  const fromAirport = getAirport(origin);
  const toAirport = getAirport(destination);

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-indigo-400 font-bold text-lg">MumbaiTravelGuru</Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300 text-sm">{origin} → {destination}</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <aside className="hidden lg:block space-y-5">
          <div className="metal-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Filter className="w-4 h-4" /> Filters</h3>
            
            <div className="mb-4">
              <label className="text-xs text-slate-400 block mb-1">Max Price: ₹{maxPrice.toLocaleString()}</label>
              <input type="range" min={1000} max={100000} value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-full accent-indigo-500" />
            </div>

            <div className="mb-4">
              <label className="text-xs text-slate-400 block mb-2">Stops</label>
              <div className="flex flex-wrap gap-2">
                {[{ label: 'All', value: null }, { label: 'Non-stop', value: 0 }, { label: '1 Stop', value: 1 }, { label: '2+ Stops', value: 2 },].map(s => (
                  <button key={String(s.value)} onClick={() => setStopsFilter(s.value)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${stopsFilter === s.value ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-2">Airline</label>
              <select value={airlineFilter} onChange={e => setAirlineFilter(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500">
                <option value="">All Airlines</option>
                {airlines.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        </aside>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-white">{fromAirport?.city || origin} → {toAirport?.city || destination}</h1>
              <p className="text-sm text-slate-400">{formatDate(departDate)} • {adults} Adult{adults > 1 ? 's' : ''} • {cabinClass}</p>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-slate-400" />
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500">
                <option value="price">Cheapest</option>
                <option value="duration">Fastest</option>
                <option value="departure">Departure</option>
              </select>
              <button onClick={() => setShowFilters(v => !v)} className="lg:hidden bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="metal-card rounded-xl p-4 lg:hidden space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Max Price: ₹{maxPrice.toLocaleString()}</label>
                <input type="range" min={1000} max={100000} value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} className="w-full accent-indigo-500" />
              </div>
              <div className="flex flex-wrap gap-2">
                {[{ label: 'All', value: null }, { label: 'Non-stop', value: 0 }, { label: '1 Stop', value: 1 }, { label: '2+ Stops', value: 2 }].map(s => (
                  <button key={String(s.value)} onClick={() => setStopsFilter(s.value)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${stopsFilter === s.value ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
              <select value={airlineFilter} onChange={e => setAirlineFilter(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200">
                <option value="">All Airlines</option>
                {airlines.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500" />
            </div>
          ) : error ? (
            <div className="metal-card rounded-xl p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="text-red-300">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="metal-card rounded-xl p-8 text-center">
              <Plane className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No flights found. Try different dates or airports.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">{filtered.length} flight{filtered.length > 1 ? 's' : ''} found</p>
              {filtered.map(offer => (
                <div key={offer.offerId} className="metal-card rounded-xl p-5 hover:border-indigo-500/30 transition-all group">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 space-y-3">
                      {offer.outboundSegments.map((seg, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="text-center">
                            <div className="text-lg font-bold text-white">{formatTime(seg.departureTime)}</div>
                            <div className="text-xs text-slate-500">{seg.departureAirportCode}</div>
                          </div>
                          <div className="flex-1 px-4">
                            <div className="text-xs text-slate-500 text-center mb-1">{formatDuration(seg.durationMinutes)}</div>
                            <div className="relative">
                              <div className="border-t border-slate-600"></div>
                              <Plane className="w-3 h-3 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <div className="text-xs text-slate-500 text-center mt-1">{seg.airline} • {seg.flightNumber}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-white">{formatTime(seg.arrivalTime)}</div>
                            <div className="text-xs text-slate-500">{seg.arrivalAirportCode}</div>
                          </div>
                        </div>
                      ))}
                      {offer.returnSegments.length > 0 && (
                        <>
                          <div className="border-t border-slate-700/50 pt-3 mt-3">
                            <p className="text-xs text-indigo-400 mb-2">Return</p>
                            {offer.returnSegments.map((seg, i) => (
                              <div key={i} className="flex items-center gap-3 opacity-80">
                                <div className="text-center">
                                  <div className="text-base font-semibold text-white">{formatTime(seg.departureTime)}</div>
                                  <div className="text-xs text-slate-500">{seg.departureAirportCode}</div>
                                </div>
                                <div className="flex-1 px-4">
                                  <div className="text-xs text-slate-500 text-center">{formatDuration(seg.durationMinutes)}</div>
                                  <div className="border-t border-slate-600/50"></div>
                                </div>
                                <div className="text-center">
                                  <div className="text-base font-semibold text-white">{formatTime(seg.arrivalTime)}</div>
                                  <div className="text-xs text-slate-500">{seg.arrivalAirportCode}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        <span>{offer.seatsAvailable} seat{offer.seatsAvailable > 1 ? 's' : ''} left</span>
                        <span>{offer.totalStops === 0 ? 'Non-stop' : `${offer.totalStops} stop${offer.totalStops > 1 ? 's' : ''}`}</span>
                        <span>{offer.fareClass}</span>
                      </div>
                    </div>
                    <div className="text-right md:border-l md:border-slate-700 md:pl-6">
                      <div className="text-2xl font-bold text-indigo-400">{priceINR(offer.totalPrice)}</div>
                      <div className="text-xs text-slate-500">per adult</div>
                      <Link
                        href={`/flights/book?offerId=${offer.offerId}&origin=${origin}&destination=${destination}&departDate=${departDate}&adults=${adults}&cabinClass=${cabinClass}&tripType=${tripType}`}
                        className="mt-3 block bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors text-center"
                      >
                        Book
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
