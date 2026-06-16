import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Topbar({ title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <strong>MonilCorpus</strong>
        <span className="topbar__sep">/</span>
        <span className="topbar__title">{title}</span>
      </div>
      <div className="topbar__right">
        {user && (
          <span className="topbar__user">
            {user.name} <span className="role-badge">{user.role}</span>
          </span>
        )}
        <button className="btn btn--ghost btn--sm" onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
}
