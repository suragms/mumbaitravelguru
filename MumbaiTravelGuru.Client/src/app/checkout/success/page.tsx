'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Loader } from 'lucide-react';

export default function SuccessPage() {
  return <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader className="animate-spin h-10 w-10 text-indigo-500" /></div>}>
    <SuccessContent />
  </Suspense>;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const paymentId = searchParams.get('paymentId');
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="metal-card rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
        <p className="text-slate-400 mb-6">Your booking is being confirmed.</p>

        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 text-left space-y-2 mb-8">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Booking ID</span>
            <span className="text-white font-mono">{bookingId?.slice(0, 8)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Payment ID</span>
            <span className="text-white font-mono text-xs">{paymentId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Order ID</span>
            <span className="text-white font-mono text-xs">{orderId}</span>
          </div>
        </div>

        <Link href="/profile"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
          View My Bookings
        </Link>
      </div>
    </div>
  );
}
