'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { Tag, Plus, Search, X, AlertCircle, CheckCircle, Power, ExternalLink, Filter } from 'lucide-react';

interface CouponItem {
  id: string;
  code: string;
  type: string;
  value: number;
  maxDiscountAmount: number | null;
  minBookingValue: number;
  applicableVerticals: string;
  validFrom: string;
  validTo: string;
  maxUsageCount: number | null;
  maxUsagePerUser: number | null;
  currentUsageCount: number;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string | null;
}

interface CouponListResult {
  items: CouponItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

interface CreateCouponResult { succeeded: boolean; error?: string; couponId?: string; }
interface UpdateCouponResult { succeeded: boolean; error?: string; }
interface DeactivateCouponResult { succeeded: boolean; error?: string; }

const verticalOptions = ['Flight', 'Hotel', 'Bus', 'Cab', 'Package'];

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const defaultForm = {
  code: '', type: 'Percentage', value: 0, maxDiscountAmount: null as number | null,
  minBookingValue: 0, applicableVerticals: 'Flight,Hotel,Bus,Package',
  validFrom: '', validTo: '', maxUsageCount: null as number | null,
  maxUsagePerUser: null as number | null, description: '',
};

export default function AdminCouponsPage() {
  const [data, setData] = useState<CouponListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetch = async (p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterActive !== 'all') params.set('isActive', filterActive);
      params.set('page', String(p));
      params.set('pageSize', '20');
      const d = await apiRequest<CouponListResult>(`/api/v1/admin/coupons?${params}`);
      setData(d);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetch(page); }, [page, filterActive]);
  useEffect(() => { const t = setTimeout(() => { setPage(1); fetch(1); }, 300); return () => clearTimeout(t); }, [search]);

  const totalPages = data ? Math.ceil(data.totalCount / data.pageSize) : 0;

  const openCreate = () => {
    setEditId(null);
    setForm({
      ...defaultForm,
      validFrom: new Date().toISOString().slice(0, 16),
      validTo: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16),
    });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (item: CouponItem) => {
    setEditId(item.id);
    setForm({
      code: item.code,
      type: item.type,
      value: item.value,
      maxDiscountAmount: item.maxDiscountAmount,
      minBookingValue: item.minBookingValue,
      applicableVerticals: item.applicableVerticals,
      validFrom: item.validFrom.slice(0, 16),
      validTo: item.validTo.slice(0, 16),
      maxUsageCount: item.maxUsageCount,
      maxUsagePerUser: item.maxUsagePerUser,
      description: item.description || '',
    });
    setFormError('');
    setShowModal(true);
  };

  const toggleVertical = (v: string) => {
    const current = form.applicableVerticals.split(',').map(s => s.trim()).filter(Boolean);
    const set = new Set(current);
    if (set.has(v)) set.delete(v); else set.add(v);
    setForm({ ...form, applicableVerticals: Array.from(set).join(',') });
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!form.code.trim()) { setFormError('Code is required.'); return; }
    if (form.value <= 0) { setFormError('Value must be greater than 0.'); return; }
    if (!form.applicableVerticals) { setFormError('Select at least one vertical.'); return; }
    if (!form.validFrom || !form.validTo) { setFormError('Valid dates are required.'); return; }
    if (new Date(form.validTo) <= new Date(form.validFrom)) { setFormError('Valid To must be after Valid From.'); return; }

    setSubmitting(true);
    try {
      if (editId) {
        const body: Record<string, unknown> = {};
        if (form.code !== data?.items.find(i => i.id === editId)?.code) body.code = form.code;
        body.type = form.type;
        body.value = form.value;
        body.maxDiscountAmount = form.maxDiscountAmount;
        body.minBookingValue = form.minBookingValue;
        body.applicableVerticals = form.applicableVerticals;
        body.validFrom = form.validFrom;
        body.validTo = form.validTo;
        body.maxUsageCount = form.maxUsageCount;
        body.maxUsagePerUser = form.maxUsagePerUser;
        body.description = form.description;
        const result = await apiRequest<UpdateCouponResult>(`/api/v1/admin/coupons/${editId}`, {
          method: 'PUT', body: JSON.stringify(body),
        });
        if (!result.succeeded) { setFormError(result.error || 'Update failed.'); return; }
      } else {
        const result = await apiRequest<CreateCouponResult>('/api/v1/admin/coupons', {
          method: 'POST',
          body: JSON.stringify({
            ...form,
            validFrom: new Date(form.validFrom).toISOString(),
            validTo: new Date(form.validTo).toISOString(),
          }),
        });
        if (!result.succeeded) { setFormError(result.error || 'Creation failed.'); return; }
      }
      setShowModal(false);
      fetch(page);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Operation failed.');
    }
    setSubmitting(false);
  };

  const deactivateCoupon = async (id: string) => {
    if (!confirm('Deactivate this coupon? It will no longer be usable.')) return;
    try {
      const result = await apiRequest<DeactivateCouponResult>(`/api/v1/admin/coupons/${id}/deactivate`, { method: 'POST' });
      if (!result.succeeded) { alert(result.error || 'Deactivation failed.'); return; }
      fetch(page);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Deactivation failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Tag className="w-6 h-6 text-indigo-400" /> Coupons
        </h1>
        <button onClick={openCreate}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by code..." className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X className="w-3 h-3" /></button>}
        </div>
        <select value={filterActive} onChange={e => setFilterActive(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500">
          <option value="all">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/80 border-b border-slate-800 text-xs text-slate-400 uppercase font-semibold tracking-wider">
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Value</th>
              <th className="py-3 px-4">Verticals</th>
              <th className="py-3 px-4">Valid</th>
              <th className="py-3 px-4">Usage</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-sm">
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center text-slate-500">Loading...</td></tr>
            ) : data?.items.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-slate-500">No coupons found.</td></tr>
            ) : data?.items.map(item => (
              <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                <td className="py-3 px-4">
                  <span className="font-mono font-bold text-white">{item.code}</span>
                  {item.description && <div className="text-xs text-slate-500 mt-0.5">{item.description}</div>}
                </td>
                <td className="py-3 px-4">
                  <span className="text-white font-medium">
                    {item.type === 'Percentage' ? `${item.value}%` : `₹${item.value}`}
                  </span>
                  {item.maxDiscountAmount && item.type === 'Percentage' && (
                    <div className="text-xs text-slate-500">Max ₹{item.maxDiscountAmount}</div>
                  )}
                  <div className="text-xs text-slate-500">Min: ₹{item.minBookingValue}</div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {item.applicableVerticals.split(',').map(v => (
                      <span key={v} className="text-xs bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">{v.trim()}</span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4 text-xs text-slate-400">
                  <div>{fmtDate(item.validFrom)}</div>
                  <div>to {fmtDate(item.validTo)}</div>
                </td>
                <td className="py-3 px-4 text-sm">
                  <span className="text-white">{item.currentUsageCount}</span>
                  {item.maxUsageCount && <span className="text-slate-500"> / {item.maxUsageCount}</span>}
                  {item.maxUsagePerUser && <div className="text-xs text-slate-500">{item.maxUsagePerUser} per user</div>}
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${item.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                    {item.isActive ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    {item.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(item)}
                      className="text-slate-400 hover:text-indigo-400 text-xs font-medium transition-colors">
                      Edit
                    </button>
                    {item.isActive && (
                      <button onClick={() => deactivateCoupon(item.id)}
                        className="text-slate-400 hover:text-rose-400 text-xs font-medium transition-colors flex items-center gap-1">
                        <Power className="w-3 h-3" /> Deactivate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{editId ? 'Edit Coupon' : 'Create Coupon'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {formError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Coupon Code *</label>
                <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono" placeholder="WELCOME10" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Discount Type *</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Flat">Flat (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Value *</label>
                  <input type="number" min="1" value={form.value || ''} onChange={e => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
              </div>

              {form.type === 'Percentage' && (
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Max Discount Amount (leave empty for no cap)</label>
                  <input type="number" min="0" value={form.maxDiscountAmount ?? ''} onChange={e => setForm({ ...form, maxDiscountAmount: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
              )}

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Min Booking Value (₹)</label>
                <input type="number" min="0" value={form.minBookingValue || ''} onChange={e => setForm({ ...form, minBookingValue: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Applicable Verticals</label>
                <div className="flex flex-wrap gap-2">
                  {verticalOptions.map(v => {
                    const selected = form.applicableVerticals.split(',').map(s => s.trim()).includes(v);
                    return (
                      <button key={v} type="button" onClick={() => toggleVertical(v)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${selected ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'}`}>
                        {v}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Valid From *</label>
                  <input type="datetime-local" value={form.validFrom} onChange={e => setForm({ ...form, validFrom: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Valid To *</label>
                  <input type="datetime-local" value={form.validTo} onChange={e => setForm({ ...form, validTo: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Max Total Uses</label>
                  <input type="number" min="0" value={form.maxUsageCount ?? ''} onChange={e => setForm({ ...form, maxUsageCount: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="Unlimited" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Max Uses Per User</label>
                  <input type="number" min="0" value={form.maxUsagePerUser ?? ''} onChange={e => setForm({ ...form, maxUsagePerUser: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="Unlimited" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" rows={2} />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-sm font-medium transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                {submitting ? 'Saving...' : editId ? 'Update Coupon' : 'Create Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
