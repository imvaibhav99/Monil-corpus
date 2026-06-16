import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext.jsx';
import * as contractorService from '../service/contractor.service.js';
import balluLogo from '../../../assets/ballu-logo.png';
import balluName from '../../../assets/name.png';

const BADGE_EMOJI = { BRONZE: '🥉', SILVER: '🥈', GOLD: '🥇' };

// Mock job board data — replace with real API when job posting is built
const MOCK_JOBS = [
  { id: 1, tag: 'Urgent', time: '1h ago',  title: 'Bathroom Pipe Leakage Fix',      category: 'Plumbing',   location: 'Koregaon Park, Pune',    budget: '₹1,500 - ₹3,000',  client: 'Rahul M.',   clientInitial: 'R' },
  { id: 2, tag: 'New',    time: '3h ago',  title: '2BHK Full Wall Painting',         category: 'Painting',   location: 'Andheri West, Mumbai',   budget: '₹8,000 - ₹12,000', client: 'Sneha K.',   clientInitial: 'S' },
  { id: 3, tag: 'Open',   time: '6h ago',  title: 'Kitchen Cabinet Installation',    category: 'Carpentry',  location: 'Whitefield, Bengaluru',  budget: '₹15,000 - ₹25,000',client: 'Arjun T.',   clientInitial: 'A' },
  { id: 4, tag: 'Urgent', time: '8h ago',  title: 'AC Servicing & Gas Refill',       category: 'AC Repair',  location: 'Sector 62, Noida',       budget: '₹800 - ₹1,500',    client: 'Priya S.',   clientInitial: 'P' },
  { id: 5, tag: 'New',    time: '12h ago', title: 'Electrical Wiring for New Flat',  category: 'Electrical', location: 'Salt Lake, Kolkata',     budget: '₹5,000 - ₹9,000',  client: 'Vikram D.',  clientInitial: 'V' },
  { id: 6, tag: 'Open',   time: '1d ago',  title: 'Deep Kitchen & Bathroom Cleaning',category: 'Cleaning',   location: 'Baner, Pune',            budget: '₹1,200 - ₹2,000',  client: 'Meena R.',   clientInitial: 'M' },
];

function StatCard({ value, label, color = 'text-gray-900' }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
      <div className={`text-3xl font-extrabold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function JobCard({ job }) {
  const tagStyle = {
    Urgent: 'bg-red-100 text-red-700',
    New:    'bg-blue-100 text-blue-700',
    Open:   'bg-green-100 text-green-700',
  }[job.tag] || 'bg-gray-100 text-gray-700';

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${tagStyle}`}>{job.tag}</span>
        <span className="text-xs text-gray-400">{job.time}</span>
      </div>
      <div>
        <div className="font-bold text-gray-900">{job.title}</div>
        <div className="text-xs text-gray-500 mt-1">🔧 {job.category}</div>
      </div>
      <div className="text-xs text-gray-600">📍 {job.location}</div>
      <div className="text-xs text-gray-600">💰 Budget: <span className="font-semibold text-gray-800">{job.budget}</span></div>
      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
        <div className="w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center text-xs font-bold text-gray-900">
          {job.clientInitial}
        </div>
        <span className="text-xs text-gray-500">Posted by <span className="font-medium text-gray-700">{job.client}</span></span>
      </div>
      <a
        href={`https://wa.me/?text=Hi, I saw your job posting for "${job.title}" and I'd like to help!`}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full bg-green-500 hover:bg-green-600 !text-white font-semibold py-2 rounded-full text-sm text-center"
      >
        💬 Express Interest
      </a>
    </div>
  );
}

