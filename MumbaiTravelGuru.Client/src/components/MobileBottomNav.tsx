'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Search, Ticket, User } from 'lucide-react';
import { useSearchContext } from '@/context/SearchContext';

const ITEMS = [
  { id: 'home', label: 'Home', icon: Compass, href: '/' },
  { id: 'search', label: 'Search', icon: Search, href: null },
  { id: 'bookings', label: 'Bookings', icon: Ticket, href: '/booking/confirm' },
  { id: 'account', label: 'Account', icon: User, href: '/profile' },
] as const;

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { isSearchOpen, setIsSearchOpen } = useSearchContext();

  if (pathname.startsWith('/admin') || pathname.startsWith('/vendor')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-monsoon/60 bg-harbour/95 backdrop-blur-md lg:hidden">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.href
            ? pathname === item.href || pathname.startsWith(item.href + '/')
            : isSearchOpen;

          if (!item.href) {
            return (
              <button
                key={item.id}
                onClick={() => setIsSearchOpen(true)}
                className="flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[44px] px-4 py-1 text-sandstone/60 hover:text-gate-gold transition-colors"
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[44px] px-4 py-1 transition-colors ${
                isActive ? 'text-gate-gold' : 'text-sandstone/60 hover:text-gate-gold'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
