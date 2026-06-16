import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as contractorService from '../service/contractor.service.js';
import * as categoryService from '../../category/service/category.service.js';
import * as cityService from '../../city/service/city.service.js';
import balluLogo from '../../../assets/ballu-logo.png';
import balluName from '../../../assets/name.png';

const BADGE_EMOJI = { BRONZE: '🥉', SILVER: '🥈', GOLD: '🥇' };

function ContractorCard({ contractor }) {
  const badge = contractor.badge || contractor.badgeTier;
  const rating = contractor.avgRating ? Number(contractor.avgRating).toFixed(1) : 'New';

  return (
    <Link
      to={`/contractors/${contractor.slug}`}
      className="block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-blue-300 transition"
    >
      {contractor.profilePhotoUrl ? (
        <img
          src={contractor.profilePhotoUrl}
          alt={contractor.businessName}
          className="w-full h-40 object-cover"
        />
      ) : (
        <div className="w-full h-40 bg-gradient-to-br from-blue-100 to-yellow-100 flex items-center justify-center text-4xl">
          👷
        </div>
      )}

      <div className="p-4">
        <h3 className="font-bold text-gray-900 truncate">{contractor.businessName || 'Unnamed Contractor'}</h3>

        {badge && badge !== 'NONE' && (
          <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-bold mt-1 mb-2">
            {BADGE_EMOJI[badge]} {badge}
          </span>
        )}

        <div className="text-xs text-gray-600 space-y-1 mb-3">
          {contractor.city && <div>📍 {contractor.city.name || contractor.city}</div>}
          {contractor.primaryCategory && <div>🔧 {contractor.primaryCategory.name || contractor.primaryCategory}</div>}
        </div>

        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-900">
            ★ {rating}
          </span>
          {contractor.totalReviews > 0 && (
            <span className="text-xs text-gray-500">({contractor.totalReviews} reviews)</span>
          )}
        </div>

        {contractor.profileCompleteness != null && (
          <div className="mb-3">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
              <div
                className="h-full bg-blue-700 rounded-full transition-all"
                style={{ width: `${contractor.profileCompleteness}%` }}
              />
            </div>
            <small className="text-xs text-gray-500">{contractor.profileCompleteness}% complete</small>
          </div>
        )}

        <button className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 rounded-lg text-sm transition">
          View Profile
        </button>
      </div>
    </Link>
  );
}

