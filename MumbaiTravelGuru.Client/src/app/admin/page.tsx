'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '@/lib/api';
import {
  TrendingUp, ShoppingBag, AlertTriangle, IndianRupee,
  Plane, Hotel, Compass, ArrowRight, ArrowDown, Search,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DashboardData {
  totalBookingsToday: number;
  totalBookingsThisMonth: number;
  revenueToday: number;
  revenueThisMonth: number;
  pendingReconciliationCount: number;
  revenueByVertical: { vertical: string; revenue: number; bookingCount: number }[];
  bookingsPerDay: { date: string; count: number; revenue: number }[];
  topRoutes: { origin: string; destination: string; count: number }[];
  conversionFunnel: {
    totalSearches: number;
    totalInitiations: number;
    totalConfirmations: number;
    searchToInitiateRate: number;
    initiateToConfirmRate: number;
    overallConversionRate: number;
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmt(n: number) { return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`; }

function shortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const d = await apiRequest<DashboardData>('/api/v1/admin/dashboard');
        setData(d);
      } catch { /* server may not be running */ }
      setLoading(false);
    };
    fetch();
  }, []);

  /* ---- derived ---- */
  const maxDayCount = useMemo(
    () => (data ? Math.max(...data.bookingsPerDay.map(d => d.count), 1) : 1),
    [data],
  );
  const maxVerticalRevenue = useMemo(
    () => (data ? Math.max(...data.revenueByVertical.map(v => v.revenue), 1) : 1),
    [data],
  );
  const maxRouteCount = useMemo(
    () => (data ? Math.max(...data.topRoutes.map(r => r.count), 1) : 1),
    [data],
  );

  /* ---- loading ---- */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gate-gold border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-sandstone/60 text-sm text-center py-20">
        Could not load dashboard data. Make sure the API server is running.
      </div>
    );
  }

  /* ============================= RENDER ============================= */
  return (
    <div className="space-y-5">
      {/* -------- Title -------- */}
      <h1 className="font-display text-xl text-paper">Dashboard</h1>

      {/* ======== KPI ROW ======== */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard
          icon={<ShoppingBag className="w-4 h-4" />}
          label="Today"
          value={String(data.totalBookingsToday)}
          sub="bookings today"
          accent="gate-gold"
        />
        <KpiCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Monthly"
          value={String(data.totalBookingsThisMonth)}
          sub="bookings this month"
          accent="emerald"
        />
        <KpiCard
          icon={<IndianRupee className="w-4 h-4" />}
          label="Revenue MTD"
          value={fmt(data.revenueThisMonth)}
          sub="month to date"
          accent="gate-gold"
        />
        <KpiCard
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Reconciliation"
          value={String(data.pendingReconciliationCount)}
          sub="pending review"
          accent="amber"
        />
      </section>

      {/* ======== CHARTS GRID ======== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        {/* ---- Bookings Per Day (bar chart) ---- */}
        <section className="lg:col-span-2 bg-harbour border border-monsoon/50 rounded-xl p-4 lg:p-5">
          <h2 className="text-xs font-semibold text-paper/80 uppercase tracking-wider mb-4">
            Bookings Per Day (Last 7 Days)
          </h2>
          <BarChart
            data={data.bookingsPerDay.map(d => ({
              label: shortDate(d.date),
              value: d.count,
              secondary: fmt(d.revenue),
            }))}
            maxValue={maxDayCount}
            barColor="bg-gate-gold"
            barActiveColor="bg-gate-gold-dim"
          />
        </section>

        {/* ---- Revenue by Vertical + Conversion Funnel ---- */}
        <section className="space-y-4">
          {/* Revenue by Vertical */}
          <div className="bg-harbour border border-monsoon/50 rounded-xl p-4 lg:p-5">
            <h2 className="text-xs font-semibold text-paper/80 uppercase tracking-wider mb-4">
              Revenue by Vertical
            </h2>
            <div className="space-y-3">
              {data.revenueByVertical.map(v => (
                <div key={v.vertical}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      {v.vertical === 'Flight' ? (
                        <Plane className="w-3.5 h-3.5 text-gate-gold" />
                      ) : v.vertical === 'Hotel' ? (
                        <Hotel className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Compass className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span className="text-paper/80 font-medium">{v.vertical}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs font-bold text-gate-gold">{fmt(v.revenue)}</div>
                      <div className="text-[10px] text-sandstone/50">{v.bookingCount} bookings</div>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-sea-deep rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(v.revenue / maxVerticalRevenue) * 100}%`,
                        backgroundColor: v.vertical === 'Flight' ? '#D4A65A' : v.vertical === 'Hotel' ? '#34D399' : '#FBBF24',
                      }}
                    />
                  </div>
                </div>
              ))}
              {data.revenueByVertical.length === 0 && (
                <p className="text-xs text-sandstone/50 text-center py-3">No revenue data yet</p>
              )}
            </div>
          </div>

          {/* Conversion Funnel */}
          <div className="bg-harbour border border-monsoon/50 rounded-xl p-4 lg:p-5">
            <h2 className="text-xs font-semibold text-paper/80 uppercase tracking-wider mb-4">
              Conversion Funnel
            </h2>
            <FunnelChart
              steps={[
                { label: 'Searches', value: data.conversionFunnel.totalSearches, pct: 100 },
                { label: 'Initiated', value: data.conversionFunnel.totalInitiations, pct: data.conversionFunnel.searchToInitiateRate },
                { label: 'Confirmed', value: data.conversionFunnel.totalConfirmations, pct: data.conversionFunnel.initiateToConfirmRate },
              ]}
              overallPct={data.conversionFunnel.overallConversionRate}
            />
          </div>
        </section>
      </div>

      {/* ======== TOP ROUTES ======== */}
      {data.topRoutes.length > 0 && (
        <section className="bg-harbour border border-monsoon/50 rounded-xl p-4 lg:p-5">
          <h2 className="text-xs font-semibold text-paper/80 uppercase tracking-wider mb-4">
            Top Flight Routes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {data.topRoutes.map((r, i) => (
              <div key={i} className="bg-sea-deep border border-monsoon/50 rounded-xl p-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-gate-gold/10 border border-gate-gold/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-gate-gold font-mono">#{i + 1}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-paper/80">
                  <span className="font-mono">{r.origin}</span>
                  <ArrowRight className="w-3 h-3 text-sandstone/50" />
                  <span className="font-mono">{r.destination}</span>
                </div>
                <div className="ml-auto">
                  <span className="text-[10px] text-sandstone/60 bg-monsoon/30 px-2 py-0.5 rounded-full border border-monsoon/40">
                    {r.count} booking{r.count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ==================================================================== */
/*  KPI Card                                                             */
/* ==================================================================== */

function KpiCard({
  icon, label, value, sub, accent,
}: {
  icon: React.ReactNode; label: string; value: string; sub: string; accent: string;
}) {
  const accentMap: Record<string, string> = {
    'gate-gold': 'text-gate-gold bg-gate-gold/10 border-gate-gold/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };

  return (
    <div className="bg-harbour border border-monsoon/50 rounded-xl p-4">
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className={`${accentMap[accent]} p-2 rounded-lg border`}>{icon}</div>
        <span className="text-[10px] text-sandstone/60 uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className="font-mono text-lg font-bold text-paper tracking-tight">{value}</div>
      <div className="text-xs text-sandstone/50 mt-0.5">{sub}</div>
    </div>
  );
}

/* ==================================================================== */
/*  Bar Chart (SVG-style bar chart using pure CSS/tailwind)              */
/* ==================================================================== */

function BarChart({
  data, maxValue, barColor, barActiveColor,
}: {
  data: { label: string; value: number; secondary: string }[];
  maxValue: number;
  barColor: string;
  barActiveColor: string;
}) {
  return (
    <div className="flex items-end gap-2 sm:gap-3 h-32 sm:h-40">
      {data.map((item, i) => {
        const pct = (item.value / maxValue) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
            <span className="text-[10px] text-sandstone/50 font-mono">{item.value}</span>
            <div className="w-full rounded-t-md relative group cursor-pointer" style={{ height: `${Math.max(pct, 4)}%` }}>
              <div
                className={`absolute inset-0 rounded-t-md ${barColor} opacity-80 group-hover:opacity-100 transition-opacity`}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                <div className="bg-monsoon-light border border-monsoon/60 rounded-lg px-2 py-1 text-[10px] text-paper whitespace-nowrap shadow-lg">
                  {item.secondary}
                </div>
              </div>
            </div>
            <span className="text-[9px] text-sandstone/50 text-center leading-tight mt-0.5 hidden sm:block">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ==================================================================== */
/*  Funnel Chart                                                         */
/* ==================================================================== */

function FunnelChart({
  steps,
  overallPct,
}: {
  steps: { label: string; value: number; pct: number }[];
  overallPct: number;
}) {
  const widths = steps.map(s => `${Math.max(s.value / steps[0].value * 100, 10)}%`);

  return (
    <div className="space-y-2">
      {steps.map((s, i) => (
        <div key={s.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-sandstone/60">{s.label}</span>
            <span className="font-mono text-paper/80 font-bold">{s.value.toLocaleString()}</span>
          </div>
          <div className="flex justify-center">
            <div
              className="h-7 rounded-lg flex items-center justify-center transition-all duration-500"
              style={{
                width: widths[i],
                backgroundColor: i === 0 ? 'rgba(212, 166, 90, 0.15)' : i === 1 ? 'rgba(212, 166, 90, 0.12)' : 'rgba(212, 166, 90, 0.08)',
                border: i === 0 ? '1px solid rgba(212, 166, 90, 0.3)' : i === 1 ? '1px solid rgba(212, 166, 90, 0.2)' : '1px solid rgba(212, 166, 90, 0.15)',
              }}
            >
              <span className="text-[10px] text-gate-gold font-mono font-bold">{s.pct}%</span>
            </div>
          </div>
        </div>
      ))}
      <div className="border-t border-monsoon/40 pt-2 mt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-emerald-400 font-semibold">Overall Conversion</span>
          <span className="text-emerald-400 font-mono font-bold">{overallPct}%</span>
        </div>
      </div>
    </div>
  );
}
