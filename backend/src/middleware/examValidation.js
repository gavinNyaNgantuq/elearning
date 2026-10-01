const pool = require('../config/database');
const examModel = require('../models/examModel');
const { isValidTokenFormat } = require('../utils/tokenGenerator');

/**
 * Validasi token ujian
 * Cek: format, existence, time window, class, sudah submit
 */
async function validateExamToken(req, res, next) {
  try {
    // Token bisa dari body (validate-token) atau params (questions, submit, result)
    const token = req.body.token || req.params.token;
    const studentId = req.user.student_id; // dari JWT

    // 1. Validasi format token
    if (!token || !isValidTokenFormat(token)) {
      return res.status(400).json({
        success: false,
        message: 'Format token tidak valid. Token harus 6 karakter A-Z dan 0-9'
      });
    }

    // 2. Cek token ada di database
    const exam = await examModel.getByToken(token);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Token tidak valid. Ujian tidak ditemukan'
      });
    }

    // 3. Cek waktu ujian sudah dimulai
    const now = new Date();
    const startTime = new Date(exam.start_at);
    if (now < startTime) {
      return res.status(400).json({
        success: false,
        message: 'Ujian belum dimulai'
      });
    }

    // 4. Cek waktu ujian belum berakhir (start_at + duration)
    const endTime = new Date(startTime.getTime() + exam.duration * 60000);
    if (now > endTime) {
      return res.status(400).json({
        success: false,
        message: 'Ujian sudah berakhir'
      });
    }

    // 5. Cek siswa termasuk kelas yang mendapat ujian
    const [studentRows] = await pool.execute(
      'SELECT class_id FROM students WHERE user_id = ?',
      [req.user.id]
    );
    
    if (studentRows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Data siswa tidak ditemukan'
      });
    }
    
    const studentClassId = studentRows[0].class_id;
    if (studentClassId !== exam.class_id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak terdaftar di kelas yang mendapat ujian ini'
      });
    }

    // 6. Cek siswa belum submit
    const hasSubmitted = await examModel.hasStudentSubmitted(exam.id, studentId);
    if (hasSubmitted) {
      return res.status(400).json({
        success: false,
        message: 'Anda sudah mengikuti ujian ini'
      });
    }

    // Simpan exam data ke request untuk digunakan di controller
    req.exam = exam;
    next();
  } catch (error) {
    console.error('Error validating exam token:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
}

module.exports = {
  validateExamToken
};
