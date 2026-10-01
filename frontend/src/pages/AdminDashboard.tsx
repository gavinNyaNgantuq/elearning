import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Dashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalExams: 0,
  });
  const [exams, setExams] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [examsRes, announcementsRes] = await Promise.all([
        api.get('/exams').catch(() => ({ data: { data: [] } })),
        api.get('/announcements/latest').catch(() => ({ data: { data: [] } })),
      ]);
      setExams(examsRes.data.data);
      setAnnouncements(announcementsRes.data.data);
      setStats({
        totalUsers: 0,
        totalStudents: 0,
        totalTeachers: 0,
        totalExams: examsRes.data.data.length,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Memuat dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h1 className="welcome-title">Dashboard Admin</h1>
        <p className="welcome-subtitle">Kelola sistem E-Learning</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalExams}</div>
          <div className="stat-label">Total Ujian</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalStudents}</div>
          <div className="stat-label">Total Siswa</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalTeachers}</div>
          <div className="stat-label">Total Guru</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalUsers}</div>
          <div className="stat-label">Total Pengguna</div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Ujian Terbaru */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Ujian Terbaru</h2>
          </div>
          {exams.length === 0 ? (
            <div className="empty-state">
              <p>Tidak ada ujian</p>
            </div>
          ) : (
            <div className="item-list">
              {exams.slice(0, 5).map((exam, index) => (
                <div key={index} className="list-item">
                  <div className="item-content">
                    <h3 className="item-title">{exam.title}</h3>
                    <p className="item-subtitle">{exam.subject_name} - {exam.class_name}</p>
                    <p className="item-deadline">Token: {exam.token}</p>
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
              {announcements.slice(0, 5).map((announcement, index) => (
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
            <button className="quick-access-btn" onClick={() => navigate('/exams')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Daftar Ujian</span>
            </button>
            <button className="quick-access-btn" onClick={() => navigate('/exams/create')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 4v16m8-8H4" />
              </svg>
              <span>Buat Ujian</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
