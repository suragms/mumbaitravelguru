'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plane, ArrowRightLeft, Calendar, Users, ChevronDown, MapPin, Compass, Sun, Hotel } from 'lucide-react';
import type { Airport } from '@/lib/airports';
import { searchAirports } from '@/lib/airports';
import type { City } from '@/lib/cities';
import { searchCities } from '@/lib/cities';
import type { ServiceType } from './PlatformBoard';

/* ------------------------------------------------------------------ */
/*  Flight Fields                                                      */
/* ------------------------------------------------------------------ */
function FlightFields() {
  const router = useRouter();
  const [origin, setOrigin] = useState('BOM');
  const [destination, setDestination] = useState('');
  const [originSug, setOriginSug] = useState<ReturnType<typeof searchAirports>>([]);
  const [destSug, setDestSug] = useState<ReturnType<typeof searchAirports>>([]);
  const [showOrigin, setShowOrigin] = useState(false);
  const [showDest, setShowDest] = useState(false);
  const [tripType, setTripType] = useState('OneWay');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [cabinClass, setCabinClass] = useState('Economy');
  const [showTrip, setShowTrip] = useState(false);
  const [showCabin, setShowCabin] = useState(false);

  const originRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (originRef.current && !originRef.current.contains(e.target as Node)) setShowOrigin(false);
      if (destRef.current && !destRef.current.contains(e.target as Node)) setShowDest(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const swap = () => { const t = origin; setOrigin(destination); setDestination(t); };

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams({ origin, destination, tripType, departDate, adults: String(adults), cabinClass });
    if (returnDate) p.set('returnDate', returnDate);
    router.push(`/flights/results?${p.toString()}`);
  };

  return (
    <form onSubmit={search} className="animate-fade-in">
      <div className="flex flex-wrap gap-2 mb-4">
        <Triplet value={tripType} set={setTripType} open={showTrip} toggle={() => setShowTrip((v) => !v)}
          options={[{ value: 'OneWay', label: 'One Way' }, { value: 'RoundTrip', label: 'Round Trip' }]}
        />
        <Triplet value={cabinClass} set={setCabinClass} open={showCabin} toggle={() => setShowCabin((v) => !v)}
          options={[
            { value: 'Economy', label: 'Economy' },
            { value: 'PremiumEconomy', label: 'Premium Economy' },
            { value: 'Business', label: 'Business' },
          ]}
        />
        <div className="flex items-center gap-1.5 bg-sea-deep/80 border border-monsoon/50 rounded-lg px-2.5 py-2 text-xs text-paper/80">
          <Users className="w-3.5 h-3.5 text-gate-gold" />
          <select value={adults} onChange={(e) => setAdults(Number(e.target.value))}
            className="bg-transparent text-paper focus:outline-none text-xs">
            {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} Adult{n > 1 ? 's' : ''}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-[1fr,auto,1fr] sm:grid-cols-[1fr,auto,1fr,auto,auto] gap-2.5 items-end">
        <LocationInput label="From" value={origin} setValue={setOrigin}
          suggestions={originSug} setSuggestions={setOriginSug}
          show={showOrigin} setShow={setShowOrigin} refObj={originRef}
          placeholder="City / Airport"
        />
        <button type="button" onClick={swap}
          className="p-1.5 rounded-full bg-monsoon/40 border border-monsoon/60 text-sandstone hover:text-gate-gold hover:border-gate-gold/50 transition-colors self-end mb-1">
          <ArrowRightLeft className="w-3.5 h-3.5" />
        </button>
        <LocationInput label="To" value={destination} setValue={setDestination}
          suggestions={destSug} setSuggestions={setDestSug}
          show={showDest} setShow={setShowDest} refObj={destRef}
          placeholder="City / Airport"
        />
        <DateField label="Depart" value={departDate} setValue={setDepartDate} required />
        {tripType === 'RoundTrip' && <DateField label="Return" value={returnDate} setValue={setReturnDate} />}
      </div>

      <button type="submit"
        className="mt-4 w-full bg-gate-gold hover:bg-gate-gold-dim text-sea-deep font-bold py-2.5 rounded-lg transition-colors text-sm tracking-wide">
        Search flights
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Hotel Fields                                                       */
/* ------------------------------------------------------------------ */
function HotelFields() {
  const router = useRouter();
  const [city, setCity] = useState('');
  const [sug, setSug] = useState<ReturnType<typeof searchCities>>([]);
  const [showSug, setShowSug] = useState(false);
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setShowSug(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams({ city, checkin, checkout, guests: String(guests), rooms: String(rooms) });
    router.push(`/hotels/search?${p.toString()}`);
  };

  return (
    <form onSubmit={search} className="animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
        <div ref={ref} className="relative">
          <label className="block text-xs text-sandstone/70 mb-1 font-medium">Destination / City</label>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sandstone/50" />
            <input value={city} onChange={(e) => { setCity(e.target.value); setSug(searchCities(e.target.value)); setShowSug(true); }}
              onFocus={() => { if (city) setShowSug(true); }}
              className="w-full bg-sea-deep/80 border border-monsoon/50 rounded-lg py-2 pl-8 pr-2.5 text-paper text-sm placeholder-sandstone/40 focus:outline-none focus:border-gate-gold"
              placeholder="City" required />
          </div>
          {showSug && sug.length > 0 && (
            <div className="absolute top-full mt-1 bg-harbour border border-monsoon/60 rounded-lg z-20 w-full max-h-36 overflow-y-auto shadow-lg">
              {sug.map((c) => (
                <button key={c.name} type="button" onClick={() => { setCity(c.name); setShowSug(false); }}
                  className="w-full text-left px-3 py-1.5 text-sm text-paper/80 hover:bg-monsoon/40 flex justify-between">
                  <span>{c.name}</span>
                  <span className="text-sandstone/50 text-xs">{c.state}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
        <DateField label="Check-in" value={checkin} setValue={setCheckin} required />
        <DateField label="Check-out" value={checkout} setValue={setCheckout} required />
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-1.5 bg-sea-deep/80 border border-monsoon/50 rounded-lg px-2.5 py-2 text-xs text-paper/80">
            <Users className="w-3.5 h-3.5 text-gate-gold shrink-0" />
            <select value={guests} onChange={(e) => setGuests(Number(e.target.value))}
              className="bg-transparent text-paper focus:outline-none text-xs w-full">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>)}
            </select>
          </div>
          <div className="flex-1 flex items-center gap-1.5 bg-sea-deep/80 border border-monsoon/50 rounded-lg px-2.5 py-2 text-xs text-paper/80">
            <Hotel className="w-3.5 h-3.5 text-gate-gold shrink-0" />
            <select value={rooms} onChange={(e) => setRooms(Number(e.target.value))}
              className="bg-transparent text-paper focus:outline-none text-xs w-full">
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} Room{n > 1 ? 's' : ''}</option>)}
            </select>
          </div>
        </div>
      </div>

      <button type="submit"
        className="mt-4 w-full bg-gate-gold hover:bg-gate-gold-dim text-sea-deep font-bold py-2.5 rounded-lg transition-colors text-sm tracking-wide">
        Search hotels
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Bus Fields                                                         */
/* ------------------------------------------------------------------ */
function BusFields() {
  const router = useRouter();
  const [from, setFrom] = useState('Mumbai');
  const [to, setTo] = useState('Pune');
  const [date, setDate] = useState('');
  const [passengers, setPassengers] = useState(1);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams({ from, to, date, passengers: String(passengers) });
    router.push(`/bus?${p.toString()}`);
  };

  return (
    <form onSubmit={search} className="animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
        <div>
          <label className="block text-xs text-sandstone/70 mb-1 font-medium">From</label>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sandstone/50" />
            <input value={from} onChange={(e) => setFrom(e.target.value)}
              className="w-full bg-sea-deep/80 border border-monsoon/50 rounded-lg py-2 pl-8 pr-2.5 text-paper text-sm placeholder-sandstone/40 focus:outline-none focus:border-gate-gold"
              placeholder="From city" required />
          </div>
        </div>
        <div>
          <label className="block text-xs text-sandstone/70 mb-1 font-medium">To</label>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sandstone/50" />
            <input value={to} onChange={(e) => setTo(e.target.value)}
              className="w-full bg-sea-deep/80 border border-monsoon/50 rounded-lg py-2 pl-8 pr-2.5 text-paper text-sm placeholder-sandstone/40 focus:outline-none focus:border-gate-gold"
              placeholder="To city" required />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-end">
        <DateField label="Travel date" value={date} setValue={setDate} required />
        <div className="flex items-center gap-1.5 bg-sea-deep/80 border border-monsoon/50 rounded-lg px-2.5 py-2 text-xs text-paper/80">
          <Users className="w-3.5 h-3.5 text-gate-gold shrink-0" />
          <select value={passengers} onChange={(e) => setPassengers(Number(e.target.value))}
            className="bg-transparent text-paper focus:outline-none text-xs w-full">
            {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} Passenger{n > 1 ? 's' : ''}</option>)}
          </select>
        </div>
      </div>

      <button type="submit"
        className="mt-4 w-full bg-gate-gold hover:bg-gate-gold-dim text-sea-deep font-bold py-2.5 rounded-lg transition-colors text-sm tracking-wide">
        Search buses
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Cab Fields                                                         */
/* ------------------------------------------------------------------ */
function CabFields() {
  const router = useRouter();
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams({ pickup, drop, date, time });
    router.push(`/cabs?${p.toString()}`);
  };

  return (
    <form onSubmit={search} className="animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
        <div>
          <label className="block text-xs text-sandstone/70 mb-1 font-medium">Pickup location</label>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sandstone/50" />
            <input value={pickup} onChange={(e) => setPickup(e.target.value)}
              className="w-full bg-sea-deep/80 border border-monsoon/50 rounded-lg py-2 pl-8 pr-2.5 text-paper text-sm placeholder-sandstone/40 focus:outline-none focus:border-gate-gold"
              placeholder="Pickup point" required />
          </div>
        </div>
        <div>
          <label className="block text-xs text-sandstone/70 mb-1 font-medium">Drop location</label>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sandstone/50" />
            <input value={drop} onChange={(e) => setDrop(e.target.value)}
              className="w-full bg-sea-deep/80 border border-monsoon/50 rounded-lg py-2 pl-8 pr-2.5 text-paper text-sm placeholder-sandstone/40 focus:outline-none focus:border-gate-gold"
              placeholder="Drop point" required />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-end">
        <DateField label="Date" value={date} setValue={setDate} required />
        <div className="flex items-center gap-1.5 bg-sea-deep/80 border border-monsoon/50 rounded-lg px-2.5 py-2 text-xs text-paper/80">
          <Calendar className="w-3.5 h-3.5 text-gate-gold shrink-0" />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
            className="bg-transparent text-paper focus:outline-none text-xs w-full [color-scheme:dark]" required />
        </div>
      </div>

      <button type="submit"
        className="mt-4 w-full bg-gate-gold hover:bg-gate-gold-dim text-sea-deep font-bold py-2.5 rounded-lg transition-colors text-sm tracking-wide">
        Search cabs
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Package Fields                                                     */
/* ------------------------------------------------------------------ */
function PackageFields() {
  const router = useRouter();
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('3');
  const [travelers, setTravelers] = useState(2);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams({ destination, duration, travelers: String(travelers) });
    router.push(`/packages?${p.toString()}`);
  };

  return (
    <form onSubmit={search} className="animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
        <div>
          <label className="block text-xs text-sandstone/70 mb-1 font-medium">Destination</label>
          <div className="relative">
            <Compass className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sandstone/50" />
            <input value={destination} onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-sea-deep/80 border border-monsoon/50 rounded-lg py-2 pl-8 pr-2.5 text-paper text-sm placeholder-sandstone/40 focus:outline-none focus:border-gate-gold"
              placeholder="Where to?" required />
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-sea-deep/80 border border-monsoon/50 rounded-lg px-2.5 py-2 text-xs text-paper/80 self-end">
          <Sun className="w-3.5 h-3.5 text-gate-gold shrink-0" />
          <select value={duration} onChange={(e) => setDuration(e.target.value)}
            className="bg-transparent text-paper focus:outline-none text-xs w-full">
            {[1, 2, 3, 4, 5, 6, 7, 10, 14].map((n) => <option key={n} value={n}>{n} {n === 1 ? 'Night' : 'Nights'}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1.5 bg-sea-deep/80 border border-monsoon/50 rounded-lg px-2.5 py-2 text-xs text-paper/80 self-end">
          <Users className="w-3.5 h-3.5 text-gate-gold shrink-0" />
          <select value={travelers} onChange={(e) => setTravelers(Number(e.target.value))}
            className="bg-transparent text-paper focus:outline-none text-xs w-full">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n} Traveler{n > 1 ? 's' : ''}</option>)}
          </select>
        </div>
      </div>

      <button type="submit"
        className="mt-4 w-full bg-gate-gold hover:bg-gate-gold-dim text-sea-deep font-bold py-2.5 rounded-lg transition-colors text-sm tracking-wide">
        Search packages
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared sub-components                                              */
/* ------------------------------------------------------------------ */

function Triplet({ value, set, open, toggle, options }: {
  value: string; set: (v: string) => void; open: boolean; toggle: () => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <button type="button" onClick={toggle}
        className="flex items-center gap-1 bg-sea-deep/80 border border-monsoon/50 hover:border-gate-gold/50 rounded-lg px-2.5 py-2 text-xs text-paper/80 transition-colors">
        {options.find((o) => o.value === value)?.label ?? value}
        <ChevronDown className="w-3 h-3 text-sandstone/60" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-harbour border border-monsoon/60 rounded-lg py-1 z-30 w-40 shadow-lg">
          {options.map((o) => (
            <button key={o.value} type="button" onClick={() => { set(o.value); toggle(); }}
              className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-monsoon/40 ${value === o.value ? 'text-gate-gold' : 'text-paper/70'}`}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LocationInput({ label, value, setValue, suggestions, setSuggestions, show, setShow, refObj, placeholder }: {
  label: string; value: string; setValue: (v: string) => void;
  suggestions: Airport[]; setSuggestions: (v: Airport[]) => void;
  show: boolean; setShow: (v: boolean) => void; refObj: React.RefObject<HTMLDivElement | null>;
  placeholder: string;
}) {
  return (
    <div ref={refObj} className="relative">
      <label className="block text-xs text-sandstone/70 mb-1 font-medium">{label}</label>
      <div className="relative">
        <Plane className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sandstone/50" />
        <input value={value} onChange={(e) => { setValue(e.target.value.toUpperCase()); setSuggestions(searchAirports(e.target.value)); setShow(true); }}
          onFocus={() => { if (value) setShow(true); }}
          className="w-full bg-sea-deep/80 border border-monsoon/50 rounded-lg py-2 pl-8 pr-2.5 text-paper text-sm placeholder-sandstone/40 focus:outline-none focus:border-gate-gold uppercase"
          placeholder={placeholder} maxLength={3} required />
      </div>
      {show && suggestions.length > 0 && (
        <div className="absolute top-full mt-1 bg-harbour border border-monsoon/60 rounded-lg z-30 w-full max-h-40 overflow-y-auto shadow-lg">
          {suggestions.map((a: Airport) => (
            <button key={a.code} type="button" onClick={() => { setValue(a.code); setShow(false); }}
              className="w-full text-left px-3 py-1.5 text-sm text-paper/80 hover:bg-monsoon/40 flex justify-between">
              <span>{a.code} &mdash; {a.city}</span>
              <span className="text-sandstone/50 text-xs">{a.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DateField({ label, value, setValue, required }: {
  label: string; value: string; setValue: (v: string) => void; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-sandstone/70 mb-1 font-medium">{label}</label>
      <div className="relative">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sandstone/50" />
        <input type="date" value={value} onChange={(e) => setValue(e.target.value)}
          className="w-full bg-sea-deep/80 border border-monsoon/50 rounded-lg py-2 pl-8 pr-2.5 text-paper text-sm focus:outline-none focus:border-gate-gold [color-scheme:dark]"
          required={required} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Root export                                                       */
/* ------------------------------------------------------------------ */
export default function SearchForm({ service }: { service: ServiceType }) {
  switch (service) {
    case 'flights':
      return <div className="p-4 sm:p-5"><FlightFields /></div>;
    case 'hotels':
      return <div className="p-4 sm:p-5"><HotelFields /></div>;
    case 'bus':
      return <div className="p-4 sm:p-5"><BusFields /></div>;
    case 'cabs':
      return <div className="p-4 sm:p-5"><CabFields /></div>;
    case 'packages':
      return <div className="p-4 sm:p-5"><PackageFields /></div>;
  }
}
