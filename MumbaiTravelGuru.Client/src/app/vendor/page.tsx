'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { Store, ShoppingBag, IndianRupee, AlertCircle, TrendingUp, Clock, ArrowRight } from 'lucide-react';

interface VendorDashboard {
  activeListings: number;
  totalBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  totalCommission: number;
  netRevenue: number;
  pendingPayout: number;
  recentBooking: {
    id: string; listingTitle: string; guestName: string;
    checkIn: string; checkOut: string; totalAmount: number;
    currency: string; status: string; createdAt: string;
  } | null;
}

export default function VendorDashboardPage() {
  const [data, setData] = useState<VendorDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileMissing, setProfileMissing] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const d = await apiRequest<VendorDashboard>('/api/v1/vendor/dashboard');
        setData(d);
      } catch (err: any) {
        if (err.message?.includes('Vendor account not found')) setProfileMissing(true);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500" /></div>;

  if (profileMissing) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center">
        <Store className="w-20 h-20 text-emerald-400/50 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-white mb-3">Welcome to Vendor Portal</h1>
        <p className="text-slate-400 mb-8">You haven&apos;t been onboarded as a vendor yet. Contact the admin to set up your vendor account.</p>
        <Link href="/" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
          Return to Main Site
        </Link>
      </div>
    );
  }

  if (!data) return <div className="text-slate-400 text-center py-20">Failed to load dashboard.</div>;

  const statCards = [
    { label: 'Active Listings', value: data.activeListings, icon: Store, color: 'text-indigo-400 bg-indigo-500/10' },
    { label: 'Total Bookings', value: data.totalBookings, icon: ShoppingBag, color: 'text-emerald-400 bg-emerald-500/10' },
    { label: 'Net Revenue', value: `₹${data.netRevenue.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-amber-400 bg-amber-500/10' },
    { label: 'Pending Payout', value: `₹${data.pendingPayout.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-rose-400 bg-rose-500/10' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Vendor Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="metal-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{card.label}</span>
              <div className={`p-2 rounded-xl ${card.color}`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-white">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" /> Revenue Summary
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-sm text-slate-400">Total Revenue</span>
              <span className="text-lg font-bold text-white">₹{data.totalRevenue.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-sm text-slate-400">Commission</span>
              <span className="text-lg font-bold text-rose-400">-₹{data.totalCommission.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-semibold text-slate-200">Net Revenue</span>
              <span className="text-xl font-extrabold text-emerald-400">₹{data.netRevenue.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" /> Recent Booking
            </h3>
            <Link href="/vendor/bookings" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {data.recentBooking ? (
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
              <div className="text-sm font-semibold text-white">{data.recentBooking.listingTitle}</div>
              <div className="text-xs text-slate-400 mt-1">Guest: {data.recentBooking.guestName || 'N/A'}</div>
              {data.recentBooking.checkIn && (
                <div className="text-xs text-slate-500 mt-1">
                  {new Date(data.recentBooking.checkIn).toLocaleDateString()} - {new Date(data.recentBooking.checkOut).toLocaleDateString()}
                </div>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  data.recentBooking.status === 'Confirmed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  data.recentBooking.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                }`}>{data.recentBooking.status}</span>
                <span className="text-sm font-bold text-white">₹{data.recentBooking.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">No bookings yet.</div>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <Link href="/vendor/listings" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2">
          <Store className="w-4 h-4" /> Manage Listings
        </Link>
        <Link href="/vendor/finance" className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2">
          <IndianRupee className="w-4 h-4" /> View Payouts
        </Link>
      </div>
    </div>
  );
}
