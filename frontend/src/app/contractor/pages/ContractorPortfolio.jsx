import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext.jsx';
import * as contractorService from '../service/contractor.service.js';
import balluLogo from '../../../assets/ballu-logo.png';
import balluName from '../../../assets/name.png';

const MAX_ITEMS = 30;

export default function ContractorPortfolio() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [addForm, setAddForm]     = useState({ imageUrl: '', caption: '' });
  const [adding, setAdding]       = useState(false);
  const [addError, setAddError]   = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchPortfolio = () => {
    setLoading(true);
    contractorService.getMyProfile()
      .then(res => setItems((res.data || res).portfolioItems || []))
      .catch(err => setError(err.response?.data?.message || 'Failed to load portfolio.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPortfolio(); }, []);

  const onAddChange = (e) => setAddForm({ ...addForm, [e.target.name]: e.target.value });

  const onAdd = async (e) => {
    e.preventDefault();
    if (!addForm.imageUrl.trim()) { setAddError('Image URL is required.'); return; }
    setAdding(true);
    setAddError(null);
    try {
      await contractorService.addPortfolioItem(addForm);
      setAddForm({ imageUrl: '', caption: '' });
      fetchPortfolio();
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add item.');
    } finally {
      setAdding(false);
    }
  };

  const onDelete = async (id) => {
    if (!confirm('Remove this portfolio item?')) return;
    setDeletingId(id);
    try {
      await contractorService.deletePortfolioItem(id);
      fetchPortfolio();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete item.');
    } finally {
      setDeletingId(null);
    }
  };

  const onLogout = async () => { await logout(); navigate('/', { replace: true }); };

  const atLimit = items.length >= MAX_ITEMS;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Topbar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={balluLogo} alt="Ballu" className="h-10 w-auto" />
            <img src={balluName} alt="Ballu Thekedar" className="h-12 w-auto" />
          </Link>
          <div className="flex-1" />
          <Link to="/contractor/home" className="text-sm text-gray-500 hover:text-blue-700 font-medium">
            ← Dashboard
          </Link>
          <div className="w-9 h-9 rounded-full bg-blue-700 flex items-center justify-center font-bold text-white text-sm">
            {user?.name?.[0]?.toUpperCase() || 'C'}
          </div>
          <button onClick={onLogout} className="text-xs text-gray-500 hover:text-red-600 font-medium hidden sm:block">
            Logout
          </button>
        </div>
      </header>

      {/* Page header */}
      <div className="bg-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs font-bold tracking-wider text-yellow-300 mb-1">CONTRACTOR PORTAL</div>
            <h1 className="text-2xl font-extrabold">My Portfolio</h1>
            <p className="text-sm text-blue-200 mt-1">
              Showcase your best work — {items.length}/{MAX_ITEMS} items added
            </p>
          </div>
          <Link
            to="/contractor/home"
            className="bg-yellow-400 hover:bg-yellow-500 !text-gray-900 font-semibold px-5 py-2 rounded-full text-sm"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8 w-full flex-1">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {/* Add new item */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-extrabold text-gray-900 text-lg">Add New Item</h2>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              atLimit ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {items.length} / {MAX_ITEMS}
            </span>
          </div>

          {atLimit && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-xl px-4 py-3 mb-4">
              You've reached the 30-item limit. Remove an item to add more.
            </div>
          )}

          {addError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
              {addError}
            </div>
          )}

          <form onSubmit={onAdd} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Image URL *</label>
                <input
                  name="imageUrl"
                  value={addForm.imageUrl}
                  onChange={onAddChange}
                  placeholder="https://…"
                  disabled={atLimit}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Caption <span className="font-normal text-gray-400 text-xs">(optional)</span></label>
                <input
                  name="caption"
                  value={addForm.caption}
                  onChange={onAddChange}
                  placeholder="Describe this work…"
                  disabled={atLimit}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50"
                />
              </div>
            </div>

            {addForm.imageUrl && (
              <div>
                <div className="text-xs text-gray-400 mb-1">Preview:</div>
                <img
                  src={addForm.imageUrl}
                  alt="Preview"
                  className="w-32 h-24 object-cover rounded-xl border border-gray-200"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={adding || atLimit}
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-6 py-3 rounded-xl text-sm disabled:opacity-50"
              >
                {adding ? 'Adding…' : '+ Add to Portfolio'}
              </button>
            </div>
          </form>
        </div>

        {/* Portfolio grid */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="w-full h-40 bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-6 bg-gray-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🖼️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No portfolio items yet</h3>
            <p className="text-gray-500 text-sm">Add photos of your best work to attract more clients.</p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-5">
              <div className="text-xs font-bold tracking-wider text-red-600">YOUR WORK</div>
              <h2 className="text-xl font-extrabold text-gray-900">{items.length} Item{items.length !== 1 ? 's' : ''}</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map(item => {
                const id = item.id || item._id;
                return (
                  <div key={id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition flex flex-col">
                    <img
                      src={item.imageUrl}
                      alt={item.caption || 'Portfolio item'}
                      className="w-full h-40 object-cover"
                    />
                    <div className="p-3 flex flex-col flex-1">
                      {item.caption && (
                        <p className="text-xs text-gray-600 flex-1 mb-3">{item.caption}</p>
                      )}
                      <button
                        onClick={() => onDelete(id)}
                        disabled={deletingId === id}
                        className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-1.5 rounded-full text-xs disabled:opacity-50"
                      >
                        {deletingId === id ? 'Removing…' : 'Remove'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-blue-700 text-white mt-6">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <img src={balluLogo} alt="Ballu" className="h-8 w-8 rounded-full bg-white p-0.5" />
            <span className="font-bold">Ballu Thekedar</span>
          </div>
          <div className="text-blue-200 text-xs">© {new Date().getFullYear()} Ballu Thekedar. Ghar ka kaam, aasaan.</div>
          <button onClick={onLogout} className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-4 py-1.5 rounded-full text-xs">
            Logout
          </button>
        </div>
      </footer>
    </div>
  );
}
