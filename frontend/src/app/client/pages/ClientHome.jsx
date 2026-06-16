import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext.jsx';
import * as contractorService from '../../contractor/service/contractor.service.js';
import * as categoryService from '../../category/service/category.service.js';
import * as cityService from '../../city/service/city.service.js';
import * as clientService from '../service/client.service.js';
import balluLogo from '../../../assets/ballu-logo.png';
import balluName from '../../../assets/name.png';

const BADGE_EMOJI = { BRONZE: '🥉', SILVER: '🥈', GOLD: '🥇' };

const QUICK_CATEGORIES = [
  { label: 'Plumbing',   icon: '🔧', slug: 'plumbing' },
  { label: 'Electrical', icon: '⚡', slug: 'electrical' },
  { label: 'Painting',   icon: '🖌️', slug: 'painting' },
  { label: 'Carpentry',  icon: '🪚', slug: 'carpentry' },
  { label: 'AC Repair',  icon: '❄️', slug: 'ac-repair' },
  { label: 'Cleaning',   icon: '🧹', slug: 'cleaning' },
];

function ContractorCard({ contractor }) {
  const badge = contractor.badge || contractor.badgeTier;
  const rating = contractor.avgRating ? Number(contractor.avgRating).toFixed(1) : null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition flex flex-col">
      <div className="relative">
        {contractor.profilePhotoUrl ? (
          <img
            src={contractor.profilePhotoUrl}
            alt={contractor.businessName}
            className="w-full h-44 object-cover"
          />
        ) : (
          <div className="w-full h-44 bg-gradient-to-br from-blue-100 to-yellow-100 flex items-center justify-center">
            <span className="text-5xl">👷</span>
          </div>
        )}
        {contractor.isAvailable && (
          <span className="absolute top-3 left-3 bg-blue-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
            ● Online
          </span>
        )}
        {badge && badge !== 'NONE' && (
          <span className="absolute top-3 right-3 bg-yellow-400 text-gray-900 text-[11px] font-bold px-2 py-1 rounded-full">
            {BADGE_EMOJI[badge]} {badge}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="font-bold text-gray-900 truncate">
          {contractor.businessName || 'Unnamed Contractor'}
        </div>
        <div className="text-xs text-gray-500 mt-0.5 mb-2 flex gap-2 flex-wrap">
          {contractor.city && <span>📍 {contractor.city.name || contractor.city}</span>}
          {contractor.primaryCategory && (
            <span>🔧 {contractor.primaryCategory.name || contractor.primaryCategory}</span>
          )}
        </div>

        <div className="text-sm mb-3">
          {rating ? (
            <>⭐ {rating} <span className="text-gray-400">({contractor.totalReviews || 0} reviews)</span></>
          ) : (
            <span className="text-gray-400 text-xs">No reviews yet</span>
          )}
        </div>

        <Link
          to={`/contractors/${contractor.slug}`}
          className="mt-auto block w-full bg-yellow-400 hover:bg-yellow-500 !text-gray-900 font-semibold py-2 rounded-full text-sm text-center"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}

export default function ClientHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile]             = useState(null);
  const [categories, setCategories]       = useState([]);
  const [cities, setCities]               = useState([]);
  const [contractors, setContractors]     = useState([]);
  const [nextCursor, setNextCursor]       = useState(null);
  const [loadingContractors, setLoadingContractors] = useState(true);
  const [loadingMore, setLoadingMore]     = useState(false);
  const [error, setError]                 = useState(null);

  const [filters, setFilters] = useState({
    categorySlug: '',
    citySlug:     '',
    badge:        '',
    minRating:    '',
    q:            '',
  });
  const [activeCategory, setActiveCategory] = useState('');

  // Load sidebar data and client profile
  useEffect(() => {
    clientService.getMyProfile()
      .then(res => setProfile(res.data || res))
      .catch(() => setProfile(null)); // Gracefully handle missing profile
    Promise.all([categoryService.getCategories(), cityService.getCities()])
      .then(([catRes, cityRes]) => {
        setCategories(Array.isArray(catRes) ? catRes : catRes.data || []);
        setCities(Array.isArray(cityRes) ? cityRes : cityRes.data || []);
      })
      .catch(() => {});
  }, []);

  const fetchContractors = async (overrideFilters = filters, cursor = null, append = false) => {
    if (append) setLoadingMore(true);
    else setLoadingContractors(true);
    setError(null);

    const params = {};
    if (overrideFilters.categorySlug) params.categorySlug = overrideFilters.categorySlug;
    if (overrideFilters.citySlug)     params.citySlug     = overrideFilters.citySlug;
    if (overrideFilters.badge)        params.badge        = overrideFilters.badge;
    if (overrideFilters.minRating)    params.minRating    = overrideFilters.minRating;
    if (overrideFilters.q)            params.q            = overrideFilters.q;
    if (cursor)                       params.cursor       = cursor;

    try {
      const res = await contractorService.searchContractors(params);
      const items = Array.isArray(res) ? res : res.data || [];
      const meta  = res.meta || {};
      setContractors(append ? prev => [...prev, ...items] : items);
      setNextCursor(meta.nextCursor || null);
    } catch {
      setError('Failed to load contractors. Please try again.');
    } finally {
      setLoadingContractors(false);
      setLoadingMore(false);
    }
  };

  // Auto-filter by client's location on initial load
  useEffect(() => {
    if (!profile) return;
    const clientCity = profile?.city || profile?.cityId;
    if (clientCity) {
      const citySlug = clientCity.slug || clientCity.name?.toLowerCase().replace(/\s+/g, '-') || '';
      const updatedFilters = { ...filters, citySlug };
      setFilters(updatedFilters);
      fetchContractors(updatedFilters);
    } else {
      fetchContractors(filters);
    }
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const onFilterChange = (e) => setFilters(f => ({ ...f, [e.target.name]: e.target.value }));

  const onSearch = (e) => {
    e.preventDefault();
    setActiveCategory(filters.categorySlug);
    fetchContractors(filters);
  };

  const onQuickCategory = (slug) => {
    const next = { ...filters, categorySlug: slug };
    setFilters(next);
    setActiveCategory(slug);
    fetchContractors(next);
  };

  const onClearFilters = () => {
    const clientCity = profile?.city || profile?.cityId;
    const clientCitySlug = clientCity?.slug || clientCity?.name?.toLowerCase().replace(/\s+/g, '-') || '';
    const cleared = {
      categorySlug: '',
      citySlug: clientCitySlug,
      badge: '',
      minRating: '',
      q: '',
    };
    setFilters(cleared);
    setActiveCategory('');
    fetchContractors(cleared);
  };

  const onLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const cityName = profile?.city?.name || profile?.cityId?.name || profile?.city || null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Topbar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={balluLogo} alt="Ballu" className="h-10 w-auto" />
            <img src={balluName} alt="Ballu Thekedar" className="h-12 w-auto" />
          </Link>

          {/* Search bar */}
          <form
            onSubmit={onSearch}
            className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-full px-4 py-2 gap-3"
          >
            <input
              type="text"
              name="q"
              value={filters.q}
              onChange={onFilterChange}
              placeholder="Search contractors, services…"
              className="bg-transparent flex-1 outline-none text-sm"
            />
            <button
              type="submit"
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-5 py-1.5 rounded-full text-sm shrink-0"
            >
              Search
            </button>
          </form>

          {/* User */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-gray-900">{user?.name}</div>
              <div className="text-xs text-gray-400">{cityName || 'Client'}</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-yellow-400 flex items-center justify-center font-bold text-gray-900 text-sm shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'C'}
            </div>
            <button
              onClick={onLogout}
              className="text-xs text-gray-500 hover:text-red-600 font-medium hidden sm:block"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Hero greeting */}
      <div className="bg-yellow-400">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold tracking-wider text-gray-900/60 mb-1">WELCOME BACK</div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              Namaste, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-gray-800 mt-1">
              {cityName
                ? `Find trusted thekedars near ${cityName}`
                : 'Find trusted thekedars for every home job'}
            </p>
          </div>
          <div className="hidden md:flex gap-3">
            <Link
              to="/client/jobs/post"
              className="bg-white !text-blue-700 font-semibold px-4 py-2 rounded-full text-sm hover:bg-gray-50"
            >
              📤 Post a Job
            </Link>
            <Link
              to="/client/profile/edit"
              className="bg-white !text-blue-700 font-semibold px-4 py-2 rounded-full text-sm hover:bg-gray-50"
            >
              Edit Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Quick category chips */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-3 flex gap-2 overflow-x-auto">
          <button
            onClick={onClearFilters}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap font-medium transition shrink-0 ${
              !activeCategory
                ? 'bg-yellow-400 text-gray-900 font-semibold'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            All
          </button>
          {QUICK_CATEGORIES.map(cat => (
            <button
              key={cat.slug}
              onClick={() => onQuickCategory(cat.slug)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition shrink-0 ${
                activeCategory === cat.slug
                  ? 'bg-blue-700 text-white font-semibold'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <span>{cat.icon}</span> {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-1">

        {/* Location info banner */}
        {(profile?.city || profile?.cityId) && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-xl px-4 py-3 mb-6 flex items-center justify-between">
            <div>
              <strong>📍 Viewing contractors in {cityName || 'your location'}</strong>
              <p className="text-xs text-blue-700 mt-1">Update your city in your profile to see contractors from a different location.</p>
            </div>
            <Link to="/client/profile/edit" className="text-xs font-semibold text-blue-700 hover:text-blue-900 shrink-0">
              Change Location →
            </Link>
          </div>
        )}

        {/* Filter bar */}
        <form onSubmit={onSearch} className="bg-white border border-gray-200 rounded-2xl p-4 mb-8 flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1 min-w-[160px] flex-1">
            <label className="text-xs font-semibold text-gray-500">Category</label>
            <select
              name="categorySlug"
              value={filters.categorySlug}
              onChange={onFilterChange}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-700"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c._id || c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 min-w-[160px] flex-1">
            <label className="text-xs font-semibold text-gray-500">City</label>
            <select
              name="citySlug"
              value={filters.citySlug}
              onChange={onFilterChange}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-700"
            >
              <option value="">All Cities</option>
              {cities.filter(c => c.isActive !== false).map(c => (
                <option key={c._id || c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 min-w-[140px] flex-1">
            <label className="text-xs font-semibold text-gray-500">Badge</label>
            <select
              name="badge"
              value={filters.badge}
              onChange={onFilterChange}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-700"
            >
              <option value="">Any Badge</option>
              <option value="BRONZE">🥉 Bronze</option>
              <option value="SILVER">🥈 Silver</option>
              <option value="GOLD">🥇 Gold</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 min-w-[140px] flex-1">
            <label className="text-xs font-semibold text-gray-500">Min Rating</label>
            <select
              name="minRating"
              value={filters.minRating}
              onChange={onFilterChange}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-700"
            >
              <option value="">Any Rating</option>
              <option value="3">★★★ 3+</option>
              <option value="4">★★★★ 4+</option>
              <option value="5">★★★★★ 5 only</option>
            </select>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              type="submit"
              className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-xl text-sm"
            >
              Apply Filters
            </button>
            {(filters.categorySlug || filters.citySlug || filters.badge || filters.minRating || filters.q) && (
              <button
                type="button"
                onClick={onClearFilters}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2.5 rounded-xl text-sm"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {/* Results header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-xs font-bold tracking-wider text-red-600 mb-1">
              {activeCategory
                ? `FILTERED BY: ${QUICK_CATEGORIES.find(c => c.slug === activeCategory)?.label?.toUpperCase() || activeCategory.toUpperCase()}`
                : 'ALL CONTRACTORS'}
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">
              {loadingContractors ? 'Loading…' : `${contractors.length} Contractor${contractors.length !== 1 ? 's' : ''} Found`}
            </h2>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loadingContractors && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-pulse">
                <div className="w-full h-44 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-8 bg-gray-200 rounded-full mt-3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loadingContractors && contractors.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No contractors found</h3>
            <p className="text-gray-500 text-sm mb-6">Try clearing some filters or searching a different category.</p>
            <button
              onClick={onClearFilters}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-6 py-2.5 rounded-full text-sm"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Grid */}
        {!loadingContractors && contractors.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {contractors.map(c => (
                <ContractorCard key={c._id || c.id} contractor={c} />
              ))}
            </div>

            {nextCursor && (
              <div className="text-center mt-8">
                <button
                  onClick={() => fetchContractors(filters, nextCursor, true)}
                  disabled={loadingMore}
                  className="bg-white border border-gray-200 hover:border-blue-700 hover:text-blue-700 text-gray-700 font-semibold px-8 py-3 rounded-full text-sm transition disabled:opacity-50"
                >
                  {loadingMore ? 'Loading…' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-blue-700 text-white mt-6">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img src={balluLogo} alt="Ballu" className="h-14 w-14 rounded-full bg-white p-0.5" />
            </div>
            <p className="text-xs text-blue-200 max-w-xs leading-relaxed">
              Ghar ka kaam, aasaan. India's trusted contractor marketplace connecting verified thekedars with homeowners.
            </p>
          </div>

          {/* Services */}
          <div>
            <div className="font-bold text-white mb-3">Services</div>
            <ul className="space-y-2 text-xs text-white">
              <li><button onClick={() => onQuickCategory('plumbing')} className="hover:text-yellow-300 text-left">Plumbing</button></li>
              <li><button onClick={() => onQuickCategory('electrical')} className="hover:text-yellow-300 text-left">Electrical</button></li>
              <li><button onClick={() => onQuickCategory('painting')} className="hover:text-yellow-300 text-left">Painting</button></li>
              <li><button onClick={() => onQuickCategory('carpentry')} className="hover:text-yellow-300 text-left">Carpentry</button></li>
              <li><button onClick={() => onQuickCategory('ac-repair')} className="hover:text-yellow-300 text-left">AC Repair</button></li>
              <li><button onClick={() => onQuickCategory('cleaning')} className="hover:text-yellow-300 text-left">Cleaning</button></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <div className="font-bold text-white mb-3">My Account</div>
            <ul className="space-y-2 text-xs text-white">
              <li><Link to="/client/profile/edit" className="!text-white hover:!text-yellow-300">Edit Profile</Link></li>
              <li><Link to="/contractors" className="!text-white hover:!text-yellow-300">Browse Contractors</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <div className="font-bold text-white mb-3">Help & Support</div>
            <ul className="space-y-2 text-xs text-white">
              <li>📞 1800-BALLU-99</li>
              <li>📍 Serving 40+ Cities</li>
              <li className="pt-2">
                <button
                  onClick={onLogout}
                  className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-4 py-1.5 rounded-full text-xs"
                >
                  Logout
                </button>
              </li>
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
