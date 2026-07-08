'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { Bus, ArrowLeft, MapPin, Clock, Sofa, ArmchairIcon, Users, IndianRupee } from 'lucide-react';

interface SeatDto {
  id: string;
  label: string;
  status: 'available' | 'booked' | 'blocked';
  deck: 'lower' | 'upper';
  row: number;
  column: number;
  isWindow: boolean;
  isAisle: boolean;
  price: number;
}

interface BoardingPointDto {
  id: string;
  name: string;
  time: string;
  address: string;
}

interface TripSeatsDto {
  tripId: string;
  operatorName: string;
  busType: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  price: number;
  currency: string;
  seats: SeatDto[];
  boardingPoints: BoardingPointDto[];
  droppingPoints: BoardingPointDto[];
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function priceINR(price: number) {
  return `₹${price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function SeatGrid({ seats, selectedIds, onToggle, isSleeper }: {
  seats: SeatDto[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  isSleeper: boolean;
}) {
  if (isSleeper) {
    const lower = seats.filter(s => s.deck === 'lower');
    const upper = seats.filter(s => s.deck === 'upper');
    const lowerRows = [...new Set(lower.map(s => s.row))].sort((a, b) => a - b);
    const upperRows = [...new Set(upper.map(s => s.row))].sort((a, b) => a - b);

    const renderDeck = (deckSeats: SeatDto[], rows: number[], title: string) => (
      <div className="flex-1">
        <h4 className="text-xs font-semibold text-slate-400 mb-2 text-center uppercase tracking-wider">{title}</h4>
        <div className="space-y-2">
          {rows.map(row => {
            const rowSeats = deckSeats.filter(s => s.row === row).sort((a, b) => a.column - b.column);
            return (
              <div key={row} className="flex items-center justify-center gap-2">
                {rowSeats.map(seat => (
                  <button
                    key={seat.id}
                    disabled={seat.status !== 'available'}
                    onClick={() => onToggle(seat.id)}
                    title={`${seat.label} - ${seat.status}${seat.isWindow ? ' (Window)' : ''}`}
                    className={`w-10 h-10 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center
                      ${seat.status === 'booked' ? 'bg-red-900/50 text-red-400 cursor-not-allowed border border-red-800' :
                        seat.status === 'blocked' ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed border border-slate-700' :
                        selectedIds.includes(seat.id) ? 'bg-blue-600 text-white border border-blue-400 shadow-lg shadow-blue-600/30 scale-110' :
                        'bg-emerald-900/40 text-emerald-300 border border-emerald-700 hover:bg-emerald-800/40 hover:border-emerald-500 cursor-pointer'}
                    `}>
                    {seat.label}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );

    return (
      <div className="flex gap-6 justify-center">
        {renderDeck(lower, lowerRows, 'Lower Deck')}
        <div className="w-px bg-slate-700 self-stretch" />
        {renderDeck(upper, upperRows, 'Upper Deck')}
      </div>
    );
  }

  const rows = [...new Set(seats.map(s => s.row))].sort((a, b) => a - b);
  const cols = [...new Set(seats.map(s => s.column))].sort((a, b) => a - b);

  return (
    <div className="space-y-2">
      {rows.map(row => {
        const rowSeats = seats.filter(s => s.row === row);
        return (
          <div key={row} className="flex items-center justify-center gap-2">
            {cols.map(col => {
              const seat = rowSeats.find(s => s.column === col);
              if (!seat) return <div key={`${row}-${col}`} className="w-10 h-10" />;
              return (
                <button
                  key={seat.id}
                  disabled={seat.status !== 'available'}
                  onClick={() => onToggle(seat.id)}
                  title={`${seat.label} - ${seat.isWindow ? 'Window' : seat.isAisle ? 'Aisle' : 'Middle'}`}
                  className={`w-10 h-10 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center relative
                    ${seat.status === 'booked' ? 'bg-red-900/50 text-red-400 cursor-not-allowed border border-red-800' :
                      seat.status === 'blocked' ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed border border-slate-700' :
                      selectedIds.includes(seat.id) ? 'bg-blue-600 text-white border border-blue-400 shadow-lg shadow-blue-600/30 scale-110' :
                      'bg-emerald-900/40 text-emerald-300 border border-emerald-700 hover:bg-emerald-800/40 hover:border-emerald-500 cursor-pointer'}
                  `}>
                  {seat.label}
                  {(seat.isWindow || seat.isAisle) && (
                    <span className="absolute -top-1 -right-1 text-[8px]">
                      {seat.isWindow ? '🚪' : '🚶'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function SeatSelectionPage() {
  return <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500" /></div>}>
    <SeatSelectionContent />
  </Suspense>;
}

function SeatSelectionContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tripId = params.tripId as string;
  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
  const travelDate = searchParams.get('travelDate') || '';

  const [data, setData] = useState<TripSeatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [boardingPointId, setBoardingPointId] = useState('');
  const [droppingPointId, setDroppingPointId] = useState('');

  useEffect(() => {
    const fetchSeats = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await apiRequest<TripSeatsDto>(`/api/v1/bus/${tripId}/seats`);
        setData(result);
        if (result.boardingPoints.length > 0) setBoardingPointId(result.boardingPoints[0].id);
        if (result.droppingPoints.length > 0) setDroppingPointId(result.droppingPoints[0].id);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load seat layout');
      }
      setLoading(false);
    };
    if (tripId) fetchSeats();
  }, [tripId]);

  const toggleSeat = (seatId: string) => {
    setSelectedSeats(prev =>
      prev.includes(seatId) ? prev.filter(id => id !== seatId) : [...prev, seatId]
    );
  };

  const totalPrice = data ? selectedSeats.length * data.price : 0;

  const isSleeper = data?.busType.toLowerCase().includes('sleeper') ?? false;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="metal-card rounded-xl p-8 text-center max-w-md">
          <p className="text-red-300 mb-4">{error}</p>
          <button onClick={() => router.back()} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-indigo-400 font-bold text-lg">MumbaiTravelGuru</Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300 text-sm">Select Seats</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-xl font-bold text-white">Select Your Seats</h1>
        </div>

        <div className="metal-card rounded-xl p-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-3">
              <Bus className="w-8 h-8 text-indigo-400" />
              <div>
                <p className="text-white font-semibold">{data.operatorName}</p>
                <p className="text-xs text-slate-400">{data.busType}</p>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center gap-4 text-sm">
              <div className="text-center">
                <div className="text-white font-bold">{formatTime(data.departureTime)}</div>
                <div className="text-xs text-slate-500">{origin || data.origin}</div>
              </div>
              <div className="text-xs text-slate-500 px-4">
                <Clock className="w-3 h-3 mx-auto mb-1" />
                {formatDuration(data.durationMinutes)}
              </div>
              <div className="text-center">
                <div className="text-white font-bold">{formatTime(data.arrivalTime)}</div>
                <div className="text-xs text-slate-500">{destination || data.destination}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-indigo-400">{priceINR(data.price)}</div>
              <div className="text-xs text-slate-500">per seat</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-6">
            <div className="metal-card rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Seat Layout</h3>

              <div className="flex items-center gap-4 mb-4 text-xs text-slate-400 justify-center">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-900/40 border border-emerald-700 inline-block" /> Available</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-600 border border-blue-400 inline-block" /> Selected</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-900/50 border border-red-800 inline-block" /> Booked</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-800/50 border border-slate-700 inline-block" /> Blocked</span>
              </div>

              <SeatGrid seats={data.seats} selectedIds={selectedSeats} onToggle={toggleSeat} isSleeper={isSleeper} />
            </div>

            <div className="metal-card rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400" /> Boarding Point
              </h3>
              <div className="space-y-2">
                {data.boardingPoints.map(bp => (
                  <label key={bp.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${boardingPointId === bp.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-900 hover:border-slate-500'}`}>
                    <input type="radio" name="boarding" checked={boardingPointId === bp.id} onChange={() => setBoardingPointId(bp.id)} className="accent-indigo-500 mt-1" />
                    <div>
                      <div className="text-sm font-medium text-white">{bp.name}</div>
                      <div className="text-xs text-slate-400">{formatTime(bp.time)}</div>
                      <div className="text-xs text-slate-500">{bp.address}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="metal-card rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400" /> Dropping Point
              </h3>
              <div className="space-y-2">
                {data.droppingPoints.map(dp => (
                  <label key={dp.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${droppingPointId === dp.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-900 hover:border-slate-500'}`}>
                    <input type="radio" name="dropping" checked={droppingPointId === dp.id} onChange={() => setDroppingPointId(dp.id)} className="accent-indigo-500 mt-1" />
                    <div>
                      <div className="text-sm font-medium text-white">{dp.name}</div>
                      <div className="text-xs text-slate-400">{formatTime(dp.time)}</div>
                      <div className="text-xs text-slate-500">{dp.address}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-24 self-start">
            <div className="metal-card rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" /> Booking Summary
              </h3>

              <div className="text-sm space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Trip</span>
                  <span className="text-white">{data.operatorName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Date</span>
                  <span className="text-white">{travelDate || formatTime(data.departureTime)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Seats</span>
                  <span className="text-white">{selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None selected'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Seats Count</span>
                  <span className="text-white">{selectedSeats.length}</span>
                </div>
              </div>

              <div className="border-t border-slate-700 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Total</span>
                  <span className="text-2xl font-bold text-indigo-400">{priceINR(totalPrice)}</span>
                </div>
              </div>

              <button
                disabled={selectedSeats.length === 0 || !boardingPointId || !droppingPointId}
                onClick={() => {
                  const bp = data.boardingPoints.find(p => p.id === boardingPointId);
                  const dp = data.droppingPoints.find(p => p.id === droppingPointId);
                  router.push(`/bus/confirm?tripId=${tripId}&origin=${encodeURIComponent(origin || data.origin)}&destination=${encodeURIComponent(destination || data.destination)}&travelDate=${travelDate}&seats=${selectedSeats.join(',')}&boardingPointId=${boardingPointId}&boardingPointName=${encodeURIComponent(bp?.name || '')}&boardingPointTime=${bp?.time || ''}&droppingPointId=${droppingPointId}&droppingPointName=${encodeURIComponent(dp?.name || '')}&droppingPointTime=${dp?.time || ''}&totalPrice=${totalPrice}`);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
              >
                Book Now — {priceINR(totalPrice)}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
