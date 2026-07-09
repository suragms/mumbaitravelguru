'use client';

import React, { useState, useCallback } from 'react';
import { Plane, Hotel, Bus, Car, Compass } from 'lucide-react';
import SearchForm from './SearchForm';

export type ServiceType = 'flights' | 'hotels' | 'bus' | 'cabs' | 'packages';

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

export default function PlatformBoard() {
  const [activeService, setActiveService] = useState<ServiceType>('flights');
  const [animKey, setAnimKey] = useState(0);

  const switchService = useCallback((service: ServiceType) => {
    if (service === activeService) return;
    setActiveService(service);
    setAnimKey((k) => k + 1);
  }, [activeService]);

  return (
    <section
      className="rounded-xl border border-monsoon/60 bg-harbour overflow-hidden shadow-lg"
      aria-label="Travel service selector"
    >
      {/* -------- Ticket Board: Tab Strip -------- */}
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
              aria-controls={`search-panel-${svc.id}`}
              id={`platform-tab-${svc.id}`}
              onClick={() => switchService(svc.id)}
              className={`
                relative flex items-center gap-1.5 sm:gap-2
                px-3 sm:px-5 py-2.5 sm:py-3.5
                text-xs sm:text-sm font-medium whitespace-nowrap
                border-r border-monsoon/40 last:border-r-0
                transition-colors duration-200
                ${
                  isActive
                    ? 'text-gate-gold bg-sea-deep/50'
                    : 'text-sandstone/60 hover:text-sandstone hover:bg-sea-deep/20'
                }
              `}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">{svc.label}</span>
              <span className="sm:hidden">{svc.label.slice(0, 3)}</span>

              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gate-gold rounded-full animate-fade-in" />
              )}
            </button>
          );
        })}
      </div>

      {/* -------- Perforated ticket-stub divider -------- */}
      <div className="ticket-stub-bottom bg-sea-deep" />

      {/* -------- Search form panel -------- */}
      <div
        role="tabpanel"
        id={`search-panel-${activeService}`}
        aria-labelledby={`platform-tab-${activeService}`}
        className="flap-stage"
      >
        <SearchForm
          service={activeService}
          key={animKey}
        />
      </div>
    </section>
  );
}
