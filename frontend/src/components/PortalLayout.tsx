import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './PortalLayout.css';

export default function PortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="portal">
      {/* School Header */}
      <header className="portal-header">
        <div className="portal-header-content">
          <div className="school-info">
            <h1 className="school-name">SMK NEGERI 1 KOTA BEKASI</h1>
            <p className="school-meta">TP: 2026/2027 &nbsp;|&nbsp; Smt: Ganjil</p>
          </div>
          <div className="header-actions">
            <button className="header-profile">
              <span className="profile-initial">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
              <span className="profile-name">{user?.username}</span>
            </button>
            <button onClick={handleLogout} className="header-logout">
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="portal-main">
        <Outlet />
      </main>
    </div>
  );
}
