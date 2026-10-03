const assignmentModel = require('../models/assignmentModel');
const classModel = require('../models/classModel');
const subjectModel = require('../models/subjectModel');
const teacherModel = require('../models/teacherModel');

const assignmentController = {
  /**
   * Get tugas berdasarkan kelas
   */
  async getByClass(req, res) {
    try {
      const assignments = await assignmentModel.getByClass(req.user.class_id);
      res.json({
        success: true,
        data: assignments
      });
    } catch (error) {
      console.error('Error getting assignments:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data tugas'
      });
    }
  },

  /**
   * Get tugas berdasarkan guru
   */
  async getByTeacher(req, res) {
    try {
      const assignments = await assignmentModel.getByTeacher(req.user.teacher_id);
      res.json({
        success: true,
        data: assignments
      });
    } catch (error) {
      console.error('Error getting teacher assignments:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data tugas'
      });
    }
  },

  /**
   * Get all assignments with pagination and filters (Admin/Guru)
   */
  async getAll(req, res) {
    try {
      const { class_id, subject_id, teacher_id, search, page = 1, limit = 20 } = req.query;
      const assignments = await assignmentModel.getAll({
        class_id: class_id ? parseInt(class_id) : undefined,
        subject_id: subject_id ? parseInt(subject_id) : undefined,
        teacher_id: teacher_id ? parseInt(teacher_id) : undefined,
        search,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      const total = await assignmentModel.getCount({
        class_id: class_id ? parseInt(class_id) : undefined,
        subject_id: subject_id ? parseInt(subject_id) : undefined,
        teacher_id: teacher_id ? parseInt(teacher_id) : undefined,
        search
      });
      
      res.json({
        success: true,
        data: assignments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting assignments:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data tugas'
      });
    }
  },

  /**
   * Get assignment by ID
   */
  async getById(req, res) {
    try {
      const assignment = await assignmentModel.getById(req.params.id);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Tugas tidak ditemukan'
        });
      }
      res.json({
        success: true,
        data: assignment
      });
    } catch (error) {
      console.error('Error getting assignment:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data tugas'
      });
    }
  },

  /**
   * Create assignment
   */
  async create(req, res) {
    try {
      const { teacher_id, subject_id, class_id, title, description, deadline } = req.body;

      // Validasi
      if (!teacher_id || !subject_id || !class_id || !title || !deadline) {
        return res.status(400).json({
          success: false,
          message: 'Guru, mata pelajaran, kelas, judul, dan tenggat waktu wajib diisi'
        });
      }

      // Validasi relasi
      const [classData, subjectData, teacherData] = await Promise.all([
        classModel.getById(class_id),
        subjectModel.getById(subject_id),
        teacherModel.getById(teacher_id)
      ]);

      if (!classData) {
        return res.status(400).json({ success: false, message: 'Kelas tidak ditemukan' });
      }
      if (!subjectData) {
        return res.status(400).json({ success: false, message: 'Mata pelajaran tidak ditemukan' });
      }
      if (!teacherData) {
        return res.status(400).json({ success: false, message: 'Guru tidak ditemukan' });
      }

      // Jika guru, pastikan guru tersebut yang login (kecuali admin)
      if (req.user.role !== 'admin' && req.user.teacher_id !== parseInt(teacher_id)) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki izin membuat tugas untuk guru lain'
        });
      }

      const assignmentData = await assignmentModel.create({
        teacher_id,
        subject_id,
        class_id,
        title,
        description: req.body.description || null,
        deadline,
        created_by: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Tugas berhasil dibuat',
        data: assignmentData
      });
    } catch (error) {
      console.error('Error creating assignment:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal membuat tugas'
      });
    }
  },

  /**
   * Update assignment
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { subject_id, class_id, title, description, deadline } = req.body;

      const assignment = await assignmentModel.getById(id);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Tugas tidak ditemukan'
        });
      }

      // Cek authorization
      if (req.user.role !== 'admin' && req.user.teacher_id !== assignment.teacher_id) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki izin mengubah tugas ini'
        });
      }

      // Validasi relasi jika diubah
      if (subject_id) {
        const subjectData = await subjectModel.getById(subject_id);
        if (!subjectData) {
          return res.status(400).json({ success: false, message: 'Mata pelajaran tidak ditemukan' });
        }
      }
      if (class_id) {
        const classData = await classModel.getById(class_id);
        if (!classData) {
          return res.status(400).json({ success: false, message: 'Kelas tidak ditemukan' });
        }
      }

      const updated = await assignmentModel.update(id, {
        subject_id,
        class_id,
        title,
        description: req.body.description || null,
        deadline,
        updated_by: req.user.id
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Tugas tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Tugas berhasil diperbarui'
      });
    } catch (error) {
      console.error('Error updating assignment:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui tugas'
      });
    }
  },

  /**
   * Soft delete assignment
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      const assignment = await assignmentModel.getById(id);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Tugas tidak ditemukan'
        });
      }

      // Cek authorization
      if (req.user.role !== 'admin' && req.user.teacher_id !== assignment.teacher_id) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki izin menghapus tugas ini'
        });
      }

      const deleted = await assignmentModel.softDelete(id, req.user.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Tugas tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Tugas berhasil dihapus'
      });
    } catch (error) {
      console.error('Error deleting assignment:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus tugas'
      });
    }
  },

  /**
   * Get assignments by class for student
   */
  async getByClass(req, res) {
    try {
      const { class_id } = req.params;
      const assignments = await assignmentModel.getByClass(parseInt(class_id));
      res.json({
        success: true,
        data: assignments
      });
    } catch (error) {
      console.error('Error getting assignments by class:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data tugas'
      });
    }
  },

  /**
   * Get assignments by teacher
   */
  async getByTeacher(req, res) {
    try {
      const { teacher_id } = req.params;
      const assignments = await assignmentModel.getByTeacher(parseInt(teacher_id));
      res.json({
        success: true,
        data: assignments
      });
    } catch (error) {
      console.error('Error getting assignments by teacher:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data tugas'
      });
    }
  },

  /**
   * Get assignments by student (with submission status)
   */
  async getByStudent(req, res) {
    try {
      const { student_id } = req.params;
      // This would need a method in assignmentModel to get assignments with submission status
      // For now, return assignments for student's class
      const student = await pool.execute(
        'SELECT class_id FROM students WHERE id = ? AND deleted_at IS NULL',
        [req.params.student_id]
      );
      
      if (student[0].length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Siswa tidak ditemukan'
        });
      }

      const assignments = await assignmentModel.getByClass(student[0][0].class_id);
      res.json({
        success: true,
        data: assignments
      });
    } catch (error) {
      console.error('Error getting assignments by student:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data tugas'
      });
    }
  }
};

module.exports = assignmentController;