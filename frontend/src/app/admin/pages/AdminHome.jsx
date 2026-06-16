import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext.jsx';
import { api } from '../../../config/api.js';
import balluLogo from '../../../assets/ballu-logo.png';
import balluName from '../../../assets/name.png';

export default function AdminHome() {
  const { user } = useAuth();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/users?limit=20&sortBy=createdAt:desc');
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const deleteUser = async (id) => {
    if (!confirm(`Delete user ${id}?`)) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
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
            <div className="text-xs text-gray-400">{user?.role}</div>
          </div>
        </div>
      </header>

      {/* Navigation tabs */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 flex gap-1">
          <Link
            to="/admin/home"
            className="px-4 py-3 text-sm font-medium text-blue-700 border-b-2 border-blue-700"
          >
            👥 Users
          </Link>
          <Link
            to="/admin/categories"
            className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300"
          >
            🏷️ Categories
          </Link>
          <Link
            to="/admin/cities"
            className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300"
          >
            🏙️ Cities
          </Link>
          <Link
            to="/admin/contractors"
            className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300"
          >
            👷 Contractors
          </Link>
          <Link
            to="/admin/settings"
            className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300"
          >
            ⚙️ Settings
          </Link>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-1">
        {/* Welcome section */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Welcome, {user?.name}</h1>
          <p className="text-gray-600 text-sm">
            You're signed in as <span className="font-semibold text-blue-700">{user?.role}</span>. Manage system users below.
            <code className="block text-xs text-gray-500 mt-1 font-mono">
              Note: DELETE only works as SUPER_ADMIN. Regular ADMIN will get a 403.
            </code>
          </p>
        </div>

        {/* Users section */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">
                All Users {users?.totalResults != null && <span className="text-gray-400 font-normal">({users.totalResults})</span>}
              </h2>
            </div>
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2 rounded-xl text-sm disabled:opacity-60 transition"
            >
              {loading ? '🔄 Refreshing…' : '🔄 Refresh'}
            </button>
          </div>

          {/* Error alert */}
          {error && (
            <div className="px-6 py-4 bg-red-50 border-b border-red-200">
              <p className="text-red-700 text-sm font-medium">⚠️ {error}</p>
            </div>
          )}

          {/* Table */}
          {users?.results && users.results.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Role</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Verified</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.results.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3 text-gray-900 font-medium">{u.name}</td>
                      <td className="px-6 py-3 text-gray-600">{u.email}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-red-100 text-red-700'
                            : u.role === 'ADMIN'
                            ? 'bg-blue-100 text-blue-700'
                            : u.role === 'CONTRACTOR'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {u.isEmailVerified ? (
                          <span className="text-green-600 font-semibold">✓ Verified</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => deleteUser(u.id)}
                          disabled={u.id === user.id || loading}
                          title={u.id === user.id ? "Can't delete yourself" : 'Delete user'}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            u.id === user.id || loading
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-red-50 text-red-600 hover:bg-red-100'
                          }`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500 text-sm">No users found.</p>
            </div>
          )}
        </div>
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
