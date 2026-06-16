import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext.jsx';
import * as cityService from '../../city/service/city.service.js';
import balluLogo from '../../../assets/ballu-logo.png';
import balluName from '../../../assets/name.png';

const emptyForm = () => ({
  name: '',
  slug: '',
  state: '',
  country: 'India',
  latitude: '',
  longitude: '',
  isActive: true,
});

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function AdminCities() {
  const { user } = useAuth();
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  const fetchCities = () => {
    setLoading(true);
    cityService.getCities()
      .then(res => setCities(Array.isArray(res) ? res : (res.data || [])))
      .catch(err => setError(err.response?.data?.message || 'Failed to load cities.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCities(); }, []);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newVal = type === 'checkbox' ? checked : value;
    setForm(f => {
      const updated = { ...f, [name]: newVal };
      if (name === 'name' && !editingId) {
        updated.slug = slugify(value);
      }
      return updated;
    });
  };

  const startEdit = (city) => {
    setEditingId(city.id || city._id);
    const coords = city.geo?.coordinates || [];
    setForm({
      name: city.name || '',
      slug: city.slug || '',
      state: city.state || '',
      country: city.country || 'India',
      latitude: coords[1] ?? '',
      longitude: coords[0] ?? '',
      isActive: city.isActive !== false,
    });
    setFormError(null);
    setFormSuccess(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
    setFormSuccess(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    setFormSuccess(null);

    const payload = {
      name: form.name,
      slug: form.slug,
      state: form.state || undefined,
      country: form.country || 'India',
      isActive: form.isActive,
    };

    if (form.latitude !== '' && form.longitude !== '') {
      payload.geo = {
        type: 'Point',
        coordinates: [Number(form.longitude), Number(form.latitude)],
      };
    }

    try {
      if (editingId) {
        await cityService.updateCity(editingId, payload);
        setFormSuccess('City updated.');
      } else {
        await cityService.createCity(payload);
        setFormSuccess('City created.');
      }
      cancelEdit();
      fetchCities();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

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
            <div className="text-xs text-gray-400">Cities</div>
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
            className="px-4 py-3 text-sm font-medium text-blue-700 border-b-2 border-blue-700 whitespace-nowrap"
          >
            🏙️ Cities
          </Link>
          <Link
            to="/admin/contractors"
            className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap"
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
        {/* Form section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">
            {editingId ? '✏️ Edit City' : '➕ Add New City'}
          </h2>

          {formSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
              <span className="text-lg">✓</span> {formSuccess}
            </div>
          )}
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
              <span className="text-lg">⚠️</span> {formError}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-700"
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  required
                  placeholder="Mumbai"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-700"
                  name="slug"
                  value={form.slug}
                  onChange={onChange}
                  required
                  placeholder="mumbai"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                <input
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-700"
                  name="state"
                  value={form.state}
                  onChange={onChange}
                  placeholder="Maharashtra"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                <input
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-700"
                  name="country"
                  value={form.country}
                  onChange={onChange}
                  placeholder="India"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Latitude</label>
                <input
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-700"
                  name="latitude"
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={onChange}
                  placeholder="19.0760"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Longitude</label>
                <input
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-700"
                  name="longitude"
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={onChange}
                  placeholder="72.8777"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={onChange}
                className="w-4 h-4 accent-blue-700"
              />
              <span className="text-sm font-semibold text-gray-700">Active</span>
            </label>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-8 py-3 rounded-xl text-sm disabled:opacity-60 transition"
              >
                {saving ? '⏳ Saving…' : editingId ? '💾 Update City' : '➕ Create City'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl text-sm transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Cities list */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
            <span className="text-lg">⚠️</span> {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading cities…</div>
          </div>
        )}

        {!loading && cities.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-500">No cities yet. Create one above!</p>
          </div>
        )}

        {!loading && cities.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-extrabold text-gray-900">
                All Cities <span className="text-gray-400 font-normal">({cities.length})</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Slug</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">State</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Country</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Active</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cities.map(city => (
                    <tr key={city.id || city._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3 text-gray-900 font-medium">{city.name}</td>
                      <td className="px-6 py-3">
                        <code className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-mono">
                          {city.slug}
                        </code>
                      </td>
                      <td className="px-6 py-3 text-gray-600">{city.state || '—'}</td>
                      <td className="px-6 py-3 text-gray-600">{city.country || '—'}</td>
                      <td className="px-6 py-3">
                        {city.isActive !== false ? (
                          <span className="text-green-600 font-semibold">✓</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => startEdit(city)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
