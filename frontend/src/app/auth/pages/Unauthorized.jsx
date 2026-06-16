import { Link } from 'react-router-dom';
import balluLogo from '../../../assets/ballu-logo.png';
import balluName from '../../../assets/name.png';

export default function Unauthorized() {
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
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
            <div className="text-6xl mb-6">🚫</div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">403 — Access Denied</h1>
            <p className="text-gray-500 mb-8">
              Your role doesn't have access to this page. If you think this is a mistake, please contact support.
            </p>
            <Link
              to="/"
              className="inline-block bg-blue-700 hover:bg-blue-800 text-white font-semibold px-8 py-3 rounded-xl text-sm"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-blue-700 text-white mt-8">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <img src={balluLogo} alt="Ballu" className="h-8 w-8 rounded-full bg-white p-0.5" />
            <span className="font-bold">Ballu Thekedar</span>
          </div>
          <div className="text-gray-400 text-xs">© {new Date().getFullYear()} Ballu Thekedar.</div>
        </div>
      </footer>
    </div>
  );
}
