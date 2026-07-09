'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { Bus, ArrowLeft, MapPin, Clock, Users } from 'lucide-react';

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
        <h4 className="text-xs font-semibold text-sandstone/50 mb-2 text-center uppercase tracking-wider">{title}</h4>
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
className={`w-11 h-11 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center
                      ${seat.status === 'booked' ? 'bg-red-900/30 text-red-400/60 cursor-not-allowed border border-red-800/40' :
                        seat.status === 'blocked' ? 'bg-monsoon/30 text-sandstone/30 cursor-not-allowed border border-monsoon/40' :
                        selectedIds.includes(seat.id) ? 'bg-gate-gold text-sea-deep border border-gate-gold shadow-lg shadow-gate-gold/20 scale-110' :
                        'bg-emerald-900/30 text-emerald-300 border border-emerald-700/50 hover:bg-emerald-800/30 hover:border-emerald-500 hover:scale-105 active:scale-95 cursor-pointer'}
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
        <div className="w-px bg-monsoon/50 self-stretch" />
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
                    className={`w-10 h-10 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center
                      ${seat.status === 'booked' ? 'bg-red-900/30 text-red-400/60 cursor-not-allowed border border-red-800/40' :
                        seat.status === 'blocked' ? 'bg-monsoon/30 text-sandstone/30 cursor-not-allowed border border-monsoon/40' :
                        selectedIds.includes(seat.id) ? 'bg-gate-gold text-sea-deep border border-gate-gold shadow-lg shadow-gate-gold/20 scale-110' :
                        'bg-emerald-900/30 text-emerald-300 border border-emerald-700/50 hover:bg-emerald-800/30 hover:border-emerald-500 hover:scale-105 active:scale-95 cursor-pointer'}
                    `}>
                  {seat.label}
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
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-sea-deep flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gate-gold border-t-transparent" />
        </div>
      }
    >
      <SeatSelectionContent />
    </Suspense>
  );
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
      <div className="min-h-dvh bg-sea-deep flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gate-gold border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-dvh bg-sea-deep flex items-center justify-center p-4">
        <div className="bg-harbour border border-monsoon/50 rounded-xl p-8 text-center max-w-md">
          <p className="text-sandstone/70 text-sm mb-4">{error}</p>
          <button onClick={() => router.back()} className="bg-monsoon hover:bg-monsoon-light text-paper px-4 py-2 rounded-lg text-xs font-medium transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-dvh bg-sea-deep">
      <header className="sticky top-0 z-30 border-b border-monsoon/60 bg-sea-deep/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-gate-gold/15 p-1 rounded-lg">
              <Bus className="w-4 h-4 text-gate-gold" />
            </div>
            <span className="font-display text-sm text-paper tracking-wide">Mumbai Travel Guru</span>
          </Link>
          <span className="text-monsoon-light text-xs">/</span>
          <span className="text-sandstone/60 text-xs">Select Seats</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-sandstone/60 hover:text-paper transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-xl text-paper">Select Your Seats</h1>
        </div>

        <div className="bg-harbour border border-monsoon/50 rounded-xl p-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gate-gold/10 rounded-lg w-10 h-10 flex items-center justify-center shrink-0">
                <Bus className="w-5 h-5 text-gate-gold" />
              </div>
              <div>
                <p className="text-sm font-semibold text-paper">{data.operatorName}</p>
                <p className="text-xs text-sandstone/50">{data.busType}</p>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center gap-4 text-xs">
              <div className="text-center">
                <div className="font-mono text-sm font-bold text-paper">{formatTime(data.departureTime)}</div>
                <div className="text-xs text-sandstone/50">{origin || data.origin}</div>
              </div>
              <div className="text-xs text-sandstone/50 px-4">
                <Clock className="w-3 h-3 mx-auto mb-1" />
                {formatDuration(data.durationMinutes)}
              </div>
              <div className="text-center">
                <div className="font-mono text-sm font-bold text-paper">{formatTime(data.arrivalTime)}</div>
                <div className="text-xs text-sandstone/50">{destination || data.destination}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-lg font-bold text-gate-gold">{priceINR(data.price)}</div>
              <div className="text-xs text-sandstone/50">per seat</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-6">
            <div className="bg-harbour border border-monsoon/50 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-paper/80 mb-4 uppercase tracking-wider">Seat Layout</h3>

              <div className="flex items-center gap-4 mb-4 text-xs text-sandstone/50 justify-center">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-900/30 border border-emerald-700/50 inline-block" /> Available</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gate-gold border border-gate-gold inline-block" /> Selected</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-900/30 border border-red-800/40 inline-block" /> Booked</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-monsoon/30 border border-monsoon/40 inline-block" /> Blocked</span>
              </div>

              <SeatGrid seats={data.seats} selectedIds={selectedSeats} onToggle={toggleSeat} isSleeper={isSleeper} />
            </div>

            <div className="bg-harbour border border-monsoon/50 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-paper/80 mb-3 flex items-center gap-2 uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-gate-gold" /> Boarding Point
              </h3>
              <div className="space-y-2">
                {data.boardingPoints.map(bp => (
                  <label key={bp.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${boardingPointId === bp.id ? 'border-gate-gold/40 bg-gate-gold/10' : 'border-monsoon/50 bg-sea-deep hover:border-monsoon-light/60'}`}>
                    <input type="radio" name="boarding" checked={boardingPointId === bp.id} onChange={() => setBoardingPointId(bp.id)} className="accent-gate-gold mt-1" />
                    <div>
                      <div className="text-xs font-medium text-paper">{bp.name}</div>
                      <div className="text-xs text-sandstone/50">{formatTime(bp.time)}</div>
                      <div className="text-xs text-sandstone/40">{bp.address}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-harbour border border-monsoon/50 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-paper/80 mb-3 flex items-center gap-2 uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-gate-gold" /> Dropping Point
              </h3>
              <div className="space-y-2">
                {data.droppingPoints.map(dp => (
                  <label key={dp.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${droppingPointId === dp.id ? 'border-gate-gold/40 bg-gate-gold/10' : 'border-monsoon/50 bg-sea-deep hover:border-monsoon-light/60'}`}>
                    <input type="radio" name="dropping" checked={droppingPointId === dp.id} onChange={() => setDroppingPointId(dp.id)} className="accent-gate-gold mt-1" />
                    <div>
                      <div className="text-xs font-medium text-paper">{dp.name}</div>
                      <div className="text-xs text-sandstone/50">{formatTime(dp.time)}</div>
                      <div className="text-xs text-sandstone/40">{dp.address}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-20 self-start">
            <div className="bg-harbour border border-monsoon/50 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-semibold text-paper/80 flex items-center gap-2 uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 text-gate-gold" /> Booking Summary
              </h3>

              <div className="text-xs space-y-2">
                <div className="flex justify-between text-sandstone/60">
                  <span>Operator</span>
                  <span className="text-paper/80 font-medium">{data.operatorName}</span>
                </div>
                <div className="flex justify-between text-sandstone/60">
                  <span>Date</span>
                  <span className="text-paper/80 font-medium">{travelDate || formatTime(data.departureTime)}</span>
                </div>
                <div className="flex justify-between text-sandstone/60">
                  <span>Seats</span>
                  <span className="text-paper/80 font-medium">{selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None selected'}</span>
                </div>
                <div className="flex justify-between text-sandstone/60">
                  <span>Count</span>
                  <span className="text-paper/80 font-medium">{selectedSeats.length}</span>
                </div>
              </div>

              <div className="border-t border-monsoon/40 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-sandstone/60">Total</span>
                  <span className="font-mono text-xl font-bold text-gate-gold">{priceINR(totalPrice)}</span>
                </div>
              </div>

              <button
                disabled={selectedSeats.length === 0 || !boardingPointId || !droppingPointId}
                onClick={() => {
                  const bp = data.boardingPoints.find(p => p.id === boardingPointId);
                  const dp = data.droppingPoints.find(p => p.id === droppingPointId);
                  router.push(`/bus/confirm?tripId=${tripId}&origin=${encodeURIComponent(origin || data.origin)}&destination=${encodeURIComponent(destination || data.destination)}&travelDate=${travelDate}&seats=${selectedSeats.join(',')}&boardingPointId=${boardingPointId}&boardingPointName=${encodeURIComponent(bp?.name || '')}&boardingPointTime=${bp?.time || ''}&droppingPointId=${droppingPointId}&droppingPointName=${encodeURIComponent(dp?.name || '')}&droppingPointTime=${dp?.time || ''}&totalPrice=${totalPrice}`);
                }}
                className="w-full bg-gate-gold hover:bg-gate-gold-dim text-sea-deep py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Book Now &mdash; {priceINR(totalPrice)}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
