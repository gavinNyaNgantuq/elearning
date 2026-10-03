import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Exam } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';
import BackButton from '../components/BackButton';
import ConfirmDialog from '../components/ConfirmDialog';
import './ExamManagement.css';

interface ExamFormData {
  title: string;
  subject_id: string;
  class_id: string;
  start_at: string;
  duration: string;
}

interface SelectOption {
  value: string;
  label: string;
}

export default function ExamManagement() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<SelectOption[]>([]);
  const [classes, setClasses] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState<ExamFormData>({
    title: '',
    subject_id: '',
    class_id: '',
    start_at: '',
    duration: '',
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [deletingExam, setDeletingExam] = useState<Exam | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchExams = useCallback(async () => {
    try {
      const response = await api.get('/exams');
      setExams(response.data.data);
    } catch (err) {
      console.error('Error fetching exams:', err);
      setError('Gagal memuat data ujian');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSubjectsAndClasses = useCallback(async () => {
    try {
      const [subjectsRes, classesRes] = await Promise.all([
        api.get('/subjects'),
        api.get('/classes')
      ]);
      setSubjects(subjectsRes.data.data.map((s: any) => ({ value: String(s.id), label: s.name })));
      setClasses(classesRes.data.data.map((c: any) => ({ value: String(c.id), label: c.name })));
    } catch (err) {
      console.error('Error fetching subjects/classes:', err);
    }
  }, []);

  useEffect(() => {
    fetchExams();
    fetchSubjectsAndClasses();
  }, [fetchExams, fetchSubjectsAndClasses]);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openCreateModal = () => {
    setFormData({ title: '', subject_id: '', class_id: '', start_at: '', duration: '' });
    setFormError('');
    setShowCreateModal(true);
  };

  const openEditModal = (exam: Exam) => {
    setEditingExam(exam);
    setFormData({
      title: exam.title,
      subject_id: String(exam.subject_id),
      class_id: String(exam.class_id),
      start_at: exam.start_at?.slice(0, 16) || '',
      duration: String(exam.duration),
    });
    setFormError('');
    setShowEditModal(true);
  };

  const openDeleteConfirm = (exam: Exam) => {
    setDeletingExam(exam);
    setShowDeleteConfirm(true);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteConfirm(false);
    setEditingExam(null);
    setDeletingExam(null);
    setFormError('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setFormError('');
    setFormLoading(true);

    // Client-side validation
    if (!formData.title.trim()) {
      setFormError('Judul ujian wajib diisi');
      setFormLoading(false);
      return;
    }
    if (!formData.subject_id) {
      setFormError('Mata pelajaran wajib dipilih');
      setFormLoading(false);
      return;
    }
    if (!formData.class_id) {
      setFormError('Kelas wajib dipilih');
      setFormLoading(false);
      return;
    }
    if (!formData.start_at) {
      setFormError('Waktu mulai wajib diisi');
      setFormLoading(false);
      return;
    }
    if (!formData.duration || parseInt(formData.duration) < 1) {
      setFormError('Durasi wajib diisi minimal 1 menit');
      setFormLoading(false);
      return;
    }

    try {
      // Format datetime for backend (MySQL expects YYYY-MM-DD HH:MM:SS)
      const submitData = {
        ...formData,
        start_at: formData.start_at ? `${formData.start_at}:00` : '',
      };
      const response = await api.post('/exams', submitData);
      setSuccess(`Ujian berhasil dibuat! Token: ${response.data.data.token}`);
      closeModals();
      fetchExams();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Gagal membuat ujian');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam) return;
    clearMessages();
    setFormError('');
    setFormLoading(true);

    // Client-side validation
    if (!formData.title.trim()) {
      setFormError('Judul ujian wajib diisi');
      setFormLoading(false);
      return;
    }
    if (!formData.subject_id) {
      setFormError('Mata pelajaran wajib dipilih');
      setFormLoading(false);
      return;
    }
    if (!formData.class_id) {
      setFormError('Kelas wajib dipilih');
      setFormLoading(false);
      return;
    }
    if (!formData.start_at) {
      setFormError('Waktu mulai wajib diisi');
      setFormLoading(false);
      return;
    }
    if (!formData.duration || parseInt(formData.duration) < 1) {
      setFormError('Durasi wajib diisi minimal 1 menit');
      setFormLoading(false);
      return;
    }

    try {
      // Format datetime for backend (MySQL expects YYYY-MM-DD HH:MM:SS)
      const submitData = {
        ...formData,
        start_at: formData.start_at ? `${formData.start_at}:00` : '',
      };
      await api.put(`/exams/${editingExam.id}`, submitData);
      setSuccess('Ujian berhasil diperbarui');
      closeModals();
      fetchExams();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Gagal memperbarui ujian');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingExam) return;
    setDeleteLoading(true);

    try {
      await api.delete(`/exams/${deletingExam.id}`);
      setSuccess('Ujian berhasil dihapus');
      closeModals();
      fetchExams();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menghapus ujian');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <BackButton />
            <h1 className="page-title">Manajemen Ujian</h1>
            <p className="page-subtitle">Kelola ujian dan ulangan sekolah</p>
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
      {/* Page Header */}
      <div className="page-header">
        <div>
          <BackButton />
          <h1 className="page-title">Manajemen Ujian</h1>
          <p className="page-subtitle">Kelola ujian dan ulangan sekolah</p>
        </div>
        <Button onClick={openCreateModal} variant="primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Buat Ujian
        </Button>
      </div>

      {/* Messages */}
      {error && <div className="page-message error">{error}</div>}
      {success && <div className="page-message success">{success}</div>}

      {/* Exam Table */}
      <Card className="table-card">
        {exams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-content">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3>Belum ada ujian</h3>
              <p>Mulai buat ujian pertama Anda</p>
              <Button onClick={openCreateModal} variant="primary" style={{marginTop: '16px'}}>
                Buat Ujian Pertama
              </Button>
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Judul</th>
                  <th>Mata Pelajaran</th>
                  <th>Kelas</th>
                  <th>Durasi</th>
                  <th>Mulai</th>
                  <th>Guru</th>
                  <th>Action</th>
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
                    <td>{exam.start_at ? new Date(exam.start_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</td>
                    <td>{exam.teacher_nip || '-'}</td>
                    <td>
                      <div className="action-buttons">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(exam)}
                          aria-label={`Edit ${exam.title}`}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5a2.121 2.121 0 0 1 3 3L22 13.5" />
                          </svg>
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => openDeleteConfirm(exam)}
                          aria-label={`Hapus ${exam.title}`}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={closeModals}
        title="Buat Ujian Baru"
        size="lg"
      >
        <form onSubmit={handleCreate} className="exam-form">
          <Input
            label="Judul Ujian"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Masukkan judul ujian"
            required
            disabled={formLoading}
          />

          <div className="form-row">
            <Select
              label="Mata Pelajaran"
              name="subject_id"
              value={formData.subject_id}
              onChange={handleChange}
              options={subjects}
              placeholder="Pilih Mata Pelajaran"
              required
              disabled={formLoading}
            />
            <Select
              label="Kelas"
              name="class_id"
              value={formData.class_id}
              onChange={handleChange}
              options={classes}
              placeholder="Pilih Kelas"
              required
              disabled={formLoading}
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
              disabled={formLoading}
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
              disabled={formLoading}
            />
          </div>

          {formError && <div className="form-error"><p>{formError}</p></div>}

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={closeModals} disabled={formLoading}>
              Batal
            </Button>
            <Button type="submit" variant="primary" loading={formLoading}>
              Buat Ujian
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={closeModals}
        title="Edit Ujian"
        size="lg"
      >
        <form onSubmit={handleUpdate} className="exam-form">
          <Input
            label="Judul Ujian"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Masukkan judul ujian"
            required
            disabled={formLoading}
          />

          <div className="form-row">
            <Select
              label="Mata Pelajaran"
              name="subject_id"
              value={formData.subject_id}
              onChange={handleChange}
              options={subjects}
              placeholder="Pilih Mata Pelajaran"
              required
              disabled={formLoading}
            />
            <Select
              label="Kelas"
              name="class_id"
              value={formData.class_id}
              onChange={handleChange}
              options={classes}
              placeholder="Pilih Kelas"
              required
              disabled={formLoading}
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
              disabled={formLoading}
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
              disabled={formLoading}
            />
          </div>

          {formError && <div className="form-error"><p>{formError}</p></div>}

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={closeModals} disabled={formLoading}>
              Batal
            </Button>
            <Button type="submit" variant="primary" loading={formLoading}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={closeModals}
        onConfirm={handleDelete}
        title="Hapus Ujian"
        message={deletingExam 
          ? `Apakah Anda yakin ingin menghapus ujian "${deletingExam.title}"? Tindakan ini tidak dapat dibatalkan.`
          : 'Apakah Anda yakin ingin menghapus ujian ini? Tindakan ini tidak dapat dibatalkan.'
        }
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}