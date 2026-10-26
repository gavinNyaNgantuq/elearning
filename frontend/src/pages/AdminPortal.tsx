import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AdminPortal.css';

interface AdminMenuItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  route?: string;
  category: 'master' | 'akademik' | 'informasi';
}

const adminMenuItems: AdminMenuItem[] = [
  // Master Data - Only implemented routes
  {
    id: 'siswa',
    label: 'Siswa',
    description: 'Data siswa dan impor CSV',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    route: '/students',
    category: 'master',
  },
  {
    id: 'guru',
    label: 'Guru',
    description: 'Data guru dan mata pelajaran diampu',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
      </svg>
    ),
    route: '/teachers',
    category: 'master',
  },
  {
    id: 'kelas',
    label: 'Kelas',
    description: 'Daftar kelas, tingkat, jurusan',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <path d="M8 21h8" />
        <path d="M12 17v4" />
      </svg>
    ),
    route: '/classes',
    category: 'master',
  },
  {
    id: 'mapel',
    label: 'Mata Pelajaran',
    description: 'Daftar mata pelajaran, kode, guru pengampu',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="8" y1="7" x2="16" y2="7" />
        <line x1="8" y1="11" x2="16" y2="11" />
      </svg>
    ),
    route: '/subjects',
    category: 'master',
  },
  {
    id: 'tahun-ajaran',
    label: 'Tahun Ajaran',
    description: 'Tahun ajaran dan semester aktif',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    route: '/tahun-ajaran',
    category: 'master',
  },

  // Akademik - Only implemented routes
  {
    id: 'jadwal',
    label: 'Jadwal',
    description: 'Jadwal pelajaran mingguan seluruh kelas',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    route: '/schedules',
    category: 'akademik',
  },
  {
    id: 'materi',
    label: 'Materi',
    description: 'Materi pembelajaran terbaru',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="8" y1="7" x2="16" y2="7" />
        <line x1="8" y1="11" x2="16" y2="11" />
      </svg>
    ),
    route: '/materials',
    category: 'akademik',
  },
  {
    id: 'tugas',
    label: 'Tugas',
    description: 'Daftar tugas yang tersedia',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      </svg>
    ),
    route: '/assignments',
    category: 'akademik',
  },
  {
    id: 'ujian',
    label: 'Ujian',
    description: 'Manajemen ujian dan ulangan (Full CRUD)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </svg>
    ),
    route: '/exams/manage',
    category: 'akademik',
  },

  // Informasi
  {
    id: 'pengumuman',
    label: 'Pengumuman',
    description: 'Daftar pengumuman sekolah',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="21 8 21 21 3 21 3 8" />
        <rect x="1" y="3" width="22" height="5" />
        <line x1="10" y1="12" x2="14" y2="12" />
      </svg>
    ),
    route: '/announcements',
    category: 'informasi',
  },
];

const EmptyState = ({ description }: { description: string }) => (
  <div className="empty-state">
    <p>{description}</p>
  </div>
);

const LoadingState = () => (
  <div className="portal-loading">
    <div className="loading-spinner" />
    <p>Memuat...</p>
  </div>
);

const AdminPortal = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'master' | 'akademik' | 'informasi'>('master');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [announcementsRes] = await Promise.all([
        api.get('/announcements/latest').catch(() => ({ data: { data: [] } })),
      ]);
      setAnnouncements(announcementsRes.data.data);
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (item: AdminMenuItem) => {
    if (item.route) {
      navigate(item.route);
    }
  };

  const filteredItems = adminMenuItems.filter(item => item.category === activeCategory);
  const categoryMeta = {
    master: { label: 'Data Master', description: 'Data induk siswa, guru, kelas, mata pelajaran, dan tahun ajaran.' },
    akademik: { label: 'Akademik', description: 'Jadwal, materi, tugas, dan ujian.' },
    informasi: { label: 'Informasi', description: 'Pengumuman dan informasi sekolah.' },
  }[activeCategory];

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard-header">
        <div>
          <p className="dashboard-kicker">Ruang kerja admin</p>
          <h1 className="dashboard-title">Dashboard Admin</h1>
          <p className="dashboard-subtitle">Akses cepat data master dan operasional akademik.</p>
        </div>
        <p className="admin-category-summary" aria-live="polite">
          {filteredItems.length} modul &middot; {categoryMeta.label}
        </p>
      </header>

      <div className="admin-layout">
        <section className="module-index" aria-label={`Modul ${categoryMeta.label}`}>
          <div className="module-index-head">
            <div>
              <h2 className="dashboard-section-title">{categoryMeta.label}</h2>
              <p className="dashboard-section-desc">{categoryMeta.description}</p>
            </div>
          </div>

          <div className="category-tabs" role="tablist" aria-label="Kategori modul">
            {[
              { key: 'master', label: 'Data Master', count: adminMenuItems.filter(i => i.category === 'master').length },
              { key: 'akademik', label: 'Akademik', count: adminMenuItems.filter(i => i.category === 'akademik').length },
              { key: 'informasi', label: 'Informasi', count: adminMenuItems.filter(i => i.category === 'informasi').length },
            ].map((cat) => (
              <button
                key={cat.key}
                type="button"
                role="tab"
                aria-selected={activeCategory === cat.key}
                className={`category-tab ${activeCategory === cat.key ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.key as typeof activeCategory)}
              >
                <span>{cat.label}</span>
                <span className="tab-badge">{cat.count}</span>
              </button>
            ))}
          </div>

          <div className="module-list">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="module-row"
                onClick={() => handleMenuClick(item)}
              >
                <span className="module-row-icon" aria-hidden="true">{item.icon}</span>
                <span className="module-row-content">
                  <span className="module-row-title">{item.label}</span>
                  <span className="module-row-description">{item.description}</span>
                </span>
                <span className="module-row-arrow" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
        </section>

        <aside className="admin-aside" aria-label="Pengumuman terbaru">
          <div className="aside-head">
            <h2 className="dashboard-section-title">Pengumuman</h2>
            <span className="aside-count">{announcements.length}</span>
          </div>
          {announcements.length > 0 ? (
            <div className="announcement-list">
              {announcements.slice(0, 3).map((announcement, index) => (
                <article key={index} className="announcement-item">
                  <h3 className="announcement-title">{announcement.title}</h3>
                  <p className="announcement-content">{announcement.content}</p>
                  {announcement.created_at && (
                    <time className="announcement-date" dateTime={announcement.created_at}>
                      {new Date(announcement.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </time>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState description="Belum ada pengumuman." />
          )}
        </aside>
      </div>
    </div>
  );
}

export default AdminPortal;