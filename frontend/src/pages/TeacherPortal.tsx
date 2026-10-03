import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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

const TeacherPortal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'teaching' | 'content' | 'assessment'>('teaching');

  useEffect(() => {
    fetchPortalData();
  }, []);

  const fetchPortalData = async () => {
    try {
      const [schedulesRes, announcementsRes] = await Promise.all([
        api.get('/schedules/teacher').catch(() => ({ data: { data: [] } })),
        api.get('/announcements/latest').catch(() => ({ data: { data: [] } })),
      ]);
      setSchedules(schedulesRes.data.data);
      setAnnouncements(announcementsRes.data.data);
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
      {/* Teaching Focus Header */}
      <section className="teaching-focus" aria-label="Fokus Mengajar Hari Ini">
        <div className="focus-card">
          <div className="focus-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <div className="focus-content">
            <p className="focus-label">Fokus Hari Ini</p>
            <h2 className="focus-title">{getTodayName()}</h2>
            <p className="focus-subtitle">
              {todaySchedules.length > 0
                ? `${todaySchedules.length} jam mengajar`
                : 'Tidak ada jadwal mengajar hari ini'}
            </p>
          </div>
          <div className="focus-meta">
            {user?.name && (
              <span className="focus-teacher">Guru: {user.name}</span>
            )}
          </div>
        </div>
      </section>

      {/* Today's Schedule */}
      <section className="schedule-section">
        <div className="section-header">
          <h2 className="section-title">Jadwal Mengajar Hari Ini</h2>
          <p className="schedule-day">{getTodayName()}</p>
        </div>
        <div className="section-content">
          {todaySchedules.length > 0 ? (
            <div className="schedule-list">
              {todaySchedules.map((schedule, index) => (
                <div key={index} className="schedule-item">
                  <div className="schedule-time">
                    {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                  </div>
                  <div className="schedule-info">
                    <h3 className="schedule-subject">{schedule.subject_name}</h3>
                    <p className="schedule-class">{schedule.class_name}</p>
                    {schedule.room && <p className="schedule-room">Ruang: {schedule.room}</p>}
                  </div>
                  <div className="schedule-status">
                    <span className={`status-badge status-${schedule.status}`}>
                      {schedule.status === 'ongoing' ? 'Sedang Berlangsung' :
                       schedule.status === 'completed' ? 'Selesai' : 'Akan Datang'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState description="Tidak ada jadwal mengajar hari ini." />
          )}
        </div>
      </section>

      {/* Quick Stats */}
      <div className="content-grid">
        {/* Announcements */}
        <section className="info-section">
          <div className="section-header">
            <h2 className="section-title">Pengumuman Terbaru</h2>
          </div>
          <div className="section-content">
            {announcements.length > 0 ? (
              <div className="announcement-list">
                {announcements.slice(0, 3).map((announcement, index) => (
                  <div key={index} className="announcement-item">
                    <h3 className="announcement-title">{announcement.title}</h3>
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
              <EmptyState description="Belum ada pengumuman yang tersedia." />
            )}
          </div>
        </section>

        {/* Reminders */}
        <section className="reminders-section">
          <div className="section-header">
            <h2 className="section-title">Perlu Perhatian</h2>
          </div>
          <div className="section-content">
            <div className="reminder-list">
              <div className="reminder-item">
                <div className="reminder-icon info">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </div>
                <div className="reminder-content">
                  <p className="reminder-title">Materi tersedia</p>
                  <p className="reminder-desc">Lihat materi pembelajaran di menu Materi</p>
                </div>
              </div>
              <div className="reminder-item">
                <div className="reminder-icon success">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div className="reminder-content">
                  <p className="reminder-title">Ujian tersedia</p>
                  <p className="reminder-desc">Kelola ujian di menu Ujian (Full CRUD)</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Module Navigation by Category */}
      <section className="modules-section">
        <div className="category-tabs">
          {[
            { key: 'teaching', label: 'Mengajar', count: teacherMenuItems.filter(i => i.category === 'teaching').length },
            { key: 'content', label: 'Konten', count: teacherMenuItems.filter(i => i.category === 'content').length },
            { key: 'assessment', label: 'Penilaian', count: teacherMenuItems.filter(i => i.category === 'assessment').length },
          ].map((cat) => (
            <button
              key={cat.key}
              className={`category-tab ${activeCategory === cat.key ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.key as typeof activeCategory)}
            >
              <span>{cat.label}</span>
              <span className="tab-badge">{cat.count}</span>
            </button>
          ))}
        </div>

        <div className="modules-grid reveal-grid">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              className="teacher-module-card"
              onClick={() => handleMenuClick(item)}
            >
              <div className="module-icon-wrapper">
                <div className="module-icon">{item.icon}</div>
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
    </div>
  );
};

export default TeacherPortal;