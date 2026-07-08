'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { FileText, Globe, Plus, Search, X, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface BlogPostItem { id: string; title: string; slug: string; excerpt: string | null; category: string | null; isPublished: boolean; publishedAt: string | null; createdAt: string; }
interface LandingPageItem { id: string; title: string; slug: string; pageType: string; origin: string | null; destination: string | null; isPublished: boolean; publishedAt: string | null; createdAt: string; }

interface BlogListResult { items: BlogPostItem[]; totalCount: number; page: number; pageSize: number; }
interface LandingPageListResult { items: LandingPageItem[]; totalCount: number; page: number; pageSize: number; }

function fmtDate(d: string | null) { return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'; }

const defaultBlog = {
  title: '', slug: '', body: '', excerpt: '', heroImageUrl: '', authorName: '',
  category: '', tags: '', metaTitle: '', metaDescription: '', canonicalUrl: '', structuredData: '',
};

const defaultLanding = {
  title: '', slug: '', pageType: 'CityRoute', body: '', excerpt: '', heroImageUrl: '',
  origin: '', destination: '', category: 'Flight', metaTitle: '', metaDescription: '',
  canonicalUrl: '', structuredData: '',
};

export default function AdminCmsPage() {
  const [tab, setTab] = useState<'blog' | 'landing'>('blog');

  // Blog state
  const [blogData, setBlogData] = useState<BlogListResult | null>(null);
  const [blogSearch, setBlogSearch] = useState('');
  const [blogFilter, setBlogFilter] = useState('');
  const [blogPage, setBlogPage] = useState(1);
  const [blogLoading, setBlogLoading] = useState(true);

  // Landing state
  const [landingData, setLandingData] = useState<LandingPageListResult | null>(null);
  const [landingSearch, setLandingSearch] = useState('');
  const [landingFilter, setLandingFilter] = useState('');
  const [landingPageP, setLandingPageP] = useState(1);
  const [landingLoading, setLandingLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editType, setEditType] = useState<'blog' | 'landing'>('blog');
  const [form, setForm] = useState<Record<string, any>>(defaultBlog);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchBlog = async (p: number) => {
    setBlogLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: '20' });
      if (blogSearch) params.set('search', blogSearch);
      if (blogFilter) params.set('isPublished', blogFilter);
      setBlogData(await apiRequest<BlogListResult>(`/api/v1/admin/cms/blog?${params}`));
    } catch { }
    setBlogLoading(false);
  };

  const fetchLanding = async (p: number) => {
    setLandingLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: '20' });
      if (landingSearch) params.set('search', landingSearch);
      if (landingFilter) params.set('pageType', landingFilter);
      setLandingData(await apiRequest<LandingPageListResult>(`/api/v1/admin/cms/landing-pages?${params}`));
    } catch { }
    setLandingLoading(false);
  };

  useEffect(() => { fetchBlog(blogPage); }, [blogPage, blogFilter]);
  useEffect(() => { const t = setTimeout(() => { setBlogPage(1); fetchBlog(1); }, 300); return () => clearTimeout(t); }, [blogSearch]);

  useEffect(() => { fetchLanding(landingPageP); }, [landingPageP, landingFilter]);
  useEffect(() => { const t = setTimeout(() => { setLandingPageP(1); fetchLanding(1); }, 300); return () => clearTimeout(t); }, [landingSearch]);

  const openCreate = (type: 'blog' | 'landing') => {
    setEditType(type);
    setEditId(null);
    if (type === 'blog') setForm(defaultBlog);
    else setForm(defaultLanding as any);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = async (type: 'blog' | 'landing', id: string) => {
    setEditType(type);
    setEditId(id);
    try {
      if (type === 'blog') {
        const item = await apiRequest<any>(`/api/v1/admin/cms/blog/${id}`);
        setForm({
          title: item.title || '', slug: item.slug || '', body: item.body || '',
          excerpt: item.excerpt || '', heroImageUrl: item.heroImageUrl || '',
          authorName: item.authorName || '', category: item.category || '',
          tags: item.tags || '', metaTitle: item.metaTitle || '',
          metaDescription: item.metaDescription || '', canonicalUrl: item.canonicalUrl || '',
          structuredData: item.structuredData || '',
        });
      } else {
        const item = await apiRequest<any>(`/api/v1/admin/cms/landing-pages/${id}`);
        setForm({
          title: item.title || '', slug: item.slug || '', body: item.body || '',
          excerpt: item.excerpt || '', heroImageUrl: item.heroImageUrl || '',
          authorName: item.authorName || '', category: item.category || '',
          tags: item.pageType || '', metaTitle: item.metaTitle || '',
          metaDescription: item.metaDescription || '', canonicalUrl: item.canonicalUrl || '',
          structuredData: item.structuredData || '',
        } as any);
        setForm(prev => ({ ...prev, pageType: item.pageType || 'CityRoute', origin: item.origin || '', destination: item.destination || '' }));
      }
      setFormError('');
      setShowModal(true);
    } catch { setFormError('Failed to load item.'); }
  };

  const publishToggle = async (type: 'blog' | 'landing', id: string, current: boolean) => {
    try {
      const body = JSON.stringify({ isPublished: !current });
      if (type === 'blog') {
        await apiRequest(`/api/v1/admin/cms/blog/${id}`, { method: 'PUT', body });
        fetchBlog(blogPage);
      } else {
        await apiRequest(`/api/v1/admin/cms/landing-pages/${id}`, { method: 'PUT', body });
        fetchLanding(landingPageP);
      }
    } catch { }
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!form.title.trim() || !form.slug.trim() || !form.body.trim()) {
      setFormError('Title, slug, and body are required.'); return;
    }

    setSubmitting(true);
    try {
      const body = JSON.stringify(editType === 'blog' ? form : { ...form, pageType: (form as any).pageType, origin: (form as any).origin, destination: (form as any).destination });

      if (editId) {
        const result = await apiRequest<any>(`/api/v1/admin/cms/${editType === 'blog' ? 'blog' : 'landing-pages'}/${editId}`, { method: 'PUT', body });
        if (!result.succeeded) { setFormError(result.error || 'Update failed.'); setSubmitting(false); return; }
      } else {
        const endpoint = editType === 'blog' ? '/api/v1/admin/cms/blog' : '/api/v1/admin/cms/landing-pages';
        const result = await apiRequest<any>(endpoint, { method: 'POST', body });
        if (!result.succeeded) { setFormError(result.error || 'Creation failed.'); setSubmitting(false); return; }
      }

      setShowModal(false);
      if (editType === 'blog') fetchBlog(blogPage); else fetchLanding(landingPageP);
    } catch (err: unknown) { setFormError(err instanceof Error ? err.message : 'Operation failed.'); }
    setSubmitting(false);
  };

  const blogBpp = blogData ? Math.ceil(blogData.totalCount / blogData.pageSize) : 0;
  const landingBpp = landingData ? Math.ceil(landingData.totalCount / landingData.pageSize) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-400" /> Content Management
        </h1>
        <div className="flex gap-2">
          <button onClick={() => openCreate('blog')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" /> New Post
          </button>
          <button onClick={() => openCreate('landing')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
            <Globe className="w-4 h-4" /> New Landing Page
          </button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-800 pb-1">
        <button onClick={() => setTab('blog')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${tab === 'blog' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
          <FileText className="w-4 h-4 inline mr-1.5" /> Blog Posts
        </button>
        <button onClick={() => setTab('landing')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${tab === 'landing' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
          <Globe className="w-4 h-4 inline mr-1.5" /> Landing Pages
        </button>
      </div>

      {tab === 'blog' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" value={blogSearch} onChange={e => setBlogSearch(e.target.value)} placeholder="Search posts..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
            </div>
            <select value={blogFilter} onChange={e => setBlogFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300">
              <option value="">All</option>
              <option value="true">Published</option>
              <option value="false">Drafts</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-xs text-slate-400 uppercase font-semibold tracking-wider">
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Published</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {blogLoading ? (
                  <tr><td colSpan={6} className="py-12 text-center text-slate-500">Loading...</td></tr>
                ) : blogData?.items.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-slate-500">No posts yet.</td></tr>
                ) : blogData?.items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-white">{item.title}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-xs">/{item.slug}</td>
                    <td className="py-3 px-4"><span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{item.category || '-'}</span></td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${item.isPublished ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                        {item.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">{fmtDate(item.publishedAt)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.isPublished && <Link href={`/blog/${item.slug}`} target="_blank" className="text-slate-500 hover:text-indigo-400"><ExternalLink className="w-3.5 h-3.5" /></Link>}
                        <button onClick={() => openEdit('blog', item.id)} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">Edit</button>
                        <button onClick={() => publishToggle('blog', item.id, item.isPublished)}
                          className={`text-xs font-medium ${item.isPublished ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'}`}>
                          {item.isPublished ? 'Unpublish' : 'Publish'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {blogBpp > 1 && (
            <div className="flex justify-center gap-2">{
              Array.from({ length: blogBpp }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setBlogPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium ${p === blogPage ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{p}</button>))
            }</div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" value={landingSearch} onChange={e => setLandingSearch(e.target.value)} placeholder="Search pages..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
            </div>
            <select value={landingFilter} onChange={e => setLandingFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300">
              <option value="">All Types</option>
              <option value="CityRoute">City Route</option>
              <option value="CityHotel">City Hotel</option>
              <option value="CityBus">City Bus</option>
              <option value="CityPackage">City Package</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-xs text-slate-400 uppercase font-semibold tracking-wider">
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Published</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {landingLoading ? (
                  <tr><td colSpan={6} className="py-12 text-center text-slate-500">Loading...</td></tr>
                ) : landingData?.items.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-slate-500">No landing pages yet.</td></tr>
                ) : landingData?.items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-white">{item.title}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-xs">/{item.slug}</td>
                    <td className="py-3 px-4 text-xs text-slate-400">
                      {item.origin && item.destination ? `${item.origin} → ${item.destination}` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${item.isPublished ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                        {item.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">{fmtDate(item.publishedAt)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.isPublished && <Link href={`/destinations/${item.slug}`} target="_blank" className="text-slate-500 hover:text-indigo-400"><ExternalLink className="w-3.5 h-3.5" /></Link>}
                        <button onClick={() => openEdit('landing', item.id)} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">Edit</button>
                        <button onClick={() => publishToggle('landing', item.id, item.isPublished)}
                          className={`text-xs font-medium ${item.isPublished ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'}`}>
                          {item.isPublished ? 'Unpublish' : 'Publish'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {landingBpp > 1 && (
            <div className="flex justify-center gap-2">{
              Array.from({ length: landingBpp }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setLandingPageP(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium ${p === landingPageP ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{p}</button>))
            }</div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{editId ? 'Edit' : 'Create'} {editType === 'blog' ? 'Blog Post' : 'Landing Page'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {formError}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Title *</label>
                  <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Slug *</label>
                  <input type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500" />
                </div>
              </div>

              {editType === 'landing' && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1">Page Type</label>
                    <select value={(form as any).pageType || 'CityRoute'} onChange={e => setForm({ ...form, pageType: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                      <option value="CityRoute">City Route</option>
                      <option value="CityHotel">City Hotel</option>
                      <option value="CityBus">City Bus</option>
                      <option value="CityPackage">City Package</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1">Origin</label>
                    <input type="text" value={(form as any).origin || ''} onChange={e => setForm({ ...form, origin: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1">Destination</label>
                    <input type="text" value={(form as any).destination || ''} onChange={e => setForm({ ...form, destination: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Body * (HTML)</label>
                <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500 font-mono" rows={8} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Excerpt</label>
                  <textarea value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" rows={2} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Hero Image URL</label>
                  <input type="text" value={form.heroImageUrl} onChange={e => setForm({ ...form, heroImageUrl: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
              </div>

              {editType === 'blog' && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1">Author</label>
                    <input type="text" value={form.authorName} onChange={e => setForm({ ...form, authorName: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1">Category</label>
                    <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1">Tags (comma-separated)</label>
                    <input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>
              )}

              {editType === 'landing' && (
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Category / Vertical</label>
                  <select value={(form as any).category || 'Flight'} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                    <option value="Flight">Flight</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Bus">Bus</option>
                    <option value="Package">Package</option>
                  </select>
                </div>
              )}

              <div className="border-t border-slate-800 pt-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">SEO Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1">Meta Title</label>
                    <input type="text" value={form.metaTitle} onChange={e => setForm({ ...form, metaTitle: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1">Canonical URL</label>
                    <input type="text" value={form.canonicalUrl} onChange={e => setForm({ ...form, canonicalUrl: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-xs text-slate-400 font-medium block mb-1">Meta Description</label>
                  <textarea value={form.metaDescription} onChange={e => setForm({ ...form, metaDescription: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" rows={2} />
                </div>
                <div className="mt-3">
                  <label className="text-xs text-slate-400 font-medium block mb-1">Structured Data (JSON-LD)</label>
                  <textarea value={form.structuredData} onChange={e => setForm({ ...form, structuredData: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500" rows={3} placeholder='{ "@context": "https://schema.org", ... }' />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-sm font-medium transition-colors">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                {submitting ? 'Saving...' : editId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
