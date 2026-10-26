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
import './Schedules.css';

interface ScheduleItem {
  id: number;
  class_id: number;
  subject_id: number;
  teacher_id: number;
  day: string;
  start_time: string;
  end_time: string;
  room?: string | null;
  class_name: string;
  subject_name: string;
  teacher_nip: string;
}

interface ClassOption {
  id: number;
  name: string;
  major_name?: string;
}

interface SubjectOption {
  id: number;
  name: string;
}

interface TeacherOption {
  id: number;
  name: string;
  nip: string;
}

interface ScheduleForm {
  class_id: string;
  subject_id: string;
  teacher_id: string;
  day: string;
  start_time: string;
  end_time: string;
  room: string;
}

const EMPTY_FORM: ScheduleForm = {
  class_id: '',
  subject_id: '',
  teacher_id: '',
  day: '',
  start_time: '',
  end_time: '',
  room: '',
};

const DAY_OPTIONS = [
  { value: 'senin', label: 'Senin' },
  { value: 'selasa', label: 'Selasa' },
  { value: 'rabu', label: 'Rabu' },
  { value: 'kamis', label: 'Kamis' },
  { value: 'jumat', label: 'Jumat' },
  { value: 'sabtu', label: 'Sabtu' },
  { value: 'minggu', label: 'Minggu' },
];

const dayNames: Record<string, string> = {
  senin: 'Senin',
  selasa: 'Selasa',
  rabu: 'Rabu',
  kamis: 'Kamis',
  jumat: 'Jumat',
  sabtu: 'Sabtu',
  minggu: 'Minggu',
};

const dayOrder = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];

