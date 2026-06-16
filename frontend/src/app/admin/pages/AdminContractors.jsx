import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext.jsx';
import * as contractorService from '../../contractor/service/contractor.service.js';
import * as cityService from '../../city/service/city.service.js';
import balluLogo from '../../../assets/ballu-logo.png';
import balluName from '../../../assets/name.png';
import React from 'react';

const BADGES = ['NONE', 'BRONZE', 'SILVER', 'GOLD'];
const PLAN_TIERS = ['STARTER', 'GROWTH', 'ELITE'];
const PAGE_SIZE = 20;

const emptyFilters = () => ({ cityId: '', badge: '', currentPlanTier: '' });

export default function AdminContractors() {
  const { user } = useAuth();
  const [contractors, setContractors] = useState([]);
  const [cities, setCities] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(emptyFilters());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ badge: '', isFeatured: false, featuredUntil: '', currentPlanTier: '' });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editSuccess, setEditSuccess] = useState(null);

  const fetchCities = () => {
    cityService.getCities()
      .then(res => setCities(Array.isArray(res) ? res : (res.data || [])))
      .catch(() => {});
  };

  const fetchContractors = (pg = 1, f = filters) => {
    setLoading(true);
    setError(null);
    const params = { limit: PAGE_SIZE, page: pg };
    if (f.cityId) params.cityId = f.cityId;
    if (f.badge) params.badge = f.badge;
    if (f.currentPlanTier) params.currentPlanTier = f.currentPlanTier;

    contractorService.getAdminContractors(params)
      .then(res => {
        const items = Array.isArray(res) ? res : (res.data || []);
        const meta = res.meta || {};
        setContractors(items);
        setTotal(meta.total || meta.totalResults || items.length);
      })
      .catch(err => setError(err.response?.data?.message || 'Failed to load contractors.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCities();
    fetchContractors(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(f => ({ ...f, [name]: value }));
  };

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchContractors(1, filters);
  };

  const onPage = (pg) => {
    setPage(pg);
    fetchContractors(pg);
  };

  const startEdit = (c) => {
    setEditingId(c.id || c._id || c.userId);
    setEditForm({
      badge: c.badge || c.badgeTier || 'NONE',
      isFeatured: !!c.isFeatured,
      featuredUntil: c.featuredUntil ? c.featuredUntil.slice(0, 10) : '',
      currentPlanTier: c.currentPlanTier || 'STARTER',
    });
    setEditError(null);
    setEditSuccess(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError(null);
    setEditSuccess(null);
  };

  const onEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const onSaveEdit = async () => {
    setSaving(true);
    setEditError(null);
    setEditSuccess(null);
    const payload = {
      badge: editForm.badge,
      isFeatured: editForm.isFeatured,
      featuredUntil: editForm.featuredUntil || undefined,
      currentPlanTier: editForm.currentPlanTier,
    };
    try {
      await contractorService.adminUpdateContractor(editingId, payload);
      setEditSuccess('Updated.');
      fetchContractors(page);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={balluLogo} alt="Ballu" className="h-10 w-auto" />
            <img src={balluName} alt="Ballu Thekedar" className="h-12 w-auto" />
          </Link>
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900">Admin Panel</div>
            <div className="text-xs text-gray-400">Contractors</div>
          </div>
        </div>
      </header>

      {/* Navigation tabs */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 flex gap-1 overflow-x-auto">
          <Link
            to="/admin/home"
            className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap"
          >
            👥 Users
          </Link>
          <Link
            to="/admin/categories"
            className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap"
          >
            🏷️ Categories
          </Link>
          <Link
            to="/admin/cities"
            className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap"
          >
            🏙️ Cities
          </Link>
          <Link
            to="/admin/contractors"
            className="px-4 py-3 text-sm font-medium text-blue-700 border-b-2 border-blue-700 whitespace-nowrap"
          >
            👷 Contractors
          </Link>
          <Link
            to="/admin/settings"
            className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap"
          >
            ⚙️ Settings
          </Link>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-1">
        {/* Filter section */}
        <form onSubmit={onSearch} className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-extrabold text-gray-900 mb-4">🔍 Filter Contractors</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
              <select
                name="cityId"
                value={filters.cityId}
                onChange={onFilterChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-700"
              >
                <option value="">All Cities</option>
                {cities.map(c => (
                  <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Badge</label>
              <select
                name="badge"
                value={filters.badge}
                onChange={onFilterChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-700"
              >
                <option value="">Any Badge</option>
                {BADGES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Plan</label>
              <select
                name="currentPlanTier"
                value={filters.currentPlanTier}
                onChange={onFilterChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-700"
              >
                <option value="">Any Plan</option>
                {PLAN_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold px-6 py-3 rounded-xl text-sm transition"
              >
                🔍 Filter
              </button>
            </div>
          </div>
        </form>

        {/* Error alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
            <span className="text-lg">⚠️</span> {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading contractors…</div>
          </div>
        )}

        {/* Empty state */}
        {!loading && contractors.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-500">No contractors found. Try adjusting your filters.</p>
          </div>
        )}

        {/* Table */}
        {!loading && contractors.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-extrabold text-gray-900">
                All Contractors <span className="text-gray-400 font-normal">({total})</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Business Name</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">City</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Badge</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Plan</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Available</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Score</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Complete</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {contractors.map(c => {
                    const id = c.id || c._id || c.userId;
                    const isEditing = editingId === id;
                    return (
                      <React.Fragment key={id}>
                        <tr className="hover:bg-gray-50 transition">
                          <td className="px-6 py-3 text-gray-900 font-medium">{c.businessName || '—'}</td>
                          <td className="px-6 py-3 text-gray-600">{c.city?.name || c.city || '—'}</td>
                          <td className="px-6 py-3">
                            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                              {c.badge || c.badgeTier || 'NONE'}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                              {c.currentPlanTier || '—'}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            {c.isAvailable ? (
                              <span className="text-green-600 font-semibold">✓ Yes</span>
                            ) : (
                              <span className="text-gray-400">No</span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-gray-600">{c.rankingScore != null ? Number(c.rankingScore).toFixed(2) : '—'}</td>
                          <td className="px-6 py-3 text-gray-600">{c.profileCompleteness != null ? `${c.profileCompleteness}%` : '—'}</td>
                          <td className="px-6 py-3 text-right">
                            {isEditing ? (
                              <button
                                onClick={cancelEdit}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                              >
                                Cancel
                              </button>
                            ) : (
                              <button
                                onClick={() => startEdit(c)}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                              >
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                        {isEditing && (
                          <tr className="bg-blue-50 border-b border-blue-100">
                            <td colSpan={8} className="px-6 py-4">
                              <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900 mb-4">Edit Contractor</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Badge</label>
                                    <select
                                      name="badge"
                                      value={editForm.badge}
                                      onChange={onEditChange}
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                                    >
                                      {BADGES.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Plan Tier</label>
                                    <select
                                      name="currentPlanTier"
                                      value={editForm.currentPlanTier}
                                      onChange={onEditChange}
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                                    >
                                      {PLAN_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Featured Until</label>
                                    <input
                                      type="date"
                                      name="featuredUntil"
                                      value={editForm.featuredUntil}
                                      onChange={onEditChange}
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                                    />
                                  </div>
                                  <div className="flex items-end">
                                    <label className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-white cursor-pointer transition w-full">
                                      <input
                                        type="checkbox"
                                        name="isFeatured"
                                        checked={editForm.isFeatured}
                                        onChange={onEditChange}
                                        className="w-4 h-4 accent-blue-700"
                                      />
                                      <span className="text-sm font-semibold text-gray-700">Featured</span>
                                    </label>
                                  </div>
                                </div>
                                <div className="flex gap-3">
                                  <button
                                    onClick={onSaveEdit}
                                    disabled={saving}
                                    className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-6 py-2 rounded-lg text-sm disabled:opacity-60 transition"
                                  >
                                    {saving ? '⏳ Saving…' : '💾 Save Changes'}
                                  </button>
                                  {editError && <span className="text-red-600 text-sm font-semibold">{editError}</span>}
                                  {editSuccess && <span className="text-green-600 text-sm font-semibold">✓ {editSuccess}</span>}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex gap-2 flex-wrap">
                <button
                  disabled={page === 1}
                  onClick={() => onPage(page - 1)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    page === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                  <button
                    key={pg}
                    onClick={() => onPage(pg)}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                      pg === page
                        ? 'bg-blue-700 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {pg}
                  </button>
                ))}
                <button
                  disabled={page === totalPages}
                  onClick={() => onPage(page + 1)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    page === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-8">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <img src={balluLogo} alt="Ballu" className="h-8 w-8 rounded-full bg-white p-0.5" />
            <span className="font-bold">Ballu Thekedar Admin</span>
          </div>
          <div className="text-gray-400 text-xs">© {new Date().getFullYear()} Ballu Thekedar.</div>
        </div>
      </footer>
    </div>
  );
}
