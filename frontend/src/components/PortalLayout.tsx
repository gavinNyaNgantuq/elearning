import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Badge from './Badge';
import ThemeToggle from './ThemeToggle';
import './PortalLayout.css';

const ROLE_LABELS: Record<string, string> = {
  siswa: 'Siswa',
  guru: 'Guru',
  admin: 'Admin',
};

export default function PortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Transisi halaman: veil translusen menutup konten lama
  // (perasaan fade-out ~120ms), lalu terbuka saat konten baru
  // fade-in (240ms, kelas .page-enter). Header/sidebar tidak
  // ikut beranimasi. Dimatikan total saat prefers-reduced-motion.
  const [veil, setVeil] = useState<'in' | 'out' | null>(null);
  const lastPath = useRef(location.pathname);
  const veilTimers = useRef<number[]>([]);

  // Dropdown profil (avatar + nama di header)
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const clearVeilTimers = () => {
    veilTimers.current.forEach((t) => window.clearTimeout(t));
    veilTimers.current = [];
  };

  useEffect(() => {
    // Aman terhadap double-effect (StrictMode): hanya jalan saat
    // path benar-benar berubah.
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

  // Tutup dropdown saat klik di luar atau tekan Escape
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

  // Handler logout yang sudah ada — dipakai ulang di dropdown
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Nama tampil: nama lengkap dari data login.
  // Tidak ada field username terpisah di data user, jadi
  // nama user adalah sumber utama (fallback: "Pengguna").
  const displayName = user?.name?.trim() || 'Pengguna';

  // Inisial avatar dari nama yang sama, maksimal 2 karakter:
  // "Andi Pratama" → "AP", "Andi" → "A"
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');

  const roleLabel = user?.role ? ROLE_LABELS[user.role] || user.role : '';

  const closeProfileMenu = () => setProfileOpen(false);

  // Format academic period
  const getAcademicPeriod = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    // Semester Ganjil: Juli - Des, Semester Genap: Jan - Jun
    const semester = month >= 6 ? 'Ganjil' : 'Genap';
    const academicYear = `${year}/${year + 1}`;
    return { academicYear, semester };
  };

  const { academicYear, semester } = getAcademicPeriod();

  return (
    <div className="portal">
      {/* School Header */}
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
              <Badge variant="blue">E-Learning</Badge>
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
    </div>
  );
}
