import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ExamResult as ExamResultType } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import './ExamResult.css';

export default function ExamResult() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<ExamResultType | null>(null);
  const [examTitle, setExamTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResult();
  }, [token]);

  const fetchResult = async () => {
    try {
      const response = await api.get(`/exams/${token}/result`);
      setResult(response.data.data);
      setExamTitle(response.data.data.exam_title);
    } catch (error) {
      console.error('Error fetching result:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <p>Memuat hasil...</p>
      </div>
    );
  }

  const percentage = result ? Math.round((result.correct_answers / result.total_questions) * 100) : 0;

  return (
    <div className="result-page">
      <Card className="result-card">
        <div className="result-header">
          <div className="result-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="result-title">Ujian Selesai</h1>
          <p className="result-subtitle">{examTitle}</p>
        </div>

        {result && (
          <>
            <div className="result-score">
              <div className="score-circle">
                <span className="score-value">{percentage}%</span>
              </div>
            </div>

            <div className="result-stats">
              <div className="stat-item">
                <span className="stat-value">{result.total_questions}</span>
                <span className="stat-label">Total Soal</span>
              </div>
              <div className="stat-item">
                <span className="stat-value stat-success">{result.correct_answers}</span>
                <span className="stat-label">Jawaban Benar</span>
              </div>
              <div className="stat-item">
                <span className="stat-value stat-error">{result.total_questions - result.correct_answers}</span>
                <span className="stat-label">Jawaban Salah</span>
              </div>
            </div>
          </>
        )}

        <div className="result-actions">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/dashboard')}
            className="result-button"
          >
            Kembali ke Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
}
