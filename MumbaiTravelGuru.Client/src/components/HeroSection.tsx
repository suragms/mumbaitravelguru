'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plane, Hotel, Bus, Car, Compass, MapPin, Calendar, Users, ArrowRightLeft, Sun, ShieldCheck, HeadphonesIcon, Banknote, Clock, ChevronRight, Sparkles } from 'lucide-react';
import { useSearchContext } from '@/context/SearchContext';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
type ServiceType = 'flights' | 'hotels' | 'bus' | 'cabs' | 'packages';

interface ServiceTab {
  id: ServiceType;
  label: string;
  icon: React.ElementType;
}

const SERVICES: ServiceTab[] = [
  { id: 'flights', label: 'Flights', icon: Plane },
  { id: 'hotels', label: 'Hotels', icon: Hotel },
  { id: 'bus', label: 'Bus', icon: Bus },
  { id: 'cabs', label: 'Cabs', icon: Car },
  { id: 'packages', label: 'Packages', icon: Compass },
];

const TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    title: 'Secure Guru Wallet',
    copy: 'Your money sits in an encrypted Wallet. Use it to book any service — flights, hotels, cabs — with zero convenience fee. Refunds land here instantly, not in a 7-day bank limbo.',
  },
  {
    icon: HeadphonesIcon,
    title: '24x7 Mumbai Support',
    copy: 'Our team is based out of Andheri. We know the Western Express Highway at 9 PM and the first local from CSMT. Call or chat — we answer in Marathi, Hindi, and English.',
  },
  {
    icon: Banknote,
    title: 'No Hidden Fees',
    copy: 'The fare you see is the fare you pay. We show the full breakup — base fare, taxes, convenience fee, GST — before you enter your UPI PIN. No surprise markups at checkout.',
  },
  {
    icon: Clock,
    title: 'Instant Refunds',
    copy: 'Cancel a booking? Your refund hits your Guru Wallet in seconds, not days. Use it right away for your next booking or withdraw to your bank — no paperwork needed.',
  },
];

const DESTINATIONS = [
  {
    name: 'Goa',
    subtitle: 'Sun, sand & spice',
    tag: 'From ₹3,999',
    detail: '55 min flight • Direct from BOM',
    href: '/flights/results?origin=BOM&destination=GOI&tripType=OneWay&adults=1&cabinClass=Economy',
    gradient: 'from-amber-900/60 to-sea-deep/90',
  },
  {
    name: 'Lonavala',
    subtitle: 'Monsoon in the Sahyadris',
    tag: 'From ₹899',
    detail: '90 min drive • Weekend escape',
    href: '/bus?from=Mumbai&to=Lonavala',
    gradient: 'from-emerald-900/60 to-sea-deep/90',
  },
  {
    name: 'Alibaug',
    subtitle: 'Coastal Konkan getaway',
    tag: 'From ₹499',
    detail: 'Ferry from Gateway of India',
    href: '/packages?destination=Alibaug',
    gradient: 'from-cyan-900/60 to-sea-deep/90',
  },
  {
    name: 'Kashmir',
    subtitle: 'Paradise on earth',
    tag: 'From ₹7,999',
    detail: 'Direct flight from BOM',
    href: '/flights/results?origin=BOM&destination=SXR&tripType=OneWay&adults=1&cabinClass=Economy',
    gradient: 'from-sky-900/60 to-sea-deep/90',
  },
];

const QUICK_ROUTES = [
  { from: 'BOM', to: 'DEL', label: 'Mumbai → Delhi', price: '₹3,999' },
  { from: 'BOM', to: 'GOI', label: 'Mumbai → Goa', price: '₹5,200' },
  { from: 'BOM', to: 'BLR', label: 'Mumbai → Bengaluru', price: '₹4,499' },
  { from: 'BOM', to: 'PNQ', label: 'Mumbai → Pune', price: '₹1,999' },
];

