const submissionModel = require('../models/submissionModel');
const assignmentModel = require('../models/assignmentModel');
const studentModel = require('../models/studentModel');
const pool = require('../config/database');

const submissionController = {
  /**
   * Get all submissions with filters (Admin/Guru)
   */
  async getAll(req, res) {
    try {
      const { assignment_id, student_id, page = 1, limit = 20 } = req.query;
      const submissions = await submissionModel.getAll({
        assignment_id: assignment_id ? parseInt(assignment_id) : undefined,
        student_id: student_id ? parseInt(student_id) : undefined,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      const total = await submissionModel.getCount({
        assignment_id: assignment_id ? parseInt(assignment_id) : undefined,
        student_id: student_id ? parseInt(student_id) : undefined
      });
      
      res.json({
        success: true,
        data: submissions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting submissions:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data pengumpulan tugas'
      });
    }
  },

  /**
   * Get submission by ID
   */
  async getById(req, res) {
    try {
      const submission = await submissionModel.getById(req.params.id);
      if (!submission) {
        return res.status(404).json({
          success: false,
          message: 'Pengumpulan tugas tidak ditemukan'
        });
      }

      // Authorization check
      if (req.user.role === 'siswa' && submission.student_id !== req.user.student_id) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki akses ke pengumpulan ini'
        });
      }

      res.json({
        success: true,
        data: submission
      });
    } catch (error) {
      console.error('Error getting submission:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data pengumpulan tugas'
      });
    }
  },

  /**
   * Create submission (Siswa)
   */
  async create(req, res) {
    try {
      const { assignment_id, file_path } = req.body;

      if (!assignment_id) {
        return res.status(400).json({
          success: false,
          message: 'ID tugas wajib diisi'
        });
      }

      // Get student_id from authenticated user
      const student_id = req.user.student_id;
      if (!student_id) {
        return res.status(400).json({
          success: false,
          message: 'Data siswa tidak ditemukan'
        });
      }

      // Check if assignment exists
      const assignment = await assignmentModel.getById(assignment_id);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Tugas tidak ditemukan'
        });
      }

      // Check if already submitted
      const existing = await submissionModel.checkExisting(assignment_id, student_id);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Anda sudah mengumpulkan tugas ini. Gunakan update untuk mengganti file.'
        });
      }

      const submissionData = await submissionModel.create({
        assignment_id: parseInt(assignment_id),
        student_id,
        file_path: file_path || null
      });

      res.status(201).json({
        success: true,
        message: 'Tugas berhasil dikumpulkan',
        data: submissionData
      });
    } catch (error) {
      console.error('Error creating submission:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengumpulkan tugas'
      });
    }
  },

  /**
   * Update submission (Siswa re-upload file)
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { file_path } = req.body;

      const submission = await submissionModel.getById(id);
      if (!submission) {
        return res.status(404).json({
          success: false,
          message: 'Pengumpulan tugas tidak ditemukan'
        });
      }

      // Authorization check - only owner can update
      if (req.user.role === 'siswa' && submission.student_id !== req.user.student_id) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki izin mengubah pengumpulan ini'
        });
      }

      // Don't allow update if already graded
      const gradedScore = submission.score ?? submission.grade;
      if (gradedScore !== null && gradedScore !== undefined && req.user.role === 'siswa') {
        return res.status(400).json({
          success: false,
          message: 'Tidak bisa mengubah pengumpulan yang sudah dinilai'
        });
      }

      const updated = await submissionModel.update(id, {
        file: file_path || submission.file || submission.file_path
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Pengumpulan tugas tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Pengumpulan tugas berhasil diperbarui'
      });
    } catch (error) {
      console.error('Error updating submission:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui pengumpulan tugas'
      });
    }
  },

  /**
   * Grade submission (Guru/Admin)
   */
  async grade(req, res) {
    try {
      const { id } = req.params;
      const { grade } = req.body;

      if (grade === undefined || grade === null) {
        return res.status(400).json({
          success: false,
          message: 'Nilai wajib diisi'
        });
      }

      if (grade < 0 || grade > 100) {
        return res.status(400).json({
          success: false,
          message: 'Nilai harus antara 0-100'
        });
      }

      const submission = await submissionModel.getById(id);
      if (!submission) {
        return res.status(404).json({
          success: false,
          message: 'Pengumpulan tugas tidak ditemukan'
        });
      }

      // Authorization: guru only can grade their own assignment
      if (req.user.role === 'guru') {
        const assignment = await assignmentModel.getById(submission.assignment_id);
        if (assignment.teacher_id !== req.user.teacher_id) {
          return res.status(403).json({
            success: false,
            message: 'Anda tidak memiliki izin menilai tugas ini'
          });
        }
      }

      const graded = await submissionModel.grade(id, parseFloat(grade));
      if (!graded) {
        return res.status(404).json({
          success: false,
          message: 'Pengumpulan tugas tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Nilai berhasil diberikan'
      });
    } catch (error) {
      console.error('Error grading submission:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memberi nilai'
      });
    }
  },

  /**
   * Delete submission
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      const submission = await submissionModel.getById(id);
      if (!submission) {
        return res.status(404).json({
          success: false,
          message: 'Pengumpulan tugas tidak ditemukan'
        });
      }

      // Authorization check
      if (req.user.role === 'siswa' && submission.student_id !== req.user.student_id) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki izin menghapus pengumpulan ini'
        });
      }

      // Don't allow delete if already graded
      const gradedScoreDel = submission.score ?? submission.grade;
      if (gradedScoreDel !== null && gradedScoreDel !== undefined && req.user.role === 'siswa') {
        return res.status(400).json({
          success: false,
          message: 'Tidak bisa menghapus pengumpulan yang sudah dinilai'
        });
      }

      const deleted = await submissionModel.delete(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Pengumpulan tugas tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Pengumpulan tugas berhasil dihapus'
      });
    } catch (error) {
      console.error('Error deleting submission:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus pengumpulan tugas'
      });
    }
  },

  /**
   * Get submissions by assignment (Guru)
   */
  async getByAssignment(req, res) {
    try {
      const { assignment_id } = req.params;
      
      // Check assignment exists
      const assignment = await assignmentModel.getById(assignment_id);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Tugas tidak ditemukan'
        });
      }

      // Authorization: guru only can see their own assignment submissions
      if (req.user.role === 'guru' && assignment.teacher_id !== req.user.teacher_id) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki izin melihat pengumpulan tugas ini'
        });
      }

      const submissions = await submissionModel.getByAssignment(parseInt(assignment_id));
      res.json({
        success: true,
        data: submissions
      });
    } catch (error) {
      console.error('Error getting submissions by assignment:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data pengumpulan tugas'
      });
    }
  },

  /**
   * Get submissions by student (Siswa own submissions)
   */
  async getByStudent(req, res) {
    try {
      const { student_id } = req.params;

      // Authorization: siswa only can see their own submissions
      if (req.user.role === 'siswa' && parseInt(student_id) !== req.user.student_id) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki izin melihat pengumpulan siswa lain'
        });
      }

      const submissions = await submissionModel.getByStudent(parseInt(student_id));
      res.json({
        success: true,
        data: submissions
      });
    } catch (error) {
      console.error('Error getting submissions by student:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data pengumpulan tugas'
      });
    }
  }
};

module.exports = submissionController;
