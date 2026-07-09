'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest, getStoredToken } from '@/lib/api';
import {
  CreditCard, AlertCircle, CheckCircle, ArrowLeft,
  Loader, ShieldCheck, Tag, X, BadgePercent, ArrowRight,
} from 'lucide-react';

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
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-sea-deep flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gate-gold border-t-transparent" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
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
      theme: { color: '#D4A65A' },
      handler: (response: any) => {
        router.push(`/booking/confirm?bookingId=${order.bookingId}&paymentId=${response.razorpay_payment_id}&orderId=${response.razorpay_order_id}&status=success`);
      },
      modal: { ondismiss: () => setProcessing(false) },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response: any) => {
      setProcessing(false);
      router.push(`/booking/confirm?bookingId=${order.bookingId}&status=failed&error=${encodeURIComponent(response.error.description || 'Your bank declined the transaction. Please try a different payment method.')}`);
    });
    rzp.open();
  };

  if (error && !order) {
    return (
      <div className="min-h-dvh bg-sea-deep flex items-center justify-center p-4">
        <div className="bg-harbour border border-monsoon/50 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gate-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-gate-gold" />
          </div>
          <h2 className="font-display text-xl text-paper mb-2">Could not start payment</h2>
          <p className="text-sm text-sandstone/60 mb-6">{error}</p>
          <Link href="/" className="inline-flex items-center gap-2 bg-gate-gold hover:bg-gate-gold-dim text-sea-deep px-6 py-3 rounded-xl font-bold text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Return Home
          </Link>
        </div>
      </div>
    );
  }

  const showAmount = order?.amount ?? 0;
  const showCurrency = order?.currency ?? 'INR';

  return (
    <div className="min-h-dvh bg-sea-deep">
      <header className="sticky top-0 z-30 border-b border-monsoon/60 bg-sea-deep/85 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-gate-gold/15 p-1 rounded-lg">
              <CreditCard className="w-4 h-4 text-gate-gold" />
            </div>
            <span className="font-display text-sm text-paper tracking-wide">Mumbai Travel Guru</span>
          </Link>
          <span className="text-xs text-sandstone/60">Checkout</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        {loading && !order ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gate-gold border-t-transparent mx-auto mb-4" />
            <p className="text-sandstone/60 text-sm">Preparing your payment...</p>
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-0 mb-6" aria-label="Payment progress">
              {[{ step: 1, label: 'Locked' }, { step: 2, label: 'Payment' }, { step: 3, label: 'Confirmed' }].map((s, i) => (
                <div key={s.step} className="flex items-center">
                  <div className={`flex items-center gap-2 ${i > 0 ? 'ml-0' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300 ${
                      s.step === 1
                        ? 'bg-gate-gold text-sea-deep'
                        : order && s.step === 2
                        ? processing
                          ? 'bg-gate-gold/30 text-gate-gold border border-gate-gold/60 animate-pulse-glow'
                          : error
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-gate-gold/20 text-gate-gold border border-gate-gold/40'
                        : s.step === 3
                        ? 'bg-monsoon/40 text-sandstone/40 border border-monsoon/40'
                        : 'bg-monsoon/30 text-sandstone/30 border border-monsoon/40'
                    }`}>
                      {s.step === 3 ? <CheckCircle className="w-3.5 h-3.5" /> : s.step}
                    </div>
                    <span className={`text-[11px] font-medium transition-colors duration-300 ${
                      s.step === 1
                        ? 'text-gate-gold'
                        : order && s.step === 2
                        ? processing
                          ? 'text-gate-gold'
                          : error ? 'text-amber-400' : 'text-gate-gold/80'
                        : 'text-sandstone/40'
                    }`}>
                      {s.step === 2 && processing ? 'Processing...' : s.label}
                    </span>
                  </div>
                  {i < 2 && (
                    <div className={`w-8 h-px mx-1.5 transition-colors duration-300 ${
                      s.step === 1 ? 'bg-gate-gold/50' : 'bg-monsoon/40'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="bg-harbour border border-monsoon/50 rounded-2xl p-6 sm:p-8">
              <div className="w-16 h-16 bg-gate-gold/10 rounded-full flex items-center justify-center mx-auto mb-5">
                <CreditCard className="w-8 h-8 text-gate-gold" />
              </div>

              <h1 className="font-display text-xl text-paper mb-1 text-center">Complete your payment</h1>
              <p className="text-sm text-sandstone/60 mb-6 text-center">
                {order ? `Booking #${order.bookingId?.slice(0, 8)}` : 'Apply a coupon or proceed to payment'}
              </p>

              {/* Coupon Code Section */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-3.5 h-3.5 text-gate-gold" />
                  <span className="text-xs font-medium text-sandstone/70">Have a coupon code?</span>
                </div>

                {appliedCoupon ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-mono font-bold text-emerald-400">{appliedCoupon}</span>
                      <span className="text-xs text-sandstone/50">applied</span>
                    </div>
                    <button onClick={removeCoupon} className="text-sandstone/50 hover:text-amber-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code"
                        className="w-full bg-sea-deep border border-monsoon/60 rounded-xl pl-3 pr-8 py-2 text-xs text-paper font-mono focus:outline-none focus:border-gate-gold/60 transition-colors"
                        maxLength={50} />
                      {couponCode && (
                        <button onClick={() => { setCouponCode(''); setCouponValidation(null); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-sandstone/50 hover:text-paper">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <button onClick={applyCoupon} disabled={!couponValidation?.isValid || validatingCoupon}
                      className="min-h-[44px] bg-gate-gold hover:bg-gate-gold-dim disabled:bg-monsoon disabled:text-sandstone/50 text-sea-deep px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1">
                      {validatingCoupon ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <BadgePercent className="w-3.5 h-3.5" />}
                      Apply
                    </button>
                  </div>
                )}

                {couponValidation && !appliedCoupon && couponCode && (
                  <div className={`mt-2 p-2.5 rounded-xl text-xs flex items-start gap-2 ${
                    couponValidation.isValid
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
                  }`}>
                    {couponValidation.isValid
                      ? <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      : <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    }
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
              <div className="bg-sea-deep border border-monsoon/50 rounded-2xl p-6 mb-6 text-center">
                <div className="text-xs text-sandstone/60 mb-1">Total Amount</div>
                <div className="font-mono text-4xl font-bold text-gate-gold tracking-tight">
                  {showCurrency} {showAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                {appliedCoupon && (
                  <div className="flex items-center justify-center gap-1 mt-2 text-xs text-emerald-400">
                    <CheckCircle className="w-3 h-3" /> Coupon {appliedCoupon} applied
                  </div>
                )}
                <div className="flex items-center justify-center gap-1 mt-3 text-xs text-sandstone/50">
                  <ShieldCheck className="w-3 h-3 text-gate-gold" /> Secured by Razorpay
                </div>
              </div>

              <div className="text-center">
                {order ? (
                  <button onClick={handlePayment} disabled={processing}
                    className="w-full bg-gate-gold hover:bg-gate-gold-dim disabled:bg-monsoon disabled:text-sandstone/50 text-sea-deep font-bold py-3.5 rounded-xl transition-all text-sm inline-flex items-center justify-center gap-2">
                    {processing ? (
                      <><Loader className="animate-spin w-4 h-4" /> Processing...</>
                    ) : (
                      <><CreditCard className="w-4 h-4" /> Pay {showCurrency} {showAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</>
                    )}
                  </button>
                ) : (
                  <button onClick={() => handleCreateOrder()} disabled={loading}
                    className="w-full bg-gate-gold hover:bg-gate-gold-dim disabled:bg-monsoon disabled:text-sandstone/50 text-sea-deep font-bold py-3.5 rounded-xl transition-all text-sm inline-flex items-center justify-center gap-2">
                    {loading ? (
                      <><Loader className="animate-spin w-4 h-4" /> Creating your order...</>
                    ) : (
                      <><CreditCard className="w-4 h-4" /> Proceed to Pay</>
                    )}
                  </button>
                )}
              </div>

              <p className="text-xs text-sandstone/50 mt-4 text-center">
                Your payment will be processed securely via Razorpay. We do not store your card details.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