/* ------------------------------------------------------------------ */
/*  Skyline Background SVG                                             */
/* ------------------------------------------------------------------ */
function SkylineBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      <svg
        viewBox="0 0 1440 560"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0C1824" />
            <stop offset="55%" stopColor="#0F1D2E" />
            <stop offset="80%" stopColor="#152433" />
            <stop offset="100%" stopColor="#1C2A3A" />
          </linearGradient>
          <linearGradient id="goldGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="60%" stopColor="rgba(212,166,90,0.04)" />
            <stop offset="85%" stopColor="rgba(212,166,90,0.10)" />
            <stop offset="100%" stopColor="rgba(212,166,90,0.15)" />
          </linearGradient>
          <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(12,24,36,0.4)" />
            <stop offset="100%" stopColor="rgba(12,24,36,0.8)" />
          </linearGradient>
        </defs>

        <rect width="1440" height="560" fill="url(#skyGrad)" />

        {/* Golden hour glow near the horizon */}
        <rect x="0" y="260" width="1440" height="200" fill="url(#goldGlow)" />

        {/* Skyline silhouette — Marine Drive / Nariman Point inspired */}
        <g fill="#0C1824" opacity="0.85">
          {/* Nariman Point cluster (left, dense tall buildings) */}
          <rect x="120" y="240" width="18" height="200" />
          <rect x="142" y="215" width="22" height="225" />
          <rect x="168" y="230" width="16" height="210" />
          <rect x="188" y="195" width="20" height="245" />
          <rect x="212" y="210" width="14" height="230" />
          <rect x="230" y="185" width="25" height="255" />
          <rect x="260" y="225" width="18" height="215" />
          <rect x="282" y="200" width="20" height="240" />
          <rect x="306" y="175" width="24" height="265" />
          <rect x="334" y="195" width="16" height="245" />
          <rect x="354" y="215" width="22" height="225" />
          <rect x="380" y="235" width="18" height="205" />

          {/* Art Deco stepped building */}
          <rect x="402" y="205" width="12" height="235" />
          <rect x="402" y="215" width="28" height="225" />
          <rect x="402" y="225" width="42" height="215" />

          {/* Mid cluster (the curve) */}
          <rect x="450" y="245" width="16" height="195" />
          <rect x="470" y="260" width="20" height="180" />
          <rect x="494" y="235" width="14" height="205" />
          <rect x="512" y="250" width="22" height="190" />
          <rect x="538" y="270" width="18" height="170" />
          <rect x="560" y="255" width="15" height="185" />
          <rect x="580" y="240" width="20" height="200" />
          <rect x="604" y="260" width="16" height="180" />
          <rect x="624" y="275" width="22" height="165" />

          {/* Gateway of India arch silhouette */}
          <path d="M655,370 Q670,340 685,370 Q678,378 670,378 Q662,378 655,370 Z" fill="#0C1824" />

          {/* Spreading right cluster */}
          <rect x="700" y="260" width="18" height="180" />
          <rect x="722" y="280" width="14" height="160" />
          <rect x="740" y="255" width="20" height="185" />
          <rect x="764" y="270" width="16" height="170" />
          <rect x="784" y="285" width="18" height="155" />
          <rect x="806" y="260" width="15" height="180" />
          <rect x="825" y="275" width="20" height="165" />
          <rect x="849" y="290" width="16" height="150" />

          {/* Malabar Hill area (right, lower, spread out) */}
          <rect x="890" y="280" width="18" height="160" />
          <rect x="912" y="300" width="14" height="140" />
          <rect x="930" y="275" width="20" height="165" />
          <rect x="954" y="295" width="16" height="145" />
          <rect x="974" y="285" width="18" height="155" />
          <rect x="996" y="305" width="14" height="135" />
          <rect x="1014" y="290" width="20" height="150" />

          {/* Far right scattered */}
          <rect x="1050" y="310" width="16" height="130" />
          <rect x="1070" y="320" width="14" height="120" />
          <rect x="1090" y="305" width="18" height="135" />
          <rect x="1120" y="325" width="15" height="115" />
          <rect x="1150" y="315" width="16" height="125" />
          <rect x="1180" y="335" width="14" height="105" />
        </g>

        {/* Building highlight accents (lit windows) */}
        <g fill="rgba(191,169,138,0.12)">
          <rect x="190" y="200" width="6" height="4" rx="1" />
          <rect x="232" y="190" width="6" height="4" rx="1" />
          <rect x="308" y="180" width="6" height="4" rx="1" />
          <rect x="315" y="200" width="6" height="4" rx="1" />
          <rect x="340" y="200" width="6" height="4" rx="1" />
          <rect x="410" y="210" width="6" height="4" rx="1" />
          <rect x="515" y="255" width="6" height="4" rx="1" />
          <rect x="585" y="245" width="6" height="4" rx="1" />
          <rect x="745" y="260" width="6" height="4" rx="1" />
          <rect x="935" y="280" width="6" height="4" rx="1" />
        </g>

        {/* Queen's Necklace — streetlights along Marine Drive curve */}
        <g fill="#D4A65A" opacity="0.6">
          <circle cx="130" cy="438" r="1.5" />
          <circle cx="175" cy="437" r="1.5" />
          <circle cx="220" cy="436" r="1.5" />
          <circle cx="260" cy="435" r="1.5" />
          <circle cx="300" cy="434" r="1.5" />
          <circle cx="340" cy="433" r="1.5" />
          <circle cx="380" cy="432" r="1.5" />
          <circle cx="420" cy="432" r="1.5" />
          <circle cx="460" cy="432" r="1.5" />
          <circle cx="500" cy="433" r="1.5" />
          <circle cx="540" cy="434" r="1.5" />
          <circle cx="580" cy="435" r="1.5" />
          <circle cx="620" cy="436" r="1.5" />
          <circle cx="660" cy="437" r="1.5" />
          <circle cx="700" cy="437" r="1.5" />
          <circle cx="740" cy="438" r="1.5" />
          <circle cx="780" cy="439" r="1.5" />
          <circle cx="820" cy="439" r="1.5" />
          <circle cx="860" cy="440" r="1.5" />
          <circle cx="900" cy="440" r="1.5" />
          <circle cx="940" cy="441" r="1.5" />
          <circle cx="980" cy="441" r="1.5" />
          <circle cx="1020" cy="442" r="1.5" />
          <circle cx="1060" cy="442" r="1.5" />
          <circle cx="1100" cy="443" r="1.5" />
          <circle cx="1140" cy="443" r="1.5" />
          <circle cx="1180" cy="443" r="1.5" />
        </g>

        {/* Brighter necklace highlights (every 4th light) */}
        <g fill="#D4A65A" opacity="0.9">
          <circle cx="220" cy="436" r="2" />
          <circle cx="380" cy="432" r="2" />
          <circle cx="540" cy="434" r="2" />
          <circle cx="700" cy="437" r="2" />
          <circle cx="860" cy="440" r="2" />
          <circle cx="1020" cy="442" r="2" />
          <circle cx="1180" cy="443" r="2" />
        </g>

        {/* Water/sea base */}
        <rect x="0" y="440" width="1440" height="120" fill="url(#waterGrad)" />
      </svg>

      {/* Bottom fade to allow content transition */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-sea-deep to-transparent" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components: Form Fields                                        */
/* ------------------------------------------------------------------ */

function AirportInput({
  label, value, onChange, placeholder, icon: Icon,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; icon: React.ElementType;
}) {
  return (
    <div>
      <label className="block text-xs text-sandstone/60 mb-1 font-medium tracking-wide">{label}</label>
      <div className="relative">
        <Icon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sandstone/40" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="w-full bg-sea-deep border border-monsoon/50 rounded-lg py-2 sm:py-2.5 pl-8 pr-2.5 text-paper text-sm placeholder-sandstone/30 focus:outline-none focus:border-gate-gold/70 transition-colors uppercase"
          placeholder={placeholder}
          maxLength={3}
          required
        />
      </div>
    </div>
  );
}

function DateInput({
  label, value, onChange, required,
}: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-sandstone/60 mb-1 font-medium tracking-wide">{label}</label>
      <div className="relative">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sandstone/40" />
        <input
          type="date" value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full bg-sea-deep border border-monsoon/50 rounded-lg py-2 sm:py-2.5 pl-8 pr-2.5 text-paper text-sm focus:outline-none focus:border-gate-gold/70 transition-colors [color-scheme:dark]"
          required={required}
        />
      </div>
    </div>
  );
}

