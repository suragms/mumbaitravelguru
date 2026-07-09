import Link from 'next/link';
import { FileText, ArrowRight, Calendar, User } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5189';

interface BlogPostItem {
  id: string; title: string; slug: string; excerpt: string | null;
  heroImageUrl: string | null; authorName: string | null;
  category: string | null; isPublished: boolean;
  publishedAt: string | null; createdAt: string;
}

interface BlogListResult {
  items: BlogPostItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

async function getBlogPosts(): Promise<BlogListResult> {
  try {
    const res = await fetch(`${API_URL}/api/v1/cms/blog?page=1&pageSize=20`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return { items: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 };
    return res.json();
  } catch {
    return { items: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 };
  }
}

export default async function BlogPage() {
  const data = await getBlogPosts();

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-indigo-400 font-bold text-lg">Mumbai Travel Guru</Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300 text-sm">Blog</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-extrabold text-white mb-2">Travel Blog</h1>
        <p className="text-slate-400 mb-10">Tips, guides, and stories from the Mumbai Travel Guru team.</p>

        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: 'Mumbai Travel Guru Blog',
            description: 'Travel tips, guides, and stories.',
            url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://mumbaitravelguru.com'}/blog`,
          }),
        }} />

        {data.items.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-700" />
            <p className="text-lg font-medium">No posts yet</p>
            <p className="text-sm mt-1">Check back soon for new travel content.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map(post => (
              <Link key={post.id} href={`/blog/${post.slug}`}
                className="glass rounded-2xl overflow-hidden hover:border-indigo-500/30 border border-slate-800 transition-all group">
                {post.heroImageUrl && (
                  <div className="h-48 bg-slate-800 overflow-hidden">
                    <img src={post.heroImageUrl} alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                )}
                <div className="p-5">
                  {post.category && (
                    <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-medium">{post.category}</span>
                  )}
                  <h2 className="text-lg font-bold text-white mt-2 group-hover:text-indigo-400 transition-colors">{post.title}</h2>
                  {post.excerpt && <p className="text-sm text-slate-400 mt-2 line-clamp-2">{post.excerpt}</p>}
                  <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                    {post.authorName && (
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {post.authorName}</span>
                    )}
                    {post.publishedAt && (
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(post.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
