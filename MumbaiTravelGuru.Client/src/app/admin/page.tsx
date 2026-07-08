'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { TrendingUp, ShoppingBag, AlertTriangle, IndianRupee, Plane, Hotel, Compass, Search, ArrowRight } from 'lucide-react';

interface DashboardData {
  totalBookingsToday: number;
  totalBookingsThisMonth: number;
  revenueToday: number;
  revenueThisMonth: number;
  pendingReconciliationCount: number;
  revenueByVertical: { vertical: string; revenue: number; bookingCount: number }[];
  bookingsPerDay: { date: string; count: number; revenue: number }[];
  topRoutes: { origin: string; destination: string; count: number }[];
  conversionFunnel: {
    totalSearches: number;
    totalInitiations: number;
    totalConfirmations: number;
    searchToInitiateRate: number;
    initiateToConfirmRate: number;
    overallConversionRate: number;
  };
}

function fmt(n: number) { return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`; }

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const d = await apiRequest<DashboardData>('/api/v1/admin/dashboard');
        setData(d);
      } catch { }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500" /></div>;

  if (!data) return <div className="text-slate-400 text-center py-20">Failed to load dashboard.</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="metal-card rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-indigo-500/10 p-2.5 rounded-xl"><ShoppingBag className="w-5 h-5 text-indigo-400" /></div>
            <span className="text-xs text-slate-400 uppercase tracking-wider">Today</span>
          </div>
          <div className="text-2xl font-bold text-white">{data.totalBookingsToday}</div>
          <div className="text-xs text-slate-500">bookings today</div>
        </div>
        <div className="metal-card rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-emerald-500/10 p-2.5 rounded-xl"><TrendingUp className="w-5 h-5 text-emerald-400" /></div>
            <span className="text-xs text-slate-400 uppercase tracking-wider">Monthly</span>
          </div>
          <div className="text-2xl font-bold text-white">{data.totalBookingsThisMonth}</div>
          <div className="text-xs text-slate-500">bookings this month</div>
        </div>
        <div className="metal-card rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-amber-500/10 p-2.5 rounded-xl"><IndianRupee className="w-5 h-5 text-amber-400" /></div>
            <span className="text-xs text-slate-400 uppercase tracking-wider">Revenue MTD</span>
          </div>
          <div className="text-2xl font-bold text-white">{fmt(data.revenueThisMonth)}</div>
          <div className="text-xs text-slate-500">month to date</div>
        </div>
        <div className="metal-card rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-rose-500/10 p-2.5 rounded-xl"><AlertTriangle className="w-5 h-5 text-rose-400" /></div>
            <span className="text-xs text-slate-400 uppercase tracking-wider">Reconciliation</span>
          </div>
          <div className="text-2xl font-bold text-rose-400">{data.pendingReconciliationCount}</div>
          <div className="text-xs text-slate-500">pending review</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="metal-card rounded-xl p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-white mb-4">Bookings Per Day (Last 7 Days)</h2>
          <div className="space-y-2">
            {data.bookingsPerDay.map(day => (
              <div key={day.date} className="flex items-center gap-4">
                <span className="text-xs text-slate-400 w-24">{new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                <div className="flex-1 bg-slate-800 rounded-full h-3 relative overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, (day.count / Math.max(...data.bookingsPerDay.map(d => d.count), 1)) * 100)}%` }} />
                </div>
                <span className="text-xs text-white font-mono w-12 text-right">{day.count}</span>
                <span className="text-xs text-emerald-400 font-mono w-20 text-right">{fmt(day.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="metal-card rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Revenue by Vertical</h2>
          <div className="space-y-3">
            {data.revenueByVertical.map(v => (
              <div key={v.vertical} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {v.vertical === 'Flight' ? <Plane className="w-4 h-4 text-indigo-400" /> : v.vertical === 'Hotel' ? <Hotel className="w-4 h-4 text-emerald-400" /> : <Compass className="w-4 h-4 text-amber-400" />}
                  <span className="text-sm text-slate-300">{v.vertical}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white">{fmt(v.revenue)}</div>
                  <div className="text-xs text-slate-500">{v.bookingCount} bookings</div>
                </div>
              </div>
            ))}
            {data.revenueByVertical.length === 0 && <div className="text-xs text-slate-500">No data yet</div>}
          </div>

          <h2 className="text-sm font-semibold text-white mt-6 mb-4">Conversion Funnel</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Searches</span>
              <span className="text-white font-mono">{data.conversionFunnel.totalSearches}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Initiated</span>
              <span className="text-white font-mono">{data.conversionFunnel.totalInitiations}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Confirmed</span>
              <span className="text-white font-mono">{data.conversionFunnel.totalConfirmations}</span>
            </div>
            <div className="border-t border-slate-700 my-2"></div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-400">Overall</span>
              <span className="text-emerald-400 font-mono">{data.conversionFunnel.overallConversionRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {data.topRoutes.length > 0 && (
        <div className="metal-card rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Top Flight Routes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {data.topRoutes.map((r, i) => (
              <div key={i} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700 flex items-center gap-3">
                <span className="text-lg font-bold text-indigo-400">#{i + 1}</span>
                <div className="flex items-center gap-1 text-sm text-white">
                  <span>{r.origin}</span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span>{r.destination}</span>
                </div>
                <span className="text-xs text-slate-400 ml-auto">{r.count} bookings</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
