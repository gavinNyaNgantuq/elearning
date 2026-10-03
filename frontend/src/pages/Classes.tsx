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
import './Classes.css';

interface ClassItem {
  id: number;
  name: string;
  major_id: number;
  major_name: string;
  academic_year?: string | null;
}

interface MajorOption {
  id: number;
  name: string;
  code?: string;
}

interface ClassForm {
  name: string;
  major_id: string;
  academic_year: string;
}

const EMPTY_FORM: ClassForm = { name: '', major_id: '', academic_year: '' };

export default function Classes() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [majors, setMajors] = useState<MajorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClassItem | null>(null);
  const [form, setForm] = useState<ClassForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ClassItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      const [classesRes, majorsRes] = await Promise.all([
        api.get('/classes'),
        api.get('/admin/majors?limit=100').catch(() => ({ data: { data: [] } })),
      ]);
      setClasses(classesRes.data.data);
      setMajors(majorsRes.data.data || []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal memuat data kelas'));
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

  const openEdit = (item: ClassItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      major_id: String(item.major_id),
      academic_year: item.academic_year || '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.major_id) {
      setFormError('Nama kelas dan jurusan wajib diisi');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name.trim(),
        major_id: parseInt(form.major_id),
        academic_year: form.academic_year.trim() || null,
      };
      if (editing) {
        await api.put(`/classes/${editing.id}`, payload);
      } else {
        await api.post('/classes', payload);
      }
      setModalOpen(false);
      await fetchData();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Gagal menyimpan kelas'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/classes/${deleteTarget.id}`);
      setDeleteTarget(null);
      await fetchData();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Gagal menghapus kelas'));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = classes.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.major_name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <BackButton />
            <h1 className="page-title">Daftar Kelas</h1>
            <p className="page-subtitle">Daftar semua kelas yang tersedia di sistem</p>
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
          <h1 className="page-title">Daftar Kelas</h1>
          <p className="page-subtitle">Daftar semua kelas yang tersedia di sistem</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate}>
            Tambah Kelas
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
            placeholder="Cari kelas atau jurusan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Cari kelas"
            className="table-search"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-content">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <path d="M8 21h8" />
                <path d="M12 17v4" />
              </svg>
              <h3>Belum ada kelas</h3>
              <p>{search ? 'Tidak ada kelas yang cocok dengan pencarian' : 'Data kelas belum tersedia'}</p>
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama Kelas</th>
                  <th>Jurusan</th>
                  <th>Tahun Ajaran</th>
                  {isAdmin && <th>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((cls) => (
                  <tr key={cls.id}>
                    <td>
                      <strong>{cls.name}</strong>
                    </td>
                    <td>{cls.major_name || '-'}</td>
                    <td>{cls.academic_year || '-'}</td>
                    {isAdmin && (
                      <td>
                        <div className="row-actions">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(cls)}>
                            Ubah
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(cls)}>
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
        title={editing ? 'Ubah Kelas' : 'Tambah Kelas'}
      >
        <form onSubmit={handleSubmit} noValidate>
          {formError && (
            <p className="form-error" role="alert">{formError}</p>
          )}
          <Input
            label="Nama Kelas"
            placeholder="Contoh: XII TKJ 1"
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
          <Input
            label="Tahun Ajaran"
            placeholder="Contoh: 2026/2027"
            value={form.academic_year}
            onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
          />
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Simpan Perubahan' : 'Buat Kelas'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Kelas"
        message={`Yakin menghapus kelas "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        loading={deleting}
      />
    </div>
  );
}
