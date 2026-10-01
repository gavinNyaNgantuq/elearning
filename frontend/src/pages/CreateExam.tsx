import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import './CreateExam.css';

export default function CreateExam() {
  const [formData, setFormData] = useState({
    title: '',
    subject_id: '',
    class_id: '',
    start_at: '',
    duration: '',
  });
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubjectsAndClasses();
  }, []);

  const fetchSubjectsAndClasses = async () => {
    try {
      const [subjectsRes, classesRes] = await Promise.all([
        api.get('/subjects'),
        api.get('/classes')
      ]);
      setSubjects(subjectsRes.data.data);
      setClasses(classesRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/exams', formData);
      alert(`Ujian berhasil dibuat! Token: ${response.data.data.token}`);
      navigate('/exams');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal membuat ujian');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Buat Ujian Baru</h1>
          <p className="page-subtitle">Lengkapi informasi ujian di bawah ini</p>
        </div>
      </div>

      <Card className="form-card">
        <form onSubmit={handleSubmit} className="exam-form">
          <Input
            label="Judul Ujian"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Masukkan judul ujian"
            required
          />

          <div className="form-row">
            <div className="form-group">
              <label className="input-label">Mata Pelajaran</label>
              <select
                name="subject_id"
                value={formData.subject_id}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="">Pilih Mata Pelajaran</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="input-label">Kelas</label>
              <select
                name="class_id"
                value={formData.class_id}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="">Pilih Kelas</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <Input
              label="Waktu Mulai"
              name="start_at"
              type="datetime-local"
              value={formData.start_at}
              onChange={handleChange}
              required
            />

            <Input
              label="Durasi (menit)"
              name="duration"
              type="number"
              value={formData.duration}
              onChange={handleChange}
              placeholder="60"
              min="1"
              required
            />
          </div>

          {error && (
            <div className="form-error">
              <p>{error}</p>
            </div>
          )}

          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/exams')}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
            >
              Buat Ujian
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
