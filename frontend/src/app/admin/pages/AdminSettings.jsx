import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext.jsx';
import * as settingsService from '../../settings/service/settings.service.js';
import balluLogo from '../../../assets/ballu-logo.png';
import balluName from '../../../assets/name.png';

const NUM = (v) => v !== undefined && v !== null ? v : '';

export default function AdminSettings() {
  const { user } = useAuth();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    settingsService.getSettings()
      .then(res => {
        const s = res.data || res;
        setForm(s);
      })
      .catch(err => setError(err.response?.data?.message || 'Failed to load settings.'))
      .finally(() => setLoading(false));
  }, []);

  const onField = (path, value) => {
    setForm(f => {
      const clone = JSON.parse(JSON.stringify(f));
      const keys = path.split('.');
      let obj = clone;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      const last = keys[keys.length - 1];
      obj[last] = value === '' ? value : (isNaN(Number(value)) ? value : Number(value));
      return clone;
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);
    setError(null);
    try {
      await settingsService.updateSettings(form);
      setSuccess('Settings saved successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const numInput = (label, path, placeholder) => {
    const keys = path.split('.');
    let val = form;
    for (const k of keys) val = val?.[k];
    return (
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
        <input
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-700"
          type="number"
          value={NUM(val)}
          onChange={e => onField(path, e.target.value)}
          placeholder={placeholder}
        />
      </div>
    );
  };

  const textInput = (label, path, placeholder) => {
    const keys = path.split('.');
    let val = form;
    for (const k of keys) val = val?.[k];
    return (
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
        <input
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-700"
          type="text"
          value={val ?? ''}
          onChange={e => onField(path, e.target.value)}
          placeholder={placeholder}
        />
      </div>
    );
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
            <div className="text-xs text-gray-400">Settings</div>
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
            className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap"
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
            className="px-4 py-3 text-sm font-medium text-blue-700 border-b-2 border-blue-700 whitespace-nowrap"
          >
            ⚙️ Settings
          </Link>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-1">
        {/* Error alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
            <span className="text-lg">⚠️</span> {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading settings…</div>
          </div>
        )}

        {!loading && form && (
          <form onSubmit={onSubmit} className="space-y-8">
            {/* Success alert */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <span className="text-lg">✓</span> {success}
              </div>
            )}

            {/* Lead Settings */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-xl font-extrabold text-gray-900 mb-6">📋 Lead Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {numInput('Default Expiry Days', 'leads.defaultExpiryDays', '3')}
                {numInput('Elite Delay Hours', 'leads.eliteDelayHours', '0')}
                {numInput('Growth Delay Hours', 'leads.growthDelayHours', '2')}
                {numInput('Starter Delay Hours', 'leads.starterDelayHours', '6')}
              </div>
            </div>

            {/* Ranking Weights */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-xl font-extrabold text-gray-900 mb-6">📊 Ranking Weights</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {numInput('Tier Weight', 'ranking.weights.tier', '0.3')}
                {numInput('Rating Weight', 'ranking.weights.rating', '0.25')}
                {numInput('Jobs Weight', 'ranking.weights.jobs', '0.2')}
                {numInput('Response Weight', 'ranking.weights.response', '0.1')}
                {numInput('Badge Weight', 'ranking.weights.badge', '0.1')}
                {numInput('Completeness Weight', 'ranking.weights.completeness', '0.05')}
              </div>
            </div>

            {/* Contact Reveal */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-xl font-extrabold text-gray-900 mb-6">👤 Contact Reveal</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {numInput('Max Per Client Per Day', 'contactReveal.maxPerClientPerDay', '5')}
              </div>
            </div>

            {/* OTP Settings */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-xl font-extrabold text-gray-900 mb-6">🔐 OTP Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {numInput('TTL Minutes', 'otp.ttlMinutes', '10')}
                {numInput('Max Attempts', 'otp.maxAttempts', '5')}
                {numInput('Requests Per Hour', 'otp.requestsPerHour', '3')}
              </div>
            </div>

            {/* Email Settings */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-xl font-extrabold text-gray-900 mb-6">✉️ Email Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {textInput('Support Address', 'email.supportAddress', 'support@example.com')}
              </div>
            </div>

            {/* Submit button */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-8 py-3 rounded-xl text-sm disabled:opacity-60 transition"
              >
                {saving ? '⏳ Saving…' : '💾 Save All Settings'}
              </button>
            </div>
          </form>
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
