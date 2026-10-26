import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Question, ExamAnswer } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import './ExamPage.css';

export default function ExamPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [examTitle, setExamTitle] = useState('Ujian');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [token]);

  useEffect(() => {
    if (loading) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading]);

  const fetchQuestions = async () => {
    try {
      const response = await api.get(`/exams/${token}/questions`);
      setQuestions(response.data.data.questions);
      setExamTitle(response.data.data.exam.title || 'Ujian');
      setTimeLeft(response.data.data.exam.duration * 60);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: number, answer: 'A' | 'B' | 'C' | 'D') => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const answerList: ExamAnswer[] = Object.entries(answers).map(([qId, ans]) => ({
        question_id: Number(qId),
        answer: ans,
      }));
      await api.post(`/exams/${token}/submit`, { answers: answerList });
      navigate(`/exam/${token}/result`);
    } catch (error) {
      console.error('Error submitting exam:', error);
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <p>Memuat soal ujian...</p>
      </div>
    );
  }

  // Soal kosong (token tidak valid / gagal memuat):
  // tampilkan pesan, jangan render pertanyaan undefined.
  if (questions.length === 0) {
    return (
      <div className="page-loading">
        <p>Soal ujian tidak ditemukan atau token tidak valid.</p>
        <Button variant="secondary" onClick={() => navigate('/dashboard')}>
          Kembali ke Dashboard
        </Button>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const answeredCount = questions.filter((q) => answers[q.id]).length;
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="exam-page">
      <div className="exam-header">
        <div className="exam-info">
          <h1 className="exam-title">{examTitle}</h1>
          <p className="exam-subtitle">Soal {currentQuestion + 1} dari {questions.length} &middot; {answeredCount} terjawab</p>
        </div>
        <div className={`exam-timer ${timeLeft < 300 ? 'timer-warning' : ''}`} role="timer" aria-label={`Sisa waktu ${formatTime(timeLeft)}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="progress-bar" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="exam-layout">
        <div className="exam-main">
          <Card className="question-card">
            <h2 className="question-text">{question.question}</h2>

            <div className="options-list" role="radiogroup" aria-label={`Pilihan jawaban soal ${currentQuestion + 1}`}>
              {['A', 'B', 'C', 'D'].map((option) => (
                <button
                  key={option}
                  role="radio"
                  aria-checked={answers[question.id] === option}
                  onClick={() => handleAnswer(question.id, option as 'A' | 'B' | 'C' | 'D')}
                  className={`option-button ${answers[question.id] === option ? 'option-selected' : ''}`}
                >
                  <span className="option-letter" aria-hidden="true">{option}</span>
                  <span className="option-text">{question[`option_${option.toLowerCase()}` as keyof Question]}</span>
                </button>
              ))}
            </div>
          </Card>

          <div className="exam-navigation">
            <Button
              variant="secondary"
              onClick={() => setCurrentQuestion((c) => Math.max(0, c - 1))}
              disabled={currentQuestion === 0}
            >
              Sebelumnya
            </Button>
            {currentQuestion < questions.length - 1 ? (
              <Button
                variant="primary"
                onClick={() => setCurrentQuestion((c) => c + 1)}
              >
                Selanjutnya
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={submitting}
              >
                Kumpulkan Jawaban
              </Button>
            )}
          </div>
        </div>

        <aside className="exam-side" aria-label="Navigasi soal">
          <div className="question-nav">
            <p className="question-nav-title">Nomor Soal</p>
            <div className="question-nav-grid">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isCurrent = idx === currentQuestion;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentQuestion(idx)}
                    className={`question-nav-btn${isCurrent ? ' is-current' : ''}${isAnswered ? ' is-answered' : ''}`}
                    aria-label={`Soal ${idx + 1}${isAnswered ? ', sudah dijawab' : ', belum dijawab'}${isCurrent ? ', aktif' : ''}`}
                    aria-current={isCurrent ? 'true' : undefined}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="question-nav-legend">
              <span className="legend-item"><span className="legend-swatch is-answered" aria-hidden="true" /> Terjawab</span>
              <span className="legend-item"><span className="legend-swatch" aria-hidden="true" /> Belum</span>
            </div>
            <Button
              variant="secondary"
              onClick={handleSubmit}
              loading={submitting}
              className="question-nav-submit"
            >
              Kumpulkan
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
