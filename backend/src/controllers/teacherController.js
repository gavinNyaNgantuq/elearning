const teacherModel = require('../models/teacherModel');
const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

const teacherController = {
  /**
   * Get all teachers with pagination and filters
   */
  async getAll(req, res) {
    try {
      const { search, page = 1, limit = 20 } = req.query;
      const teachers = await teacherModel.getAll({
        search,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      const total = await teacherModel.getCount({ search });
      
      res.json({
        success: true,
        data: teachers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting teachers:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data guru'
      });
    }
  },

  /**
   * Get teacher by ID
   */
  async getById(req, res) {
    try {
      const teacher = await teacherModel.getById(req.params.id);
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Guru tidak ditemukan'
        });
      }
      res.json({
        success: true,
        data: teacher
      });
    } catch (error) {
      console.error('Error getting teacher:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data guru'
      });
    }
  },

  /**
   * Create teacher
   */
  async create(req, res) {
    try {
      const { name, email, password, nip, subject_ids } = req.body;

      // Validasi
      if (!name || !email || !password || !nip) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, password, dan NIP wajib diisi'
        });
      }

      // Cek NIP unik
      const existingNip = await pool.execute(
        'SELECT id FROM teachers WHERE nip = ? AND deleted_at IS NULL',
        [nip]
      );
      if (existingNip[0].length > 0) {
        return res.status(400).json({
          success: false,
          message: 'NIP sudah digunakan'
        });
      }

      // Cek email unik
      const existingUser = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL',
        [email]
      );
      if (existingUser[0].length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email sudah digunakan'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await userModel.create({
        name,
        email,
        password: hashedPassword,
        role_id: 2, // guru
        is_active: 1
      });

      // Create teacher
      const teacher = await teacherModel.create({
        user_id: user.id,
        nip
      });

      // Assign subjects if provided
      if (subject_ids && subject_ids.length > 0) {
        for (const subjectId of subject_ids) {
          await teacherModel.assignSubject(teacher.id, subjectId);
        }
      }

      res.status(201).json({
        success: true,
        message: 'Guru berhasil dibuat',
        data: { ...teacher, user }
      });
    } catch (error) {
      console.error('Error creating teacher:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal membuat guru'
      });
    }
  },

  /**
   * Update teacher
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, email, nip, subject_ids } = req.body;

      const teacher = await teacherModel.getById(id);
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Guru tidak ditemukan'
        });
      }

      // Cek NIP unik
      if (nip && nip !== teacher.nip) {
        const existing = await pool.execute(
          'SELECT id FROM teachers WHERE nip = ? AND id != ? AND deleted_at IS NULL',
          [nip, id]
        );
        if (existing[0].length > 0) {
          return res.status(400).json({
            success: false,
            message: 'NIP sudah digunakan'
          });
        }
      }

      // Cek email unik
      if (email && email !== teacher.email) {
        const existing = await pool.execute(
          'SELECT id FROM users WHERE email = ? AND id != ? AND deleted_at IS NULL',
          [email, teacher.user_id]
        );
        if (existing[0].length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Email sudah digunakan'
          });
        }
      }

      // Update user (nama, email) bila berubah
      if (name || email) {
        await pool.execute(
          'UPDATE users SET name = ?, email = ?, updated_at = NOW() WHERE id = ?',
          [name || teacher.name, email || teacher.email, teacher.user_id]
        );
      }

      const updated = await teacherModel.update(id, {
        nip: nip || teacher.nip
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Guru tidak ditemukan'
        });
      }

      // Update subjects if provided
      if (subject_ids) {
        // Get current subjects
        const currentSubjects = await teacherModel.getTeacherSubjects(id);
        const currentSubjectIds = currentSubjects.map(s => s.id);
        const newSubjectIds = subject_ids.map(id => parseInt(id));

        // Find subjects to add
        const toAdd = newSubjectIds.filter(id => !currentSubjectIds.includes(id));
        // Find subjects to remove
        const toRemove = currentSubjectIds.filter(id => !newSubjectIds.includes(id));

        for (const subjectId of toAdd) {
          await teacherModel.assignSubject(id, subjectId);
        }

        for (const subjectId of toRemove) {
          await teacherModel.removeSubject(id, subjectId);
        }
      }

      res.json({
        success: true,
        message: 'Guru berhasil diperbarui'
      });
    } catch (error) {
      console.error('Error updating teacher:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui guru'
      });
    }
  },

  /**
   * Soft delete teacher
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      const teacher = await teacherModel.getById(id);
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Guru tidak ditemukan'
        });
      }

      const deleted = await teacherModel.softDelete(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Guru tidak ditemukan'
        });
      }

      // Soft delete user too
      await userModel.softDelete(teacher.user_id);

      res.json({
        success: true,
        message: 'Guru berhasil dihapus'
      });
    } catch (error) {
      console.error('Error deleting teacher:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus guru'
      });
    }
  },

  /**
   * Get teachers with subjects (for dropdown)
   */
  async getWithSubjects(req, res) {
    try {
      const teachers = await teacherModel.getWithSubjects();
      res.json({
        success: true,
        data: teachers
      });
    } catch (error) {
      console.error('Error getting teachers with subjects:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data guru'
      });
    }
  },

  /**
   * Get teacher subjects
   */
  async getSubjects(req, res) {
    try {
      const { id } = req.params;
      const subjects = await teacherModel.getTeacherSubjects(id);
      res.json({
        success: true,
        data: subjects
      });
    } catch (error) {
      console.error('Error getting teacher subjects:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data mata pelajaran guru'
      });
    }
  },

  /**
   * Assign subject to teacher
   */
  async assignSubject(req, res) {
    try {
      const { id } = req.params;
      const { subject_id } = req.body;

      if (!subject_id) {
        return res.status(400).json({
          success: false,
          message: 'subject_id wajib diisi'
        });
      }

      // Check if already assigned
      const exists = await teacherModel.exists(req.params.id, subject_id);
      if (exists) {
        return res.status(400).json({
          success: false,
          message: 'Mata pelajaran sudah ditugaskan ke guru ini'
        });
      }

      await teacherModel.assignSubject(req.params.id, subject_id);

      res.json({
        success: true,
        message: 'Mata pelajaran berhasil ditugaskan'
      });
    } catch (error) {
      console.error('Error assigning subject:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menugaskan mata pelajaran'
      });
    }
  },

  /**
   * Remove subject from teacher
   */
  async removeSubject(req, res) {
    try {
      const { id, subject_id } = req.params;

      await teacherModel.removeSubject(id, subject_id);

      res.json({
        success: true,
        message: 'Mata pelajaran berhasil dihapus dari guru'
      });
    } catch (error) {
      console.error('Error removing subject:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus mata pelajaran'
      });
    }
  }
};

module.exports = teacherController;
