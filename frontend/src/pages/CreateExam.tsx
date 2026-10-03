import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import BackButton from '../components/BackButton';
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

    // Client-side validation
    if (!formData.title.trim()) {
      setError('Judul ujian wajib diisi');
      setLoading(false);
      return;
    }
    if (!formData.subject_id) {
      setError('Mata pelajaran wajib dipilih');
      setLoading(false);
      return;
    }
    if (!formData.class_id) {
      setError('Kelas wajib dipilih');
      setLoading(false);
      return;
    }
    if (!formData.start_at) {
      setError('Waktu mulai wajib diisi');
      setLoading(false);
      return;
    }
    if (!formData.duration || parseInt(formData.duration) < 1) {
      setError('Durasi wajib diisi minimal 1 menit');
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Format datetime for backend (MySQL expects YYYY-MM-DD HH:MM:SS)
      const submitData = {
        ...formData,
        start_at: formData.start_at ? `${formData.start_at}:00` : '',
      };
      const response = await api.post('/exams', submitData);
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
          <BackButton />
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
            <Select
              label="Mata Pelajaran"
              name="subject_id"
              value={formData.subject_id}
              onChange={handleChange}
              options={subjects.map((s: any) => ({ value: String(s.id), label: s.name }))}
              placeholder="Pilih Mata Pelajaran"
              required
              disabled={loading}
            />
            <Select
              label="Kelas"
              name="class_id"
              value={formData.class_id}
              onChange={handleChange}
              options={classes.map((c: any) => ({ value: String(c.id), label: c.name }))}
              placeholder="Pilih Kelas"
              required
              disabled={loading}
            />
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
