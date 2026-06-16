import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import balluLogo from '../../../assets/ballu-logo.png';
import balluName from '../../../assets/name.png';

const HOME_BY_ROLE = {
  CLIENT: '/client/home',
  CONTRACTOR: '/contractor/home',
  ADMIN: '/admin/home',
  SUPER_ADMIN: '/admin/home',
};

export default function LoginPage({ role }) {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const isContractor = role === 'CONTRACTOR';
  const signupPath = isContractor ? '/contractor/signup' : '/client/signup';
  const otherLogin = isContractor ? '/client/login' : '/contractor/login';

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      const user = await login(form);
      if (user.role !== role && (user.role === 'CLIENT' || user.role === 'CONTRACTOR')) {
        setNotice(`This account is a ${user.role}. Redirecting…`);
      }
      navigate(HOME_BY_ROLE[user.role] || '/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="w-full bg-yellow-400 text-sm">
        <div className="max-w-7xl mx-auto px-6 py-2 flex justify-between items-center text-gray-900">
          <span>📞 Helpline: 1800-BALLU-99</span>
          <span>📍 Serving 40+ Cities across India</span>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={balluLogo} alt="Ballu" className="h-12 w-auto" />
            <img src={balluName} alt="Ballu Thekedar" className="h-14 w-auto" />
          </Link>
          <Link to="/" className="text-sm text-gray-500 hover:text-blue-700">← Back to Home</Link>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Role badge */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-4 ${
              isContractor ? 'bg-blue-700 text-white' : 'bg-yellow-400 text-gray-900'
            }`}>
              {isContractor ? 'Contractor Portal' : 'Client Portal'}
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900">Welcome back!</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Sign in to your {isContractor ? 'contractor' : 'client'} account
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">

            {notice && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-xl px-4 py-3 mb-5">
                {notice}
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={onChange}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent bg-gray-50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl font-bold text-sm transition disabled:opacity-60 disabled:cursor-not-allowed ${
                  isContractor
                    ? 'bg-blue-700 hover:bg-blue-800 text-white'
                    : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
                }`}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">OR</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="space-y-3 text-center text-sm">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link to={signupPath} className="!text-blue-700 font-semibold hover:underline">
                  Sign up for free
                </Link>
              </p>
              <p className="text-gray-400">
                <Link to={otherLogin} className="!text-gray-500 hover:!text-blue-700">
                  Sign in as {isContractor ? 'Client' : 'Contractor'} instead
                </Link>
              </p>
            </div>
          </div>

          {/* Bottom info */}
          <div className={`mt-6 rounded-2xl p-5 ${isContractor ? 'bg-blue-700 text-white' : 'bg-yellow-400 text-gray-900'}`}>
            <div className="text-xs font-bold tracking-wider mb-2 opacity-80">
              {isContractor ? 'WHY JOIN AS A CONTRACTOR?' : 'WHY HIRE ON BALLU?'}
            </div>
            {isContractor ? (
              <ul className="text-sm space-y-1">
                <li>✓ Get daily job leads in your area</li>
                <li>✓ Earn ₹50k+ per month on average</li>
                <li>✓ Free signup, no hidden charges</li>
              </ul>
            ) : (
              <ul className="text-sm space-y-1">
                <li>✓ 12,000+ verified thekedars</li>
                <li>✓ Transparent pricing & reviews</li>
                <li>✓ Chat directly on WhatsApp</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
