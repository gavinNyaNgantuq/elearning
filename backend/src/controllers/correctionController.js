const pool = require('../config/database');
const correctionModel = require('../models/correctionModel');

function isGuru(user) {
  return user && user.role === 'guru';
}

/**
 * Pastikan guru hanya mengakses ujiannya sendiri.
 * Return exam bila boleh, kirim 403/404 bila tidak.
 */
async function authorizeExam(req, res) {
  const exam = await correctionModel.getExamById(req.params.id);
  if (!exam) {
    res.status(404).json({ success: false, message: 'Ujian tidak ditemukan' });
    return null;
  }
  if (isGuru(req.user) && exam.teacher_id !== req.user.teacher_id) {
    res.status(403).json({
      success: false,
      message: 'Anda tidak memiliki akses ke ujian ini'
    });
    return null;
  }
  return exam;
}

const correctionController = {
  /**
   * GET /api/corrections/exams
   * Guru: ujiannya sendiri. Admin: semua.
   */
  async getExams(req, res) {
    try {
      const exams = await correctionModel.getExams(
        isGuru(req.user) ? { teacher_id: req.user.teacher_id } : {}
      );
      res.json({ success: true, data: exams });
    } catch (error) {
      console.error('Error getting correction exams:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil daftar ujian'
      });
    }
  },

  /**
   * GET /api/corrections/exams/:id/participants
   */
  async getParticipants(req, res) {
    try {
      const exam = await authorizeExam(req, res);
      if (!exam) return;
      const participants = await correctionModel.getParticipants(exam.id);
      res.json({ success: true, data: { exam, participants } });
    } catch (error) {
      console.error('Error getting participants:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil hasil ujian siswa'
      });
    }
  },

  /**
   * GET /api/corrections/exams/:id/participants/:studentId/answers
   */
  async getAnswers(req, res) {
    try {
      const exam = await authorizeExam(req, res);
      if (!exam) return;

      const studentId = parseInt(req.params.studentId, 10);
      if (!Number.isInteger(studentId)) {
        return res.status(400).json({
          success: false,
          message: 'ID siswa tidak valid'
        });
      }

      const participant = await correctionModel.isParticipant(exam.id, studentId);
      if (!participant) {
        return res.status(403).json({
          success: false,
          message: 'Siswa bukan peserta ujian ini'
        });
      }

      const answers = await correctionModel.getParticipantAnswers(exam.id, studentId);
      const manual = await correctionModel.getManualGrade(
        exam.id, exam.subject_id, studentId
      );
      res.json({ success: true, data: { exam, answers, manual } });
    } catch (error) {
      console.error('Error getting correction answers:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil detail jawaban siswa'
      });
    }
  },

  /**
   * PUT /api/corrections/exams/:id/participants/:studentId/grade
   * Body: { score: 0-100 }
   * Menyimpan nilai manual TANPA mengubah exam_answers/questions
   * (nilai otomatis tetap utuh). Idempoten — tidak terduplikasi.
   */
  async saveGrade(req, res) {
    const connection = await pool.getConnection();
    try {
      const exam = await authorizeExam(req, res);
      if (!exam) {
        connection.release();
        return;
      }

      const studentId = parseInt(req.params.studentId, 10);
      if (!Number.isInteger(studentId)) {
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'ID siswa tidak valid'
        });
      }

      const participant = await correctionModel.isParticipant(exam.id, studentId);
      if (!participant) {
        connection.release();
        return res.status(403).json({
          success: false,
          message: 'Siswa bukan peserta ujian ini'
        });
      }

      const submitted = await correctionModel.hasSubmitted(exam.id, studentId);
      if (!submitted) {
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'Siswa belum mengerjakan ujian ini'
        });
      }

      const score = Number(req.body.score);
      if (!Number.isFinite(score) || score < 0 || score > 100) {
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'Nilai harus angka 0-100'
        });
      }

      await connection.beginTransaction();
      await correctionModel.saveManualGrade(connection, {
        exam,
        student_id: studentId,
        score,
        user_id: req.user.id
      });
      await connection.commit();

      const manual = await correctionModel.getManualGrade(
        exam.id, exam.subject_id, studentId
      );

      res.json({
        success: true,
        message: 'Nilai koreksi berhasil disimpan',
        data: manual
      });
    } catch (error) {
      try {
        await connection.rollback();
      } catch (_) {
        /* abaikan */
      }
      console.error('Error saving correction grade:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menyimpan nilai koreksi'
      });
    } finally {
      connection.release();
    }
  }
};

module.exports = correctionController;
