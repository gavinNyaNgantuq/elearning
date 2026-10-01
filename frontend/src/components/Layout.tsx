import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = () => {
    if (user?.role === 'siswa') {
      return [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/exam/enter-token', label: 'Ikuti Ujian' },
      ];
    }
    return [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/exams', label: 'Daftar Ujian' },
      { to: '/exams/create', label: 'Buat Ujian' },
    ];
  };

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-logo">E-Learning</h1>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <p className="user-name">{user?.username}</p>
            <p className="user-role">{user?.role}</p>
          </div>
        </div>

        <ul className="sidebar-nav">
          {getNavItems().map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-logout">
            Keluar
          </button>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
