const subjectModel = require('../models/subjectModel');
const majorModel = require('../models/majorModel');

const subjectController = {
  /**
   * Get all subjects with pagination and filters
   */
  async getAll(req, res) {
    try {
      const { major_id, search, page = 1, limit = 20 } = req.query;
      const subjects = await subjectModel.getAll({
        major_id: major_id ? parseInt(major_id) : undefined,
        search,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      const total = await subjectModel.getCount({
        major_id: major_id ? parseInt(major_id) : undefined,
        search
      });
      
      res.json({
        success: true,
        data: subjects,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting subjects:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data mata pelajaran'
      });
    }
  },

  /**
   * Get subject by ID
   */
  async getById(req, res) {
    try {
      const subject = await subjectModel.getById(req.params.id);
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Mata pelajaran tidak ditemukan'
        });
      }
      res.json({
        success: true,
        data: subject
      });
    } catch (error) {
      console.error('Error getting subject:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data mata pelajaran'
      });
    }
  },

  /**
   * Create subject
   */
  async create(req, res) {
    try {
      const { name, major_id } = req.body;

      // Validasi
      if (!name || !major_id) {
        return res.status(400).json({
          success: false,
          message: 'Nama mata pelajaran dan jurusan wajib diisi'
        });
      }

      // Cek major exists
      const major = await majorModel.getById(major_id);
      if (!major) {
        return res.status(400).json({
          success: false,
          message: 'Jurusan tidak ditemukan'
        });
      }

      const subjectData = await subjectModel.create({
        name,
        major_id: parseInt(major_id),
        created_by: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Mata pelajaran berhasil dibuat',
        data: subjectData
      });
    } catch (error) {
      console.error('Error creating subject:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal membuat mata pelajaran'
      });
    }
  },

  /**
   * Update subject
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, major_id } = req.body;

      const subject = await subjectModel.getById(id);
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Mata pelajaran tidak ditemukan'
        });
      }

      // Cek major exists
      if (major_id) {
        const major = await majorModel.getById(major_id);
        if (!major) {
          return res.status(400).json({
            success: false,
            message: 'Jurusan tidak ditemukan'
          });
        }
      }

      const updated = await subjectModel.update(id, {
        name: name || subject.name,
        major_id: major_id ? parseInt(major_id) : subject.major_id,
        updated_by: req.user.id
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Mata pelajaran tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Mata pelajaran berhasil diperbarui'
      });
    } catch (error) {
      console.error('Error updating subject:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui mata pelajaran'
      });
    }
  },

  /**
   * Soft delete subject
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      const subject = await subjectModel.getById(id);
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Mata pelajaran tidak ditemukan'
        });
      }

      const deleted = await subjectModel.softDelete(id, req.user.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Mata pelajaran tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Mata pelajaran berhasil dihapus'
      });
    } catch (error) {
      console.error('Error deleting subject:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus mata pelajaran'
      });
    }
  },

  /**
   * Get subjects for dropdown
   */
  async getForDropdown(req, res) {
    try {
      const { major_id } = req.query;
      const subjects = await subjectModel.getForDropdown(major_id ? parseInt(major_id) : undefined);
      res.json({
        success: true,
        data: subjects
      });
    } catch (error) {
      console.error('Error getting subjects for dropdown:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data mata pelajaran'
      });
    }
  },

  /**
   * Get subjects by teacher
   */
  async getByTeacher(req, res) {
    try {
      const { teacher_id } = req.params;
      const subjects = await subjectModel.getByTeacher(parseInt(teacher_id));
      res.json({
        success: true,
        data: subjects
      });
    } catch (error) {
      console.error('Error getting subjects by teacher:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data mata pelajaran guru'
      });
    }
  }
};

module.exports = subjectController;