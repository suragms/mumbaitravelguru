'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { User, Phone, MapPin, Plus, Pencil, Trash2, ArrowLeft, LogOut } from 'lucide-react';

interface SavedTravelerDto {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  passportNumber: string | null;
  frequentFlyerNumber: string | null;
  nationality: string | null;
  isPrimary: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [travelers, setTravelers] = useState<SavedTravelerDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SavedTravelerDto | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    gender: '',
    passportNumber: '',
    nationality: '',
    isPrimary: false,
  });

  useEffect(() => {
    loadTravelers();
  }, []);

  const loadTravelers = async () => {
    try {
      const data = await apiRequest<SavedTravelerDto[]>('/api/v1/savedtravelers');
      setTravelers(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const resetForm = () => {
    setForm({ firstName: '', lastName: '', phoneNumber: '', gender: '', passportNumber: '', nationality: '', isPrimary: false });
    setEditing(null);
    setShowForm(false);
  };

  const openEdit = (t: SavedTravelerDto) => {
    setForm({
      firstName: t.firstName,
      lastName: t.lastName,
      phoneNumber: t.phoneNumber || '',
      gender: t.gender || '',
      passportNumber: t.passportNumber || '',
      nationality: t.nationality || '',
      isPrimary: t.isPrimary,
    });
    setEditing(t);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await apiRequest<SavedTravelerDto>(`/api/v1/savedtravelers/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...form, id: editing.id }),
        });
      } else {
        await apiRequest<SavedTravelerDto>('/api/v1/savedtravelers', {
          method: 'POST',
          body: JSON.stringify(form),
        });
      }
      resetForm();
      await loadTravelers();
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this traveler?')) return;
    try {
      await apiRequest(`/api/v1/savedtravelers/${id}`, { method: 'DELETE' });
      await loadTravelers();
    } catch { /* ignore */ }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950">
        <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/')} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-white">My Profile</h1>
            </div>
            <button onClick={handleLogout} className="min-h-[44px] flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors px-2">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          {user && (
            <div className="metal-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Account Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-slate-300">
                  <User className="w-5 h-5 text-indigo-400" />
                  <span>{user.firstName} {user.lastName}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <MapPin className="w-5 h-5 text-indigo-400" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <Phone className="w-5 h-5 text-indigo-400" />
                  <span>{user.phoneNumber || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <span className="text-xs uppercase tracking-wider text-slate-500">Roles:</span>
                  <span>{user.roles.join(', ')}</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Saved Travelers</h2>
              <button
                onClick={() => { resetForm(); setShowForm(true); }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Traveler
              </button>
            </div>

            {loading ? (
              <div className="text-center text-slate-500 py-8">Loading...</div>
            ) : travelers.length === 0 ? (
              <div className="text-center text-slate-500 py-8 metal-card rounded-2xl">
                <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No saved travelers yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {travelers.map(t => (
                  <div key={t.id} className="metal-card rounded-xl p-5 relative group">
                    {t.isPrimary && (
                      <span className="absolute top-3 right-3 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">Primary</span>
                    )}
                    <h3 className="font-medium text-white mb-2">{t.firstName} {t.lastName}</h3>
                    <div className="space-y-1 text-sm text-slate-400">
                      {t.phoneNumber && <p>📞 {t.phoneNumber}</p>}
                      {t.nationality && <p>🌍 {t.nationality}</p>}
                      {t.passportNumber && <p>🛂 {t.passportNumber}</p>}
                      {t.gender && <p>⚤ {t.gender}</p>}
                    </div>
                    <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(t)} className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showForm && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={resetForm}>
              <div className="metal-card rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold text-white mb-4">{editing ? 'Edit Traveler' : 'Add Traveler'}</h3>
                <form onSubmit={handleSave} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">First Name</label>
                      <input type="text" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500" required />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Last Name</label>
                      <input type="text" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Phone</label>
                    <input type="tel" value={form.phoneNumber} onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Gender</label>
                      <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500">
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Nationality</label>
                      <input type="text" value={form.nationality} onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Passport Number</label>
                    <input type="text" value={form.passportNumber} onChange={e => setForm(f => ({ ...f, passportNumber: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={form.isPrimary} onChange={e => setForm(f => ({ ...f, isPrimary: e.target.checked }))}
                      className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500" />
                    Set as primary traveler
                  </label>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={saving}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50">
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button type="button" onClick={resetForm}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-medium transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
