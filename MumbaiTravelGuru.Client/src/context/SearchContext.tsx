'use client';

import React, { createContext, useContext, useState, useMemo } from 'react';

interface SearchContextType {
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
}

const SearchContext = createContext<SearchContextType | null>(null);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const value = useMemo(() => ({ isSearchOpen, setIsSearchOpen }), [isSearchOpen]);
  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchContext() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearchContext must be used within SearchProvider');
  return ctx;
}
