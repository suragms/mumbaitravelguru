'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X, Plane, Hotel, Bus, Car, Compass } from 'lucide-react';
import { useSearchContext } from '@/context/SearchContext';
import type { ServiceType } from './PlatformBoard';
import SearchForm from './SearchForm';

const SERVICES: { id: ServiceType; label: string; icon: React.ElementType }[] = [
  { id: 'flights', label: 'Flights', icon: Plane },
  { id: 'hotels', label: 'Hotels', icon: Hotel },
  { id: 'bus', label: 'Bus', icon: Bus },
  { id: 'cabs', label: 'Cabs', icon: Car },
  { id: 'packages', label: 'Packages', icon: Compass },
];

export default function MobileSearchOverlay() {
  const { isSearchOpen, setIsSearchOpen } = useSearchContext();
  const [activeService, setActiveService] = useState<ServiceType>('flights');
  const [animKey, setAnimKey] = useState(0);
  const [shouldRender, setShouldRender] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const switchService = useCallback((svc: ServiceType) => {
    if (svc === activeService) return;
    setActiveService(svc);
    setAnimKey((k) => k + 1);
  }, [activeService]);

  useEffect(() => {
    if (isSearchOpen) {
      setShouldRender(true);
    }
  }, [isSearchOpen]);

  const handleClose = useCallback(() => {
    setIsSearchOpen(false);
  }, [setIsSearchOpen]);

  const handleTransitionEnd = () => {
    if (!isSearchOpen) {
      setShouldRender(false);
    }
  };

  React.useEffect(() => {
    if (!isSearchOpen || !shouldRender) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, shouldRender, handleClose]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[60] lg:hidden transition-opacity duration-300 ${
        isSearchOpen ? 'opacity-100' : 'opacity-0'
      }`}
      onTransitionEnd={handleTransitionEnd}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div
        ref={sheetRef}
        className={`absolute inset-x-0 bottom-0 top-[10%] bg-harbour rounded-t-2xl shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isSearchOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex justify-center pt-2 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-monsoon-light" />
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-b border-monsoon/50 shrink-0">
          <h2 className="text-sm font-bold text-paper">Search travel</h2>
          <button
            onClick={handleClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-sandstone/60 hover:text-paper transition-colors rounded-lg hover:bg-monsoon/40"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className="flex overflow-x-auto scrollbar-none border-b border-monsoon/50 shrink-0"
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
                onClick={() => switchService(svc.id)}
                className={`relative flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap border-r border-monsoon/40 last:border-r-0 transition-colors ${
                  isActive
                    ? 'text-gate-gold bg-sea-deep/50'
                    : 'text-sandstone/60 hover:text-sandstone'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{svc.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gate-gold rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div key={animKey} className="animate-fade-in">
            <SearchForm service={activeService} />
          </div>
        </div>
      </div>
    </div>
  );
}
