import { useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../services/api';
import Card from '../components/Card';
import BackButton from '../components/BackButton';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import '../styles/admin-crud.css';
import './StudentsAdmin.css';

interface StudentItem {
  id: number;
  nis: string;
  name: string;
  email: string;
  is_active: number;
  class_id: number;
  class_name: string;
  major_name: string;
}

interface ClassOption {
  id: number;
  name: string;
  major_name?: string;
}

interface StudentForm {
  name: string;
  email: string;
  password: string;
  nis: string;
  class_id: string;
}

const EMPTY_FORM: StudentForm = { name: '', email: '', password: '', nis: '', class_id: '' };

export default function StudentsAdmin() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StudentItem | null>(null);
  const [form, setForm] = useState<StudentForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<StudentItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      const [studentsRes, classesRes] = await Promise.all([
        api.get('/students?limit=100'),
        api.get('/classes').catch(() => ({ data: { data: [] } })),
      ]);
      setStudents(studentsRes.data.data || []);
      setClassOptions(classesRes.data.data || []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal memuat data siswa'));
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

  const openEdit = (item: StudentItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      email: item.email,
      password: '',
      nis: item.nis,
      class_id: String(item.class_id),
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.nis.trim() || !form.class_id) {
      setFormError('Nama, email, NIS, dan kelas wajib diisi');
      return;
    }
    if (!editing && !form.password) {
      setFormError('Password wajib diisi untuk siswa baru');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await api.put(`/students/${editing.id}`, {
          name: form.name.trim(),
          nis: form.nis.trim(),
          class_id: parseInt(form.class_id),
        });
      } else {
        await api.post('/students', {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          nis: form.nis.trim(),
          class_id: parseInt(form.class_id),
        });
      }
      setModalOpen(false);
      await fetchData();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Gagal menyimpan siswa'));
    } finally {
      setSaving(false);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      setFormError('Pilih file CSV terlebih dahulu');
      return;
    }
    setImporting(true);
    setFormError(null);
    setImportResult(null);
    try {
      const fd = new FormData();
      fd.append('file', importFile);
      const res = await api.post('/students/import', fd);
      setImportResult(res.data.data);
      setImportFile(null);
      await fetchData();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Gagal mengimpor CSV'));
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/students/${deleteTarget.id}`);
      setDeleteTarget(null);
      await fetchData();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Gagal menghapus siswa'));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.nis.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchClass = !classFilter || String(s.class_id) === classFilter;
    return matchSearch && matchClass;
  });

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <BackButton />
            <h1 className="page-title">Data Siswa</h1>
            <p className="page-subtitle">Kelola data siswa sekolah</p>
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
          <h1 className="page-title">Data Siswa</h1>
          <p className="page-subtitle">Kelola data siswa sekolah</p>
        </div>
        <div className="page-header-actions">
          <Button variant="secondary" onClick={() => { setImportOpen(true); setImportResult(null); setFormError(null); }}>
            Impor CSV
          </Button>
          <Button onClick={openCreate}>
            Tambah Siswa
          </Button>
        </div>
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
            placeholder="Cari nama, NIS, atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Cari siswa"
            className="table-search"
          />
          <Select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            options={classOptions.map((c) => ({
              value: String(c.id),
              label: c.major_name ? `${c.name} — ${c.major_name}` : c.name,
            }))}
            placeholder="Semua kelas"
            aria-label="Filter kelas"
            className="table-filter"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-content">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              <h3>Belum ada siswa</h3>
              <p>{search || classFilter ? 'Tidak ada siswa yang cocok dengan filter' : 'Data siswa belum tersedia'}</p>
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>NIS</th>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Kelas</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td><code>{s.nis}</code></td>
                    <td>
                      <strong>{s.name}</strong>
                    </td>
                    <td>{s.email}</td>
                    <td>
                      {s.class_name || '-'}
                      {s.major_name ? <span className="text-muted"> • {s.major_name}</span> : null}
                    </td>
                    <td>
                      <span className={`status-pill ${s.is_active ? 'status-active' : 'status-inactive'}`}>
                        {s.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                          Ubah
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(s)}>
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
        title={editing ? 'Ubah Siswa' : 'Tambah Siswa'}
      >
        <form onSubmit={handleSubmit} noValidate>
          {formError && (
            <p className="form-error" role="alert">{formError}</p>
          )}
          <Input
            label="Nama Lengkap"
            placeholder="Contoh: Siswa 01"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="Contoh: siswa01@example.com"
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
          <div className="form-row">
            <Input
              label="NIS"
              placeholder="Contoh: 2024001"
              value={form.nis}
              onChange={(e) => setForm({ ...form, nis: e.target.value })}
              required
            />
            <Select
              label="Kelas"
              value={form.class_id}
              onChange={(e) => setForm({ ...form, class_id: e.target.value })}
              options={classOptions.map((c) => ({
                value: String(c.id),
                label: c.major_name ? `${c.name} — ${c.major_name}` : c.name,
              }))}
              placeholder="Pilih kelas..."
              required
            />
          </div>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Simpan Perubahan' : 'Buat Siswa'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        title="Impor Siswa dari CSV"
      >
        <form onSubmit={handleImport} noValidate>
          {formError && (
            <p className="form-error" role="alert">{formError}</p>
          )}
          <p className="import-hint">
            Kolom CSV: <code>name, email, password, nis, class_id</code>. Maksimal 2 MB.
          </p>
          <Input
            label="File CSV"
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            required
          />
          {importResult && (
            <p className="import-result" role="status">
              Impor selesai: {importResult.success} berhasil, {importResult.failed} gagal.
            </p>
          )}
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setImportOpen(false)}>
              Tutup
            </Button>
            <Button type="submit" loading={importing}>
              Impor
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Siswa"
        message={`Yakin menghapus siswa "${deleteTarget?.name}" (NIS ${deleteTarget?.nis})? Akun login ikut dihapus.`}
        loading={deleting}
      />
    </div>
  );
}