function SelectInput({
  label, value, onChange, options, icon: Icon,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; icon: React.ElementType;
}) {
  return (
    <div>
      <label className="block text-xs text-sandstone/60 mb-1 font-medium tracking-wide">{label}</label>
      <div className="relative">
        <Icon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sandstone/40 pointer-events-none" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-sea-deep border border-monsoon/50 rounded-lg py-2 sm:py-2.5 pl-8 pr-2.5 text-paper text-sm focus:outline-none focus:border-gate-gold/70 transition-colors appearance-none"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Service-Specific Form Fields                                       */
/* ------------------------------------------------------------------ */

function FlightFields() {
  const router = useRouter();
  const [tripType, setTripType] = useState('OneWay');
  const [origin, setOrigin] = useState('BOM');
  const [destination, setDestination] = useState('');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [adults, setAdults] = useState('1');
  const [cabinClass, setCabinClass] = useState('Economy');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({ origin, destination, tripType, departDate, adults, cabinClass });
    if (tripType === 'RoundTrip' && returnDate) params.set('returnDate', returnDate);
    router.push(`/flights/results?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch}>
      <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
        <div className="flex bg-sea-deep border border-monsoon/50 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setTripType('OneWay')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${tripType === 'OneWay' ? 'bg-gate-gold/15 text-gate-gold' : 'text-sandstone/50 hover:text-sandstone/80'}`}
          >
            One way
          </button>
          <button
            type="button"
            onClick={() => setTripType('RoundTrip')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${tripType === 'RoundTrip' ? 'bg-gate-gold/15 text-gate-gold' : 'text-sandstone/50 hover:text-sandstone/80'}`}
          >
            Round trip
          </button>
        </div>
        <SelectInput
          label="" value={cabinClass} onChange={setCabinClass}
          options={[{ value: 'Economy', label: 'Economy' }, { value: 'PremiumEconomy', label: 'Premium Economy' }, { value: 'Business', label: 'Business' }]}
          icon={Plane}
        />
      </div>

      <div className="grid grid-cols-[1fr,auto,1fr] sm:grid-cols-[1fr,auto,1fr,auto,auto] gap-2 sm:gap-3 items-end">
        <AirportInput label="From" value={origin} onChange={setOrigin} placeholder="BOM" icon={Plane} />
        <button
          type="button"
          onClick={() => { const t = origin; setOrigin(destination); setDestination(t); }}
          className="p-1.5 rounded-full border border-monsoon/50 bg-sea-deep text-sandstone/60 hover:text-gate-gold hover:border-gate-gold/50 transition-colors self-end mb-1"
          aria-label="Swap airports"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
        </button>
        <AirportInput label="To" value={destination} onChange={setDestination} placeholder="DEL" icon={Plane} />
        <DateInput label="Depart" value={departDate} onChange={setDepartDate} required />
        {tripType === 'RoundTrip' && <DateInput label="Return" value={returnDate} onChange={setReturnDate} />}
        <SelectInput
          label="Travelers" value={adults} onChange={setAdults}
          options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `${n} Adult${n > 1 ? 's' : ''}` }))}
          icon={Users}
        />
      </div>

      <button
        type="submit"
        className="mt-4 sm:mt-5 w-full bg-gate-gold hover:bg-gate-gold-dim text-sea-deep font-bold py-2.5 sm:py-3 rounded-lg transition-all text-sm sm:text-base tracking-wide shadow-lg shadow-gate-gold/15 hover:shadow-gate-gold/25"
      >
        Search flights
      </button>
    </form>
  );
}

function HotelFields() {
  const router = useRouter();
  const [city, setCity] = useState('');
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [guests, setGuests] = useState('2');
  const [rooms, setRooms] = useState('1');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({ city, checkin, checkout, guests, rooms });
    router.push(`/hotels/search?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div>
          <label className="block text-xs text-sandstone/60 mb-1 font-medium tracking-wide">Destination / City</label>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sandstone/40" />
            <input
              value={city} onChange={(e) => setCity(e.target.value)}
              className="w-full bg-sea-deep border border-monsoon/50 rounded-lg py-2 sm:py-2.5 pl-8 pr-2.5 text-paper text-sm placeholder-sandstone/30 focus:outline-none focus:border-gate-gold/70 transition-colors"
              placeholder="City or property name" required
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 items-end">
        <DateInput label="Check-in" value={checkin} onChange={setCheckin} required />
        <DateInput label="Check-out" value={checkout} onChange={setCheckout} required />
        <div className="grid grid-cols-2 gap-2">
          <SelectInput label="Guests" value={guests} onChange={setGuests}
            options={[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ value: String(n), label: `${n} Guest${n > 1 ? 's' : ''}` }))}
            icon={Users}
          />
          <SelectInput label="Rooms" value={rooms} onChange={setRooms}
            options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} Room${n > 1 ? 's' : ''}` }))}
            icon={Hotel}
          />
        </div>
      </div>
      <button
        type="submit"
        className="mt-4 sm:mt-5 w-full bg-gate-gold hover:bg-gate-gold-dim text-sea-deep font-bold py-2.5 sm:py-3 rounded-lg transition-all text-sm sm:text-base tracking-wide shadow-lg shadow-gate-gold/15 hover:shadow-gate-gold/25"
      >
        Search hotels
      </button>
    </form>
  );
}

function BusFields() {
  const router = useRouter();
  const [from, setFrom] = useState('Mumbai');
  const [to, setTo] = useState('Pune');
  const [date, setDate] = useState('');
  const [passengers, setPassengers] = useState('1');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({ from, to, date, passengers: String(passengers) });
    router.push(`/bus?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div>
          <label className="block text-xs text-sandstone/60 mb-1 font-medium tracking-wide">From</label>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sandstone/40" />
            <input value={from} onChange={(e) => setFrom(e.target.value)}
              className="w-full bg-sea-deep border border-monsoon/50 rounded-lg py-2 sm:py-2.5 pl-8 pr-2.5 text-paper text-sm placeholder-sandstone/30 focus:outline-none focus:border-gate-gold/70 transition-colors"
              placeholder="Departure city" required />
          </div>
        </div>
        <div>
          <label className="block text-xs text-sandstone/60 mb-1 font-medium tracking-wide">To</label>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sandstone/40" />
            <input value={to} onChange={(e) => setTo(e.target.value)}
              className="w-full bg-sea-deep border border-monsoon/50 rounded-lg py-2 sm:py-2.5 pl-8 pr-2.5 text-paper text-sm placeholder-sandstone/30 focus:outline-none focus:border-gate-gold/70 transition-colors"
              placeholder="Arrival city" required />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 items-end">
        <DateInput label="Travel date" value={date} onChange={setDate} required />
        <SelectInput label="Passengers" value={passengers} onChange={setPassengers}
          options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `${n} Passenger${n > 1 ? 's' : ''}` }))}
          icon={Users}
        />
      </div>
      <button
        type="submit"
        className="mt-4 sm:mt-5 w-full bg-gate-gold hover:bg-gate-gold-dim text-sea-deep font-bold py-2.5 sm:py-3 rounded-lg transition-all text-sm sm:text-base tracking-wide shadow-lg shadow-gate-gold/15 hover:shadow-gate-gold/25"
      >
        Search buses
      </button>
    </form>
  );
}

