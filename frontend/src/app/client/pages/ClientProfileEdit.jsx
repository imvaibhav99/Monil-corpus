import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext.jsx';
import * as clientService from '../service/client.service.js';
import * as cityService from '../../city/service/city.service.js';
import balluLogo from '../../../assets/ballu-logo.png';
import balluName from '../../../assets/name.png';

export default function ClientProfileEdit() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    phone: '',
    cityId: '',
    pincode: '',
    address: '',
    preferences: {
      notifications: false,
      emailDigest: false,
      preferredContact: '',
    },
  });
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      clientService.getMyProfile().catch(() => null),
      cityService.getCities(),
    ]).then(([profileRes, cityRes]) => {
      const cityList = Array.isArray(cityRes) ? cityRes : (cityRes.data || []);
      setCities(cityList);
      if (profileRes) {
        const p = profileRes.data || profileRes;
        const city = p.city || p.cityId;
        setForm({
          phone: p.phone || '',
          cityId: city?._id || city?.id || p.cityId || '',
          pincode: p.pincode || '',
          address: p.address || '',
          preferences: p.preferences || {},
        });
      } else {
        // New profile or missing profile — start with empty form
        setForm({
          phone: '',
          cityId: '',
          pincode: '',
          address: '',
          preferences: {},
        });
      }
    }).catch(err => {
      setError(err.response?.data?.message || 'Failed to load data.');
    }).finally(() => setLoading(false));
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const onPreferenceChange = (key, value) => {
    setForm({ ...form, preferences: { ...form.preferences, [key]: value } });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.cityId) {
      setError('Please select a city.');
      return;
    }
    setSaving(true);
    setSuccess(null);
    setError(null);
    try {
      await clientService.updateMyProfile({
        phone: form.phone || undefined,
        cityId: form.cityId,
        pincode: form.pincode || undefined,
        address: form.address || undefined,
        preferences: form.preferences,
      });
      setSuccess('Profile updated successfully!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const onLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </header>
        <div className="max-w-3xl mx-auto px-6 py-8 w-full">
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl h-40 border border-gray-200 animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

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
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-gray-900">{user?.name}</div>
            <div className="text-xs text-gray-400">Client</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-yellow-400 flex items-center justify-center font-bold text-gray-900 text-sm">
            {user?.name?.[0]?.toUpperCase() || 'C'}
          </div>
          <button onClick={onLogout} className="text-xs text-gray-500 hover:text-red-600 font-medium hidden sm:block">
            Logout
          </button>
        </div>
      </header>

      {/* Page Header */}
      <div className="bg-yellow-400">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-extrabold text-gray-900">Edit Your Profile</h1>
          <p className="text-sm text-gray-800 mt-1">Complete your profile so contractors can reach you easily</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-8 w-full flex-1">
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-6 flex items-center gap-2">
            <span className="text-lg">✓</span> {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-0">
          {/* Location Information */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-5">
            <h2 className="font-extrabold text-gray-900 text-lg mb-5 pb-3 border-b border-gray-100">📍 Location Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  City <span className="text-red-500">*</span>
                </label>
                <select
                  className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50"
                  name="cityId"
                  value={form.cityId}
                  onChange={onChange}
                  required
                >
                  <option value="">Select your city</option>
                  {cities.map(c => (
                    <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Phone</label>
                <input
                  className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={onChange}
                  placeholder="e.g., 9876543210"
                  maxLength="10"
                />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Pincode</label>
                <input
                  className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50"
                  name="pincode"
                  value={form.pincode}
                  onChange={onChange}
                  placeholder="e.g., 400001"
                  maxLength="6"
                />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Street Address</label>
                <input
                  className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50"
                  name="address"
                  value={form.address}
                  onChange={onChange}
                  placeholder="e.g., 123 Main Street, Apt 4B"
                />
              </div>
            </div>
          </div>

          {/* Communication Preferences */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-5">
            <h2 className="font-extrabold text-gray-900 text-lg mb-5 pb-3 border-b border-gray-100">📞 Communication Preferences</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Preferred Contact Method</label>
                <select
                  className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50"
                  value={form.preferences.preferredContact || ''}
                  onChange={(e) => onPreferenceChange('preferredContact', e.target.value)}
                >
                  <option value="">No preference</option>
                  <option value="phone">📱 Phone</option>
                  <option value="email">📧 Email</option>
                  <option value="whatsapp">💬 WhatsApp</option>
                </select>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition">
                <input
                  type="checkbox"
                  checked={form.preferences.notifications || false}
                  onChange={(e) => onPreferenceChange('notifications', e.target.checked)}
                  className="w-4 h-4 accent-yellow-400"
                />
                <div>
                  <span className="text-sm font-semibold text-gray-700">Receive Job Notifications</span>
                  <p className="text-xs text-gray-500">Get alerts when new jobs matching your interests are posted</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition">
                <input
                  type="checkbox"
                  checked={form.preferences.emailDigest || false}
                  onChange={(e) => onPreferenceChange('emailDigest', e.target.checked)}
                  className="w-4 h-4 accent-yellow-400"
                />
                <div>
                  <span className="text-sm font-semibold text-gray-700">Weekly Email Digest</span>
                  <p className="text-xs text-gray-500">Receive a summary of new contractors and services every week</p>
                </div>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pb-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-8 py-3 rounded-xl text-sm disabled:opacity-60 transition"
            >
              {saving ? 'Saving…' : '✓ Save Profile'}
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
            <p className="text-xs text-blue-200 max-w-xs leading-relaxed">
              Ghar ka kaam, aasaan. India's trusted contractor marketplace connecting verified thekedars with homeowners.
            </p>
          </div>

          <div>
            <div className="font-bold text-white mb-3">Services</div>
            <ul className="space-y-2 text-xs text-white">
              <li><Link to="/contractors" className="!text-white hover:!text-yellow-300">All Categories</Link></li>
              <li><Link to="/contractors" className="!text-white hover:!text-yellow-300">Find Contractors</Link></li>
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
