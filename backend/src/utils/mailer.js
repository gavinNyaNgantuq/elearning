const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Util pengiriman email via SMTP.
 *
 * Konfigurasi dibaca dari backend/.env:
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS,
 *   MAIL_FROM, OTP_EXPIRY_MIN
 *
 * TIDAK ada fallback pengiriman (tidak dicetak ke log / tidak ditampilkan
 * di UI). Jika SMTP belum dikonfigurasi, fungsi ini melempar error
 * bernama code 'SMTP_NOT_CONFIGURED' supaya controller bisa membalas
 * 502 secara seragam.
 */

function isSmtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

function getOtpExpiryMinutes() {
  const value = Number(process.env.OTP_EXPIRY_MIN);
  return Number.isFinite(value) && value > 0 ? value : 10;
}

function createTransport() {
  const port = Number(process.env.SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function buildOtpEmail({ to, otp, expiryMinutes }) {
  const from = process.env.MAIL_FROM || 'E-Learning <no-reply@localhost>';
  const subject = 'Kode Reset Password - E-Learning';
  const text =
    `Kode reset password Anda: ${otp}\n\n` +
    `Kode berlaku selama ${expiryMinutes} menit. ` +
    `Jika Anda tidak meminta kode ini, abaikan email ini.\n\n` +
    'Jangan bagikan kode ini kepada siapa pun.';

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
      <p style="font-size:14px;color:#475569">Masukkan kode berikut untuk mereset password Anda:</p>
      <p style="font-size:32px;letter-spacing:8px;font-weight:700;margin:16px 0">${otp}</p>
      <p style="font-size:13px;color:#64748b">Kode berlaku selama ${expiryMinutes} menit.</p>
      <p style="font-size:13px;color:#64748b">Jika Anda tidak meminta kode ini, abaikan email ini. Jangan bagikan kode ini kepada siapa pun.</p>
    </div>`;

  return { from, to, subject, text, html };
}

/**
 * Cek kesehatan koneksi SMTP sebelum lookup email.
 * Dipakai supaya respons 502 seragam untuk email terdaftar maupun tidak,
 * sehingga kegagalan SMTP tidak membocorkan keberadaan akun.
 * @throws {{code: string, message: string}}
 */
async function verifySmtpConnection() {
  if (!isSmtpConfigured()) {
    const error = new Error('SMTP belum dikonfigurasi');
    error.code = 'SMTP_NOT_CONFIGURED';
    throw error;
  }
  try {
    await createTransport().verify();
  } catch (err) {
    console.error('SMTP health check failed:', err.message);
    const error = new Error('Koneksi SMTP tidak tersedia');
    error.code = 'SMTP_UNAVAILABLE';
    throw error;
  }
}

/**
 * Kirim kode OTP ke sebuah alamat email.
 * @throws {{code: string, message: string}} bila SMTP belum diatur / pengiriman gagal
 */
async function sendPasswordResetOtp(to, otp) {
  if (!isSmtpConfigured()) {
    const error = new Error('SMTP belum dikonfigurasi');
    error.code = 'SMTP_NOT_CONFIGURED';
    throw error;
  }

  const expiryMinutes = getOtpExpiryMinutes();
  const mail = buildOtpEmail({ to, otp, expiryMinutes });

  try {
    await createTransport().sendMail(mail);
  } catch (err) {
    console.error('Error sending OTP email:', err.message);
    const error = new Error('Gagal mengirim email');
    error.code = 'SMTP_SEND_FAILED';
    throw error;
  }
}

module.exports = {
  sendPasswordResetOtp,
  verifySmtpConnection,
  isSmtpConfigured,
  getOtpExpiryMinutes,
};
