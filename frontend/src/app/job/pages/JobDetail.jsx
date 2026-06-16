import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext.jsx';
import * as jobService from '../service/job.service.js';
import balluLogo from '../../../assets/ballu-logo.png';
import balluName from '../../../assets/name.png';

const STATUS_COLORS = {
  OPEN: 'bg-blue-100 text-blue-700',
  ASSIGNED: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-purple-100 text-purple-700',
  CANCELLED: 'bg-gray-100 text-gray-700',
  EXPIRED: 'bg-red-100 text-red-700',
};

const URGENCY_COLORS = {
  NORMAL: 'bg-gray-100 text-gray-700',
  URGENT: 'bg-orange-100 text-orange-700',
  EMERGENCY: 'bg-red-100 text-red-700',
};

function InterestCard({ lead, job }) {
  const contractor = lead.contractorId || {};
  const statusBadge = {
    NEW: '🆕 New',
    VIEWED: '👀 Viewed',
    CONTACTED: '📞 Contacted',
    WON: '✓ Selected',
    LOST: '✗ Not Selected',
    EXPIRED: '⏰ Expired',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
      <div className="flex-1">
        <div className="font-semibold text-gray-900">{contractor.name}</div>
        <div className="text-xs text-gray-600 mt-1">
          {lead.contactedAt ? `Contacted ${new Date(lead.contactedAt).toLocaleDateString()}` : 'Not yet contacted'}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
          lead.status === 'WON' ? 'bg-green-100 text-green-700' :
          lead.status === 'CONTACTED' ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {statusBadge[lead.status]}
        </span>
        {lead.status === 'CONTACTED' && job.status === 'OPEN' && (
          <button
            onClick={() => {/* TODO: implement assign */}}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg text-sm"
          >
            Select
          </button>
        )}
      </div>
    </div>
  );
}

export default function JobDetail() {
  const { jobId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await jobService.getJobById(jobId);
      setJob(result.data || result);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load job');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🔄</div>
          <p className="text-gray-500">Loading job details…</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
            <Link to="/client/home" className="flex items-center gap-2 shrink-0">
              <img src={balluLogo} alt="Ballu" className="h-10 w-auto" />
              <img src={balluName} alt="Ballu Thekedar" className="h-12 w-auto" />
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center">
            <div className="text-5xl mb-4">😞</div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Job Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'This job could not be loaded'}</p>
            <Link
              to="/client/home"
              className="inline-block bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-xl text-sm"
            >
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const category = job.categoryId || {};
  const city = job.cityId || {};
  const assignedContractor = job.assignedContractorId || null;
  const daysUntilExpiry = job.expiresAt ? Math.ceil((new Date(job.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link to="/client/home" className="flex items-center gap-2 shrink-0">
            <img src={balluLogo} alt="Ballu" className="h-10 w-auto" />
            <img src={balluName} alt="Ballu Thekedar" className="h-12 w-auto" />
          </Link>
          <div className="flex-1" />
          <Link to="/client/home" className="text-sm text-gray-500 hover:text-blue-700 font-medium">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-6 py-8 flex-1">
        {/* Job Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">{job.title}</h1>
              <p className="text-gray-600 mt-2">📍 {city.name || 'Location TBD'}</p>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${STATUS_COLORS[job.status] || STATUS_COLORS.OPEN}`}>
                {job.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${URGENCY_COLORS[job.urgency] || URGENCY_COLORS.NORMAL}`}>
                {job.urgency}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-100">
            <div>
              <span className="text-xs text-gray-500">Category</span>
              <p className="font-semibold text-gray-900 mt-1">🔧 {category.name}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Budget</span>
              <p className="font-semibold text-gray-900 mt-1">
                {job.budgetMin && job.budgetMax ? `₹${job.budgetMin.toLocaleString()}-${job.budgetMax.toLocaleString()}` :
                 job.budgetMin ? `₹${job.budgetMin.toLocaleString()}+` :
                 'Not specified'}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Expires In</span>
              <p className="font-semibold text-gray-900 mt-1">{daysUntilExpiry} days</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Responses</span>
              <p className="font-semibold text-gray-900 mt-1">{job.responseCount || 0} contractors</p>
            </div>
          </div>

          {job.address && (
            <div>
              <span className="text-xs text-gray-500">Address</span>
              <p className="text-sm text-gray-700 mt-1">{job.address}</p>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-extrabold text-gray-900 mb-4">📝 Job Description</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{job.description}</p>
        </div>

        {/* Interested Contractors */}
        {job.status !== 'CANCELLED' && job.status !== 'EXPIRED' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-extrabold text-gray-900 mb-4">
              👥 Interested Contractors ({job.responseCount || 0})
            </h2>
            {job.responseCount && job.responseCount > 0 ? (
              <div className="space-y-3">
                {/* In real implementation, this would show actual leads */}
                <p className="text-gray-600 text-sm">
                  Contractors who have shown interest will appear here. Check back soon!
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-sm">No contractors have shown interest yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {job.status === 'OPEN' && (
          <div className="flex gap-3">
            <button
              onClick={() => {/* TODO: implement edit */}}
              className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-xl text-sm"
            >
              Edit Job
            </button>
            <button
              onClick={() => {/* TODO: implement cancel */}}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl text-sm"
            >
              Cancel Job
            </button>
          </div>
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
              <li><Link to="/contractors" className="!text-white hover:!text-yellow-300">Find Contractors</Link></li>
              <li><Link to="/client/jobs/post" className="!text-white hover:!text-yellow-300">Post a Job</Link></li>
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
              <li><Link to="/client/home" className="!text-white hover:!text-yellow-300">My Dashboard</Link></li>
              <li><Link to="/client/profile/edit" className="!text-white hover:!text-yellow-300">Edit Profile</Link></li>
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
