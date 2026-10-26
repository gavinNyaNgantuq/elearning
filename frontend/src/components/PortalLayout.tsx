import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Badge from './Badge';
import ThemeToggle from './ThemeToggle';
import './PortalLayout.css';

const ROLE_LABELS: Record<string, string> = {
  siswa: 'Siswa',
  guru: 'Guru',
  admin: 'Admin',
};

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
  icon: React.ReactNode;
}

function icon(path: React.ReactNode) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}

const ICONS = {
  dashboard: icon(
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  users: icon(
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  user: icon(
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  class: icon(
    <>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </>
  ),
  book: icon(
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ),
  calendar: icon(
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  task: icon(
    <>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M9 13l2 2 4-4" />
    </>
  ),
  exam: icon(
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="15" y2="17" />
    </>
  ),
  chart: icon(
    <>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </>
  ),
  check: icon(
    <>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </>
  ),
  note: icon(
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </>
  ),
  archive: icon(
    <>
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </>
  ),
  library: icon(
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="8" y1="7" x2="16" y2="7" />
    </>
  ),
  megaphone: icon(
    <>
      <path d="M3 11l18-8-8 18-2.5-7.5L3 11z" />
    </>
  ),
};

interface NavGroup {
  title?: string;
  items: NavItem[];
}

function navForRole(role?: string): NavGroup[] {
  const dash: NavItem = { to: '/dashboard', label: 'Dashboard', end: true, icon: ICONS.dashboard };
  if (role === 'admin') {
    return [
      { items: [dash] },
      {
        title: 'Data Master',
        items: [
          { to: '/students', label: 'Siswa', icon: ICONS.users },
          { to: '/teachers', label: 'Guru', icon: ICONS.user },
          { to: '/classes', label: 'Kelas', icon: ICONS.class },
          { to: '/subjects', label: 'Mata Pelajaran', icon: ICONS.book },
          { to: '/tahun-ajaran', label: 'Tahun Ajaran', icon: ICONS.calendar },
        ],
      },
      {
        title: 'Akademik',
        items: [
          { to: '/schedules', label: 'Jadwal', icon: ICONS.calendar },
          { to: '/materials', label: 'Materi', icon: ICONS.book },
          { to: '/assignments', label: 'Tugas', icon: ICONS.task },
          { to: '/exams/manage', label: 'Ujian', icon: ICONS.exam },
        ],
      },
      {
        title: 'Informasi',
        items: [{ to: '/announcements', label: 'Pengumuman', icon: ICONS.megaphone }],
      },
    ];
  }
  if (role === 'guru') {
    return [
      {
        items: [
          dash,
          { to: '/schedules', label: 'Jadwal Mengajar', icon: ICONS.calendar },
          { to: '/materials', label: 'Materi', icon: ICONS.book },
          { to: '/assignments', label: 'Tugas', icon: ICONS.task },
          { to: '/exams/manage', label: 'Ujian', icon: ICONS.exam },
          { to: '/announcements', label: 'Pengumuman', icon: ICONS.megaphone },
        ],
      },
    ];
  }
  return [
    {
      items: [
        dash,
        { to: '/schedules', label: 'Jadwal', icon: ICONS.calendar },
        { to: '/materials', label: 'Materi', icon: ICONS.book },
        { to: '/assignments', label: 'Tugas', icon: ICONS.task },
        { to: '/exam/enter-token', label: 'Ujian', icon: ICONS.exam },
        { to: '/nilai', label: 'Nilai', icon: ICONS.chart },
        { to: '/absensi', label: 'Absensi', icon: ICONS.check },
        { to: '/announcements', label: 'Pengumuman', icon: ICONS.megaphone },
      ],
    },
  ];
}

function mobileNavForRole(role?: string): NavItem[] {
  if (role === 'admin') {
    return [
      { to: '/dashboard', label: 'Home', end: true, icon: ICONS.dashboard },
      { to: '/students', label: 'Siswa', icon: ICONS.users },
      { to: '/schedules', label: 'Jadwal', icon: ICONS.calendar },
      { to: '/exams/manage', label: 'Ujian', icon: ICONS.exam },
      { to: '/announcements', label: 'Info', icon: ICONS.megaphone },
    ];
  }
  if (role === 'guru') {
    return [
      { to: '/dashboard', label: 'Home', end: true, icon: ICONS.dashboard },
      { to: '/schedules', label: 'Jadwal', icon: ICONS.calendar },
      { to: '/materials', label: 'Materi', icon: ICONS.book },
      { to: '/exams/manage', label: 'Ujian', icon: ICONS.exam },
      { to: '/announcements', label: 'Info', icon: ICONS.megaphone },
    ];
  }
  return [
    { to: '/dashboard', label: 'Home', end: true, icon: ICONS.dashboard },
    { to: '/schedules', label: 'Jadwal', icon: ICONS.calendar },
    { to: '/assignments', label: 'Tugas', icon: ICONS.task },
    { to: '/exam/enter-token', label: 'Ujian', icon: ICONS.exam },
    { to: '/nilai', label: 'Nilai', icon: ICONS.chart },
  ];
}

export default function PortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [veil, setVeil] = useState<'in' | 'out' | null>(null);
  const lastPath = useRef(location.pathname);
  const veilTimers = useRef<number[]>([]);

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const clearVeilTimers = () => {
    veilTimers.current.forEach((t) => window.clearTimeout(t));
    veilTimers.current = [];
  };

  useEffect(() => {
    if (lastPath.current === location.pathname) return;
    lastPath.current = location.pathname;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    clearVeilTimers();
    setVeil('in');
    veilTimers.current.push(
      window.setTimeout(() => setVeil('out'), 120),
      window.setTimeout(() => setVeil(null), 120 + 200)
    );
    return clearVeilTimers;
  }, [location.pathname]);

  useEffect(() => {
    if (!profileOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.name?.trim() || 'Pengguna';

  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');

  const roleLabel = user?.role ? ROLE_LABELS[user.role] || user.role : '';

  const closeProfileMenu = () => setProfileOpen(false);

  const getAcademicPeriod = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const semester = month >= 6 ? 'Ganjil' : 'Genap';
    const academicYear = `${year}/${year + 1}`;
    return { academicYear, semester };
  };

  const { academicYear, semester } = getAcademicPeriod();
  const navGroups = navForRole(user?.role);
  const mobileNav = mobileNavForRole(user?.role);
  const showSidebar = user?.role !== 'siswa';
  const isExamMode = location.pathname.startsWith('/exam/');

  return (
    <div className={`portal${isExamMode ? ' portal--exam' : ''}`}>
      {/* Sidebar — desktop & tablet */}
      {showSidebar ? (
        <div>
          <aside className="portal-sidebar" aria-label="Navigasi utama">
            <div className="sidebar-brand">
              <img
                src="/assets/image1.png"
                alt="Logo SMK Bhakti Anindya"
                className="sidebar-logo"
              />
              <div className="sidebar-school">
                <p className="sidebar-school-name">SMK Bhakti Anindya</p>
                <Badge variant="blue">E-Learning</Badge>
              </div>
            </div>
            <nav className="sidebar-nav">
              {navGroups.map((group, gi) => (
                <div key={gi} className="sidebar-group">
                  {group.title && <p className="sidebar-group-title">{group.title}</p>}
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `sidebar-link${isActive ? ' sidebar-link-active' : ''}`
                      }
                    >
                      <span className="sidebar-link-icon">{item.icon}</span>
                      <span className="sidebar-link-label">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              ))}
            </nav>
            <div className="sidebar-footer">
              <p className="sidebar-period">
                TP: {academicYear} &middot; Smt: {semester}
              </p>
            </div>
          </aside>
        </div>
      ) : (
        <div />
      )}

      <div className="portal-body">
        {/* Header */}
        <header className="portal-header">
          <div className="portal-header-content">
            <div className="school-brand">
              <img
                src="/assets/image1.png"
                alt="Logo SMK Bhakti Anindya"
                className="school-logo"
              />
              <div className="school-info">
                <h1 className="school-name">SMK Bhakti Anindya</h1>
                <p className="school-meta">
                  <span className="meta-item">TP: {academicYear}</span>
                  <span className="meta-separator" aria-hidden="true">|</span>
                  <span className="meta-item">Smt: {semester}</span>
                </p>
              </div>
            </div>
            <div className="header-actions">
              <ThemeToggle />
              <div className="profile-menu-wrapper" ref={profileRef}>
                <button
                  type="button"
                  className="header-profile"
                  onClick={() => setProfileOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                  aria-label="Menu profil"
                >
                  <span className="profile-initial" aria-hidden="true">
                    {initials}
                  </span>
                  <span className="profile-text">
                    <span className="profile-name">{displayName}</span>
                    {roleLabel && (
                      <span className="profile-role">{roleLabel}</span>
                    )}
                  </span>
                </button>
                {profileOpen && (
                  <div className="profile-menu" role="menu" aria-label="Profil">
                    <button
                      type="button"
                      className="profile-menu-item"
                      role="menuitem"
                      onClick={() => {
                        closeProfileMenu();
                        navigate('/profile');
                      }}
                    >
                      Profil Saya
                    </button>
                    <button
                      type="button"
                      className="profile-menu-item profile-menu-item--danger"
                      role="menuitem"
                      onClick={() => {
                        closeProfileMenu();
                        handleLogout();
                      }}
                    >
                      Keluar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="portal-main">
          {veil && (
            <div
              className={`page-veil ${veil === 'in' ? 'is-in' : 'is-out'}`}
              aria-hidden="true"
            />
          )}
          <div key={location.pathname} className="page-enter">
            <Outlet />
          </div>
        </main>

        {/* Navigasi mobile bawah */}
        <nav className="mobile-nav" aria-label="Navigasi mobile">
          {mobileNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `mobile-nav-link${isActive ? ' mobile-nav-link-active' : ''}`
              }
            >
              <span className="mobile-nav-icon">{item.icon}</span>
              <span className="mobile-nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
