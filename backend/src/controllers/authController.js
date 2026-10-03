const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const authModel = require('../models/authModel');
const mailer = require('../utils/mailer');
require('dotenv').config();

const OTP_LENGTH = 6;
const RESET_TOKEN_TTL = '15m';
const RESEND_COOLDOWN_SECONDS = 60;

/** Pesan generik: tidak pernah membocorkan apakah email terdaftar atau tidak. */
const GENERIC_REQUEST_MESSAGE =
  'Jika email terdaftar, kode verifikasi akan dikirim ke email tersebut.';
const INVALID_CODE_MESSAGE = 'Kode tidak valid atau sudah kedaluwarsa.';
const INVALID_LINK_MESSAGE = 'Tautan reset tidak valid atau sudah kedaluwarsa.';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Generate kode OTP numerik 6 digit (crypto, bukan Math.random). */
function generateOtp() {
  return crypto.randomInt(0, 10 ** OTP_LENGTH)
    .toString()
    .padStart(OTP_LENGTH, '0');
}

const authController = {
  /**
   * Login user
   */
  async login(req, res) {
    try {
      const { email, username, password } = req.body;
      const identifier = email || username;

      if (!identifier || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email dan password wajib diisi'
        });
      }

      const user = await authModel.login(identifier, password);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Email atau password salah'
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Email atau password salah'
        });
      }

      // Get additional data based on role
      let studentData = null;
      let teacherData = null;
      
      if (user.role_name === 'siswa') {
        studentData = await authModel.getStudentByUserId(user.id);
      } else if (user.role_name === 'guru') {
        teacherData = await authModel.getTeacherByUserId(user.id);
      }

      // Generate JWT
      const token = jwt.sign(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role_name,
          student_id: studentData?.id || null,
          teacher_id: teacherData?.id || null,
          class_id: studentData?.class_id || null
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        message: 'Login berhasil',
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role_name,
            nis: studentData?.nis || null,
            class_name: studentData?.class_name || null
          }
        }
      });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  /**
   * Logout user.
   * JWT bersifat stateless, sehingga invalidasi dilakukan
   * di client (hapus token dari storage). Endpoint ini
   * dipanggil agar logout tercatat di sisi server.
   */
  async logout(req, res) {
    res.json({
      success: true,
      message: 'Logout berhasil'
    });
  },

  /**
   * Get current user profile
   */
  async getProfile(req, res) {
    try {
      res.json({
        success: true,
        data: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role
        }
      });
    } catch (error) {
      console.error('Error getting profile:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  /**
   * Langkah 1 — Minta kode OTP reset password.
   *
   * Respons generik untuk semua email (anti enumeration): email yang
   * terdaftar maupun tidak mendapat pesan yang sama. Baris password_resets
   * dibuat untuk SEMUA email agar cooldown 60 detik berlaku seragam.
   * Kode hanya dikirim bila email ditemukan.
   */
  async forgotPassword(req, res) {
    try {
      const rawEmail = (req.body.email || '').trim();
      if (!EMAIL_REGEX.test(rawEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Format email tidak valid'
        });
      }
      const email = rawEmail.toLowerCase();

      // Health-check SMTP SEBELUUM lookup email. Bila SMTP mati, semua
      // email (terdaftar maupun tidak) mendapat 502 yang sama, sehingga
      // kegagalan SMTP tidak membocorkan keberadaan akun.
      try {
        await mailer.verifySmtpConnection();
      } catch (err) {
        return res.status(502).json({
          success: false,
          message: 'Gagal mengirim kode, coba lagi nanti.'
        });
      }

      // Cooldown seragam berdasarkan email terakhir (termasuk email tak terdaftar)
      const latest = await authModel.getLatestPasswordReset(email);
      if (latest) {
        const elapsedSeconds =
          (Date.now() - new Date(latest.created_at).getTime()) / 1000;
        if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
          const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsedSeconds);
          return res.status(429).json({
            success: false,
            message: `Kode baru dapat dikirim dalam ${wait} detik.`
          });
        }
      }

      const user = await authModel.findUserByEmail(email);

      const otp = generateOtp();
      const otpHash = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(
        Date.now() + mailer.getOtpExpiryMinutes() * 60 * 1000
      );

      await authModel.createPasswordReset({
        userId: user ? user.id : null,
        email,
        otpHash,
        expiresAt
      });

      // Kode hanya dikirim bila email benar-benar terdaftar.
      if (user && user.email) {
        try {
          await mailer.sendPasswordResetOtp(user.email, otp);
        } catch (err) {
          console.error('Error sending reset OTP:', err.code || err.message);
          return res.status(502).json({
            success: false,
            message: 'Gagal mengirim kode, coba lagi nanti.'
          });
        }
      }

      return res.json({ success: true, message: GENERIC_REQUEST_MESSAGE });
    } catch (error) {
      console.error('Error requesting reset OTP:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  /**
   * Langkah 2 — Verifikasi kode OTP, lalu keluarkan resetToken.
   * Maksimal 5 percobaan; salah habis -> kode dibakar.
   */
  async verifyOtp(req, res) {
    try {
      const rawEmail = (req.body.email || '').trim();
      const otp = (req.body.otp || '').trim();
      if (!EMAIL_REGEX.test(rawEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Format email tidak valid'
        });
      }
      if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(otp)) {
        return res.status(400).json({
          success: false,
          message: INVALID_CODE_MESSAGE
        });
      }
      const email = rawEmail.toLowerCase();

      const row = await authModel.getLatestPasswordReset(email);
      if (!row || row.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: INVALID_CODE_MESSAGE
        });
      }

      if (new Date(row.expires_at).getTime() < Date.now()) {
        await authModel.consumePasswordReset(row.id);
        return res.status(400).json({
          success: false,
          message: INVALID_CODE_MESSAGE
        });
      }

      if (row.attempts >= row.max_attempts) {
        await authModel.consumePasswordReset(row.id);
        return res.status(400).json({
          success: false,
          message: INVALID_CODE_MESSAGE
        });
      }

      const isMatch = await bcrypt.compare(otp, row.otp_hash);
      if (!isMatch) {
        await authModel.incrementResetAttempts(row.id);
        return res.status(400).json({
          success: false,
          message: INVALID_CODE_MESSAGE
        });
      }

      await authModel.markResetVerified(row.id);

      const resetToken = jwt.sign(
        { purpose: 'reset', email, user_id: row.user_id },
        process.env.JWT_SECRET,
        { expiresIn: RESET_TOKEN_TTL }
      );

      return res.json({
        success: true,
        message: 'Kode terverifikasi.',
        data: { resetToken }
      });
    } catch (error) {
      console.error('Error verifying OTP:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  /**
   * Langkah 3 — Ganti password memakai resetToken (sekali pakai).
   */
  async resetPassword(req, res) {
    try {
      const rawEmail = (req.body.email || '').trim();
      const { resetToken, password, confirmPassword } = req.body;

      if (!password || password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password minimal 8 karakter'
        });
      }
      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Konfirmasi password tidak cocok'
        });
      }
      if (!EMAIL_REGEX.test(rawEmail) || !resetToken) {
        return res.status(400).json({
          success: false,
          message: INVALID_LINK_MESSAGE
        });
      }
      const email = rawEmail.toLowerCase();

      let decoded;
      try {
        decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: INVALID_LINK_MESSAGE
        });
      }

      if (
        decoded.purpose !== 'reset' ||
        decoded.email !== email ||
        !decoded.user_id
      ) {
        return res.status(400).json({
          success: false,
          message: INVALID_LINK_MESSAGE
        });
      }

      const row = await authModel.getLatestPasswordReset(email);
      if (
        !row ||
        row.status !== 'verified' ||
        row.user_id !== decoded.user_id ||
        new Date(row.expires_at).getTime() < Date.now()
      ) {
        return res.status(400).json({
          success: false,
          message: INVALID_LINK_MESSAGE
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await authModel.updatePassword(row.user_id, hashedPassword);
      await authModel.consumePasswordReset(row.id);

      return res.json({
        success: true,
        message: 'Password berhasil diubah. Silakan masuk kembali.'
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  }
};

module.exports = authController;
