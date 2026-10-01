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
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [token]);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const fetchQuestions = async () => {
    try {
      const response = await api.get(`/exams/${token}/questions`);
      setQuestions(response.data.data.questions);
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

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="exam-page">
      <div className="exam-header">
        <div className="exam-info">
          <h1 className="exam-title">Ujian</h1>
          <p className="exam-subtitle">Soal {currentQuestion + 1} dari {questions.length}</p>
        </div>
        <div className={`exam-timer ${timeLeft < 300 ? 'timer-warning' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <Card className="question-card">
        <h2 className="question-text">{question.question}</h2>

        <div className="options-list">
          {['A', 'B', 'C', 'D'].map((option) => (
            <button
              key={option}
              onClick={() => handleAnswer(question.id, option as 'A' | 'B' | 'C' | 'D')}
              className={`option-button ${answers[question.id] === option ? 'option-selected' : ''}`}
            >
              <span className="option-letter">{option}</span>
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
            Submit Jawaban
          </Button>
        )}
      </div>
    </div>
  );
}
