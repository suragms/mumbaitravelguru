'use client';

import React from 'react';
import Link from 'next/link';
import {
  Wallet,
  Percent,
  HeadphonesIcon,
  MapPin,
  ChevronRight,
  Plane,
  Hotel,
  Bus,
  Car,
  Compass,
  Ticket,
  Banknote,
  Calendar,
  Users,
  ExternalLink,
  ArrowRight,
  Tag,
  Sun,
  Globe,
  MessageCircle,
  Send,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface WhyItem {
  icon: React.ElementType;
  title: string;
  copy: string;
}

const WHY_ITEMS: WhyItem[] = [
  {
    icon: Percent,
    title: 'Zero convenience fee',
    copy: 'Every booking on Mumbai Travel Guru comes with zero platform fee. The price you see in search is the price you pay at checkout — no surprise service charges added at the last step.',
  },
  {
    icon: MapPin,
    title: 'Curated Maharashtra & India packages',
    copy: 'We build holiday packages to places we know personally — from the Konkan coast to the Himalayas. Each itinerary is designed by our Mumbai-based team, not a generic template.',
  },
  {
    icon: HeadphonesIcon,
    title: '24x7 Mumbai-based support',
    copy: 'Our team works out of Andheri and knows the Western Express Highway at midnight. Call or chat in Marathi, Hindi, or English — a real person answers, not a bot.',
  },
  {
    icon: Wallet,
    title: 'Encrypted Guru Wallet',
    copy: 'Fund your Wallet once and use it across flights, hotels, buses, cabs, and packages. Refunds land here in seconds, not 7-day bank cycles. No merchant lock-in.',
  },
];

interface CouponOffer {
  code: string;
  title: string;
  description: string;
  validOn: string;
  expiry: string;
  verticals: string;
}

const OFFERS: CouponOffer[] = [
  {
    code: 'FIRST10',
    title: '10% off your first booking',
    description: 'Use code FIRST10 at checkout to get 10% off on flights, hotels, or holiday packages. Maximum discount ₹1,500.',
    validOn: 'Flights & Hotels',
    expiry: 'Valid until 31 Aug 2026',
    verticals: 'Flight,Hotel,Package',
  },
  {
    code: 'HDFCFLIGHT',
    title: 'Flat ₹1,500 off on flights',
    description: 'Pay with any HDFC Bank debit or credit card and get a flat ₹1,500 off on domestic flights. Minimum booking value ₹5,000.',
    validOn: 'Domestic Flights',
    expiry: 'Valid until 31 Dec 2026',
    verticals: 'Flight',
  },
  {
    code: 'WEEKEND50',
    title: '₹500 off on weekend bus trips',
    description: 'Book a bus for travel between Friday and Sunday and get ₹500 off. Use code WEEKEND50. Minimum booking ₹1,000.',
    validOn: 'Bus Bookings',
    expiry: 'Valid every weekend',
    verticals: 'Bus',
  },
];

interface PackageCard {
  name: string;
  destination: string;
  duration: string;
  price: string;
  hook: string;
  slug: string;
  gradient: string;
}

const POPULAR_PACKAGES: PackageCard[] = [
  {
    name: 'Kerala Backwaters',
    destination: 'Kerala',
    duration: '5D / 4N',
    price: '₹18,999',
    hook: 'Houseboats, tea gardens, and coastal cuisine.',
    slug: 'kerala-backwaters',
    gradient: 'from-emerald-900/40 to-sea-deep/90',
  },
  {
    name: 'Goa Beach Escape',
    destination: 'Goa',
    duration: '3D / 2N',
    price: '₹9,499',
    hook: 'Beach resorts, water sports, and Portuguese heritage.',
    slug: 'goa-beach-escape',
    gradient: 'from-amber-900/40 to-sea-deep/90',
  },
  {
    name: 'Kashmir Valley',
    destination: 'Jammu & Kashmir',
    duration: '7D / 6N',
    price: '₹32,999',
    hook: 'Houseboats, Mughal gardens, and snow-capped peaks.',
    slug: 'kashmir-valley',
    gradient: 'from-sky-900/40 to-sea-deep/90',
  },
  {
    name: 'Rajasthan Heritage',
    destination: 'Rajasthan',
    duration: '6D / 5N',
    price: '₹22,499',
    hook: 'Palaces, desert forts, and royal cuisine across Jaipur, Jodhpur & Udaipur.',
    slug: 'rajasthan-heritage',
    gradient: 'from-orange-900/40 to-sea-deep/90',
  },
  {
    name: 'Lonavala & Khandala',
    destination: 'Maharashtra',
    duration: '2D / 1N',
    price: '₹4,299',
    hook: 'Monsoon mist, hill forts, and chikki from the Sahyadris.',
    slug: 'lonavala-khandala',
    gradient: 'from-teal-900/40 to-sea-deep/90',
  },
  {
    name: 'Andaman Islands',
    destination: 'Andaman & Nicobar',
    duration: '6D / 5N',
    price: '₹28,499',
    hook: 'Crystal waters, coral reefs, and pristine white beaches.',
    slug: 'andaman-islands',
    gradient: 'from-cyan-900/40 to-sea-deep/90',
  },
];

const QUICK_LINKS = [
  { label: 'About us', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Refund Policy', href: '/refund-policy' },
  { label: 'Careers', href: '/careers' },
  { label: 'Blog', href: '/blog' },
];

const SERVICES = [
  { label: 'Flights', href: '/flights/results?origin=BOM', icon: Plane },
  { label: 'Hotels', href: '/hotels/search', icon: Hotel },
  { label: 'Bus', href: '/bus', icon: Bus },
  { label: 'Cabs', href: '/cabs', icon: Car },
  { label: 'Packages', href: '/packages', icon: Compass },
];

/* ------------------------------------------------------------------ */
/*  Why Book                                                            */
/* ------------------------------------------------------------------ */
function WhyBookSection() {
  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-xl sm:text-2xl text-paper mb-2">
          Why book with Mumbai Travel Guru
        </h2>
        <p className="text-sandstone/60 text-sm mb-8 sm:mb-10 max-w-xl">
          We built this for Mumbai — transparent pricing, local support, and
          packages you won&apos;t find on a generic OTA.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {WHY_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="group">
                <div className="bg-harbour border border-monsoon/50 rounded-xl p-5 h-full transition-colors hover:border-monsoon-light/60">
                  <div className="bg-gate-gold/10 rounded-lg w-9 h-9 flex items-center justify-center mb-3.5">
                    <Icon className="w-4.5 h-4.5 text-gate-gold" />
                  </div>
                  <h3 className="text-sm font-semibold text-paper mb-1.5">{item.title}</h3>
                  <p className="text-xs text-sandstone/60 leading-relaxed">{item.copy}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Offers Carousel                                                    */
/* ------------------------------------------------------------------ */
function OffersSection() {
  return (
    <section className="py-12 sm:py-16 border-t border-monsoon/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-xl sm:text-2xl text-paper mb-1">
              Offers & coupons
            </h2>
            <p className="text-sandstone/60 text-sm">
              Bank deals, first-booking discounts, and seasonal sales.
            </p>
          </div>
          <Link
            href="/admin/coupons"
            className="hidden sm:flex items-center gap-1 text-xs text-sandstone/50 hover:text-sandstone/70 transition-colors"
          >
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Carousel — horizontal scroll with snap */}
        <div
          className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:gap-5"
        >
          {OFFERS.map((offer) => (
            <div
              key={offer.code}
              className="snap-start shrink-0 w-[280px] sm:w-auto bg-harbour border border-monsoon/50 rounded-xl p-5 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="bg-gate-gold/10 rounded-lg w-9 h-9 flex items-center justify-center">
                  <Ticket className="w-4.5 h-4.5 text-gate-gold" />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-gate-gold/80 bg-gate-gold/10 px-2 py-0.5 rounded border border-gate-gold/20">
                  {offer.code}
                </span>
              </div>

              <h3 className="text-sm font-semibold text-paper mb-1.5">{offer.title}</h3>
              <p className="text-xs text-sandstone/60 leading-relaxed mb-4 flex-1">
                {offer.description}
              </p>

              {/* Footer metadata */}
              <div className="border-t border-monsoon/40 pt-3 mt-auto space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3 h-3 text-sandstone/50" />
                  <span className="text-[11px] text-sandstone/60">{offer.validOn}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-sandstone/50" />
                  <span className="text-[11px] text-sandstone/60">{offer.expiry}</span>
                </div>
              </div>

              {/* CTA */}
              <button
                className="mt-3 w-full text-xs font-semibold text-gate-gold border border-gate-gold/30 hover:bg-gate-gold/10 rounded-lg py-2 transition-colors"
                onClick={() => {
                  navigator.clipboard?.writeText(offer.code);
                }}
              >
                Copy code {offer.code}
              </button>
            </div>
          ))}
        </div>

        {/* Mobile view-all */}
        <div className="mt-4 text-center sm:hidden">
          <Link
            href="/admin/coupons"
            className="inline-flex items-center gap-1 text-xs text-sandstone/50 hover:text-sandstone/70 transition-colors"
          >
            View all offers <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Popular Packages Grid                                               */
/* ------------------------------------------------------------------ */
function PackagesSection() {
  return (
    <section className="py-12 sm:py-16 border-t border-monsoon/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-xl sm:text-2xl text-paper mb-1">
              Popular holiday packages
            </h2>
            <p className="text-sandstone/60 text-sm">
              Curated getaways from Mumbai, for every season and budget.
            </p>
          </div>
          <Link
            href="/packages"
            className="hidden sm:flex items-center gap-1 text-xs text-gate-gold hover:text-gate-gold-dim font-medium transition-colors"
          >
            View all packages <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {POPULAR_PACKAGES.map((pkg) => (
            <Link
              key={pkg.slug}
              href={`/packages/${pkg.slug}`}
              className="group relative rounded-xl overflow-hidden border border-monsoon/50 hover:border-gate-gold/40 transition-all bg-harbour"
            >
              {/* Gradient header area */}
              <div className={`relative h-32 sm:h-36 bg-gradient-to-br ${pkg.gradient} flex items-end p-4`}>
                <div className="absolute inset-0 bg-sea-deep/30" />
                <div className="relative z-10 flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-sandstone/70" />
                    <span className="text-xs text-sandstone/80">{pkg.destination}</span>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-paper/70 bg-sea-deep/60 px-2 py-0.5 rounded border border-monsoon/50">
                    {pkg.duration}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-4">
                <h3 className="text-sm font-semibold text-paper group-hover:text-gate-gold transition-colors mb-1">
                  {pkg.name}
                </h3>
                <p className="text-xs text-sandstone/60 leading-relaxed mb-3 line-clamp-1">
                  {pkg.hook}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-sm font-bold text-gate-gold">{pkg.price}</span>
                    <span className="text-[10px] text-sandstone/50 ml-1">per person</span>
                  </div>
                  <span className="text-xs text-gate-gold/70 group-hover:text-gate-gold group-hover:translate-x-0.5 transition-all">
                    Details <ChevronRight className="w-3 h-3 inline" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile view-all */}
        <div className="mt-5 text-center sm:hidden">
          <Link
            href="/packages"
            className="inline-flex items-center gap-1.5 text-sm text-gate-gold font-medium transition-colors"
          >
            View all packages <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */
function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-monsoon/50 bg-sea-deep">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer grid */}
        <div className="py-10 sm:py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10">
          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-gate-gold/15 p-1.5 rounded-lg">
                <Compass className="w-4 h-4 text-gate-gold" />
              </div>
              <span className="font-display text-sm text-paper tracking-wide">
                Mumbai Travel Guru
              </span>
            </div>
            <p className="text-xs text-sandstone/50 leading-relaxed max-w-xs">
              Mumbai&apos;s own travel marketplace. Book flights, hotels, buses, cabs,
              and holiday packages — all with transparent pricing and 24x7 local support.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="border border-monsoon/50 hover:border-gate-gold/40 rounded-lg p-2 text-sandstone/50 hover:text-gate-gold transition-all" aria-label="Website">
                <Globe className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="border border-monsoon/50 hover:border-gate-gold/40 rounded-lg p-2 text-sandstone/50 hover:text-gate-gold transition-all" aria-label="Chat">
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="border border-monsoon/50 hover:border-gate-gold/40 rounded-lg p-2 text-sandstone/50 hover:text-gate-gold transition-all" aria-label="Email">
                <Send className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div className="sm:col-span-1 lg:col-span-2">
            <h4 className="text-xs font-semibold text-paper/80 uppercase tracking-wider mb-3">
              Company
            </h4>
            <ul className="space-y-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs text-sandstone/50 hover:text-sandstone/80 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="sm:col-span-1 lg:col-span-3">
            <h4 className="text-xs font-semibold text-paper/80 uppercase tracking-wider mb-3">
              Services
            </h4>
            <ul className="space-y-2">
              {SERVICES.map((svc) => {
                const Icon = svc.icon;
                return (
                  <li key={svc.label}>
                    <Link
                      href={svc.href}
                      className="inline-flex items-center gap-1.5 text-xs text-sandstone/50 hover:text-sandstone/80 transition-colors"
                    >
                      <Icon className="w-3 h-3" />
                      {svc.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Contact */}
          <div className="sm:col-span-2 lg:col-span-3">
            <h4 className="text-xs font-semibold text-paper/80 uppercase tracking-wider mb-3">
              Contact
            </h4>
            <ul className="space-y-2 text-xs text-sandstone/50">
              <li>
                <span className="block">Andheri East, Mumbai</span>
                <span className="block">Maharashtra 400093, India</span>
              </li>
              <li className="pt-1">
                <a href="tel:+919999999999" className="hover:text-sandstone/80 transition-colors">
                  +91 99999 99999
                </a>
              </li>
              <li>
                <a href="mailto:support@mumbaitravelguru.com" className="hover:text-sandstone/80 transition-colors">
                  support@mumbaitravelguru.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-monsoon/40 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-sandstone/40">
          <p>
            &copy; {currentYear} Mumbai Travel Guru. All rights reserved.
          </p>
          <p>
            Built by{' '}
            <a href="#" className="hover:text-sandstone/60 transition-colors">
              HexaStack Solutions
            </a>
            . Designed &amp; developed in Mumbai.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Export — compose all sections                                      */
/* ------------------------------------------------------------------ */
export default function HomeSections() {
  return (
    <>
      <WhyBookSection />
      <OffersSection />
      <PackagesSection />
      <AppFooter />
    </>
  );
}