export default function ContractorSearch() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    categorySlug: searchParams.get('categorySlug') || '',
    citySlug: searchParams.get('citySlug') || '',
    badge: '',
    minRating: '',
  });

  const hasSearched = useRef(false);

  useEffect(() => {
    Promise.all([categoryService.getCategories(), cityService.getCities()])
      .then(([catRes, cityRes]) => {
        setCategories(Array.isArray(catRes) ? catRes : (catRes.data || []));
        setCities(Array.isArray(cityRes) ? cityRes : (cityRes.data || []));
      })
      .catch(() => {})
      .finally(() => setLoadingFilters(false));
  }, []);

  const doSearch = async (cursor = null, append = false, filtersToUse = null) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);

    const activeFilters = filtersToUse || filters;
    const params = {};
    if (activeFilters.categorySlug) params.categorySlug = activeFilters.categorySlug;
    if (activeFilters.citySlug) params.citySlug = activeFilters.citySlug;
    if (activeFilters.badge) params.badge = activeFilters.badge;
    if (activeFilters.minRating) params.minRating = activeFilters.minRating;
    if (cursor) params.cursor = cursor;

    try {
      const res = await contractorService.searchContractors(params);
      const items = Array.isArray(res) ? res : (res.data || []);
      const meta = res.meta || {};
      if (append) {
        setContractors(prev => [...prev, ...items]);
      } else {
        setContractors(items);
      }
      setNextCursor(meta.nextCursor || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load contractors.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!hasSearched.current) {
      hasSearched.current = true;
      doSearch(null, false, filters);
    }
  }, []);

  useEffect(() => {
    if (hasSearched.current) {
      setNextCursor(null);
      doSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.categorySlug, filters.citySlug, filters.badge, filters.minRating]);

  const onSearch = (e) => {
    e.preventDefault();
    const p = {};
    if (filters.categorySlug) p.categorySlug = filters.categorySlug;
    if (filters.citySlug) p.citySlug = filters.citySlug;
    setSearchParams(p);
    doSearch();
  };

  const onChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={balluLogo} alt="Ballu" className="h-10 w-auto" />
            <img src={balluName} alt="Ballu Thekedar" className="h-12 w-auto" />
          </Link>
          <div className="flex-1" />
          <Link to="/" className="text-sm text-gray-500 hover:text-blue-700 font-medium">
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-1">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Find Contractors</h1>
          <p className="text-gray-600 mt-1">Browse and filter verified contractors near you</p>
        </div>

        {/* Filter form */}
        <form onSubmit={onSearch} className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Category</label>
              <select
                name="categorySlug"
                value={filters.categorySlug}
                onChange={onChange}
                disabled={loadingFilters}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50"
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.id || c._id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">City</label>
              <select
                name="citySlug"
                value={filters.citySlug}
                onChange={onChange}
                disabled={loadingFilters}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50"
              >
                <option value="">All Cities</option>
                {cities.map(c => (
                  <option key={c.id || c._id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Badge</label>
              <select
                name="badge"
                value={filters.badge}
                onChange={onChange}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-700"
              >
                <option value="">Any Badge</option>
                <option value="BRONZE">🥉 Bronze</option>
                <option value="SILVER">🥈 Silver</option>
                <option value="GOLD">🥇 Gold</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Min Rating</label>
              <select
                name="minRating"
                value={filters.minRating}
                onChange={onChange}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-700"
              >
                <option value="">Any Rating</option>
                <option value="1">★ 1+</option>
                <option value="2">★★ 2+</option>
                <option value="3">★★★ 3+</option>
                <option value="4">★★★★ 4+</option>
                <option value="5">★★★★★ 5</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || loadingFilters}
              className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-xl text-sm disabled:opacity-60 transition"
            >
              {loading ? '🔍 Searching…' : '🔍 Search'}
            </button>
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
          <div className="text-center py-16">
            <div className="animate-spin text-4xl mb-4">🔄</div>
            <p className="text-gray-500">Loading contractors…</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && contractors.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No contractors found</h3>
            <p className="text-gray-600">Try adjusting your filters or searching a different category.</p>
          </div>
        )}

        {/* Results grid */}
        {!loading && contractors.length > 0 && (
          <>
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Found <span className="font-bold text-gray-900">{contractors.length}</span> contractor{contractors.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {contractors.map(c => (
                <ContractorCard key={c.id || c._id} contractor={c} />
              ))}
            </div>

            {nextCursor && (
              <div className="text-center pb-8">
                <button
                  onClick={() => doSearch(nextCursor, true)}
                  disabled={loadingMore}
                  className="bg-white border border-gray-200 hover:border-blue-700 hover:text-blue-700 text-gray-700 font-semibold px-8 py-3 rounded-full text-sm transition disabled:opacity-50"
                >
                  {loadingMore ? '🔄 Loading…' : '📥 Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-blue-700 text-white mt-12">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div className="col-span-2 md:col-span-1">
            <img src={balluLogo} alt="Ballu" className="h-14 w-14 rounded-full bg-white p-0.5 mb-3" />
            <p className="text-xs text-blue-200 leading-relaxed">
              Ghar ka kaam, aasaan. India's trusted contractor marketplace.
            </p>
          </div>
          <div>
            <div className="font-bold text-white mb-3">Services</div>
            <ul className="space-y-2 text-xs text-white">
              <li><Link to="/" className="!text-white hover:!text-yellow-300">All Categories</Link></li>
              <li><Link to="/" className="!text-white hover:!text-yellow-300">Find Contractors</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-white mb-3">Help</div>
            <ul className="space-y-2 text-xs text-white">
              <li>📞 1800-BALLU-99</li>
              <li>📍 Serving 40+ Cities</li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-white mb-3">Account</div>
            <ul className="space-y-2 text-xs text-white">
              <li><Link to="/client/login" className="!text-white hover:!text-yellow-300">Client Login</Link></li>
              <li><Link to="/contractor/login" className="!text-white hover:!text-yellow-300">Contractor Login</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-blue-600 py-4 text-center text-xs text-blue-200">
          © {new Date().getFullYear()} Ballu Thekedar. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
