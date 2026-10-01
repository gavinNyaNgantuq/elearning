import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import './Dashboard.css';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [schedulesRes, assignmentsRes, examsRes, materialsRes, announcementsRes] = await Promise.all([
        api.get('/schedules/student').catch(() => ({ data: { data: [] } })),
        api.get('/assignments/student').catch(() => ({ data: { data: [] } })),
        api.get('/exams').catch(() => ({ data: { data: [] } })),
        api.get('/materials/student').catch(() => ({ data: { data: [] } })),
        api.get('/announcements/latest').catch(() => ({ data: { data: [] } })),
      ]);
      setSchedules(schedulesRes.data.data);
      setAssignments(assignmentsRes.data.data);
      setExams(examsRes.data.data);
      setMaterials(materialsRes.data.data);
      setAnnouncements(announcementsRes.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTodaySchedules = () => {
    const days = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    const today = days[new Date().getDay()];
    return schedules.filter(s => s.day === today);
  };

  const getAvailableExams = () => {
    const now = new Date();
    return exams.filter(e => {
      const start = new Date(e.start_at);
      const end = new Date(start.getTime() + e.duration * 60000);
      return now >= start && now <= end;
    });
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Memuat dashboard...</p>
      </div>
    );
  }

  const todaySchedules = getTodaySchedules();
  const availableExams = getAvailableExams();

  return (
    <div className="dashboard">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h1 className="welcome-title">Selamat datang, {user?.username}</h1>
        <p className="welcome-subtitle">Siap belajar hari ini?</p>
      </div>

      <div className="dashboard-grid">
        {/* Jadwal Hari Ini */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Jadwal Hari Ini</h2>
          </div>
          {todaySchedules.length === 0 ? (
            <div className="empty-state">
              <p>Tidak ada jadwal hari ini</p>
            </div>
          ) : (
            <div className="timeline">
              {todaySchedules.map((schedule, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-time">
                    {schedule.start_time?.substring(0, 5)}
                  </div>
                  <div className="timeline-content">
                    <h3 className="timeline-title">{schedule.subject_name}</h3>
                    <p className="timeline-subtitle">{schedule.class_name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Tugas */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Tugas</h2>
          </div>
          {assignments.length === 0 ? (
            <div className="empty-state">
              <p>Tidak ada tugas</p>
            </div>
          ) : (
            <div className="item-list">
              {assignments.slice(0, 3).map((assignment, index) => (
                <div key={index} className="list-item">
                  <div className="item-content">
                    <h3 className="item-title">{assignment.title}</h3>
                    <p className="item-subtitle">{assignment.subject_name}</p>
                    <p className="item-deadline">Deadline: {new Date(assignment.due_date).toLocaleDateString('id-ID')}</p>
                  </div>
                  <button className="btn btn-primary btn-sm">Kerjakan</button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Ujian */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Ujian Tersedia</h2>
          </div>
          {availableExams.length === 0 ? (
            <div className="empty-state">
              <p>Tidak ada ujian tersedia</p>
            </div>
          ) : (
            <div className="item-list">
              {availableExams.slice(0, 3).map((exam, index) => (
                <div key={index} className="list-item">
                  <div className="item-content">
                    <h3 className="item-title">{exam.title}</h3>
                    <p className="item-subtitle">{exam.subject_name}</p>
                    <p className="item-deadline">{exam.duration} menit</p>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate('/exam/enter-token')}
                  >
                    Mulai
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Materi Terbaru */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Materi Terbaru</h2>
          </div>
          {materials.length === 0 ? (
            <div className="empty-state">
              <p>Tidak ada materi</p>
            </div>
          ) : (
            <div className="item-list">
              {materials.slice(0, 3).map((material, index) => (
                <div key={index} className="list-item">
                  <div className="item-content">
                    <h3 className="item-title">{material.title}</h3>
                    <p className="item-subtitle">{material.subject_name}</p>
                    <p className="item-deadline">
                      {material.created_at && new Date(material.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pengumuman */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Pengumuman</h2>
          </div>
          {announcements.length === 0 ? (
            <div className="empty-state">
              <p>Tidak ada pengumuman</p>
            </div>
          ) : (
            <div className="item-list">
              {announcements.slice(0, 3).map((announcement, index) => (
                <div key={index} className="list-item">
                  <div className="item-content">
                    <h3 className="item-title">{announcement.title}</h3>
                    <p className="item-subtitle">{announcement.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Quick Access */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Akses Cepat</h2>
          </div>
          <div className="quick-access">
            <button className="quick-access-btn" onClick={() => navigate('/exam/enter-token')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Ikuti Ujian</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
