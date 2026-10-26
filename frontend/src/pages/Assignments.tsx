import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/Card';
import BackButton from '../components/BackButton';
import './Assignments.css';

export default function Assignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      // Siswa pakai endpoint perannya; guru/admin pakai endpoint guru.
      const endpoint = user?.role === 'siswa' ? '/assignments/student' : '/assignments/teacher';
      const response = await api.get(endpoint).catch(() => ({ data: { data: [] } }));
      setAssignments(response.data.data);
    } catch (err) {
      console.error('Error fetching assignments:', err);
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
            <h1 className="page-title">Tugas</h1>
            <p className="page-subtitle">Daftar tugas yang tersedia</p>
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
          <h1 className="page-title">Tugas</h1>
          <p className="page-subtitle">Daftar tugas yang tersedia</p>
        </div>
      </div>

      <Card className="table-card">
        {assignments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-content">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              </svg>
              <h3>Belum ada tugas</h3>
              <p>Data tugas belum tersedia dari backend</p>
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Judul Tugas</th>
                  <th>Mata Pelajaran</th>
                  <th>Kelas</th>
                  <th>Deadline</th>
                  <th>Tanggal Dibuat</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a.id}>
                  <td>
                    <strong>{a.title}</strong>
                    {a.description && <p className="cell-description">{a.description}</p>}
                  </td>
                    <td>{a.subject_name || '-'}</td>
                    <td>{a.class_name || '-'}</td>
                    <td>{(a.deadline || a.due_date) ? new Date(a.deadline || a.due_date).toLocaleDateString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}</td>
                    <td>{a.created_at ? new Date(a.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'}</td>
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