import { useEffect, useState } from 'react';
import api from '../services/api';
import Card from '../components/Card';
import BackButton from '../components/BackButton';
import './Announcements.css';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await api.get('/announcements/latest');
      setAnnouncements(response.data.data);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <BackButton />
            <h1 className="page-title">Pengumuman</h1>
            <p className="page-subtitle">Daftar pengumuman sekolah</p>
          </div>
        </div>

        <Card className="table-card">
          <div className="table-skeleton" aria-hidden="true">
            <div className="skeleton" />
            <div className="skeleton" />
            <div className="skeleton" />
            <div className="skeleton" />
            <div className="skeleton" />
            <div className="skeleton" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <BackButton />
          <h1 className="page-title">Pengumuman</h1>
          <p className="page-subtitle">Daftar pengumuman sekolah</p>
        </div>
      </div>

      <Card className="table-card">
        {announcements.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-content">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="21 8 21 21 3 21 3 8" />
                <rect x="1" y="3" width="22" height="5" />
                <line x1="10" y1="12" x2="14" y2="12" />
              </svg>
              <h3>Belum ada pengumuman</h3>
              <p>Data pengumuman belum tersedia dari backend</p>
            </div>
          </div>
        ) : (
          <div className="announcement-list">
            {announcements.map((a, index) => (
              <div key={index} className="announcement-card">
                <h3 className="announcement-title">{a.title}</h3>
                <p className="announcement-content">{a.content}</p>
                <div className="announcement-meta">
                  {a.author_name && <span className="announcement-author">Oleh: {a.author_name}</span>}
                  {a.created_at && <time className="announcement-date" dateTime={a.created_at}>
                    {new Date(a.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </time>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}