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

const formatDeadline = (value?: string) => {
  if (!value) return 'Tanpa tenggat';
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });
};

const StudentPortal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortalData();
  }, []);

  const fetchPortalData = async () => {
    try {
      const [announcementsRes, schedulesRes, assignmentsRes] = await Promise.all([
        api.get('/announcements/latest').catch(() => ({ data: { data: [] } })),
        api.get('/schedules/student').catch(() => ({ data: { data: [] } })),
        api.get('/assignments/student').catch(() => ({ data: { data: [] } })),
      ]);
      setAnnouncements(announcementsRes.data.data);
      setSchedules(schedulesRes.data.data);
      setAssignments(assignmentsRes.data.data);
    } catch (error) {
      console.error('Error fetching portal data:', error);
    } finally {
      setLoading(false);
    }
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
      <header className="student-header">
        <div className="student-identity">
          <p className="dashboard-kicker">Selamat datang</p>
          <h1 className="student-name">{user?.name || 'Siswa'}</h1>
          <div className="student-meta">
            {user?.nis && <span>NIS {user.nis}</span>}
            {user?.class_name && <span>{user.class_name}</span>}
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/profile')}
          className="student-profile-button"
        >
          Profil
        </Button>
      </header>

      <div className="student-main">
        <section className="task-panel" aria-labelledby="student-task-title">
          <div className="panel-head">
            <div>
              <h2 id="student-task-title" className="dashboard-section-title">Tugas Terdekat</h2>
              <p className="dashboard-section-desc">
                {assignments.length > 0 ? `${assignments.length} tugas tersedia` : 'Daftar tugas kelas'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/assignments')}
            >
              Semua tugas
            </Button>
          </div>

          {assignments.length > 0 ? (
            <ul className="task-list">
              {assignments.slice(0, 3).map((assignment) => (
                <li key={assignment.id} className="task-item">
                  <div className="task-main">
                    <span className="task-kicker">
                      {assignment.subject_name || 'Mata pelajaran'}
                      {assignment.class_name ? ` · ${assignment.class_name}` : ''}
                    </span>
                    <h3 className="task-title">{assignment.title}</h3>
                    {assignment.description && (
                      <p className="task-description">{assignment.description}</p>
                    )}
                  </div>
                  <div className="task-side">
                    <span className="task-deadline">{formatDeadline(assignment.deadline)}</span>
                    <button
                      type="button"
                      className="task-action"
                      onClick={() => navigate('/assignments')}
                    >
                      Buka
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState description="Belum ada tugas untuk kelasmu saat ini." />
          )}
        </section>

        <aside className="student-agenda" aria-label="Jadwal dan pengumuman">
          <section className="agenda-block">
            <div className="side-block-head">
              <div>
                <h2 className="dashboard-section-title">Jadwal Hari Ini</h2>
                <p className="dashboard-section-desc">{todayName}</p>
              </div>
              <button type="button" className="text-action" onClick={() => navigate('/schedules')}>
                Semua
              </button>
            </div>

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
                        {schedule.room ? `Ruang ${schedule.room}` : 'Ruang belum ditentukan'}
                      </p>
                    </div>
                    <span className={`schedule-pill schedule-pill--${schedule.status || 'upcoming'}`}>
                      {schedule.status === 'ongoing' ? 'Berlangsung' :
                       schedule.status === 'completed' ? 'Selesai' : 'Akan Datang'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState description="Belum ada jadwal untuk hari ini." />
            )}
          </section>

          <section className="agenda-block">
            <div className="side-block-head">
              <div>
                <h2 className="dashboard-section-title">Pengumuman</h2>
                <p className="dashboard-section-desc">Informasi terbaru sekolah</p>
              </div>
              <button type="button" className="text-action" onClick={() => navigate('/announcements')}>
                Semua
              </button>
            </div>

            {announcements.length > 0 ? (
              <div className="announcement-list">
                {announcements.slice(0, 2).map((announcement, index) => (
                  <article key={index} className="announcement-item">
                    <h3 className="announcement-title">{announcement.title}</h3>
                    <p className="announcement-content">{announcement.content}</p>
                    {announcement.created_at && (
                      <time className="announcement-date" dateTime={announcement.created_at}>
                        {new Date(announcement.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </time>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState description="Belum ada pengumuman." />
            )}
          </section>
        </aside>
      </div>

      <section className="menu-section" aria-labelledby="student-menu-title">
        <div className="menu-head">
          <div>
            <h2 id="student-menu-title" className="dashboard-section-title">Menu Siswa</h2>
            <p className="dashboard-section-desc">Akses pembelajaran dan layanan sekolah.</p>
          </div>
        </div>
        <div className="menu-grid reveal-grid">
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className="module-card"
              onClick={() => handleMenuClick(item)}
            >
              <span className="module-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="module-content">
                <span className="module-title">{item.label}</span>
                <span className="module-description">{item.description}</span>
              </span>
              <span className="module-arrow" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default StudentPortal;