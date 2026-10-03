import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Button from '../components/Button';
import './Portal.css';

type MenuId =
  | 'jadwal'
  | 'materi'
  | 'tugas'
  | 'ujian'
  | 'nilai'
  | 'absensi'
  | 'catatan'
  | 'arsip'
  | 'eperpus';

interface MenuItem {
  id: MenuId;
  label: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  route?: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'jadwal',
    label: 'Jadwal Pelajaran',
    description: 'Lihat jadwal pelajaran hari ini dan minggu ini',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    accentColor: 'blue',
    route: '/schedules',
  },
  {
    id: 'materi',
    label: 'Materi',
    description: 'Akses materi pembelajaran dari guru',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="8" y1="7" x2="16" y2="7" />
        <line x1="8" y1="11" x2="16" y2="11" />
      </svg>
    ),
    accentColor: 'cyan',
    route: '/materials',
  },
  {
    id: 'tugas',
    label: 'Tugas',
    description: 'Tugas yang perlu dikerjakan dan dikumpulkan',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      </svg>
    ),
    accentColor: 'orange',
    route: '/assignments',
  },
  {
    id: 'ujian',
    label: 'Ujian / Ulangan',
    description: 'Evaluasi pembelajaran dan ujian yang tersedia',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </svg>
    ),
    accentColor: 'indigo',
    route: '/exam/enter-token',
  },
  {
    id: 'nilai',
    label: 'Nilai Hasil',
    description: 'Lihat hasil belajar dan penilaian',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    accentColor: 'green',
    route: '/nilai',
  },
  {
    id: 'absensi',
    label: 'Absensi',
    description: 'Riwayat kehadiran dan status kehadiran',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    accentColor: 'teal',
    route: '/absensi',
  },
  {
    id: 'catatan',
    label: 'Catatan Guru',
    description: 'Catatan dan feedback dari guru',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    accentColor: 'purple',
    route: '/catatan',
  },
  {
    id: 'arsip',
    label: 'Arsip',
    description: 'Dokumen dan materi yang telah diarsipkan',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="21 8 21 21 3 21 3 8" />
        <rect x="1" y="3" width="22" height="5" />
        <line x1="10" y1="12" x2="14" y2="12" />
      </svg>
    ),
    accentColor: 'slate',
    route: '/arsip',
  },
  {
    id: 'eperpus',
    label: 'E-Perpus',
    description: 'Akses koleksi perpustakaan digital',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="8" y1="7" x2="16" y2="7" />
        <line x1="8" y1="11" x2="16" y2="11" />
      </svg>
    ),
    accentColor: 'pink',
    route: '/eperpus',
  },
];

const EmptyState = ({
  description,
}: {
  description: string;
}) => {
  return (
    <div className="empty-state">
      <p>{description}</p>
    </div>
  );
};

const getTodaySchedules = (schedules: any[]) => {
  const days = [
    'minggu',
    'senin',
    'selasa',
    'rabu',
    'kamis',
    'jumat',
    'sabtu',
  ];
  const today = days[new Date().getDay()];
  return schedules.filter((s: any) => s.day === today);
};

const formatDayName = (day: string) => {
  const dayNames: Record<string, string> = {
    senin: 'Senin',
    selasa: 'Selasa',
    rabu: 'Rabu',
    kamis: 'Kamis',
    jumat: 'Jumat',
    sabtu: 'Sabtu',
    minggu: 'Minggu',
  };
  return dayNames[day.toLowerCase()] || day;
};

const getInitials = (name?: string) =>
  (name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');

const StudentPortal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortalData();
  }, []);

  const fetchPortalData = async () => {
    try {
      const [announcementsRes, schedulesRes] = await Promise.all([
        api.get('/announcements/latest').catch(() => ({ data: { data: [] } })),
        api.get('/schedules/student').catch(() => ({ data: { data: [] } })),
      ]);
      setAnnouncements(announcementsRes.data.data);
      setSchedules(schedulesRes.data.data);
    } catch (error) {
      console.error('Error fetching portal data:', error);
    } finally {
      setLoading(false);
    }
  };

