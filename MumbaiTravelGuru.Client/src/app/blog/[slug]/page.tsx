import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, User, Tag } from 'lucide-react';
import type { Metadata } from 'next';
import SanitizedHtml from '@/components/SanitizedHtml';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5189';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mumbaitravelguru.com';

interface BlogPost {
  id: string; title: string; slug: string; body: string; excerpt: string | null;
  heroImageUrl: string | null; authorName: string | null; category: string | null;
  tags: string | null; isPublished: boolean; publishedAt: string | null;
  metaTitle: string | null; metaDescription: string | null;
  canonicalUrl: string | null; structuredData: string | null;
  createdAt: string; updatedAt: string | null;
}

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/cms/blog/${slug}`, {
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
  const post = await getPost(slug);
  if (!post) return { title: 'Post Not Found' };

  return {
    title: post.metaTitle || `${post.title} | Mumbai Travel Guru Blog`,
    description: post.metaDescription || post.excerpt || '',
    alternates: { canonical: post.canonicalUrl || `${SITE_URL}/blog/${post.slug}` },
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || '',
      type: 'article',
      publishedTime: post.publishedAt || undefined,
      authors: post.authorName ? [post.authorName] : undefined,
      images: post.heroImageUrl ? [{ url: post.heroImageUrl }] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const jsonLd = post.structuredData || JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.heroImageUrl,
    datePublished: post.publishedAt,
    author: post.authorName ? { '@type': 'Person', name: post.authorName } : undefined,
    publisher: { '@type': 'Organization', name: 'Mumbai Travel Guru' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${post.slug}` },
  });

  return (
    <div className="min-h-screen bg-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-indigo-400 font-bold text-lg">Mumbai Travel Guru</Link>
          <span className="text-slate-600">/</span>
          <Link href="/blog" className="text-slate-400 hover:text-slate-200 text-sm">Blog</Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300 text-sm truncate">{post.title}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>

        {post.heroImageUrl && (
          <div className="rounded-2xl overflow-hidden mb-8">
            <img src={post.heroImageUrl} alt={post.title} className="w-full h-64 sm:h-96 object-cover" />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-4">
          {post.category && (
            <span className="flex items-center gap-1 bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full">
              <Tag className="w-3 h-3" /> {post.category}
            </span>
          )}
          {post.authorName && (
            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {post.authorName}</span>
          )}
          {post.publishedAt && (
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(post.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-6">{post.title}</h1>

        {post.tags && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.split(',').map(tag => (
              <span key={tag} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{tag.trim()}</span>
            ))}
          </div>
        )}

        <SanitizedHtml html={post.body} className="prose prose-invert max-w-none text-slate-300 leading-relaxed space-y-4" />
      </main>
    </div>
  );
}
