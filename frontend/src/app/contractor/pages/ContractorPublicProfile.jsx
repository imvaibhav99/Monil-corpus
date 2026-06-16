import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext.jsx';
import * as contractorService from '../service/contractor.service.js';
import balluLogo from '../../../assets/ballu-logo.png';
import balluName from '../../../assets/name.png';

const BADGE_EMOJI = { BRONZE: '🥉', SILVER: '🥈', GOLD: '🥇' };
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function WorkingHoursTable({ hours }) {
  if (!hours) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <tbody className="divide-y divide-gray-100">
          {DAYS.map(day => {
            const h = hours[day];
            return (
              <tr key={day} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold text-gray-700 capitalize">{day}</td>
                <td className="px-4 py-3 text-gray-600">
                  {!h || h.closed
                    ? <span className="text-gray-400">Closed</span>
                    : `${h.open} – ${h.close}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ContractorPublicProfile() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contractor, setContractor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    contractorService.getContractorBySlug(slug)
      .then(res => {
        setContractor(res.data || res);
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Contractor not found.');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🔄</div>
          <p className="text-gray-500">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
            <Link to="/contractors" className="flex items-center gap-2 shrink-0">
              <img src={balluLogo} alt="Ballu" className="h-10 w-auto" />
              <img src={balluName} alt="Ballu Thekedar" className="h-12 w-auto" />
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center">
            <div className="text-5xl mb-4">😞</div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Contractor Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              to="/contractors"
              className="inline-block bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-xl text-sm"
            >
              Back to Search
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!contractor) return null;

  const badge = contractor.badge || contractor.badgeTier;
  const portfolio = contractor.portfolioItems || [];
  const categories = contractor.serviceCategories || contractor.categories || [];
  const languages = Array.isArray(contractor.languages) ? contractor.languages : [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link to="/contractors" className="flex items-center gap-2 shrink-0">
            <img src={balluLogo} alt="Ballu" className="h-10 w-auto" />
            <img src={balluName} alt="Ballu Thekedar" className="h-12 w-auto" />
          </Link>
          <div className="flex-1" />
          <Link to="/contractors" className="text-sm text-gray-500 hover:text-blue-700 font-medium">
            ← Back to Search
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full px-6 py-8 flex-1">
        {/* Hero Section */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8">
          {/* Cover Photo */}
          {contractor.coverPhotoUrl && (
            <div
              className="h-48 bg-gradient-to-br from-blue-100 to-yellow-100 bg-cover bg-center"
              style={{ backgroundImage: `url(${contractor.coverPhotoUrl})` }}
            />
          )}

          {/* Profile Info */}
          <div className="px-6 py-8 flex flex-col md:flex-row gap-6 items-start md:items-end">
            <div className="flex-1">
              {contractor.profilePhotoUrl ? (
                <img
                  src={contractor.profilePhotoUrl}
                  alt={contractor.businessName}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-white shadow-lg object-cover -mt-16 mb-4"
                />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-blue-100 to-yellow-100 flex items-center justify-center text-5xl -mt-16 mb-4 border-4 border-white shadow-lg">
                  👷
                </div>
              )}
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900">{contractor.businessName || 'Contractor Profile'}</h1>
                {contractor.city && (
                  <p className="text-gray-600 text-sm mt-1">📍 {contractor.city.name || contractor.city}</p>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {badge && badge !== 'NONE' && (
                    <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold">
                      {BADGE_EMOJI[badge]} {badge}
                    </span>
                  )}
                  {contractor.emergencyService && (
                    <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                      ⚡ Emergency Available
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-shrink-0">
              {!user ? (
                <button
                  onClick={() => navigate(`/client/login?redirect=/contractors/${slug}`)}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-xl text-sm"
                >
                  Login to Contact
                </button>
              ) : (
                <button
                  disabled
                  title="Contact information is visible"
                  className="bg-green-100 text-green-700 font-semibold px-6 py-3 rounded-xl text-sm cursor-default"
                >
                  ✓ Contact Visible
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <div className="text-3xl font-extrabold text-yellow-500">
              {contractor.avgRating ? Number(contractor.avgRating).toFixed(1) : '—'}
            </div>
            <div className="text-xs text-gray-600 mt-1">★ Rating</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <div className="text-3xl font-extrabold text-blue-700">{contractor.totalReviews ?? 0}</div>
            <div className="text-xs text-gray-600 mt-1">Reviews</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <div className="text-3xl font-extrabold text-green-600">{contractor.jobsCompleted ?? 0}</div>
            <div className="text-xs text-gray-600 mt-1">Jobs Done</div>
          </div>
          {contractor.responseRate != null && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
              <div className="text-3xl font-extrabold text-purple-600">{contractor.responseRate}%</div>
              <div className="text-xs text-gray-600 mt-1">Response Rate</div>
            </div>
          )}
          {contractor.responseTime != null && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
              <div className="text-3xl font-extrabold text-orange-600">{contractor.responseTime}h</div>
              <div className="text-xs text-gray-600 mt-1">Response Time</div>
            </div>
          )}
        </div>

        {/* About Section */}
        {contractor.bio && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-extrabold text-gray-900 mb-4">📝 About</h2>
            <p className="text-gray-700 leading-relaxed mb-3">{contractor.bio}</p>
            {contractor.yearsExperience > 0 && (
              <p className="text-sm text-gray-600">
                💼 {contractor.yearsExperience} {contractor.yearsExperience === 1 ? 'year' : 'years'} of experience
              </p>
            )}
          </div>
        )}

        {/* Categories & Languages */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {categories.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-xl font-extrabold text-gray-900 mb-4">🔧 Service Categories</h2>
              <div className="flex flex-wrap gap-2">
                {categories.map((c, i) => (
                  <span
                    key={i}
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      c.isPrimary
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {c.name || (c.categoryId && c.categoryId.name) || c}
                    {c.isPrimary && ' ★'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {languages.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-xl font-extrabold text-gray-900 mb-4">🗣️ Languages</h2>
              <div className="flex flex-wrap gap-2">
                {languages.map((l, i) => (
                  <span key={i} className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                    {l}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Working Hours */}
        {contractor.workingHours && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-extrabold text-gray-900 mb-4">⏰ Working Hours</h2>
            <WorkingHoursTable hours={contractor.workingHours} />
          </div>
        )}

        {/* Portfolio */}
        {portfolio.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-extrabold text-gray-900 mb-4">🖼️ Portfolio</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {portfolio.map((item, i) => (
                <div key={item.id || item._id || i} className="rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition">
                  <img
                    src={item.imageUrl}
                    alt={item.caption || 'Portfolio'}
                    className="w-full h-40 object-cover"
                  />
                  {item.caption && (
                    <p className="px-3 py-2 text-xs text-gray-600">{item.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Section */}
        {user && contractor.contactChannels && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-extrabold text-gray-900 mb-4">📞 Contact Information</h2>
            <div className="space-y-3">
              {contractor.contactChannels.phone && (
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-700 min-w-fit">📱 Phone:</span>
                  <a href={`tel:${contractor.contactChannels.phone}`} className="text-blue-700 hover:underline break-all">
                    {contractor.contactChannels.phone}
                  </a>
                </div>
              )}
              {contractor.contactChannels.whatsapp && (
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-700 min-w-fit">💬 WhatsApp:</span>
                  <a
                    href={`https://wa.me/${contractor.contactChannels.whatsapp.replace(/\D/g, '')}`}
                    className="text-blue-700 hover:underline break-all"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {contractor.contactChannels.whatsapp}
                  </a>
                </div>
              )}
              {contractor.contactChannels.email && (
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-700 min-w-fit">✉️ Email:</span>
                  <a href={`mailto:${contractor.contactChannels.email}`} className="text-blue-700 hover:underline break-all">
                    {contractor.contactChannels.email}
                  </a>
                </div>
              )}
              {contractor.contactChannels.telegram && (
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-700 min-w-fit">🎮 Telegram:</span>
                  <a
                    href={`https://t.me/${contractor.contactChannels.telegram.replace('@', '')}`}
                    className="text-blue-700 hover:underline break-all"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {contractor.contactChannels.telegram}
                  </a>
                </div>
              )}
              {contractor.contactChannels.preferredChannel && (
                <div className="text-sm text-gray-600 pt-2 border-t border-gray-100">
                  ⭐ Preferred: <span className="font-semibold">{contractor.contactChannels.preferredChannel.toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {!user && (
          <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6 mb-8">
            <h2 className="text-xl font-extrabold text-gray-900 mb-3">📞 Contact Information</h2>
            <p className="text-gray-700 mb-4">
              Please{' '}
              <Link
                to={`/client/login?redirect=/contractors/${slug}`}
                className="text-blue-700 hover:underline font-semibold"
              >
                log in
              </Link>{' '}
              to see contact details and reach out to this contractor.
            </p>
            <button
              onClick={() => navigate(`/client/login?redirect=/contractors/${slug}`)}
              className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2 rounded-xl text-sm"
            >
              Login to Contact
            </button>
          </div>
        )}

        {/* Reviews Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-xl font-extrabold text-gray-900 mb-4">⭐ Reviews</h2>
          <p className="text-gray-600">Reviews coming soon!</p>
        </div>
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
            <div className="font-bold text-white mb-3">Help</div>
            <ul className="space-y-2 text-xs text-white">
              <li>📞 1800-BALLU-99</li>
              <li>📍 Serving 40+ Cities</li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-white mb-3">Account</div>
            <ul className="space-y-2 text-xs text-white">
              {user ? (
                <li><Link to="/client/home" className="!text-white hover:!text-yellow-300">My Dashboard</Link></li>
              ) : (
                <li><Link to="/client/login" className="!text-white hover:!text-yellow-300">Client Login</Link></li>
              )}
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
