const examModel = require('../models/examModel');
const { generateUniqueToken } = require('../utils/tokenGenerator');

const examController = {
  /**
   * Buat ujian baru (Admin/Guru)
   */
  async createExam(req, res) {
    try {
      const {
        title,
        subject_id,
        class_id,
        start_at,
        duration
      } = req.body;

      // Generate token unik
      const token = await generateUniqueToken();

      const examData = {
        title,
        subject_id,
        class_id,
        teacher_id: req.user.teacher_id,
        start_at,
        duration,
        token,
        created_by: req.user.id
      };

      const result = await examModel.create(examData);

      res.status(201).json({
        success: true,
        message: 'Ujian berhasil dibuat',
        data: {
          id: result.id,
          token: token,
          ...examData
        }
      });
    } catch (error) {
      console.error('Error creating exam:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal membuat ujian'
      });
    }
  },

  /**
   * Get semua ujian (Admin/Guru)
   */
  async getAllExams(req, res) {
    try {
      const exams = await examModel.getAll(req.query);
      res.json({
        success: true,
        data: exams
      });
    } catch (error) {
      console.error('Error getting exams:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data ujian'
      });
    }
  },

  /**
   * Get ujian by ID (Admin/Guru)
   */
  async getExamById(req, res) {
    try {
      const exam = await examModel.getById(req.params.id);
      if (!exam) {
        return res.status(404).json({
          success: false,
          message: 'Ujian tidak ditemukan'
        });
      }
      res.json({
        success: true,
        data: exam
      });
    } catch (error) {
      console.error('Error getting exam:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data ujian'
      });
    }
  },

  /**
   * Update ujian (Admin/Guru)
   */
  async updateExam(req, res) {
    try {
      const { id } = req.params;
      const examData = {
        ...req.body,
        updated_by: req.user.id
      };

      const success = await examModel.update(id, examData);
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Ujian tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Ujian berhasil diupdate'
      });
    } catch (error) {
      console.error('Error updating exam:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengupdate ujian'
      });
    }
  },

  /**
   * Hapus ujian (Admin/Guru)
   */
  async deleteExam(req, res) {
    try {
      const success = await examModel.softDelete(req.params.id, req.user.id);
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Ujian tidak ditemukan'
        });
      }
      res.json({
        success: true,
        message: 'Ujian berhasil dihapus'
      });
    } catch (error) {
      console.error('Error deleting exam:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus ujian'
      });
    }
  },

  /**
   * Validasi token ujian (Siswa)
   */
  async validateToken(req, res) {
    try {
      const exam = req.exam;

      res.json({
        success: true,
        message: 'Token valid',
        data: {
          exam_id: exam.id,
          title: exam.title,
          duration: exam.duration,
          start_at: exam.start_at
        }
      });
    } catch (error) {
      console.error('Error validating token:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memvalidasi token'
      });
    }
  },

  /**
   * Get soal ujian (Siswa - token valid)
   */
  async getExamQuestions(req, res) {
    try {
      const exam = req.exam;
      const questions = await examModel.getQuestions(exam.id);

      // Jangan kirim answer ke siswa
      const sanitizedQuestions = questions.map(q => ({
        id: q.id,
        question: q.question,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d
      }));

      res.json({
        success: true,
        data: {
          exam: {
            id: exam.id,
            title: exam.title,
            duration: exam.duration,
            start_at: exam.start_at
          },
          questions: sanitizedQuestions
        }
      });
    } catch (error) {
      console.error('Error getting questions:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil soal ujian'
      });
    }
  },

  /**
   * Submit jawaban ujian (Siswa)
   */
  async submitExam(req, res) {
    try {
      const exam = req.exam;
      const { answers } = req.body;
      const studentId = req.user.student_id;

      // Validasi jawaban
      if (!answers || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Jawaban tidak valid'
        });
      }

      // Submit jawaban
      await examModel.submitAnswers(exam.id, studentId, answers);

      // Hitung nilai
      const result = await examModel.getExamResult(exam.id, studentId);

      res.json({
        success: true,
        message: 'Jawaban berhasil disubmit',
        data: {
          total_questions: result.total_questions,
          correct_answers: result.correct_answers
        }
      });
    } catch (error) {
      console.error('Error submitting exam:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal submit jawaban'
      });
    }
  },

  /**
   * Get hasil ujian (Siswa)
   */
  async getExamResult(req, res) {
    try {
      const exam = req.exam;
      const studentId = req.user.student_id;

      const result = await examModel.getExamResult(exam.id, studentId);

      res.json({
        success: true,
        data: {
          exam_title: exam.title,
          total_questions: result.total_questions,
          correct_answers: result.correct_answers
        }
      });
    } catch (error) {
      console.error('Error getting result:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil hasil ujian'
      });
    }
  }
};

module.exports = examController;
