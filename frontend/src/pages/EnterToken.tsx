import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import BackButton from '../components/BackButton';
import './EnterToken.css';

export default function EnterToken() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/exams/validate-token', { token: token.toUpperCase() });
      if (response.data.success) {
        navigate(`/exam/${token.toUpperCase()}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Token tidak valid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="token-page">
      <Card className="token-card">
        <div className="token-header">
          <BackButton />
          <div className="token-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="token-title">Masuk Ujian</h1>
          <p className="token-subtitle">Masukkan token 6 karakter yang diberikan guru</p>
        </div>

        <form onSubmit={handleSubmit} className="token-form">
          <div className="token-input-wrapper">
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value.toUpperCase())}
              placeholder="XXXXXX"
              maxLength={6}
              required
              className="token-input"
              autoComplete="off"
              autoFocus
            />
          </div>

          {error && (
            <div className="token-error">
              <p>{error}</p>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            disabled={token.length !== 6}
            className="token-button"
          >
            Mulai Ujian
          </Button>
        </form>
      </Card>
    </div>
  );
}
