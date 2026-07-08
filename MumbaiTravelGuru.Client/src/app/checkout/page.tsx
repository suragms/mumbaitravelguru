'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest, getStoredToken } from '@/lib/api';
import { CreditCard, AlertCircle, CheckCircle, ArrowLeft, Loader, ShieldCheck, Tag, X, BadgePercent } from 'lucide-react';

declare global {
  interface Window { Razorpay: any; }
}

interface CreateOrderResult {
  succeeded: boolean;
  error?: string;
  gatewayOrderId?: string;
  amount: number;
  currency: string;
  gatewayKeyId?: string;
  bookingId?: string;
}

interface ValidateCouponResult {
  isValid: boolean;
  error?: string;
  code?: string;
  type?: string;
  value?: number;
  maxDiscountAmount?: number | null;
  discountedAmount?: number | null;
  finalAmount?: number | null;
  currency?: string;
}

export default function CheckoutPage() {
  return <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader className="animate-spin h-10 w-10 text-indigo-500" /></div>}>
    <CheckoutContent />
  </Suspense>;
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('bookingId');

  const [order, setOrder] = useState<CreateOrderResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [couponValidation, setCouponValidation] = useState<ValidateCouponResult | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const validateCoupon = useCallback(async (code: string) => {
    if (code.length < 2 || !bookingId) {
      setCouponValidation(null);
      return;
    }
    setValidatingCoupon(true);
    try {
      const result = await apiRequest<ValidateCouponResult>('/api/v1/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code, bookingId }),
      });
      setCouponValidation(result);
    } catch {
      setCouponValidation({ isValid: false, error: 'Validation failed. Try again.' });
    }
    setValidatingCoupon(false);
  }, [bookingId]);

  useEffect(() => {
    if (!appliedCoupon && couponCode) {
      const timer = setTimeout(() => validateCoupon(couponCode), 500);
      return () => clearTimeout(timer);
    }
  }, [couponCode, appliedCoupon, validateCoupon]);

  useEffect(() => {
    if (!bookingId || !getStoredToken()) {
      setError('Missing booking information or not logged in.');
      setLoading(false);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, [bookingId]);

  const handleCreateOrder = async (couponCodeToApply?: string) => {
    setLoading(true);
    try {
      const body: Record<string, unknown> = { bookingId };
      if (couponCodeToApply) body.couponCode = couponCodeToApply;
      const result = await apiRequest<CreateOrderResult>('/api/v1/payments/order', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (!result.succeeded) {
        setError(result.error || 'Failed to create payment order.');
        if (couponCodeToApply) setAppliedCoupon(null);
      } else {
        setOrder(result);
        if (couponCodeToApply) setAppliedCoupon(couponCodeToApply);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to initiate payment.');
    }
    setLoading(false);
  };

  const applyCoupon = () => {
    if (!couponValidation?.isValid) return;
    handleCreateOrder(couponCode);
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponValidation(null);
    setAppliedCoupon(null);
    if (order) handleCreateOrder();
  };

  const handlePayment = () => {
    if (!order || !order.gatewayOrderId || !order.gatewayKeyId) return;
    setProcessing(true);

    const options = {
      key: order.gatewayKeyId,
      amount: order.amount * 100,
      currency: order.currency,
      name: 'Mumbai Travel Guru',
      description: `Booking #${order.bookingId?.slice(0, 8)}${appliedCoupon ? ` (${appliedCoupon})` : ''}`,
      order_id: order.gatewayOrderId,
      prefill: { contact: '', email: '' },
      theme: { color: '#4f46e5' },
      handler: (response: any) => {
        router.push(`/checkout/success?bookingId=${order.bookingId}&paymentId=${response.razorpay_payment_id}&orderId=${response.razorpay_order_id}`);
      },
      modal: { ondismiss: () => setProcessing(false) },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response: any) => {
      setProcessing(false);
      router.push(`/checkout/failed?bookingId=${order.bookingId}&error=${encodeURIComponent(response.error.description || 'Payment failed')}`);
    });
    rzp.open();
  };

  if (error && !order) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="metal-card rounded-2xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Payment Error</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <Link href="/" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Return Home
          </Link>
        </div>
      </div>
    );
  }

  const showAmount = order?.amount ?? 0;
  const showCurrency = order?.currency ?? 'INR';

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-indigo-400 font-bold text-lg">MumbaiTravelGuru</Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300 text-sm">Checkout</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        {loading && !order ? (
          <div className="text-center py-20">
            <Loader className="animate-spin h-10 w-10 text-indigo-500 mx-auto mb-4" />
            <p className="text-slate-400">Preparing payment...</p>
          </div>
        ) : (
          <div className="metal-card rounded-2xl p-8">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard className="w-10 h-10 text-indigo-400" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-2 text-center">Complete Your Payment</h1>
            <p className="text-slate-400 mb-8 text-center">
              {order ? `Pay for booking #${order.bookingId?.slice(0, 8)}` : 'Apply a coupon or proceed to payment'}
            </p>

            {/* Coupon Code Section */}
            <div className="max-w-sm mx-auto mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium text-slate-300">Have a coupon code?</span>
              </div>

              {appliedCoupon ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-mono font-bold text-emerald-400">{appliedCoupon}</span>
                    <span className="text-xs text-slate-400">applied</span>
                  </div>
                  <button onClick={removeCoupon} className="text-slate-500 hover:text-rose-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-3 pr-8 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                      maxLength={50} />
                    {couponCode && (
                      <button onClick={() => { setCouponCode(''); setCouponValidation(null); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <button onClick={applyCoupon} disabled={!couponValidation?.isValid || validatingCoupon}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1">
                    {validatingCoupon ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <BadgePercent className="w-3.5 h-3.5" />}
                    Apply
                  </button>
                </div>
              )}

              {/* Validation Feedback */}
              {couponValidation && !appliedCoupon && couponCode && (
                <div className={`mt-2 p-2.5 rounded-xl text-xs flex items-start gap-2 ${couponValidation.isValid ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' : 'bg-amber-500/10 border border-amber-500/20 text-amber-300'}`}>
                  {couponValidation.isValid ? <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                  <div>
                    {couponValidation.isValid ? (
                      <>
                        <span className="font-semibold">{couponValidation.code}</span>
                        {couponValidation.type === 'Percentage'
                          ? ` - ${couponValidation.value}% off`
                          : ` - ₹${couponValidation.value} off`}
                        {couponValidation.discountedAmount && (
                          <span className="block text-emerald-400 font-semibold mt-1">
                            You save: {showCurrency} {couponValidation.discountedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </>
                    ) : (
                      <span>{couponValidation.error}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Amount Display */}
            <div className="bg-slate-900/50 rounded-2xl p-6 mb-8 border border-slate-800 max-w-sm mx-auto">
              <div className="text-sm text-slate-400 mb-1">Total Amount</div>
              <div className="text-4xl font-extrabold text-white">
                {showCurrency} {showAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              {appliedCoupon && (
                <div className="flex items-center justify-center gap-1 mt-2 text-xs text-emerald-400">
                  <CheckCircle className="w-3 h-3" /> Coupon {appliedCoupon} applied
                </div>
              )}
              <div className="flex items-center justify-center gap-1 mt-3 text-xs text-emerald-400">
                <ShieldCheck className="w-3 h-3" /> Secured by Razorpay
              </div>
            </div>

            <div className="text-center">
              {order ? (
                <button onClick={handlePayment} disabled={processing}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-4 px-8 rounded-xl transition-all text-lg inline-flex items-center gap-3">
                  {processing ? <><Loader className="animate-spin w-5 h-5" /> Processing...</>
                    : <><CreditCard className="w-5 h-5" /> Pay {showCurrency} {showAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</>}
                </button>
              ) : (
                <button onClick={() => handleCreateOrder()} disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-4 px-8 rounded-xl transition-all text-lg inline-flex items-center gap-3">
                  {loading ? <><Loader className="animate-spin w-5 h-5" /> Creating Order...</>
                    : <><CreditCard className="w-5 h-5" /> Proceed to Pay</>}
                </button>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-4 text-center">
              Your payment will be processed securely via Razorpay. We do not store your card details.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
