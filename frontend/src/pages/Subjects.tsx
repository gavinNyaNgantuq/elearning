import { useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/Card';
import BackButton from '../components/BackButton';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import '../styles/admin-crud.css';
import './Subjects.css';

interface SubjectItem {
  id: number;
  name: string;
  major_id: number;
  major_name: string;
}

interface MajorOption {
  id: number;
  name: string;
  code?: string;
}

interface SubjectForm {
  name: string;
  major_id: string;
}

const EMPTY_FORM: SubjectForm = { name: '', major_id: '' };

export default function Subjects() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [majors, setMajors] = useState<MajorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SubjectItem | null>(null);
  const [form, setForm] = useState<SubjectForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<SubjectItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      const [subjectsRes, majorsRes] = await Promise.all([
        api.get('/subjects'),
        api.get('/admin/majors?limit=100').catch(() => ({ data: { data: [] } })),
      ]);
      setSubjects(subjectsRes.data.data);
      setMajors(majorsRes.data.data || []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal memuat data mata pelajaran'));
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

  const openEdit = (item: SubjectItem) => {
    setEditing(item);
    setForm({ name: item.name, major_id: String(item.major_id) });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.major_id) {
      setFormError('Nama mata pelajaran dan jurusan wajib diisi');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name.trim(),
        major_id: parseInt(form.major_id),
      };
      if (editing) {
        await api.put(`/subjects/${editing.id}`, payload);
      } else {
        await api.post('/subjects', payload);
      }
      setModalOpen(false);
      await fetchData();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Gagal menyimpan mata pelajaran'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/subjects/${deleteTarget.id}`);
      setDeleteTarget(null);
      await fetchData();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Gagal menghapus mata pelajaran'));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = subjects.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.major_name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <BackButton />
            <h1 className="page-title">Mata Pelajaran</h1>
            <p className="page-subtitle">Daftar mata pelajaran yang tersedia di sistem</p>
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
          <h1 className="page-title">Mata Pelajaran</h1>
          <p className="page-subtitle">Daftar mata pelajaran yang tersedia di sistem</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate}>
            Tambah Mapel
          </Button>
        )}
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
            placeholder="Cari mata pelajaran..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Cari mata pelajaran"
            className="table-search"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-content">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                <line x1="8" y1="7" x2="16" y2="7" />
                <line x1="8" y1="11" x2="16" y2="11" />
              </svg>
              <h3>Belum ada mata pelajaran</h3>
              <p>{search ? 'Tidak ada mapel yang cocok dengan pencarian' : 'Data mata pelajaran belum tersedia'}</p>
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama Mata Pelajaran</th>
                  <th>Jurusan</th>
                  {isAdmin && <th>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((subj) => (
                  <tr key={subj.id}>
                    <td>
                      <strong>{subj.name}</strong>
                    </td>
                    <td>{subj.major_name || '-'}</td>
                    {isAdmin && (
                      <td>
                        <div className="row-actions">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(subj)}>
                            Ubah
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(subj)}>
                            Hapus
                          </Button>
                        </div>
                      </td>
                    )}
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
        title={editing ? 'Ubah Mata Pelajaran' : 'Tambah Mata Pelajaran'}
      >
        <form onSubmit={handleSubmit} noValidate>
          {formError && (
            <p className="form-error" role="alert">{formError}</p>
          )}
          <Input
            label="Nama Mata Pelajaran"
            placeholder="Contoh: Matematika"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Select
            label="Jurusan"
            value={form.major_id}
            onChange={(e) => setForm({ ...form, major_id: e.target.value })}
            options={majors.map((m) => ({
              value: String(m.id),
              label: m.code ? `${m.name} (${m.code})` : m.name,
            }))}
            placeholder="Pilih jurusan..."
            required
          />
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Simpan Perubahan' : 'Buat Mapel'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Mata Pelajaran"
        message={`Yakin menghapus mata pelajaran "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        loading={deleting}
      />
    </div>
  );
}