function CabFields() {
  const router = useRouter();
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [tripType, setTripType] = useState('City');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({ pickup, drop, date, time, tripType });
    router.push(`/cabs?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch}>
      <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
        <div className="flex bg-sea-deep border border-monsoon/50 rounded-lg p-0.5">
          <button type="button" onClick={() => setTripType('City')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${tripType === 'City' ? 'bg-gate-gold/15 text-gate-gold' : 'text-sandstone/50 hover:text-sandstone/80'}`}>City</button>
          <button type="button" onClick={() => setTripType('Outstation')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${tripType === 'Outstation' ? 'bg-gate-gold/15 text-gate-gold' : 'text-sandstone/50 hover:text-sandstone/80'}`}>Outstation</button>
          <button type="button" onClick={() => setTripType('Airport')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${tripType === 'Airport' ? 'bg-gate-gold/15 text-gate-gold' : 'text-sandstone/50 hover:text-sandstone/80'}`}>Airport</button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div>
          <label className="block text-xs text-sandstone/60 mb-1 font-medium tracking-wide">Pickup location</label>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sandstone/40" />
            <input value={pickup} onChange={(e) => setPickup(e.target.value)}
              className="w-full bg-sea-deep border border-monsoon/50 rounded-lg py-2 sm:py-2.5 pl-8 pr-2.5 text-paper text-sm placeholder-sandstone/30 focus:outline-none focus:border-gate-gold/70 transition-colors"
              placeholder="Pickup point" required />
          </div>
        </div>
        <div>
          <label className="block text-xs text-sandstone/60 mb-1 font-medium tracking-wide">Drop location</label>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sandstone/40" />
            <input value={drop} onChange={(e) => setDrop(e.target.value)}
              className="w-full bg-sea-deep border border-monsoon/50 rounded-lg py-2 sm:py-2.5 pl-8 pr-2.5 text-paper text-sm placeholder-sandstone/30 focus:outline-none focus:border-gate-gold/70 transition-colors"
              placeholder="Drop point" required />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3 items-end">
        <DateInput label="Date" value={date} onChange={setDate} required />
        <div>
          <label className="block text-xs text-sandstone/60 mb-1 font-medium tracking-wide">Time</label>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sandstone/40" />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
              className="w-full bg-sea-deep border border-monsoon/50 rounded-lg py-2 sm:py-2.5 pl-8 pr-2.5 text-paper text-sm focus:outline-none focus:border-gate-gold/70 transition-colors [color-scheme:dark]" required />
          </div>
        </div>
      </div>
      <button
        type="submit"
        className="mt-4 sm:mt-5 w-full bg-gate-gold hover:bg-gate-gold-dim text-sea-deep font-bold py-2.5 sm:py-3 rounded-lg transition-all text-sm sm:text-base tracking-wide shadow-lg shadow-gate-gold/15 hover:shadow-gate-gold/25"
      >
        Search cabs
      </button>
    </form>
  );
}

