import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import './Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password, rememberMe);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* KIRI: Area visual/branding sekolah */}
      <div className="login-left">
        <div className="school-visual">
          <img
            src="/assets/image1.png"
            alt="Logo SMK Bhakti Anindya"
            className="school-logo-large"
          />
          <h1 className="school-name">SMK Bhakti Anindya</h1>
          <p className="school-desc">Platform Pembelajaran Digital</p>
          <p className="school-tagline">E-Learning</p>
        </div>
      </div>

      {/* KANAN: Glass login panel */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-header">
            <img
              src="/assets/image1.png"
              alt="Logo SMK Bhakti Anindya"
              className="login-logo"
            />
            <h1 className="login-title">Selamat Datang</h1>
            <p className="login-subtitle">Masuk ke akun E-Learning Anda</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <Input
              label="Username / Email"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username atau email"
              required
              disabled={loading}
              autoComplete="username"
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
              disabled={loading}
              autoComplete="current-password"
              icon={
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              }
            />

            <div className="login-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <span className="remember-label">Ingat saya</span>
              </label>

              <Link to="/forgot-password" className="forgot-link">
                Lupa Password?
              </Link>
            </div>

            {error && (
              <div className="login-error" role="alert">
                <p>{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading}
              className="login-button"
            >
              Masuk
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}