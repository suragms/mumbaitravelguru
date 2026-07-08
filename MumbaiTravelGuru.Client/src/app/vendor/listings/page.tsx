'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { Store, Search, X, AlertCircle, CheckCircle, Power, Calendar } from 'lucide-react';

interface VendorListing {
  id: string; vendorAccountId: string; listingType: string;
  title: string; description: string | null; defaultPrice: number | null;
  currency: string | null; isActive: boolean; createdAt: string;
}

interface AvailabilityEntry {
  id: string; date: string; isAvailable: boolean;
  availableUnits: number | null; priceOverride: number | null; notes: string | null;
}

function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }

export default function VendorListingsPage() {
  const [listings, setListings] = useState<VendorListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<VendorListing | null>(null);
  const [availability, setAvailability] = useState<AvailabilityEntry[]>([]);
  const [availLoading, setAvailLoading] = useState(false);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    apiRequest<VendorListing[]>('/api/v1/vendor/listings')
      .then(d => setListings(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadAvailability = async (listing: VendorListing) => {
    setSelectedListing(listing);
    setAvailLoading(true);
    try {
      const data = await apiRequest<AvailabilityEntry[]>(`/api/v1/vendor/listings/${listing.id}/availability`);
      setAvailability(data);
    } catch { setAvailability([]); }
    setAvailLoading(false);
  };

  const toggleActive = async (listing: VendorListing) => {
    try {
      await apiRequest(`/api/v1/vendor/listings/${listing.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !listing.isActive }),
      });
      setListings(prev => prev.map(l => l.id === listing.id ? { ...l, isActive: !l.isActive } : l));
    } catch { }
  };

  const saveListing = async (id: string) => {
    try {
      await apiRequest(`/api/v1/vendor/listings/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: editTitle, defaultPrice: editPrice ? parseFloat(editPrice) : null, description: editDesc }),
      });
      setListings(prev => prev.map(l => l.id === id ? { ...l, title: editTitle, defaultPrice: editPrice ? parseFloat(editPrice) : null, description: editDesc } : l));
      setEditMode(null);
    } catch { }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Store className="w-6 h-6 text-emerald-400" /> My Listings
      </h1>

      {listings.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Store className="w-16 h-16 mx-auto mb-4 text-slate-700" />
          <p className="text-lg font-medium">No listings yet</p>
          <p className="text-sm mt-1">Contact admin to add listings to your vendor account.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            {listings.map(listing => (
              <div key={listing.id}
                className={`glass rounded-xl p-4 cursor-pointer transition-all border ${selectedListing?.id === listing.id ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-transparent hover:border-slate-700'}`}
                onClick={() => loadAvailability(listing)}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${listing.listingType === 'Room' ? 'bg-indigo-500/10 text-indigo-400' : listing.listingType === 'Package' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {listing.listingType}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); toggleActive(listing); }}
                    className={`p-1.5 rounded-lg transition-colors ${listing.isActive ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:bg-slate-700'}`}>
                    <Power className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-sm font-semibold text-white mt-2">{listing.title}</div>
                {listing.defaultPrice && <div className="text-xs text-slate-400 mt-1">{listing.currency || 'INR'} {listing.defaultPrice}</div>}
                <div className={`text-xs mt-2 ${listing.isActive ? 'text-emerald-400' : 'text-slate-500'}`}>{listing.isActive ? 'Active' : 'Inactive'}</div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2">
            {selectedListing ? (
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-400" /> {selectedListing.title}
                  </h3>
                  <div className="flex gap-2">
                    {editMode === selectedListing.id ? (
                      <>
                        <button onClick={() => saveListing(selectedListing.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">Save</button>
                        <button onClick={() => setEditMode(null)} className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => { setEditMode(selectedListing.id); setEditTitle(selectedListing.title); setEditPrice(selectedListing.defaultPrice?.toString() || ''); setEditDesc(selectedListing.description || ''); }}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-medium px-3 py-1.5 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/10 transition-colors">
                        Edit
                      </button>
                    )}
                  </div>
                </div>

                {editMode === selectedListing.id && (
                  <div className="mb-4 p-4 bg-slate-900/50 rounded-xl border border-slate-800 space-y-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Title</label>
                      <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Default Price</label>
                        <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Description</label>
                      <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" rows={2} />
                    </div>
                  </div>
                )}

                {availLoading ? (
                  <div className="text-center py-8 text-slate-500">Loading availability...</div>
                ) : availability.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                    <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-700" />
                    <p className="text-sm font-medium">No availability entries</p>
                    <p className="text-xs mt-1">Vendor bookings will appear here as they are made.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-xs text-slate-400 uppercase font-semibold tracking-wider border-b border-slate-800">
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Available</th>
                          <th className="py-2 px-3">Units</th>
                          <th className="py-2 px-3">Price Override</th>
                          <th className="py-2 px-3">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-sm">
                        {availability.map(entry => (
                          <tr key={entry.id} className="hover:bg-slate-900/30">
                            <td className="py-2 px-3 text-slate-300">{fmtDate(entry.date)}</td>
                            <td className="py-2 px-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${entry.isAvailable ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                {entry.isAvailable ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                {entry.isAvailable ? 'Open' : 'Blocked'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-400">{entry.availableUnits ?? '-'}</td>
                            <td className="py-2 px-3 text-slate-400">{entry.priceOverride ? `₹${entry.priceOverride}` : '-'}</td>
                            <td className="py-2 px-3 text-slate-500 max-w-[200px] truncate">{entry.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass rounded-2xl p-12 text-center text-slate-500">
                <Store className="w-16 h-16 mx-auto mb-4 text-slate-700" />
                <p className="text-lg font-medium">Select a listing</p>
                <p className="text-sm mt-1">Choose a listing from the left to view its availability calendar and details.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