export default function Schedules() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<SubjectOption[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dayFilter, setDayFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleItem | null>(null);
  const [form, setForm] = useState<ScheduleForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ScheduleItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      // Siswa/guru pakai endpoint perannya; admin tetap rekap 7 hari.
      // Backend tetap menegakkan role per endpoint.
      if (user?.role === 'siswa') {
        const res = await api.get('/schedules/student').catch(() => ({ data: { data: [] } }));
        setSchedules(res.data.data || []);
      } else if (user?.role === 'guru') {
        const res = await api.get('/schedules/teacher').catch(() => ({ data: { data: [] } }));
        setSchedules(res.data.data || []);
      } else {
        const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
        const results = await Promise.all(
          days.map((day) => api.get(`/schedules/day/${day}`).catch(() => ({ data: { data: [] } })))
        );
        const all = results.flatMap((r) => r.data.data);
        setSchedules(all);
      }

      const [classesRes, subjectsRes, teachersRes] = await Promise.all([
        api.get('/classes').catch(() => ({ data: { data: [] } })),
        api.get('/subjects').catch(() => ({ data: { data: [] } })),
        api.get('/teachers').catch(() => ({ data: { data: [] } })),
      ]);
      setClassOptions(classesRes.data.data || []);
      setSubjectOptions(subjectsRes.data.data || []);
      setTeacherOptions(teachersRes.data.data || []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal memuat data jadwal'));
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

  const openEdit = (item: ScheduleItem) => {
    setEditing(item);
    setForm({
      class_id: String(item.class_id),
      subject_id: String(item.subject_id),
      teacher_id: String(item.teacher_id),
      day: item.day,
      start_time: (item.start_time || '').substring(0, 5),
      end_time: (item.end_time || '').substring(0, 5),
      room: item.room || '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.class_id || !form.subject_id || !form.teacher_id || !form.day || !form.start_time || !form.end_time) {
      setFormError('Kelas, mapel, guru, hari, dan jam wajib diisi');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        class_id: parseInt(form.class_id),
        subject_id: parseInt(form.subject_id),
        teacher_id: parseInt(form.teacher_id),
        day: form.day,
        start_time: form.start_time + ':00',
        end_time: form.end_time + ':00',
        room: form.room.trim() || null,
      };
      if (editing) {
        await api.put(`/schedules/${editing.id}`, payload);
      } else {
        await api.post('/schedules', payload);
      }
      setModalOpen(false);
      await fetchData();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Gagal menyimpan jadwal'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/schedules/${deleteTarget.id}`);
      setDeleteTarget(null);
      await fetchData();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Gagal menghapus jadwal'));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = schedules.filter((s) => {
    const matchSearch =
      (s.subject_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.class_name || '').toLowerCase().includes(search.toLowerCase());
    const matchDay = !dayFilter || s.day === dayFilter;
    return matchSearch && matchDay;
  });

  const groupByDay = (list: ScheduleItem[]) => {
    const grouped: Record<string, ScheduleItem[]> = {};
    dayOrder.forEach((day) => (grouped[day] = []));
    list.forEach((s) => {
      if (grouped[s.day]) grouped[s.day].push(s);
    });
    return grouped;
  };

  const grouped = groupByDay(filtered);

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <BackButton />
            <h1 className="page-title">Jadwal Pelajaran</h1>
            <p className="page-subtitle">Jadwal pelajaran mingguan seluruh kelas</p>
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

  const hasAnySchedule = Object.values(grouped).some((arr) => arr.length > 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <BackButton />
          <h1 className="page-title">Jadwal Pelajaran</h1>
          <p className="page-subtitle">Jadwal pelajaran mingguan seluruh kelas</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate}>
            Tambah Jadwal
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
            placeholder="Cari mapel atau kelas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Cari jadwal"
            className="table-search"
          />
          <Select
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            options={DAY_OPTIONS}
            placeholder="Semua hari"
            aria-label="Filter hari"
            className="table-filter"
          />
        </div>

        {!hasAnySchedule ? (
          <div className="empty-state">
            <div className="empty-state-content">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <h3>Belum ada jadwal</h3>
              <p>{search || dayFilter ? 'Tidak ada jadwal yang cocok dengan filter' : 'Data jadwal belum tersedia'}</p>
            </div>
          </div>
        ) : (
          <div className="schedule-week">
            {dayOrder.map((day) => {
              const daySchedules = grouped[day];
              return (
                <div key={day} className="day-column">
                  <div className="day-header">
                    <h3 className="day-name">{dayNames[day]}</h3>
                    <span className="day-count">{daySchedules.length} jam</span>
                  </div>
                  <div className="day-schedules">
                    {daySchedules.length === 0 ? (
                      <p className="no-schedule">Tidak ada jadwal</p>
                    ) : (
                      daySchedules
                        .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
                        .map((schedule) => (
                          <div key={schedule.id} className="schedule-card">
                            <div className="schedule-time">
                              {schedule.start_time?.substring(0, 5)} - {schedule.end_time?.substring(0, 5)}
                            </div>
                            <div className="schedule-info">
                              <h4 className="schedule-subject">{schedule.subject_name || 'Mata Pelajaran'}</h4>
                              <p className="schedule-class">{schedule.class_name || 'Kelas'}</p>
                              <p className="schedule-teacher">
                                Guru: {schedule.teacher_nip || '-'}
                                {schedule.room ? ` • Ruang: ${schedule.room}` : ''}
                              </p>
                            </div>
                            {isAdmin && (
                              <div className="schedule-actions">
                                <Button variant="ghost" size="sm" onClick={() => openEdit(schedule)}>
                                  Ubah
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(schedule)}>
                                  Hapus
                                </Button>
                              </div>
                            )}
                          </div>
                        ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Ubah Jadwal' : 'Tambah Jadwal'}
        size="lg"
      >
        <form onSubmit={handleSubmit} noValidate>
          {formError && (
            <p className="form-error" role="alert">{formError}</p>
          )}
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
          <Select
            label="Mata Pelajaran"
            value={form.subject_id}
            onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
            options={subjectOptions.map((s) => ({ value: String(s.id), label: s.name }))}
            placeholder="Pilih mata pelajaran..."
            required
          />
          <Select
            label="Guru"
            value={form.teacher_id}
            onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
            options={teacherOptions.map((t) => ({
              value: String(t.id),
              label: t.nip ? `${t.name} (${t.nip})` : t.name,
            }))}
            placeholder="Pilih guru..."
            required
          />
          <Select
            label="Hari"
            value={form.day}
            onChange={(e) => setForm({ ...form, day: e.target.value })}
            options={DAY_OPTIONS}
            placeholder="Pilih hari..."
            required
          />
          <div className="form-row">
            <Input
              label="Jam Mulai"
              type="time"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              required
            />
            <Input
              label="Jam Selesai"
              type="time"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              required
            />
          </div>
          <Input
            label="Ruang"
            placeholder="Contoh: R1"
            value={form.room}
            onChange={(e) => setForm({ ...form, room: e.target.value })}
          />
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Simpan Perubahan' : 'Buat Jadwal'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Jadwal"
        message={`Yakin menghapus jadwal ${deleteTarget?.subject_name || ''} hari ${dayNames[deleteTarget?.day || ''] || ''}? Tindakan ini tidak dapat dibatalkan.`}
        loading={deleting}
      />
    </div>
  );
}
