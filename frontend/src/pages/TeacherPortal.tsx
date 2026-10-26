import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './TeacherPortal.css';

interface TeacherMenuItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  route?: string;
  category: 'teaching' | 'content' | 'assessment';
}

const teacherMenuItems: TeacherMenuItem[] = [
  // Teaching
  {
    id: 'jadwal',
    label: 'Jadwal Mengajar',
    description: 'Jadwal mengajar mingguan dan harian',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    route: '/schedules',
    category: 'teaching',
  },
  {
    id: 'pengumuman',
    label: 'Pengumuman',
    description: 'Pengumuman untuk kelas',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="21 8 21 21 3 21 3 8" />
        <rect x="1" y="3" width="22" height="5" />
        <line x1="10" y1="12" x2="14" y2="12" />
      </svg>
    ),
    route: '/announcements',
    category: 'teaching',
  },

  // Content
  {
    id: 'materi',
    label: 'Materi',
    description: 'Materi pembelajaran dari guru',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="8" y1="7" x2="16" y2="7" />
        <line x1="8" y1="11" x2="16" y2="11" />
      </svg>
    ),
    route: '/materials',
    category: 'content',
  },

  // Assessment - Exams has CRUD for Guru
  {
    id: 'ujian',
    label: 'Ujian',
    description: 'Ujian dan ulangan (Full CRUD untuk Guru)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </svg>
    ),
    route: '/exams/manage',
    category: 'assessment',
  },
  {
    id: 'koreksi',
    label: 'Koreksi Nilai',
    description: 'Periksa jawaban dan koreksi nilai ujian siswa',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
    route: '/correction',
    category: 'assessment',
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
    <p>Memuat portal guru...</p>
  </div>
);

const getTodayName = () => {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[new Date().getDay()];
};

const formatTime = (time?: string) => time?.substring(0, 5) || '--:--';

const formatDeadline = (value?: string) => {
  if (!value) return 'Tanpa tenggat';
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });
};

