'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { searchAirports, getAirport } from '@/lib/airports';
import { Plane, ArrowRightLeft, Calendar, Users, ChevronDown } from 'lucide-react';

export default function FlightSearchForm() {
  const router = useRouter();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [originSuggestions, setOriginSuggestions] = useState<ReturnType<typeof searchAirports>>([]);
  const [destSuggestions, setDestSuggestions] = useState<ReturnType<typeof searchAirports>>([]);
  const [showOrigin, setShowOrigin] = useState(false);
  const [showDest, setShowDest] = useState(false);
  const [tripType, setTripType] = useState('OneWay');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [cabinClass, setCabinClass] = useState('Economy');
  const [showTripDropdown, setShowTripDropdown] = useState(false);
  const [showCabinDropdown, setShowCabinDropdown] = useState(false);

  const originRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (originRef.current && !originRef.current.contains(e.target as Node)) setShowOrigin(false);
      if (destRef.current && !destRef.current.contains(e.target as Node)) setShowDest(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const swapAirports = () => {
    const tmp = origin; setOrigin(destination); setDestination(tmp);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      origin, destination, tripType, departDate, adults: String(adults), cabinClass,
    });
    if (returnDate) params.set('returnDate', returnDate);
    router.push(`/flights/results?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="metal-card rounded-2xl p-6 space-y-5">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <button type="button" onClick={() => setShowTripDropdown(v => !v)}
            className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 hover:border-indigo-500 transition-colors">
            {tripType === 'OneWay' ? 'One Way' : tripType === 'RoundTrip' ? 'Round Trip' : 'Multi City'} <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {showTripDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg py-1 z-20 w-40 shadow-xl">
              {['OneWay', 'RoundTrip', 'MultiCity'].map(t => (
                <button key={t} type="button" onClick={() => { setTripType(t); setShowTripDropdown(false); }}
                  className={`block w-full text-left px-3 py-2 text-sm hover:bg-slate-700 ${tripType === t ? 'text-indigo-400' : 'text-slate-300'}`}>
                  {t === 'OneWay' ? 'One Way' : t === 'RoundTrip' ? 'Round Trip' : 'Multi City'}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button type="button" onClick={() => setShowCabinDropdown(v => !v)}
            className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 hover:border-indigo-500 transition-colors">
            {cabinClass} <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {showCabinDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg py-1 z-20 w-44 shadow-xl">
              {['Economy', 'PremiumEconomy', 'Business', 'First'].map(c => (
                <button key={c} type="button" onClick={() => { setCabinClass(c); setShowCabinDropdown(false); }}
                  className={`block w-full text-left px-3 py-2 text-sm hover:bg-slate-700 ${cabinClass === c ? 'text-indigo-400' : 'text-slate-300'}`}>
                  {c === 'PremiumEconomy' ? 'Premium Economy' : c}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300">
          <Users className="w-4 h-4 text-indigo-400" />
          <select value={adults} onChange={e => setAdults(Number(e.target.value))} className="bg-transparent text-slate-200 focus:outline-none">
            {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Adult{n > 1 ? 's' : ''}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr,auto,auto] gap-3 items-end">
        <div ref={originRef} className="relative">
          <label className="block text-xs text-slate-500 mb-1">From</label>
          <div className="relative">
            <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={origin} onChange={e => { setOrigin(e.target.value.toUpperCase()); setOriginSuggestions(searchAirports(e.target.value)); setShowOrigin(true); }}
              onFocus={() => { if (origin) setShowOrigin(true); }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 uppercase"
              placeholder="City or Airport" maxLength={3} required />
          </div>
          {showOrigin && originSuggestions.length > 0 && (
            <div className="absolute top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg z-20 w-full max-h-48 overflow-y-auto shadow-xl">
              {originSuggestions.map(a => (
                <button key={a.code} type="button" onClick={() => { setOrigin(a.code); setShowOrigin(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 flex justify-between">
                  <span>{a.code} — {a.city}</span>
                  <span className="text-slate-500">{a.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button type="button" onClick={swapAirports} className="p-2 rounded-full bg-slate-800 border border-slate-700 hover:border-indigo-500 text-slate-400 hover:text-indigo-400 transition-colors self-end mb-1">
          <ArrowRightLeft className="w-4 h-4" />
        </button>

        <div ref={destRef} className="relative">
          <label className="block text-xs text-slate-500 mb-1">To</label>
          <div className="relative">
            <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={destination} onChange={e => { setDestination(e.target.value.toUpperCase()); setDestSuggestions(searchAirports(e.target.value)); setShowDest(true); }}
              onFocus={() => { if (destination) setShowDest(true); }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 uppercase"
              placeholder="City or Airport" maxLength={3} required />
          </div>
          {showDest && destSuggestions.length > 0 && (
            <div className="absolute top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg z-20 w-full max-h-48 overflow-y-auto shadow-xl">
              {destSuggestions.map(a => (
                <button key={a.code} type="button" onClick={() => { setDestination(a.code); setShowDest(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 flex justify-between">
                  <span>{a.code} — {a.city}</span>
                  <span className="text-slate-500">{a.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">Depart</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="date" value={departDate} onChange={e => setDepartDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-3 text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]" required />
          </div>
        </div>

        {tripType === 'RoundTrip' && (
          <div>
            <label className="block text-xs text-slate-500 mb-1">Return</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-3 text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]" />
            </div>
          </div>
        )}
      </div>

      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-semibold transition-colors text-lg">
        Search Flights
      </button>
    </form>
  );
}
