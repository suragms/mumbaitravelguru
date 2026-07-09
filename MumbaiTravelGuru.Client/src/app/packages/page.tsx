'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { Compass, Filter, MapPin, Calendar, Users, IndianRupee, Tag, Sparkles, AlertCircle } from 'lucide-react';

interface PackageListItemDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  destination: string;
  theme: string;
  durationDays: number;
  durationNights: number;
  pricePerPerson: number;
  discountedPricePerPerson?: number;
  currency: string;
  photoUrls: string[];
  highlights: string[];
  isFixedDeparture: boolean;
}

function priceINR(price: number) {
  return `₹${price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export default function PackagesListPage() {
  const [packages, setPackages] = useState<PackageListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [destination, setDestination] = useState('');
  const [maxDuration, setMaxDuration] = useState<number | null>(null);
  const [theme, setTheme] = useState('');
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (destination) params.set('destination', destination);
        if (maxDuration) params.set('maxDuration', String(maxDuration));
        if (theme) params.set('theme', theme);
        if (maxPrice) params.set('maxPrice', String(maxPrice));
        const qs = params.toString();
        const data = await apiRequest<PackageListItemDto[]>(`/api/v1/packages${qs ? '?' + qs : ''}`);
        setPackages(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load packages');
      }
      setLoading(false);
    };
    fetch();
  }, [destination, maxDuration, theme, maxPrice]);

  const themes = useMemo(() => [...new Set(packages.map(p => p.theme))], [packages]);
  const destinations = useMemo(() => [...new Set(packages.map(p => p.destination))], [packages]);

  return (
    <div className="min-h-dvh bg-sea-deep">
      <header className="sticky top-0 z-30 border-b border-monsoon/60 bg-sea-deep/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-gate-gold/15 p-1 rounded-lg">
              <Compass className="w-4 h-4 text-gate-gold" />
            </div>
            <span className="font-display text-sm text-paper tracking-wide">Mumbai Travel Guru</span>
          </Link>
          <span className="text-xs text-sandstone/60">Holiday Packages</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="font-display text-xl sm:text-2xl text-paper flex items-center gap-2">
            <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-gate-gold" /> Holiday Packages
          </h1>
          <p className="text-sandstone/60 text-xs sm:text-sm mt-1">Curated travel experiences across India</p>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 bg-harbour border border-monsoon/50 rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-1.5 bg-sea-deep border border-monsoon/50 rounded-lg px-2.5 py-1.5">
            <MapPin className="w-3.5 h-3.5 text-sandstone/50 shrink-0" />
            <select value={destination} onChange={e => setDestination(e.target.value)}
              className="bg-transparent text-xs text-sandstone/70 focus:outline-none">
              <option value="">All Destinations</option>
              {destinations.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5 bg-sea-deep border border-monsoon/50 rounded-lg px-2.5 py-1.5">
            <Tag className="w-3.5 h-3.5 text-sandstone/50 shrink-0" />
            <select value={theme} onChange={e => setTheme(e.target.value)}
              className="bg-transparent text-xs text-sandstone/70 focus:outline-none">
              <option value="">All Themes</option>
              {themes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5 bg-sea-deep border border-monsoon/50 rounded-lg px-2.5 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-sandstone/50 shrink-0" />
            <select value={maxDuration ?? ''} onChange={e => setMaxDuration(e.target.value ? Number(e.target.value) : null)}
              className="bg-transparent text-xs text-sandstone/70 focus:outline-none">
              <option value="">Any Duration</option>
              <option value="3">Up to 3 days</option>
              <option value="5">Up to 5 days</option>
              <option value="7">Up to 7 days</option>
              <option value="10">Up to 10 days</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5 bg-sea-deep border border-monsoon/50 rounded-lg px-2.5 py-1.5">
            <IndianRupee className="w-3.5 h-3.5 text-sandstone/50 shrink-0" />
            <select value={maxPrice ?? ''} onChange={e => setMaxPrice(e.target.value ? Number(e.target.value) : null)}
              className="bg-transparent text-xs text-sandstone/70 focus:outline-none">
              <option value="">Any Price</option>
              <option value="15000">Under ₹15,000</option>
              <option value="25000">Under ₹25,000</option>
              <option value="35000">Under ₹35,000</option>
              <option value="50000">Under ₹50,000</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gate-gold border-t-transparent" />
          </div>
        ) : error ? (
          <div className="bg-harbour border border-monsoon/50 rounded-xl p-8 text-center max-w-lg mx-auto">
            <AlertCircle className="w-8 h-8 text-gate-gold/60 mx-auto mb-3" />
            <p className="text-sm text-sandstone/70">{error}</p>
          </div>
        ) : packages.length === 0 ? (
          <div className="bg-harbour border border-monsoon/50 rounded-xl p-8 sm:p-10 text-center max-w-lg mx-auto">
            <div className="bg-gate-gold/10 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
              <Compass className="w-6 h-6 text-gate-gold/60" />
            </div>
            <h2 className="text-base font-semibold text-paper mb-2">No packages found</h2>
            <p className="text-xs text-sandstone/60 leading-relaxed">
              No packages match your current filters. Try adjusting your search criteria or check back later for new listings.
            </p>
            <button
              onClick={() => { setDestination(''); setMaxDuration(null); setTheme(''); setMaxPrice(null); }}
              className="mt-4 text-xs font-medium text-gate-gold hover:text-gate-gold-dim transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {packages.map(pkg => (
              <Link key={pkg.id} href={`/packages/${pkg.id}`}
                className="bg-harbour border border-monsoon/50 rounded-xl overflow-hidden group hover:border-gate-gold/30 transition-all">
                <div className="h-44 sm:h-48 bg-gradient-to-br from-harbour-light/80 to-sea-deep relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Compass className="w-14 h-14 text-gate-gold/20 group-hover:text-gate-gold/30 transition-colors" />
                  </div>
                  {pkg.highlights.length > 0 && (
                    <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                      {pkg.highlights.slice(0, 2).map((h, i) => (
                        <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gate-gold/15 text-gate-gold border border-gate-gold/20">
                          {h}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      pkg.isFixedDeparture
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                    }`}>
                      {pkg.isFixedDeparture ? 'Fixed Departure' : 'Customizable'}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-sea-deep/70 backdrop-blur-sm px-2 py-1 rounded-lg border border-monsoon/30">
                    <span className="text-xs font-mono text-sandstone/70">{pkg.durationDays}D / {pkg.durationNights}N</span>
                  </div>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 text-[11px] text-sandstone/50 mb-2">
                    <MapPin className="w-3 h-3" /> {pkg.destination}
                    <span className="text-monsoon-light">&middot;</span>
                    <Tag className="w-3 h-3" /> {pkg.theme}
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-paper mb-1 group-hover:text-gate-gold transition-colors">{pkg.name}</h3>
                  <p className="text-xs text-sandstone/60 line-clamp-2 mb-4 leading-relaxed">{pkg.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      {pkg.discountedPricePerPerson ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-lg font-bold text-gate-gold">{priceINR(pkg.discountedPricePerPerson)}</span>
                          <span className="text-xs text-sandstone/40 line-through">{priceINR(pkg.pricePerPerson)}</span>
                        </div>
                      ) : (
                        <span className="font-mono text-lg font-bold text-gate-gold">{priceINR(pkg.pricePerPerson)}</span>
                      )}
                      <div className="text-[10px] text-sandstone/50">per person</div>
                    </div>
                    <span className="text-xs font-medium text-gate-gold group-hover:translate-x-1 transition-transform">
                      View Details &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