function PackageFields() {
  const router = useRouter();
  const [destination, setDestination] = useState('');
  const [month, setMonth] = useState('');
  const [travelers, setTravelers] = useState('2');
  const [duration, setDuration] = useState('3');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({ destination, month, travelers, duration });
    router.push(`/packages?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div>
          <label className="block text-xs text-sandstone/60 mb-1 font-medium tracking-wide">Destination</label>
          <div className="relative">
            <Compass className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sandstone/40" />
            <input value={destination} onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-sea-deep border border-monsoon/50 rounded-lg py-2 sm:py-2.5 pl-8 pr-2.5 text-paper text-sm placeholder-sandstone/30 focus:outline-none focus:border-gate-gold/70 transition-colors"
              placeholder="Where to?" required />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 items-end">
        <div>
          <label className="block text-xs text-sandstone/60 mb-1 font-medium tracking-wide">Month</label>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sandstone/40" />
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
              className="w-full bg-sea-deep border border-monsoon/50 rounded-lg py-2 sm:py-2.5 pl-8 pr-2.5 text-paper text-sm focus:outline-none focus:border-gate-gold/70 transition-colors [color-scheme:dark]" required />
          </div>
        </div>
        <SelectInput label="Travelers" value={travelers} onChange={setTravelers}
          options={[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ value: String(n), label: `${n} Traveler${n > 1 ? 's' : ''}` }))}
          icon={Users}
        />
        <SelectInput label="Duration" value={duration} onChange={setDuration}
          options={[1, 2, 3, 4, 5, 6, 7, 10, 14].map((n) => ({ value: String(n), label: n >= 7 ? `${n} Days` : `${n} Nights` }))}
          icon={Sun}
        />
      </div>
      <button
        type="submit"
        className="mt-4 sm:mt-5 w-full bg-gate-gold hover:bg-gate-gold-dim text-sea-deep font-bold py-2.5 sm:py-3 rounded-lg transition-all text-sm sm:text-base tracking-wide shadow-lg shadow-gate-gold/15 hover:shadow-gate-gold/25"
      >
        Search packages
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Hero Section Export                                           */
/* ------------------------------------------------------------------ */
export default function HeroSection() {
  const { setIsSearchOpen } = useSearchContext();
  const [activeService, setActiveService] = useState<ServiceType>('flights');
  const [animKey, setAnimKey] = useState(0);
  const ActiveIcon = SERVICES.find((s) => s.id === activeService)?.icon || Plane;

  const switchService = useCallback((svc: ServiceType) => {
    if (svc === activeService) return;
    setActiveService(svc);
    setAnimKey((k) => k + 1);
  }, [activeService]);

  /* ---- render active form ---- */
  function renderForm() {
    const key = animKey;
    switch (activeService) {
      case 'flights':
        return <div key={key} className="animate-fade-in"><FlightFields /></div>;
      case 'hotels':
        return <div key={key} className="animate-fade-in"><HotelFields /></div>;
      case 'bus':
        return <div key={key} className="animate-fade-in"><BusFields /></div>;
      case 'cabs':
        return <div key={key} className="animate-fade-in"><CabFields /></div>;
      case 'packages':
        return <div key={key} className="animate-fade-in"><PackageFields /></div>;
    }
  }

  return (
    <section className="relative">
      {/* ========== SKYLINE ========== */}
      <SkylineBackground />

      {/* ========== HERO CONTENT ========== */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 lg:pt-16 pb-8 sm:pb-12">
        {/* Brand marker */}
        <div className="flex items-center gap-2 mb-4 sm:mb-6 animate-fade-in">
          <div className="bg-gate-gold/15 p-1.5 rounded-lg">
            <Compass className="w-4 h-4 text-gate-gold" />
          </div>
          <span className="font-display text-sm text-paper/60 tracking-wider uppercase">
            Mumbai Travel Guru
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-paper leading-tight max-w-2xl mb-2 animate-fade-in" style={{ animationDelay: '0.15s' }}>
          Where are you headed?
        </h1>
        <p className="text-sandstone/60 text-sm sm:text-base lg:text-lg max-w-xl mb-6 sm:mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          Search flights, hotels, buses, cabs, and holiday packages — all in one place.
          Mumbai&apos;s own travel marketplace.
        </p>

        {/* ========== COMMAND CENTER — SEARCH WIDGET ========== */}
        <div className="rounded-xl border border-monsoon/60 bg-harbour/95 backdrop-blur-sm shadow-2xl shadow-black/30 overflow-hidden max-w-4xl animate-fade-in" style={{ animationDelay: '0.45s' }}>
          {/* Tab strip */}
          <div
            className="flex overflow-x-auto scrollbar-none border-b border-monsoon/50"
            role="tablist"
            aria-label="Travel services"
          >
            {SERVICES.map((svc) => {
              const Icon = svc.icon;
              const isActive = activeService === svc.id;
              return (
                <button
                  key={svc.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`hero-panel-${svc.id}`}
                  id={`hero-tab-${svc.id}`}
                  onClick={() => switchService(svc.id)}
                  className={`
                    relative flex items-center gap-1.5 sm:gap-2
                    px-4 sm:px-6 py-2.5 sm:py-3.5
                    text-xs sm:text-sm font-medium whitespace-nowrap
                    border-r border-monsoon/40 last:border-r-0
                    transition-colors duration-200
                    ${isActive
                      ? 'text-gate-gold bg-sea-deep/60'
                      : 'text-sandstone/50 hover:text-sandstone/80 hover:bg-sea-deep/20'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="hidden sm:inline">{svc.label}</span>
                  <span className="sm:hidden">{svc.label.slice(0, 3)}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gate-gold rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Ticket-stub perforated divider */}
          <div className="ticket-stub-bottom bg-sea-deep" />

          {/* Form panel */}
          <div
            role="tabpanel"
            id={`hero-panel-${activeService}`}
            aria-labelledby={`hero-tab-${activeService}`}
            className="p-4 sm:p-5 lg:p-6"
          >
            {/* Desktop: full form */}
            <div className="hidden sm:block">{renderForm()}</div>

            {/* Mobile: compact sticky search trigger */}
            <div className="sm:hidden">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="w-full flex items-center justify-between bg-sea-deep/80 border border-monsoon/50 rounded-lg px-4 py-3 text-left transition-colors hover:border-gate-gold/50 active:bg-monsoon/40"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-gate-gold/10 p-2 rounded-lg">
                    <ActiveIcon className="w-5 h-5 text-gate-gold" />
                  </div>
                  <div>
                    <div className="text-[10px] text-sandstone/50 font-medium uppercase tracking-wider">
                      {activeService} search
                    </div>
                    <div className="text-sm text-paper font-medium">Where are you going?</div>
                  </div>
                </div>
                <div className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-gate-gold text-sea-deep font-bold text-sm rounded-lg px-5">
                  Go
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Quick route chips */}
        <div className="flex flex-wrap gap-2 mt-4 sm:mt-5 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <span className="text-xs text-sandstone/50 self-center mr-1 font-medium">Popular:</span>
          {QUICK_ROUTES.map((r) => (
            <Link
              key={r.to}
              href={`/flights/results?origin=${r.from}&destination=${r.to}&tripType=OneWay&adults=1&cabinClass=Economy`}
              className="inline-flex items-center gap-1.5 bg-harbour/80 border border-monsoon/50 hover:border-gate-gold/40 rounded-full px-3 py-1 text-xs text-paper/70 hover:text-gate-gold transition-all"
            >
              <Plane className="w-3 h-3" />
              {r.label}
              <span className="font-mono text-gate-gold/80">{r.price}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ========== TRUST STRIP ========== */}
      <div className="relative z-10 border-t border-monsoon/50 bg-harbour/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {TRUST_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-3">
                  <div className="shrink-0 mt-0.5">
                    <div className="bg-gate-gold/10 border border-gate-gold/20 rounded-lg p-2">
                      <Icon className="w-4 h-4 text-gate-gold" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-paper mb-1">{item.title}</h3>
                    <p className="text-xs text-sandstone/60 leading-relaxed">{item.copy}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========== DESTINATION CARDS ========== */}
      <div className="relative z-10 border-t border-monsoon/30 bg-sea-deep/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex items-center justify-between mb-5 sm:mb-6">
            <h2 className="font-display text-xl sm:text-2xl text-paper">
              Places to go from Mumbai
            </h2>
            <Link
              href="/packages"
              className="text-xs text-gate-gold hover:text-gate-gold-dim font-medium flex items-center gap-1 transition-colors"
            >
              View all packages <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {DESTINATIONS.map((dest) => (
              <Link
                key={dest.name}
                href={dest.href}
                className="group relative rounded-xl overflow-hidden border border-monsoon/50 hover:border-gate-gold/40 transition-all"
              >
                {/* Card background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${dest.gradient} transition-opacity group-hover:opacity-90`} />
                <div className="absolute inset-0 bg-sea-deep/40" />

                {/* Content */}
                <div className="relative p-4 sm:p-5 min-h-[140px] sm:min-h-[160px] flex flex-col justify-end">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-display text-lg sm:text-xl text-paper group-hover:text-gate-gold transition-colors">
                        {dest.name}
                      </h3>
                      <p className="text-xs text-sandstone/70 mt-0.5">{dest.subtitle}</p>
                    </div>
                    <Sparkles className="w-4 h-4 text-gate-gold/60 group-hover:text-gate-gold transition-colors" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-sandstone/60">{dest.detail}</span>
                    <span className="font-mono text-sm font-bold text-gate-gold">{dest.tag}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
