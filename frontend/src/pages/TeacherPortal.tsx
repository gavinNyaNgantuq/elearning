import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import './Portal.css';

export default function TeacherPortal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      console.error('Error fetching portal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTodaySchedules = () => {
    const days = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    const today = days[new Date().getDay()];
    return schedules.filter(s => s.day === today);
  };

  const menuItems = [
    { id: 'jadwal', label: 'Jadwal Mengajar', icon: 'calendar', color: 'blue' },
    { id: 'materi', label: 'Materi', icon: 'book', color: 'teal' },
    { id: 'tugas', label: 'Tugas', icon: 'clipboard', color: 'orange' },
    { id: 'ujian', label: 'Ujian', icon: 'pencil', color: 'purple' },
    { id: 'nilai', label: 'Nilai', icon: 'chart', color: 'orange' },
    { id: 'absensi', label: 'Absensi', icon: 'check', color: 'green' },
    { id: 'catatan', label: 'Catatan', icon: 'document', color: 'pink' },
    { id: 'pengumuman', label: 'Pengumuman', icon: 'archive', color: 'indigo' },
  ];

  const getIcon = (iconName: string) => {
    const icons: Record<string, JSX.Element> = {
      calendar: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      book: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
      clipboard: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        </svg>
      ),
      pencil: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
      ),
      chart: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
      check: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      document: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      archive: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="21 8 21 21 3 21 3 8" />
          <rect x="1" y="3" width="22" height="5" />
          <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
      ),
    };
    return icons[iconName] || null;
  };

  if (loading) {
    return (
      <div className="portal-loading">
        <div className="loading-spinner" />
        <p>Memuat portal...</p>
      </div>
    );
  }

  const todaySchedules = getTodaySchedules();

  return (
    <div className="portal-content">
      {/* Profile Section */}
      <section className="profile-section">
        <div className="profile-card">
          <div className="profile-avatar">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h2 className="profile-name">{user?.username}</h2>
            <p className="profile-nis">198501012010011001</p>
            <p className="profile-class">Guru</p>
          </div>
        </div>
      </section>

      {/* Menu Utama */}
      <section className="menu-section">
        <h2 className="section-title">Menu Utama</h2>
        <div className="menu-grid">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`menu-item menu-${item.color}`}
              onClick={() => {
                if (item.id === 'ujian') navigate('/exams');
              }}
            >
              <div className="menu-icon">
                {getIcon(item.icon)}
              </div>
              <span className="menu-label">{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Pengumuman */}
      <section className="info-section">
        <h2 className="section-title">Info / Pengumuman</h2>
        {announcements.length === 0 ? (
          <div className="empty-state">
            <p>Tidak ada pengumuman</p>
          </div>
        ) : (
          <div className="announcement-list">
            {announcements.slice(0, 3).map((announcement, index) => (
              <div key={index} className="announcement-item">
                <h3 className="announcement-title">{announcement.title}</h3>
                <p className="announcement-content">{announcement.content}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Jadwal Hari Ini */}
      <section className="schedule-section">
        <h2 className="section-title">Jadwal Mengajar Hari Ini</h2>
        {todaySchedules.length === 0 ? (
          <div className="empty-state">
            <p>Tidak ada jadwal mengajar hari ini</p>
          </div>
        ) : (
          <div className="schedule-list">
            {todaySchedules.map((schedule, index) => (
              <div key={index} className="schedule-item">
                <div className="schedule-time">
                  {schedule.start_time?.substring(0, 5)}
                </div>
                <div className="schedule-info">
                  <h3 className="schedule-subject">{schedule.subject_name}</h3>
                  <p className="schedule-teacher">{schedule.class_name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
