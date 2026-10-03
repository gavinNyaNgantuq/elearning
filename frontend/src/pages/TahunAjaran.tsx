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
import './TahunAjaran.css';

interface TahunAjaranItem {
  id: number;
  name: string;
  semester: 'ganjil' | 'genap';
  start_date: string | null;
  end_date: string | null;
  is_active: number;
}

interface TahunAjaranForm {
  name: string;
  semester: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

const EMPTY_FORM: TahunAjaranForm = {
  name: '',
  semester: '',
  start_date: '',
  end_date: '',
  is_active: false,
};

const SEMESTER_OPTIONS = [
  { value: 'ganjil', label: 'Ganjil' },
  { value: 'genap', label: 'Genap' },
];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function TahunAjaran() {
  const [items, setItems] = useState<TahunAjaranItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TahunAjaranItem | null>(null);
  const [form, setForm] = useState<TahunAjaranForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<TahunAjaranItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activating, setActivating] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const res = await api.get('/tahun-ajaran?limit=100');
      setItems(res.data.data || []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal memuat data tahun ajaran'));
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

  const openEdit = (item: TahunAjaranItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      semester: item.semester,
      start_date: item.start_date || '',
      end_date: item.end_date || '',
      is_active: !!item.is_active,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.semester) {
      setFormError('Tahun ajaran dan semester wajib diisi');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name.trim(),
        semester: form.semester,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        is_active: form.is_active,
      };
      if (editing) {
        await api.put(`/tahun-ajaran/${editing.id}`, payload);
      } else {
        await api.post('/tahun-ajaran', payload);
      }
      setModalOpen(false);
      await fetchData();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Gagal menyimpan tahun ajaran'));
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (item: TahunAjaranItem) => {
    setActivating(item.id);
    try {
      await api.put(`/tahun-ajaran/${item.id}/aktifkan`);
      await fetchData();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Gagal mengaktifkan tahun ajaran'));
    } finally {
      setActivating(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/tahun-ajaran/${deleteTarget.id}`);
      setDeleteTarget(null);
      await fetchData();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Gagal menghapus tahun ajaran'));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = items.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.semester.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <BackButton />
            <h1 className="page-title">Tahun Ajaran</h1>
            <p className="page-subtitle">Kelola tahun ajaran sekolah</p>
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
          <h1 className="page-title">Tahun Ajaran</h1>
          <p className="page-subtitle">Kelola tahun ajaran sekolah</p>
        </div>
        <Button onClick={openCreate}>
          Tambah Tahun Ajaran
        </Button>
      </div>

      {error && (
        <div className="page-error" role="alert">
          <p>{error}</p>
          <Button variant="secondary" size="sm" onClick={fetchData}>Coba Lagi</Button>
        </div>
      )}

      {formError && !modalOpen && (
        <div className="page-error" role="alert">
          <p>{formError}</p>
        </div>
      )}

      <Card className="table-card">
        <div className="table-toolbar">
          <Input
            placeholder="Cari tahun ajaran..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Cari tahun ajaran"
            className="table-search"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-content">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <h3>Belum ada tahun ajaran</h3>
              <p>{search ? 'Tidak ada tahun ajaran yang cocok dengan pencarian' : 'Data tahun ajaran belum tersedia'}</p>
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tahun Ajaran</th>
                  <th>Semester</th>
                  <th>Mulai</th>
                  <th>Selesai</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.name}</strong>
                    </td>
                    <td>
                      {t.semester === 'ganjil' ? 'Ganjil' : 'Genap'}
                    </td>
                    <td>{formatDate(t.start_date)}</td>
                    <td>{formatDate(t.end_date)}</td>
                    <td>
                      <span className={`status-pill ${t.is_active ? 'status-active' : 'status-inactive'}`}>
                        {t.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        {!t.is_active && (
                          <Button
                            variant="ghost"
                            size="sm"
                            loading={activating === t.id}
                            onClick={() => handleActivate(t)}
                          >
                            Aktifkan
                          </Button>
                        )}
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
        title={editing ? 'Ubah Tahun Ajaran' : 'Tambah Tahun Ajaran'}
      >
        <form onSubmit={handleSubmit} noValidate>
          {formError && (
            <p className="form-error" role="alert">{formError}</p>
          )}
          <Input
            label="Tahun Ajaran"
            placeholder="Contoh: 2026/2027"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Select
            label="Semester"
            value={form.semester}
            onChange={(e) => setForm({ ...form, semester: e.target.value })}
            options={SEMESTER_OPTIONS}
            placeholder="Pilih semester..."
            required
          />
          <div className="form-row">
            <Input
              label="Tanggal Mulai"
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
            <Input
              label="Tanggal Selesai"
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </div>
          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            <span>Jadikan tahun ajaran aktif sekarang</span>
          </label>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Simpan Perubahan' : 'Buat Tahun Ajaran'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Tahun Ajaran"
        message={`Yakin menghapus tahun ajaran "${deleteTarget?.name}" semester ${deleteTarget?.semester === 'ganjil' ? 'Ganjil' : 'Genap'}?`}
        loading={deleting}
      />
    </div>
  );
}
