'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getStoredToken, loadTokens } from '@/lib/api';
import {
  LayoutDashboard, ShoppingBag, Users, History, LogOut, Menu, X, Compass, Tag, FileText,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/bookings', label: 'Bookings', icon: ShoppingBag },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag },
  { href: '/admin/cms', label: 'CMS', icon: FileText },
  { href: '/admin/audit-log', label: 'Audit Log', icon: History },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
    return (
      <div className="min-h-dvh bg-sea-deep flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gate-gold border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-sea-deep flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-harbour border-r border-monsoon/60 transform transition-transform lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-14 flex items-center justify-between px-5 border-b border-monsoon/50">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="bg-gate-gold/15 p-1 rounded-lg">
              <Compass className="w-4 h-4 text-gate-gold" />
            </div>
            <span className="font-display text-sm text-paper tracking-wide">Admin</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-sandstone/60 hover:text-paper transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="p-3 space-y-0.5">
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? 'bg-gate-gold/10 text-gate-gold border border-gate-gold/20'
                    : 'text-sandstone/60 hover:text-sandstone hover:bg-monsoon/30'
                }`}
                onClick={() => setSidebarOpen(false)}>
                <item.icon className="w-4 h-4" /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-3 left-3 right-3">
          <Link href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-sandstone/50 hover:text-sandstone hover:bg-monsoon/30 transition-colors">
            <LogOut className="w-4 h-4" /> Back to Site
          </Link>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-dvh">
        <header className="h-14 border-b border-monsoon/60 bg-sea-deep/85 backdrop-blur-md flex items-center justify-between px-4 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-sandstone/60 hover:text-paper transition-colors">
            <Menu className="w-4 h-4" />
          </button>
          <div className="text-xs text-sandstone/60 ml-auto">Admin Panel</div>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
