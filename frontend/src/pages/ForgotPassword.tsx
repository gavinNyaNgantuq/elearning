import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { forgotPassword, verifyOtp, resetPassword } from '../services/authService';
import './ForgotPassword.css';

type ForgotStep = 'email' | 'otp' | 'new-password' | 'success';

export default function ForgotPassword() {
  const navigate = useNavigate();

  // Shared state
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<ForgotStep>('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP state
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  // Password state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');

  // Cooldown
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Clear error when step changes
  useEffect(() => {
    setError('');
    setOtpError('');
  }, [step]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const id = setInterval(() => {
      setCooldownSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldownSeconds]);

  // Back to login
  const handleBack = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  // ── STEP 1: EMAIL ──────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email wajib diisi');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Format email tidak valid');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim kode. Coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2: OTP ────────────────────────────────
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    if (!/^\d{6}$/.test(otp)) {
      setOtpError('Masukkan 6 digit kode OTP');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOtp(email.trim(), otp);
      setResetToken(result.resetToken);
      setStep('new-password');
    } catch (err: any) {
      setOtpError(err.message || 'Kode tidak valid atau sudah kedaluwarsa.');
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 3: NEW PASSWORD ───────────────────────
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password minimal 8 karakter');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim(), resetToken, password, confirmPassword);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah password. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // ── RENDER ─────────────────────────────────────
  return (
    <div className="forgot-page">
      <div className="forgot-container">
        <Card className="forgot-card">
          <div className="forgot-header">
            <h1 className="forgot-title">Lupa Password</h1>
            <p className="forgot-subtitle">
              {step === 'email' && 'Masukkan email Anda untuk menerima kode OTP'}
              {step === 'otp' && 'Kode OTP dikirim ke email Anda'}
              {step === 'new-password' && 'Buat password baru'}
              {step === 'success' && 'Password berhasil diubah'}
            </p>
          </div>

          {/* ── STEP 1: EMAIL ── */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="forgot-form" noValidate>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contoh@school.com"
                required
                disabled={loading}
                autoComplete="email"
                autoFocus
              />

              {error && (
                <div className="forgot-error" role="alert">
                  <p>{error}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                disabled={loading}
                className="forgot-button"
              >
                Kirim Kode
              </Button>

              <div className="forgot-actions">
                <button
                  type="button"
                  className="forgot-back"
                  onClick={handleBack}
                  disabled={loading}
                >
                  ← Kembali ke Login
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="forgot-form" noValidate>
              <Input
                label="Kode OTP"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                required
                disabled={loading}
                autoFocus
                className="otp-input"
              />

              {otpError && (
                <div className="forgot-error" role="alert">
                  <p>{otpError}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                disabled={loading || otp.length !== 6}
                className="forgot-button"
              >
                Verifikasi
              </Button>

              <div className="forgot-actions">
                <button
                  type="button"
                  className="forgot-back"
                  onClick={() => {
                    setStep('email');
                    setOtp('');
                    setOtpError('');
                  }}
                  disabled={loading}
                >
                  ← Kembali
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 3: NEW PASSWORD ── */}
          {step === 'new-password' && (
            <form onSubmit={handlePasswordSubmit} className="forgot-form" noValidate>
              <Input
                label="Password Baru"
                type={password.length > 0 ? (password.includes('.') ? 'text' : 'password') : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                required
                disabled={loading}
                autoComplete="new-password"
                autoFocus
              />

              <Input
                label="Konfirmasi Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                required
                disabled={loading}
                autoComplete="new-password"
              />

              {error && (
                <div className="forgot-error" role="alert">
                  <p>{error}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                disabled={loading || password.length < 8 || password !== confirmPassword}
                className="forgot-button"
              >
                Ubah Password
              </Button>

              <div className="forgot-actions">
                <button
                  type="button"
                  className="forgot-back"
                  onClick={() => {
                    setStep('otp');
                    setError('');
                  }}
                  disabled={loading}
                >
                  ← Kembali ke OTP
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 4: SUCCESS ── */}
          {step === 'success' && (
            <div className="forgot-success">
              <div className="forgot-success-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h2 className="forgot-success-title">Password Berhasil Diubah</h2>
              <p className="forgot-success-msg">
                Password Anda telah diperbarui. Silakan masuk dengan password baru.
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={handleBack}
                className="forgot-button"
              >
                Kembali ke Login
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}