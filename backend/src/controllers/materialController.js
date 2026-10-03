const materialModel = require('../models/materialModel');
const classModel = require('../models/classModel');
const subjectModel = require('../models/subjectModel');
const teacherModel = require('../models/teacherModel');

const materialController = {
  /**
   * Get materi terbaru
   */
  async getLatest(req, res) {
    try {
      const materials = await materialModel.getLatest(5);
      res.json({
        success: true,
        data: materials
      });
    } catch (error) {
      console.error('Error getting materials:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data materi'
      });
    }
  },

  /**
   * Get materi untuk siswa
   */
  async getStudentMaterials(req, res) {
    try {
      const materials = await materialModel.getByClass(req.user.class_id);
      res.json({
        success: true,
        data: materials
      });
    } catch (error) {
      console.error('Error getting student materials:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data materi'
      });
    }
  },

  /**
   * Get all materials with pagination and filters (Admin/Guru)
   */
  async getAll(req, res) {
    try {
      const { class_id, subject_id, teacher_id, search, page = 1, limit = 20 } = req.query;
      const materials = await materialModel.getAll({
        class_id: class_id ? parseInt(class_id) : undefined,
        subject_id: subject_id ? parseInt(subject_id) : undefined,
        teacher_id: teacher_id ? parseInt(teacher_id) : undefined,
        search,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      const total = await materialModel.getCount({
        class_id: class_id ? parseInt(class_id) : undefined,
        subject_id: subject_id ? parseInt(subject_id) : undefined,
        teacher_id: teacher_id ? parseInt(teacher_id) : undefined,
        search
      });
      
      res.json({
        success: true,
        data: materials,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting materials:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data materi'
      });
    }
  },

  /**
   * Get material by ID
   */
  async getById(req, res) {
    try {
      const material = await materialModel.getById(req.params.id);
      if (!material) {
        return res.status(404).json({
          success: false,
          message: 'Materi tidak ditemukan'
        });
      }
      res.json({
        success: true,
        data: material
      });
    } catch (error) {
      console.error('Error getting material:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data materi'
      });
    }
  },

  /**
   * Create material
   */
  async create(req, res) {
    try {
      const { teacher_id, subject_id, class_id, title, description, file, link } = req.body;

      // Validasi
      if (!teacher_id || !subject_id || !class_id || !title) {
        return res.status(400).json({
          success: false,
          message: 'Guru, mata pelajaran, kelas, dan judul wajib diisi'
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
          message: 'Anda tidak memiliki izin membuat materi untuk guru lain'
        });
      }

      const materialData = await materialModel.create({
        teacher_id,
        subject_id,
        class_id,
        title,
        description: req.body.description || null,
        file: req.body.file || null,
        link: req.body.link || null,
        created_by: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Materi berhasil dibuat',
        data: materialData
      });
    } catch (error) {
      console.error('Error creating material:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal membuat materi'
      });
    }
  },

  /**
   * Update material
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { subject_id, class_id, title, description, file, link } = req.body;

      const material = await materialModel.getById(id);
      if (!material) {
        return res.status(404).json({
          success: false,
          message: 'Materi tidak ditemukan'
        });
      }

      // Cek authorization
      if (req.user.role !== 'admin' && req.user.teacher_id !== material.teacher_id) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki izin mengubah materi ini'
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

      const updated = await materialModel.update(id, {
        subject_id,
        class_id,
        title,
        description: req.body.description || null,
        file: req.body.file || null,
        link: req.body.link || null,
        updated_by: req.user.id
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Materi tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Materi berhasil diperbarui'
      });
    } catch (error) {
      console.error('Error updating material:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui materi'
      });
    }
  },

  /**
   * Soft delete material
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      const material = await materialModel.getById(id);
      if (!material) {
        return res.status(404).json({
          success: false,
          message: 'Materi tidak ditemukan'
        });
      }

      // Cek authorization
      if (req.user.role !== 'admin' && req.user.teacher_id !== material.teacher_id) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki izin menghapus materi ini'
        });
      }

      const deleted = await materialModel.softDelete(id, req.user.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Materi tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Materi berhasil dihapus'
      });
    } catch (error) {
      console.error('Error deleting material:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus materi'
      });
    }
  },

  /**
   * Get materials by class for student
   */
  async getByClass(req, res) {
    try {
      const { class_id } = req.params;
      const materials = await materialModel.getByClass(parseInt(class_id));
      res.json({
        success: true,
        data: materials
      });
    } catch (error) {
      console.error('Error getting materials by class:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data materi'
      });
    }
  },

  /**
   * Get materials by subject
   */
  async getBySubject(req, res) {
    try {
      const { subject_id } = req.params;
      const materials = await materialModel.getBySubject(parseInt(subject_id));
      res.json({
        success: true,
        data: materials
      });
    } catch (error) {
      console.error('Error getting materials by subject:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data materi'
      });
    }
  }
};

module.exports = materialController;