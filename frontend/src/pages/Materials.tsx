import { useEffect, useState } from 'react';
import api from '../services/api';
import Card from '../components/Card';
import BackButton from '../components/BackButton';
import './Materials.css';

const FileIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="file-icon"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

export default function Materials() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await api.get('/materials/latest');
      setMaterials(response.data.data);
    } catch (err) {
      console.error('Error fetching materials:', err);
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
            <h1 className="page-title">Materi Pembelajaran</h1>
            <p className="page-subtitle">Daftar materi pembelajaran terbaru</p>
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
          <h1 className="page-title">Materi Pembelajaran</h1>
          <p className="page-subtitle">Daftar materi pembelajaran terbaru</p>
        </div>
      </div>

      <Card className="table-card">
        {materials.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-content">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                <line x1="8" y1="7" x2="16" y2="7" />
                <line x1="8" y1="11" x2="16" y2="11" />
              </svg>
              <h3>Belum ada materi</h3>
              <p>Data materi belum tersedia dari backend</p>
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Judul Materi</th>
                  <th>Mata Pelajaran</th>
                  <th>Kelas</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((mat) => (
                <tr key={mat.id}>
                  <td>
                    <FileIcon />
                  </td>
                  <td>
                    <strong>{mat.title}</strong>
                    {mat.description && <p className="cell-description">{mat.description}</p>}
                  </td>
                    <td>{mat.subject_name || '-'}</td>
                    <td>{mat.class_name || '-'}</td>
                    <td>{mat.created_at ? new Date(mat.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}