export default function ContractorHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError]       = useState(null);
  const [tab, setTab]           = useState('dashboard');
  const [jobFilter, setJobFilter] = useState('');

  const fetchProfile = () => {
    setLoading(true);
    contractorService.getMyProfile()
      .then(res => setProfile(res.data || res))
      .catch(err => setError(err.response?.data?.message || 'Could not load profile.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await contractorService.toggleAvailability();
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle availability.');
    } finally {
      setToggling(false);
    }
  };

  const onLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const completeness = profile?.profileCompleteness ?? 0;
  const filteredJobs = jobFilter
    ? MOCK_JOBS.filter(j => j.category.toLowerCase().includes(jobFilter.toLowerCase()))
    : MOCK_JOBS;

  const TABS = [
    { key: 'dashboard', label: '🏠 Dashboard' },
    { key: 'leads',     label: '🎯 My Leads', link: '/contractor/leads' },
    { key: 'profile',   label: '✏️ Edit Profile', link: '/contractor/profile/edit' },
    { key: 'portfolio', label: '🖼️ Portfolio', link: '/contractor/portfolio' },
  ];

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

          {/* Availability toggle */}
          {profile && (
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition ${
                profile.isAvailable
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${profile.isAvailable ? 'bg-green-500' : 'bg-gray-400'}`} />
              {toggling ? 'Updating…' : profile.isAvailable ? 'Available' : 'Unavailable'}
            </button>
          )}

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-gray-900">{user?.name}</div>
              <div className="text-xs text-gray-400">Contractor</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-700 flex items-center justify-center font-bold text-white text-sm">
              {user?.name?.[0]?.toUpperCase() || 'C'}
            </div>
            <button onClick={onLogout} className="text-xs text-gray-500 hover:text-red-600 font-medium hidden sm:block">
              Logout
            </button>
          </div>
        </div>

        {/* Tab nav */}
        <div className="max-w-7xl mx-auto px-6 pb-0 flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => {
                if (t.link) { navigate(t.link); return; }
                setTab(t.key);
              }}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                tab === t.key
                  ? 'border-blue-700 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Hero banner */}
      <div className="bg-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs font-bold tracking-wider text-yellow-300 mb-1">CONTRACTOR DASHBOARD</div>
            <h1 className="text-2xl font-extrabold">
              Namaste, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-blue-200 mt-1">
              {profile?.primaryCategory?.name
                ? `${profile.primaryCategory.name} · ${profile.city?.name || 'India'}`
                : 'Complete your profile to attract more clients'}
            </p>
          </div>
          {profile && (
            <div className="flex gap-3 flex-wrap">
              {profile.badge && profile.badge !== 'NONE' && (
                <div className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-full text-sm font-bold">
                  {BADGE_EMOJI[profile.badge]} {profile.badge} Badge
                </div>
              )}
              <Link
                to="/contractor/profile/edit"
                className="bg-white !text-blue-700 font-semibold px-4 py-2 rounded-full text-sm hover:bg-gray-50"
              >
                Edit Profile
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-1">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 h-24" />
            ))}
          </div>
        )}

        {/* ── DASHBOARD TAB ── */}
        {!loading && tab === 'dashboard' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                value={profile?.avgRating ? `${Number(profile.avgRating).toFixed(1)}★` : '—'}
                label="Avg Rating"
                color="text-yellow-500"
              />
              <StatCard value={profile?.totalReviews ?? 0}  label="Reviews" />
              <StatCard value={profile?.jobsCompleted ?? 0} label="Jobs Done" />
              <StatCard value={`${completeness}%`}          label="Profile Complete" color={completeness === 100 ? 'text-green-600' : 'text-blue-700'} />
            </div>

            {/* Profile completeness */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-900">Profile Completeness</h2>
                <span className="text-sm font-bold text-blue-700">{completeness}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${completeness === 100 ? 'bg-green-500' : 'bg-blue-700'}`}
                  style={{ width: `${completeness}%` }}
                />
              </div>
              {completeness < 100 && (
                <p className="text-sm text-gray-500 mt-3">
                  A complete profile gets <span className="font-semibold text-gray-800">3× more views.</span>{' '}
                  <Link to="/contractor/profile/edit" className="!text-blue-700 font-semibold hover:underline">
                    Complete now →
                  </Link>
                </p>
              )}
              {completeness === 100 && (
                <p className="text-sm text-green-600 font-semibold mt-3">✓ Your profile is 100% complete!</p>
              )}
            </div>

            {/* Availability + quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h2 className="font-bold text-gray-900 mb-1">Availability Status</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Clients can only reach out to contractors marked as Available.
                </p>
                <div className="flex items-center gap-4">
                  <div className={`flex-1 text-center py-3 rounded-xl font-bold text-sm ${
                    profile?.isAvailable ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'
                  }`}>
                    {profile?.isAvailable ? '🟢 Currently Available' : '⚫ Currently Unavailable'}
                  </div>
                  <button
                    onClick={handleToggle}
                    disabled={toggling}
                    className={`px-5 py-3 rounded-xl font-bold text-sm disabled:opacity-50 ${
                      profile?.isAvailable
                        ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {toggling ? '…' : profile?.isAvailable ? 'Go Offline' : 'Go Online'}
                  </button>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/contractor/profile/edit" className="flex flex-col items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition text-center">
                    <span className="text-2xl">✏️</span>
                    <span className="text-xs font-semibold text-blue-700">Edit Profile</span>
                  </Link>
                  <Link to="/contractor/portfolio" className="flex flex-col items-center gap-2 p-3 bg-yellow-50 hover:bg-yellow-100 rounded-xl transition text-center">
                    <span className="text-2xl">🖼️</span>
                    <span className="text-xs font-semibold text-yellow-700">Portfolio</span>
                  </Link>
                  <button onClick={() => setTab('jobs')} className="flex flex-col items-center gap-2 p-3 bg-green-50 hover:bg-green-100 rounded-xl transition text-center">
                    <span className="text-2xl">📋</span>
                    <span className="text-xs font-semibold text-green-700">Job Board</span>
                  </button>
                  <Link to={`/contractors/${profile?.slug || ''}`} className="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition text-center">
                    <span className="text-2xl">👁️</span>
                    <span className="text-xs font-semibold text-gray-700">Public Profile</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent job board preview */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-xs font-bold tracking-wider text-red-600 mb-1">OPEN NOW</div>
                  <h2 className="text-xl font-extrabold text-gray-900">Latest Client Jobs</h2>
                </div>
                <button
                  onClick={() => setTab('jobs')}
                  className="text-sm text-blue-700 font-semibold hover:underline"
                >
                  View All →
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {MOCK_JOBS.slice(0, 3).map(job => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── JOB BOARD TAB ── */}
        {tab === 'jobs' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-xs font-bold tracking-wider text-red-600 mb-1">CLIENT POSTINGS</div>
                <h2 className="text-2xl font-extrabold text-gray-900">Job Board</h2>
                <p className="text-sm text-gray-500 mt-1">Express interest directly via WhatsApp</p>
              </div>
              <div className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1.5 rounded-full">
                🚧 Live jobs coming soon
              </div>
            </div>

            {/* Category filter */}
            <div className="flex gap-2 flex-wrap mb-6">
              {['', 'Plumbing', 'Electrical', 'Painting', 'Carpentry', 'AC Repair', 'Cleaning'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setJobFilter(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                    jobFilter === cat
                      ? 'bg-blue-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {cat || 'All'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredJobs.map(job => (
                <JobCard key={job.id} job={job} />
              ))}
              {filteredJobs.length === 0 && (
                <div className="col-span-3 text-center py-16 text-gray-400">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="font-semibold">No jobs in this category yet.</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-blue-700 text-white mt-6">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div className="col-span-2 md:col-span-1">
            <img src={balluLogo} alt="Ballu" className="h-14 w-14 rounded-full bg-white p-0.5 mb-3" />
            <p className="text-xs text-blue-200 leading-relaxed">
              Ghar ka kaam, aasaan. India's trusted contractor marketplace.
            </p>
          </div>
          <div>
            <div className="font-bold text-white mb-3">My Account</div>
            <ul className="space-y-2 text-xs text-white">
              <li><Link to="/contractor/profile/edit" className="!text-white hover:!text-yellow-300">Edit Profile</Link></li>
              <li><Link to="/contractor/portfolio" className="!text-white hover:!text-yellow-300">Portfolio</Link></li>
              <li><button onClick={() => setTab('jobs')} className="hover:text-yellow-300 text-left">Job Board</button></li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-white mb-3">Help & Support</div>
            <ul className="space-y-2 text-xs text-white">
              <li>📞 1800-BALLU-99</li>
              <li>📍 Serving 40+ Cities</li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-white mb-3">Account</div>
            <ul className="space-y-2 text-xs text-white">
              <li>
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
