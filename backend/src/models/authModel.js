const pool = require('../config/database');

const authModel = {
  /**
   * Login user
   */
  async login(username, password) {
    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.email, u.password, u.role_id, r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.username = ? AND u.deleted_at IS NULL`,
      [username]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    return rows[0];
  },

  /**
   * Get student data by user_id
   */
  async getStudentByUserId(userId) {
    const [rows] = await pool.execute(
      'SELECT id, class_id, nis FROM students WHERE user_id = ?',
      [userId]
    );
    return rows[0] || null;
  },

  /**
   * Get teacher data by user_id
   */
  async getTeacherByUserId(userId) {
    const [rows] = await pool.execute(
      'SELECT id, nip FROM teachers WHERE user_id = ?',
      [userId]
    );
    return rows[0] || null;
  },

  /* =========================================================
   * Password reset (OTP)
   * ========================================================= */

  /**
   * Cari user berdasarkan email (untuk alur lupa password)
   */
  async findUserByEmail(email) {
    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.email, u.role_id, r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = ? AND u.deleted_at IS NULL`,
      [email]
    );
    return rows[0] || null;
  },

  /**
   * Simpan kode OTP baru untuk sebuah email.
   * Request lama untuk email yang sama dibuang agar tidak menumpuk,
   * sehingga resetToken lama ikut tidak berlaku.
   */
  async createPasswordReset({ userId, email, otpHash, expiresAt }) {
    await pool.execute(
      'DELETE FROM password_resets WHERE email = ?',
      [email]
    );
    const [result] = await pool.execute(
      `INSERT INTO password_resets (user_id, email, otp_hash, expires_at)
       VALUES (?, ?, ?, ?)`,
      [userId, email, otpHash, expiresAt]
    );
    return result.insertId;
  },

  /**
   * Ambil baris password_reset terbaru untuk sebuah email
   * (tanpa filter status, agar bisa dipakai untuk cek cooldown).
   */
  async getLatestPasswordReset(email) {
    const [rows] = await pool.execute(
      `SELECT id, user_id, email, otp_hash, attempts, max_attempts,
              status, expires_at, created_at
       FROM password_resets
       WHERE email = ? AND deleted_at IS NULL
       ORDER BY id DESC
       LIMIT 1`,
      [email]
    );
    return rows[0] || null;
  },

  /**
   * Tambah jumlah percobaan verifikasi OTP yang salah
   */
  async incrementResetAttempts(id) {
    await pool.execute(
      'UPDATE password_resets SET attempts = attempts + 1, updated_at = NOW() WHERE id = ?',
      [id]
    );
  },

  /**
   * Tandai kode OTP sudah diverifikasi (menghasilkan resetToken)
   */
  async markResetVerified(id) {
    await pool.execute(
      `UPDATE password_resets
       SET status = 'verified', updated_at = NOW()
       WHERE id = ?`,
      [id]
    );
  },

  /**
   * Tandai reset sudah dipakai (sekali pakai) dan bakar semua
   * kode aktif lain untuk email yang sama.
   */
  async consumePasswordReset(id) {
    const [rows] = await pool.execute(
      'SELECT email FROM password_resets WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return;
    await pool.execute(
      `UPDATE password_resets
       SET status = 'used', updated_at = NOW()
       WHERE email = ? AND status <> 'used'`,
      [rows[0].email]
    );
  },

  /**
   * Perbarui password user (hash bcrypt)
   */
  async updatePassword(userId, hashedPassword) {
    await pool.execute(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, userId]
    );
  }
};

module.exports = authModel;
