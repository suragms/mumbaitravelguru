'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getStoredToken, loadTokens } from '@/lib/api';
import {
  LayoutDashboard, Store, ShoppingBag, IndianRupee, LogOut, Menu, X, Compass
} from 'lucide-react';

const navItems = [
  { href: '/vendor', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vendor/listings', label: 'Listings', icon: Store },
  { href: '/vendor/bookings', label: 'Bookings', icon: ShoppingBag },
  { href: '/vendor/finance', label: 'Finance', icon: IndianRupee },
];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    loadTokens();
    const token = getStoredToken();
    if (!token) {
      router.push('/login');
      return;
    }
    setAuthorized(true);
  }, [router]);

  if (!authorized) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <Link href="/vendor" className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
            <Store className="w-5 h-5" /> Vendor Portal
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== '/vendor' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                onClick={() => setSidebarOpen(false)}>
                <item.icon className="w-4 h-4" /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-4 left-4 right-4 space-y-1">
          <Link href="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors">
            <Compass className="w-4 h-4" /> Main Site
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm flex items-center justify-between px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-sm text-slate-400">Vendor Portal</div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
