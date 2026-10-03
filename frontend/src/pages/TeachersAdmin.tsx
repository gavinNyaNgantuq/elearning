import { useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../services/api';
import Card from '../components/Card';
import BackButton from '../components/BackButton';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import '../styles/admin-crud.css';
import './TeachersAdmin.css';

interface TeacherItem {
  id: number;
  nip: string;
  name: string;
  email: string;
  is_active: number;
  subjects?: string | null;
}

interface SubjectOption {
  id: number;
  name: string;
  major_name?: string;
}

interface TeacherForm {
  name: string;
  email: string;
  password: string;
  nip: string;
  subject_ids: number[];
}

const EMPTY_FORM: TeacherForm = { name: '', email: '', password: '', nip: '', subject_ids: [] };

export default function TeachersAdmin() {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TeacherItem | null>(null);
  const [form, setForm] = useState<TeacherForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<TeacherItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      const [teachersRes, subjectsRes] = await Promise.all([
        api.get('/teachers/list/with-subjects'),
        api.get('/subjects').catch(() => ({ data: { data: [] } })),
      ]);
      setTeachers(teachersRes.data.data || []);
      setSubjectOptions(subjectsRes.data.data || []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal memuat data guru'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = async (item: TeacherItem) => {
    setEditing(item);
    setFormError(null);
    try {
      // ambil mata pelajaran yang sudah ditugaskan
      const res = await api.get(`/teachers/${item.id}/subjects`);
      const assigned: SubjectOption[] = res.data.data || [];
      setForm({
        name: item.name,
        email: item.email,
        password: '',
        nip: item.nip,
        subject_ids: assigned.map((s) => s.id),
      });
    } catch {
      setForm({
        name: item.name,
        email: item.email,
        password: '',
        nip: item.nip,
        subject_ids: [],
      });
    }
    setModalOpen(true);
  };

  const toggleSubject = (id: number) => {
    setForm((prev) => ({
      ...prev,
      subject_ids: prev.subject_ids.includes(id)
        ? prev.subject_ids.filter((s) => s !== id)
        : [...prev.subject_ids, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.nip.trim()) {
      setFormError('Nama, email, dan NIP wajib diisi');
      return;
    }
    if (!editing && !form.password) {
      setFormError('Password wajib diisi untuk guru baru');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await api.put(`/teachers/${editing.id}`, {
          name: form.name.trim(),
          email: form.email.trim(),
          nip: form.nip.trim(),
          subject_ids: form.subject_ids,
        });
      } else {
        await api.post('/teachers', {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          nip: form.nip.trim(),
          subject_ids: form.subject_ids,
        });
      }
      setModalOpen(false);
      await fetchData();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Gagal menyimpan guru'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/teachers/${deleteTarget.id}`);
      setDeleteTarget(null);
      await fetchData();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Gagal menghapus guru'));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = teachers.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.nip.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <BackButton />
            <h1 className="page-title">Data Guru</h1>
            <p className="page-subtitle">Kelola data guru sekolah</p>
          </div>
        </div>
        <Card className="table-card">
          <div className="table-skeleton" aria-hidden="true">
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
          <h1 className="page-title">Data Guru</h1>
          <p className="page-subtitle">Kelola data guru sekolah</p>
        </div>
        <Button onClick={openCreate}>
          Tambah Guru
        </Button>
      </div>

      {error && (
        <div className="page-error" role="alert">
          <p>{error}</p>
          <Button variant="secondary" size="sm" onClick={fetchData}>Coba Lagi</Button>
        </div>
      )}

      <Card className="table-card">
        <div className="table-toolbar">
          <Input
            placeholder="Cari nama, NIP, atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Cari guru"
            className="table-search"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-content">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              <h3>Belum ada guru</h3>
              <p>{search ? 'Tidak ada guru yang cocok dengan pencarian' : 'Data guru belum tersedia'}</p>
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>NIP</th>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Mata Pelajaran</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td><code>{t.nip}</code></td>
                    <td>
                      <strong>{t.name}</strong>
                    </td>
                    <td>{t.email}</td>
                    <td>{t.subjects || '-'}</td>
                    <td>
                      <div className="row-actions">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                          Ubah
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(t)}>
                          Hapus
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

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Ubah Guru' : 'Tambah Guru'}
        size="lg"
      >
        <form onSubmit={handleSubmit} noValidate>
          {formError && (
            <p className="form-error" role="alert">{formError}</p>
          )}
          <Input
            label="Nama Lengkap"
            placeholder="Contoh: Guru 01"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="Contoh: guru01@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            disabled={!!editing}
          />
          {!editing && (
            <Input
              label="Password"
              type="password"
              placeholder="Minimal 8 karakter"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          )}
          <Input
            label="NIP"
            placeholder="Contoh: 198501012010011001"
            value={form.nip}
            onChange={(e) => setForm({ ...form, nip: e.target.value })}
            required
          />
          <fieldset className="subject-picker">
            <legend>Mata Pelajaran yang Diampu</legend>
            {subjectOptions.length === 0 ? (
              <p className="text-muted">Belum ada mata pelajaran. Tambahkan di halaman Mata Pelajaran.</p>
            ) : (
              <div className="subject-checkboxes">
                {subjectOptions.map((s) => (
                  <label key={s.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={form.subject_ids.includes(s.id)}
                      onChange={() => toggleSubject(s.id)}
                    />
                    <span>{s.name}{s.major_name ? ` (${s.major_name})` : ''}</span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Simpan Perubahan' : 'Buat Guru'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Guru"
        message={`Yakin menghapus guru "${deleteTarget?.name}" (NIP ${deleteTarget?.nip})? Akun login ikut dihapus.`}
        loading={deleting}
      />
    </div>
  );
}
