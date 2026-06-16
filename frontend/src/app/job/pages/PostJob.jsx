import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext.jsx';
import * as jobService from '../service/job.service.js';
import * as categoryService from '../../category/service/category.service.js';
import * as cityService from '../../city/service/city.service.js';
import balluLogo from '../../../assets/ballu-logo.png';
import balluName from '../../../assets/name.png';

export default function PostJob() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [form, setForm] = useState({
    categoryId: '',
    cityId: '',
    title: '',
    description: '',
    budgetMin: '',
    budgetMax: '',
    pincode: '',
    address: '',
    urgency: 'NORMAL',
  });

  useEffect(() => {
    Promise.all([categoryService.getCategories(), cityService.getCities()])
      .then(([catRes, cityRes]) => {
        // catRes and cityRes are already arrays (service extracts r.data)
        const cats = Array.isArray(catRes) ? catRes : (catRes.data || []);
        const citys = Array.isArray(cityRes) ? cityRes : (cityRes.data || []);
        setCategories(cats);
        setCities(citys);
      })
      .catch(() => setError('Failed to load categories and cities'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.categoryId || !form.cityId || !form.title || !form.description) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const data = {
        categoryId: form.categoryId,
        cityId: form.cityId,
        title: form.title,
        description: form.description,
        urgency: form.urgency,
        ...(form.budgetMin && { budgetMin: parseInt(form.budgetMin) }),
        ...(form.budgetMax && { budgetMax: parseInt(form.budgetMax) }),
        pincode: form.pincode || undefined,
        address: form.address || undefined,
      };

      const result = await jobService.createJob(data);
      // API returns { data: { id, ... } } where id is the jobId
      const jobId = result.data?.id || result.id || result.data?._id || result._id;
      setSuccess('Job posted successfully! Contractors in your area will see it soon.');
      setTimeout(() => {
        navigate(`/client/jobs/${jobId}`);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post job');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🔄</div>
          <p className="text-gray-500">Loading…</p>
        </div>
      </div>
    );
  }

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
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full px-6 py-8 flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Post a Job</h1>
          <p className="text-gray-600 mt-2">Describe what you need and contractors will send you quotes</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
            <span>✓</span> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-8">
          {/* Category & City */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Service Category *</label>
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 bg-gray-50"
                required
              >
                <option value="">Select a category</option>
                {categories.map(c => (
                  <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">City *</label>
              <select
                name="cityId"
                value={form.cityId}
                onChange={handleChange}
                className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 bg-gray-50"
                required
              >
                <option value="">Select a city</option>
                {cities.map(c => (
                  <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-gray-700 block mb-2">Job Title *</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g., Fix leaking kitchen sink"
              maxLength="200"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
              required
            />
            <p className="text-xs text-gray-500 mt-1">{form.title.length}/200 characters</p>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-gray-700 block mb-2">Description *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the work needed in detail. Be specific about what needs to be done, materials, timeline, etc."
              maxLength="2000"
              rows="6"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">{form.description.length}/2000 characters</p>
          </div>

          {/* Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Budget (Min)</label>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">₹</span>
                <input
                  type="number"
                  name="budgetMin"
                  value={form.budgetMin}
                  onChange={handleChange}
                  placeholder="Optional"
                  min="0"
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Budget (Max)</label>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">₹</span>
                <input
                  type="number"
                  name="budgetMax"
                  value={form.budgetMax}
                  onChange={handleChange}
                  placeholder="Optional"
                  min="0"
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>
            </div>
          </div>

          {/* Urgency */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-gray-700 block mb-2">Urgency</label>
            <div className="flex gap-4">
              {['NORMAL', 'URGENT', 'EMERGENCY'].map(level => (
                <label key={level} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="urgency"
                    value={level}
                    checked={form.urgency === level}
                    onChange={handleChange}
                    className="w-4 h-4 accent-blue-700"
                  />
                  <span className="text-sm text-gray-700">{level}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Location Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Pincode</label>
              <input
                type="text"
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                placeholder="e.g., 400001"
                className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Address</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="e.g., 123 Main Street, Apt 4B"
                className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-8 py-3 rounded-xl text-sm disabled:opacity-60 transition"
            >
              {submitting ? '📤 Posting…' : '📤 Post Job'}
            </button>
            <Link
              to="/client/home"
              className="bg-gray-100 hover:bg-gray-200 !text-gray-700 font-semibold px-6 py-3 rounded-xl text-sm transition"
            >
              Cancel
            </Link>
          </div>
        </form>
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
              <li><Link to="/client/jobs" className="!text-white hover:!text-yellow-300">My Jobs</Link></li>
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