const getProfileInfo = () => {
  if (!user) return null;
  const classInfo = user.class_name || '';
  const nis = user.nis || '';
  if (!nis && !classInfo) return null;
  return (
    <div className="profile-info">
      {nis && <p className="profile-nis">NIS: {nis}</p>}
      {classInfo && <p className="profile-class">{classInfo}</p>}
    </div>
  );
};

  const todaySchedules = getTodaySchedules(schedules);
  const todayName = formatDayName(new Date().toLocaleDateString('id-ID', { weekday: 'long' }));

  const handleMenuClick = (item: MenuItem) => {
    if (item.route) {
      navigate(item.route);
    }
  };

  if (loading) {
    return (
      <div className="portal-loading">
        <div className="loading-spinner" />
        <p>Memuat dashboard...</p>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      {/* Welcome / Profile Hero */}
      <section className="hero-section">
        <div className="hero-card">
          <div className="hero-content">
            <div className="hero-greeting">
              <p className="greeting-label">Selamat datang,</p>
              <h1 className="greeting-name">{user?.name || 'Siswa'}</h1>
            </div>
            <div className="hero-meta">
              {getProfileInfo()}
            <Button
              variant="secondary"
              onClick={() => navigate('/profile')}
              className="hero-profile-button"
            >
              Lihat Profil Lengkap
            </Button>
            </div>
          </div>
          <div className="hero-avatar" aria-hidden="true">
            {getInitials(user?.name)}
          </div>
        </div>
      </section>

      {/* Menu Utama */}
      <section className="menu-section">
        <h2 className="section-title">Menu Utama</h2>
        <div className="menu-grid reveal-grid">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`module-card module-card--${item.accentColor}`}
              onClick={() => handleMenuClick(item)}
            >
              <div className="module-icon">
                {item.icon}
              </div>
              <div className="module-content">
                <h3 className="module-title">{item.label}</h3>
                <p className="module-description">{item.description}</p>
              </div>
              <div className="module-arrow" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Content Grid: Pengumuman + Jadwal Hari Ini */}
      <div className="content-grid">
        {/* Pengumuman */}
        <section className="info-section">
          <div className="section-header">
            <h2 className="section-title">Pengumuman</h2>
          </div>
          <div className="section-content">
            {announcements.length > 0 ? (
              <div className="announcement-list">
                {announcements.slice(0, 3).map((announcement, index) => (
                  <div key={index} className="announcement-item">
                    <div className="announcement-header">
                      <h3 className="announcement-title">{announcement.title}</h3>
                    </div>
                    <p className="announcement-content">{announcement.content}</p>
                    {announcement.created_at && (
                      <time className="announcement-date" dateTime={announcement.created_at}>
                        {new Date(announcement.created_at).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </time>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                description="Belum ada pengumuman yang tersedia."
              />
            )}
          </div>
        </section>

        {/* Jadwal Hari Ini */}
        <section className="schedule-section">
          <div className="section-header">
            <h2 className="section-title">Jadwal Hari Ini</h2>
            <p className="schedule-day">{todayName}</p>
          </div>
          <div className="section-content">
            {todaySchedules.length > 0 ? (
              <div className="schedule-list">
                {todaySchedules.map((schedule, index) => (
                  <div key={index} className="schedule-item">
                    <div className="schedule-time">
                      {schedule.start_time?.substring(0, 5)}
                    </div>
                    <div className="schedule-info">
                      <h3 className="schedule-subject">
                        {schedule.subject_name || 'Mata Pelajaran'}
                      </h3>
                      <p className="schedule-teacher">
                        {schedule.teacher_nip ? `Guru: ${schedule.teacher_nip}` : ''}
                        {schedule.room && ` • Ruang: ${schedule.room}`}
                      </p>
                    </div>
                    <div className="schedule-status">
                      <span className={`status-badge status-${schedule.status || 'upcoming'}`}>
                        {schedule.status === 'ongoing' ? 'Sedang Berlangsung' :
                         schedule.status === 'completed' ? 'Selesai' : 'Akan Datang'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                description="Belum ada jadwal untuk hari ini."
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default StudentPortal;