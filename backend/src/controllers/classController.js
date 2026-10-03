const classModel = require('../models/classModel');
const majorModel = require('../models/majorModel');

const classController = {
  /**
   * Get all classes with pagination and filters
   */
  async getAll(req, res) {
    try {
      const { major_id, search, page = 1, limit = 20 } = req.query;
      const classes = await classModel.getAll({
        major_id: major_id ? parseInt(major_id) : undefined,
        search,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      const total = await classModel.getCount({
        major_id: major_id ? parseInt(major_id) : undefined,
        search
      });
      
      res.json({
        success: true,
        data: classes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting classes:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data kelas'
      });
    }
  },

  /**
   * Get class by ID
   */
  async getById(req, res) {
    try {
      const classData = await classModel.getById(req.params.id);
      if (!classData) {
        return res.status(404).json({
          success: false,
          message: 'Kelas tidak ditemukan'
        });
      }
      res.json({
        success: true,
        data: classData
      });
    } catch (error) {
      console.error('Error getting class:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data kelas'
      });
    }
  },

  /**
   * Create class
   */
  async create(req, res) {
    try {
      const { name, major_id, academic_year } = req.body;

      // Validasi
      if (!name || !major_id) {
        return res.status(400).json({
          success: false,
          message: 'Nama kelas dan jurusan wajib diisi'
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

      const classData = await classModel.create({
        name,
        major_id: parseInt(major_id),
        academic_year: academic_year || null,
        created_by: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Kelas berhasil dibuat',
        data: classData
      });
    } catch (error) {
      console.error('Error creating class:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal membuat kelas'
      });
    }
  },

  /**
   * Update class
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, major_id, academic_year } = req.body;

      const classData = await classModel.getById(id);
      if (!classData) {
        return res.status(404).json({
          success: false,
          message: 'Kelas tidak ditemukan'
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

      const updated = await classModel.update(id, {
        name: name || classData.name,
        major_id: major_id ? parseInt(major_id) : classData.major_id,
        academic_year: academic_year !== undefined ? academic_year : classData.academic_year,
        updated_by: req.user.id
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Kelas tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Kelas berhasil diperbarui'
      });
    } catch (error) {
      console.error('Error updating class:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui kelas'
      });
    }
  },

  /**
   * Soft delete class
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      const classData = await classModel.getById(id);
      if (!classData) {
        return res.status(404).json({
          success: false,
          message: 'Kelas tidak ditemukan'
        });
      }

      const deleted = await classModel.softDelete(id, req.user.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Kelas tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Kelas berhasil dihapus'
      });
    } catch (error) {
      console.error('Error deleting class:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus kelas'
      });
    }
  },

  /**
   * Get classes for dropdown
   */
  async getForDropdown(req, res) {
    try {
      const { major_id } = req.query;
      const classes = await classModel.getForDropdown(major_id ? parseInt(major_id) : undefined);
      res.json({
        success: true,
        data: classes
      });
    } catch (error) {
      console.error('Error getting classes for dropdown:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data kelas'
      });
    }
  },

  /**
   * Get class students
   */
  async getStudents(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;
      
      // This would need a method in studentModel
      res.json({
        success: true,
        message: 'Endpoint not implemented yet'
      });
    } catch (error) {
      console.error('Error getting class students:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data siswa kelas'
      });
    }
  }
};

module.exports = classController;