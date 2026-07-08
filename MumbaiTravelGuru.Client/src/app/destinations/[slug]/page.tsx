import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Globe, MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import SanitizedHtml from '@/components/SanitizedHtml';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5189';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mumbaitravelguru.com';

interface LandingPage {
  id: string; title: string; slug: string; pageType: string; body: string;
  excerpt: string | null; heroImageUrl: string | null;
  origin: string | null; destination: string | null; category: string | null;
  isPublished: boolean; publishedAt: string | null;
  metaTitle: string | null; metaDescription: string | null;
  canonicalUrl: string | null; structuredData: string | null;
  createdAt: string; updatedAt: string | null;
}

async function getLandingPage(slug: string): Promise<LandingPage | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/cms/landing-pages/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getLandingPage(slug);
  if (!page) return { title: 'Page Not Found' };

  return {
    title: page.metaTitle || `${page.title} | Mumbai Travel Guru`,
    description: page.metaDescription || page.excerpt || '',
    alternates: { canonical: page.canonicalUrl || `${SITE_URL}/destinations/${page.slug}` },
    openGraph: {
      title: page.metaTitle || page.title,
      description: page.metaDescription || page.excerpt || '',
      images: page.heroImageUrl ? [{ url: page.heroImageUrl }] : undefined,
    },
  };
}

const pageTypeIcons: Record<string, string> = {
  CityRoute: '✈️',
  CityHotel: '🏨',
  CityBus: '🚌',
  CityPackage: '🎒',
};

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getLandingPage(slug);
  if (!page) notFound();

  const jsonLd = page.structuredData || JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title,
    description: page.excerpt,
    url: `${SITE_URL}/destinations/${page.slug}`,
    ...(page.origin && page.destination ? {
      about: {
        '@type': 'Trip',
        origin: page.origin,
        destination: page.destination,
      },
    } : {}),
  });

  return (
    <div className="min-h-screen bg-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-indigo-400 font-bold text-lg">MumbaiTravelGuru</Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300 text-sm truncate">{page.title}</span>
        </div>
      </header>

      {page.heroImageUrl && (
        <div className="h-64 sm:h-80 relative overflow-hidden">
          <img src={page.heroImageUrl} alt={page.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
        </div>
      )}

      <main className={`max-w-4xl mx-auto px-4 ${page.heroImageUrl ? '-mt-20 relative z-10' : 'py-12'}`}>
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="glass rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-lg">{pageTypeIcons[page.pageType] || '🌍'}</span>
            <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-medium">{page.pageType?.replace('City', '')}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">{page.title}</h1>

          {page.origin && page.destination && (
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-6 bg-slate-900/50 rounded-xl px-4 py-3 border border-slate-800">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span className="font-medium text-white">{page.origin}</span>
              <span className="text-slate-600">→</span>
              <span className="font-medium text-white">{page.destination}</span>
              {page.category && (
                <span className="ml-auto text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">{page.category}</span>
              )}
            </div>
          )}

          <SanitizedHtml html={page.body} className="prose prose-invert max-w-none text-slate-300 leading-relaxed space-y-4" />

          <div className="mt-8 pt-6 border-t border-slate-800">
            <Link href="/"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
              <Globe className="w-4 h-4" /> Explore More Destinations
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/60 py-8 text-center text-xs text-slate-500 mt-12">
        <p>© 2026 Mumbai Travel Guru. All rights reserved.</p>
      </footer>
    </div>
  );
}
