'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { Compass, Filter, MapPin, Calendar, Users, IndianRupee, Tag } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-indigo-400 font-bold text-lg">MumbaiTravelGuru</Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300 text-sm">Holiday Packages</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Compass className="w-6 h-6 text-indigo-400" /> Holiday Packages
          </h1>
          <p className="text-slate-400 text-sm mt-1">Curated travel experiences across India</p>
        </div>

        <div className="flex flex-wrap gap-3 mb-6 metal-card rounded-xl p-4">
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            <select value={destination} onChange={e => setDestination(e.target.value)}
              className="bg-transparent text-sm text-slate-200 focus:outline-none">
              <option value="">All Destinations</option>
              {destinations.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
            <Tag className="w-4 h-4 text-slate-400" />
            <select value={theme} onChange={e => setTheme(e.target.value)}
              className="bg-transparent text-sm text-slate-200 focus:outline-none">
              <option value="">All Themes</option>
              {themes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select value={maxDuration ?? ''} onChange={e => setMaxDuration(e.target.value ? Number(e.target.value) : null)}
              className="bg-transparent text-sm text-slate-200 focus:outline-none">
              <option value="">Any Duration</option>
              <option value="3">Up to 3 days</option>
              <option value="5">Up to 5 days</option>
              <option value="7">Up to 7 days</option>
              <option value="10">Up to 10 days</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
            <IndianRupee className="w-4 h-4 text-slate-400" />
            <select value={maxPrice ?? ''} onChange={e => setMaxPrice(e.target.value ? Number(e.target.value) : null)}
              className="bg-transparent text-sm text-slate-200 focus:outline-none">
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
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500" />
          </div>
        ) : error ? (
          <div className="metal-card rounded-xl p-8 text-center">
            <p className="text-red-300">{error}</p>
          </div>
        ) : packages.length === 0 ? (
          <div className="metal-card rounded-xl p-8 text-center">
            <Compass className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No packages found matching your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map(pkg => (
              <Link key={pkg.id} href={`/packages/${pkg.id}`}
                className="metal-card rounded-xl overflow-hidden group hover:border-indigo-500/30 transition-all">
                <div className="h-48 bg-gradient-to-br from-indigo-900/50 to-slate-900 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Compass className="w-16 h-16 text-indigo-500/30 group-hover:text-indigo-400/50 transition-colors" />
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${pkg.isFixedDeparture ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                      {pkg.isFixedDeparture ? 'Bookable' : 'Customizable'}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
                    <span className="text-xs text-white">{pkg.durationDays}D / {pkg.durationNights}N</span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <MapPin className="w-3 h-3" /> {pkg.destination}
                    <span className="mx-1">•</span>
                    <Tag className="w-3 h-3" /> {pkg.theme}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">{pkg.name}</h3>
                  <p className="text-sm text-slate-400 line-clamp-2 mb-4">{pkg.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      {pkg.discountedPricePerPerson ? (
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-indigo-400">{priceINR(pkg.discountedPricePerPerson)}</span>
                          <span className="text-xs text-slate-500 line-through">{priceINR(pkg.pricePerPerson)}</span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-indigo-400">{priceINR(pkg.pricePerPerson)}</span>
                      )}
                      <div className="text-xs text-slate-500">per person</div>
                    </div>
                    <span className="text-sm text-indigo-400 group-hover:translate-x-1 transition-transform">View Details →</span>
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
