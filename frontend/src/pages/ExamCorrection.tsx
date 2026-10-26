import { useState, useEffect, useCallback } from 'react';
import api, { apiErrorMessage } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import BackButton from '../components/BackButton';
import './ExamCorrection.css';

interface CorrectionExam {
  id: number;
  title: string;
  token: string;
  start_at: string;
  duration: number;
  subject_name: string;
  class_name: string;
  submitted_count: number;
  class_size: number;
}

interface Participant {
  student_id: number;
  nis: string;
  student_name: string;
  class_name: string;
  submitted_at: string | null;
  auto_correct: number;
  auto_total: number;
  manual_score: number | null;
}

interface AnswerDetail {
  question_id: number;
  question: string;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  correct_answer: string | null;
  student_answer: string | null;
  is_correct: number | null;
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function isEssay(q: AnswerDetail) {
  return !q.option_a && !q.option_b && !q.option_c && !q.option_d;
}

export default function ExamCorrection() {
  const [exams, setExams] = useState<CorrectionExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [selectedExam, setSelectedExam] = useState<CorrectionExam | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState<Participant | null>(null);
  const [answers, setAnswers] = useState<AnswerDetail[]>([]);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [scoreInput, setScoreInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [detailError, setDetailError] = useState('');

  const fetchExams = useCallback(async () => {
    try {
      setError('');
      const response = await api.get('/corrections/exams');
      setExams(response.data.data);
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal memuat daftar ujian'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const openExam = async (exam: CorrectionExam) => {
    setSelectedExam(exam);
    setSelectedStudent(null);
    setAnswers([]);
    setSuccess('');
    setError('');
    setLoadingParticipants(true);
    try {
      const response = await api.get(`/corrections/exams/${exam.id}/participants`);
      setParticipants(response.data.data.participants);
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal memuat hasil ujian siswa'));
      setParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const openDetail = async (participant: Participant) => {
    if (!selectedExam) return;
    setSelectedStudent(participant);
    setAnswers([]);
    setDetailError('');
    setSuccess('');
    setScoreInput(
      participant.manual_score !== null && participant.manual_score !== undefined
        ? String(participant.manual_score)
        : ''
    );
    setLoadingAnswers(true);
    try {
      const response = await api.get(
        `/corrections/exams/${selectedExam.id}/participants/${participant.student_id}/answers`
      );
      setAnswers(response.data.data.answers);
    } catch (err) {
      setDetailError(apiErrorMessage(err, 'Gagal memuat detail jawaban'));
    } finally {
      setLoadingAnswers(false);
    }
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam || !selectedStudent) return;
    setDetailError('');
    setSuccess('');

    const score = Number(scoreInput);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      setDetailError('Nilai harus angka 0-100');
      return;
    }

    setSaving(true);
    try {
      await api.put(
        `/corrections/exams/${selectedExam.id}/participants/${selectedStudent.student_id}/grade`,
        { score }
      );
      setSuccess(`Nilai ${selectedStudent.student_name} berhasil disimpan (${score})`);
      // Perbarui daftar tanpa reload penuh
      setParticipants((prev) =>
        prev.map((p) =>
          p.student_id === selectedStudent.student_id ? { ...p, manual_score: score } : p
        )
      );
      setSelectedStudent((prev) => (prev ? { ...prev, manual_score: score } : prev));
    } catch (err) {
      setDetailError(apiErrorMessage(err, 'Gagal menyimpan nilai koreksi'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <BackButton />
            <h1 className="page-title">Koreksi Nilai Ujian</h1>
            <p className="page-subtitle">Periksa jawaban dan koreksi nilai ujian siswa</p>
          </div>
        </div>
        <Card className="table-card">
          <div className="table-skeleton" aria-hidden="true">
            <div className="skeleton" />
            <div className="skeleton" />
            <div className="skeleton" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="page correction-page">
      <div className="page-header">
        <div>
          <BackButton />
          <h1 className="page-title">Koreksi Nilai Ujian</h1>
          <p className="page-subtitle">Periksa jawaban dan koreksi nilai ujian siswa</p>
        </div>
      </div>

      {error && (
        <div className="page-message error" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="page-message success" role="status">
          {success}
        </div>
      )}

      {/* Daftar ujian */}
      <Card className="table-card">
        <div className="correction-section-title">
          <h2>Daftar Ujian</h2>
        </div>
        {exams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-content">
              <h3>Belum ada ujian untuk dikoreksi</h3>
              <p>Ujian yang menjadi tanggung jawab Anda akan tampil di sini.</p>
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ujian</th>
                  <th>Mapel</th>
                  <th>Kelas</th>
                  <th>Mulai</th>
                  <th>Pengumpulan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam.id} className={selectedExam?.id === exam.id ? 'row-selected' : ''}>
                    <td>
                      <strong>{exam.title}</strong>
                      <p className="cell-description">Token: {exam.token} &middot; {exam.duration} menit</p>
                    </td>
                    <td>{exam.subject_name || '-'}</td>
                    <td>{exam.class_name || '-'}</td>
                    <td>{formatDateTime(exam.start_at)}</td>
                    <td>
                      {exam.submitted_count}/{exam.class_size} siswa
                    </td>
                    <td>
                      <Button variant="secondary" size="sm" onClick={() => openExam(exam)}>
                        Periksa
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Hasil peserta */}
      {selectedExam && (
        <Card className="table-card">
          <div className="correction-section-title">
            <h2>Hasil: {selectedExam.title}</h2>
            <p className="cell-description">
              {selectedExam.class_name} &middot; {selectedExam.subject_name}
            </p>
          </div>
          {loadingParticipants ? (
            <div className="table-skeleton" aria-hidden="true">
              <div className="skeleton" />
              <div className="skeleton" />
              <div className="skeleton" />
            </div>
          ) : participants.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-content">
                <h3>Belum ada peserta</h3>
                <p>Kelas ujian ini belum memiliki data siswa.</p>
              </div>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Siswa</th>
                    <th>Status</th>
                    <th>Otomatis</th>
                    <th>Nilai Koreksi</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <tr
                      key={p.student_id}
                      className={selectedStudent?.student_id === p.student_id ? 'row-selected' : ''}
                    >
                      <td>
                        <strong>{p.student_name}</strong>
                        <p className="cell-description">NIS: {p.nis || '-'}</p>
                      </td>
                      <td>
                        {p.submitted_at ? (
                          <span className="status-pill status-active">Sudah mengerjakan</span>
                        ) : (
                          <span className="status-pill status-inactive">Belum mengerjakan</span>
                        )}
                      </td>
                      <td>
                        {p.submitted_at ? `${p.auto_correct}/${p.auto_total} benar` : '-'}
                      </td>
                      <td>{p.manual_score !== null ? p.manual_score : '-'}</td>
                      <td>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetail(p)}
                          disabled={!p.submitted_at}
                          aria-label={`Periksa jawaban ${p.student_name}`}
                        >
                          Detail
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Detail jawaban + form koreksi */}
      {selectedStudent && (
        <Card className="table-card">
          <div className="correction-section-title">
            <h2>Detail: {selectedStudent.student_name}</h2>
            <p className="cell-description">
              NIS: {selectedStudent.nis || '-'} &middot; dikerjakan{' '}
              {formatDateTime(selectedStudent.submitted_at)}
            </p>
          </div>
          {detailError && (
            <div className="form-error" role="alert" style={{ margin: '0 16px 16px' }}>
              {detailError}
            </div>
          )}
          {loadingAnswers ? (
            <div className="table-skeleton" aria-hidden="true">
              <div className="skeleton" />
              <div className="skeleton" />
              <div className="skeleton" />
            </div>
          ) : answers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-content">
                <h3>Belum ada soal</h3>
                <p>Ujian ini belum memiliki soal.</p>
              </div>
            </div>
          ) : (
            <div className="correction-answers">
              {answers.map((a, idx) => (
                <div key={a.question_id} className="correction-answer">
                  <div className="correction-answer-head">
                    <span className="correction-qnum">Soal {idx + 1}</span>
                    {a.student_answer === null || a.student_answer === undefined ? (
                      <span className="status-pill status-inactive">Tidak dijawab</span>
                    ) : a.is_correct === 1 ? (
                      <span className="status-pill status-active">Benar</span>
                    ) : (
                      <span className="status-pill status-wrong">Salah</span>
                    )}
                  </div>
                  <p className="correction-question">{a.question}</p>
                  {isEssay(a) ? (
                    <p className="correction-essay-note">
                      Soal esai — nilai per-soal dicatat melalui Nilai Koreksi di bawah. Koreksi
                      per-soal terpisah membutuhkan persetujuan perubahan skema database.
                    </p>
                  ) : (
                    <ul className="correction-options">
                      {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                        const text = a[`option_${opt.toLowerCase()}` as keyof AnswerDetail] as
                          | string
                          | null;
                        if (text === null || text === undefined) return null;
                        const isKey = a.correct_answer === opt;
                        const isStudent = a.student_answer === opt;
                        return (
                          <li
                            key={opt}
                            className={`correction-option${isKey ? ' is-key' : ''}${
                              isStudent ? ' is-student' : ''
                            }`}
                          >
                            <span className="correction-opt-letter">{opt}</span>
                            <span className="correction-opt-text">{text}</span>
                            {isKey && <span className="correction-tag">Kunci</span>}
                            {isStudent && <span className="correction-tag">Jawaban siswa</span>}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ))}

              <form onSubmit={handleSaveGrade} className="correction-grade-form">
                <Input
                  label="Nilai Koreksi (0-100)"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={scoreInput}
                  onChange={(e) => setScoreInput(e.target.value)}
                  placeholder="Contoh: 85"
                  required
                  disabled={saving}
                />
                <div className="form-actions">
                  <Button type="submit" variant="primary" loading={saving}>
                    Simpan Koreksi
                  </Button>
                </div>
              </form>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
