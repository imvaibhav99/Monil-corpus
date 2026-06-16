import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext.jsx';
import * as jobService from '../service/job.service.js';
import balluLogo from '../../../assets/ballu-logo.png';
import balluName from '../../../assets/name.png';

function LeadCard({ lead, onContact }) {
  const job = lead.jobId || {};
  const client = job.clientId || {};
  const category = job.categoryId || {};
  const city = job.cityId || {};

  const budgetDisplay = job.budgetMin && job.budgetMax
    ? `₹${job.budgetMin?.toLocaleString()} - ₹${job.budgetMax?.toLocaleString()}`
    : job.budgetMin
    ? `₹${job.budgetMin?.toLocaleString()}+`
    : 'Budget not specified';

  const urgencyColors = {
    NORMAL: 'bg-blue-100 text-blue-700',
    URGENT: 'bg-orange-100 text-orange-700',
    EMERGENCY: 'bg-red-100 text-red-700',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">{job.title}</h3>
          <p className="text-xs text-gray-500 mt-1">📍 {city.name} {job.pincode && `- ${job.pincode}`}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${urgencyColors[job.urgency] || urgencyColors.NORMAL}`}>
          {job.urgency}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-700 line-clamp-3">{job.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-100">
        <div>
          <span className="text-xs text-gray-500">Category</span>
          <p className="text-sm font-semibold text-gray-900">🔧 {category.name}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500">Budget</span>
          <p className="text-sm font-semibold text-gray-900">{budgetDisplay}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-600">
          Posted by <span className="font-semibold">{client.name}</span>
        </div>
        <button
          onClick={() => onContact(lead._id)}
          className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2 rounded-lg text-sm transition"
        >
          Contact Client
        </button>
      </div>
    </div>
  );
}

export default function ContractorLeads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contacting, setContacting] = useState({});
  const [success, setSuccess] = useState(null);

  const [filter, setFilter] = useState('NEW');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});

  useEffect(() => {
    fetchLeads();
  }, [filter, page]);

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await jobService.getMyLeads({ status: filter, page, limit: 20 });
      setLeads(result.data || []);
      setMeta(result.meta || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const handleContact = async (leadId) => {
    setContacting(prev => ({ ...prev, [leadId]: true }));
    try {
      const result = await jobService.markLeadContacted(leadId);
      const clientContact = result.clientContact;

      // Find the lead to get job info
      const lead = leads.find(l => l._id === leadId);
      const jobTitle = lead?.jobId?.title || 'Job';

      if (clientContact?.phone) {
        // Create a WhatsApp message with client's phone number
        const message = `Hi, I'm interested in your "${jobTitle}" job posted on Ballu Thekedar. I can help with this work. Please reach out to me at ${user?.email || 'my contact'}.`;

        // Open WhatsApp with client's direct phone number
        const whatsappLink = `https://wa.me/${clientContact.phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappLink, '_blank');

        setSuccess('✓ Opening WhatsApp to contact client...');
        setTimeout(() => setSuccess(null), 3000);
        fetchLeads();
      } else if (clientContact?.email) {
        // Fallback if phone is not available
        setError('Client phone number not available. Please try reaching via email.');
      } else {
        setError('Unable to contact client - no contact information available');
      }
    } catch (err) {
      setError('Failed to mark contact');
    } finally {
      setContacting(prev => ({ ...prev, [leadId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link to="/contractor/home" className="flex items-center gap-2 shrink-0">
            <img src={balluLogo} alt="Ballu" className="h-10 w-auto" />
            <img src={balluName} alt="Ballu Thekedar" className="h-12 w-auto" />
          </Link>
          <div className="flex-1" />
          <Link to="/contractor/home" className="text-sm text-gray-500 hover:text-blue-700 font-medium">
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-6 py-8 flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Available Leads</h1>
          <p className="text-gray-600 mt-2">New job opportunities in your service area</p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
            <span>✓</span> {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-8">
          <div className="flex gap-2 flex-wrap">
            {['NEW', 'VIEWED', 'CONTACTED', 'WON', 'LOST', 'EXPIRED'].map(status => (
              <button
                key={status}
                onClick={() => {
                  setFilter(status);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  filter === status
                    ? 'bg-blue-700 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin text-4xl mb-4">🔄</div>
            <p className="text-gray-500">Loading leads…</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && leads.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No leads found</h3>
            <p className="text-gray-600">Check back later for new opportunities in your area</p>
          </div>
        )}

        {/* Leads Grid */}
        {!loading && leads.length > 0 && (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Found <span className="font-bold text-gray-900">{meta.totalResults || leads.length}</span> lead{leads.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="space-y-4">
              {leads.map(lead => (
                <LeadCard
                  key={lead._id}
                  lead={lead}
                  onContact={handleContact}
                />
              ))}
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold disabled:opacity-50 hover:bg-gray-50"
                >
                  ← Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {meta.totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(meta.totalPages, page + 1))}
                  disabled={page === meta.totalPages}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold disabled:opacity-50 hover:bg-gray-50"
                >
                  Next →
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
              <li><Link to="/contractors" className="!text-white hover:!text-yellow-300">Browse Contractors</Link></li>
              <li><Link to="/contractor/leads" className="!text-white hover:!text-yellow-300">My Leads</Link></li>
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
              <li><Link to="/contractor/home" className="!text-white hover:!text-yellow-300">My Dashboard</Link></li>
              <li><Link to="/contractor/profile/edit" className="!text-white hover:!text-yellow-300">Edit Profile</Link></li>
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
