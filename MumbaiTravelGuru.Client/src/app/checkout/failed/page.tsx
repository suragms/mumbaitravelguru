'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Loader } from 'lucide-react';

export default function FailedPage() {
  return <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader className="animate-spin h-10 w-10 text-indigo-500" /></div>}>
    <FailedContent />
  </Suspense>;
}

function FailedContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="metal-card rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Payment Failed</h1>
        <p className="text-slate-400 mb-4">{error || 'Your payment could not be processed. Please try again.'}</p>

        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 text-left mb-8">
          <div className="text-sm text-slate-400">Booking ID</div>
          <div className="text-white font-mono">{bookingId?.slice(0, 8)}</div>
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={() => window.history.back()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
            Try Again
          </button>
          <Link href="/profile"
            className="text-slate-400 hover:text-slate-200 text-sm">
            View My Bookings
          </Link>
        </div>
      </div>
    </div>
  );
}
