import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as categoryService from '../../category/service/category.service.js';
import balluLogo from '../../../assets/ballu-logo.png';
import balluName from '../../../assets/name.png';

const emptyForm = () => ({
  name: '',
  slug: '',
  description: '',
  iconUrl: '',
  sortOrder: '',
  isActive: true,
});

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  const fetchCategories = () => {
    setLoading(true);
    categoryService.getCategories()
      .then(res => setCategories(Array.isArray(res) ? res : (res.data || [])))
      .catch(err => setError(err.response?.data?.message || 'Failed to load categories.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

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

  const startEdit = (cat) => {
    setEditingId(cat.id || cat._id);
    setForm({
      name: cat.name || '',
      slug: cat.slug || '',
      description: cat.description || '',
      iconUrl: cat.iconUrl || '',
      sortOrder: cat.sortOrder ?? '',
      isActive: cat.isActive !== false,
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
      description: form.description || undefined,
      iconUrl: form.iconUrl || undefined,
      sortOrder: form.sortOrder !== '' ? Number(form.sortOrder) : undefined,
      isActive: form.isActive,
    };

    try {
      if (editingId) {
        await categoryService.updateCategory(editingId, payload);
        setFormSuccess('Category updated.');
      } else {
        await categoryService.createCategory(payload);
        setFormSuccess('Category created.');
      }
      cancelEdit();
      fetchCategories();
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
            <div className="text-xs text-gray-400">Categories</div>
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
            className="px-4 py-3 text-sm font-medium text-blue-700 border-b-2 border-blue-700 whitespace-nowrap"
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
            {editingId ? '✏️ Edit Category' : '➕ Add New Category'}
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
                  placeholder="Plumbing"
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
                  placeholder="plumbing"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <input
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-700"
                name="description"
                value={form.description}
                onChange={onChange}
                placeholder="Short description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Icon URL</label>
                <input
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-700"
                  name="iconUrl"
                  value={form.iconUrl}
                  onChange={onChange}
                  placeholder="https://…"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sort Order</label>
                <input
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-700"
                  name="sortOrder"
                  type="number"
                  value={form.sortOrder}
                  onChange={onChange}
                  placeholder="0"
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
                {saving ? '⏳ Saving…' : editingId ? '💾 Update Category' : '➕ Create Category'}
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

        {/* Categories list */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
            <span className="text-lg">⚠️</span> {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading categories…</div>
          </div>
        )}

        {!loading && categories.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-500">No categories yet. Create one above!</p>
          </div>
        )}

        {!loading && categories.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-extrabold text-gray-900">
                All Categories <span className="text-gray-400 font-normal">({categories.length})</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Slug</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Description</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Order</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Active</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.map(cat => (
                    <tr key={cat.id || cat._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3 text-gray-900 font-medium">{cat.name}</td>
                      <td className="px-6 py-3">
                        <code className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-mono">
                          {cat.slug}
                        </code>
                      </td>
                      <td className="px-6 py-3 text-gray-600 text-sm">{cat.description || '—'}</td>
                      <td className="px-6 py-3 text-gray-600">{cat.sortOrder ?? '—'}</td>
                      <td className="px-6 py-3">
                        {cat.isActive !== false ? (
                          <span className="text-green-600 font-semibold">✓</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => startEdit(cat)}
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