const TeacherPortal = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'teaching' | 'content' | 'assessment'>('teaching');

  useEffect(() => {
    fetchPortalData();
  }, []);

  const fetchPortalData = async () => {
    try {
      const [schedulesRes, announcementsRes, assignmentsRes] = await Promise.all([
        api.get('/schedules/teacher').catch(() => ({ data: { data: [] } })),
        api.get('/announcements/latest').catch(() => ({ data: { data: [] } })),
        api.get('/assignments/teacher').catch(() => ({ data: { data: [] } })),
      ]);
      setSchedules(schedulesRes.data.data);
      setAnnouncements(announcementsRes.data.data);
      setAssignments(assignmentsRes.data.data);
    } catch (error) {
      console.error('Error fetching teacher portal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTodaySchedules = () => {
    const days = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    const today = days[new Date().getDay()];
    return schedules.filter(s => s.day === today);
  };

  const handleMenuClick = (item: TeacherMenuItem) => {
    if (item.route) {
      navigate(item.route);
    }
  };

  const filteredItems = teacherMenuItems.filter(item => item.category === activeCategory);
  const todaySchedules = getTodaySchedules();

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="teacher-dashboard">
      <header className="teacher-dashboard-header">
        <div>
          <p className="dashboard-kicker">Agenda guru</p>
          <h1 className="dashboard-title">Agenda Mengajar</h1>
          <p className="dashboard-subtitle">
            {getTodayName()} &middot; {todaySchedules.length} sesi &middot; {assignments.length} tugas
          </p>
        </div>
        <div className="teacher-focus-count" aria-label={`${todaySchedules.length} sesi hari ini`}>
          <strong>{todaySchedules.length}</strong>
          <span>sesi hari ini</span>
        </div>
      </header>

      <div className="teacher-layout">
        <section className="agenda-panel" aria-labelledby="teacher-schedule-title">
          <div className="panel-head">
            <div>
              <h2 id="teacher-schedule-title" className="dashboard-section-title">Jadwal Hari Ini</h2>
              <p className="dashboard-section-desc">{getTodayName()}</p>
            </div>
            <button type="button" className="text-action" onClick={() => navigate('/schedules')}>
              Semua jadwal
            </button>
          </div>

          {todaySchedules.length > 0 ? (
            <ol className="agenda-timeline">
              {todaySchedules.map((schedule, index) => (
                <li key={index} className="agenda-item">
                  <div className="agenda-time">
                    <strong>{formatTime(schedule.start_time)}</strong>
                    <span>{formatTime(schedule.end_time)}</span>
                  </div>
                  <span
                    className={`agenda-marker agenda-marker--${schedule.status || 'upcoming'}`}
                    aria-hidden="true"
                  />
                  <div className="agenda-body">
                    <div className="agenda-title-row">
                      <h3 className="agenda-title">{schedule.subject_name}</h3>
                      <span className={`status-badge status-${schedule.status}`}>
                        {schedule.status === 'ongoing' ? 'Berlangsung' :
                         schedule.status === 'completed' ? 'Selesai' : 'Akan Datang'}
                      </span>
                    </div>
                    <p className="agenda-meta">
                      {schedule.class_name}
                      {schedule.room ? ` · Ruang ${schedule.room}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState description="Tidak ada jadwal mengajar hari ini." />
          )}
        </section>

        <aside className="teacher-aside" aria-label="Aktivitas dan informasi">
          <section className="side-block">
            <div className="side-block-head">
              <h2 className="dashboard-section-title">Tenggat Terdekat</h2>
              <button type="button" className="text-action" onClick={() => navigate('/assignments')}>
                Semua
              </button>
            </div>
            {assignments.length > 0 ? (
              <ul className="side-list">
                {assignments.slice(0, 3).map((assignment) => (
                  <li key={assignment.id} className="side-list-item">
                    <span className="side-list-title">{assignment.title}</span>
                    <span className="side-list-meta">
                      {assignment.subject_name || 'Mata pelajaran'} &middot; {assignment.class_name || '-'}
                    </span>
                    <span className="side-list-deadline">{formatDeadline(assignment.deadline)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState description="Tidak ada tugas mendatang." />
            )}
          </section>

          <section className="side-block">
            <div className="side-block-head">
              <h2 className="dashboard-section-title">Pengumuman</h2>
              <span className="aside-count">{announcements.length}</span>
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

          <section className="side-block">
            <h2 className="dashboard-section-title">Perlu Perhatian</h2>
            <ul className="attention-list">
              <li>
                <button type="button" className="attention-link" onClick={() => navigate('/materials')}>
                  Materi pembelajaran siap digunakan
                </button>
              </li>
              <li>
                <button type="button" className="attention-link" onClick={() => navigate('/exams/manage')}>
                  Kelola ujian dan nilai siswa
                </button>
              </li>
            </ul>
          </section>
        </aside>
      </div>

      <section className="quick-panel" aria-labelledby="teacher-menu-title">
        <div className="quick-panel-head">
          <div>
            <h2 id="teacher-menu-title" className="dashboard-section-title">Menu Kerja</h2>
            <p className="dashboard-section-desc">Akses modul pengajaran dan penilaian.</p>
          </div>
        </div>
        <div className="category-tabs" role="tablist" aria-label="Kategori menu guru">
          {[
            { key: 'teaching', label: 'Mengajar', count: teacherMenuItems.filter(i => i.category === 'teaching').length },
            { key: 'content', label: 'Konten', count: teacherMenuItems.filter(i => i.category === 'content').length },
            { key: 'assessment', label: 'Penilaian', count: teacherMenuItems.filter(i => i.category === 'assessment').length },
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

        <div className="quick-links">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className="quick-link"
              onClick={() => handleMenuClick(item)}
            >
              <span className="quick-link-icon" aria-hidden="true">{item.icon}</span>
              <span className="quick-link-content">
                <span className="quick-link-title">{item.label}</span>
                <span className="quick-link-description">{item.description}</span>
              </span>
              <span className="quick-link-arrow" aria-hidden="true">
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

export default TeacherPortal;