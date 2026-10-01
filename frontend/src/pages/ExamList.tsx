import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Exam } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import './ExamList.css';

export default function ExamList() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await api.get('/exams');
      setExams(response.data.data);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <p>Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Daftar Ujian</h1>
          <p className="page-subtitle">Kelola semua ujian yang telah dibuat</p>
        </div>
        <Button onClick={() => navigate('/exams/create')}>
          Buat Ujian
        </Button>
      </div>

      {exams.length === 0 ? (
        <Card className="empty-state">
          <div className="empty-state-content">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3>Belum ada ujian</h3>
            <p>Mulai buat ujian pertama Anda</p>
          </div>
        </Card>
      ) : (
        <Card className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Judul</th>
                <th>Mata Pelajaran</th>
                <th>Kelas</th>
                <th>Durasi</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam.id}>
                  <td>
                    <span className="token-badge">{exam.token}</span>
                  </td>
                  <td>{exam.title}</td>
                  <td>{exam.subject_name}</td>
                  <td>{exam.class_name}</td>
                  <td>{exam.duration} menit</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
