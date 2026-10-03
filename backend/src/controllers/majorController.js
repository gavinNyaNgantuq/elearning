const pool = require('../config/database');
const majorModel = require('../models/majorModel');

const majorController = {
  /**
   * Get all majors with pagination and filters
   */
  async getAll(req, res) {
    try {
      const { search, page = 1, limit = 20 } = req.query;
      const majors = await majorModel.getAll({
        search,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      const total = await majorModel.getCount({ search });
      
      res.json({
        success: true,
        data: majors,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting majors:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data jurusan'
      });
    }
  },

  /**
   * Get major by ID
   */
  async getById(req, res) {
    try {
      const major = await majorModel.getById(req.params.id);
      if (!major) {
        return res.status(404).json({
          success: false,
          message: 'Jurusan tidak ditemukan'
        });
      }
      res.json({
        success: true,
        data: major
      });
    } catch (error) {
      console.error('Error getting major:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data jurusan'
      });
    }
  },

  /**
   * Create major
   */
  async create(req, res) {
    try {
      const { name, code } = req.body;

      // Validasi
      if (!name || !code) {
        return res.status(400).json({
          success: false,
          message: 'Nama jurusan dan kode wajib diisi'
        });
      }

      // Cek code unik
      const existing = await pool.execute(
        'SELECT id FROM majors WHERE code = ? AND deleted_at IS NULL',
        [code]
      );
      if (existing[0].length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Kode jurusan sudah digunakan'
        });
      }

      const majorData = await majorModel.create({
        name,
        code,
        created_by: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Jurusan berhasil dibuat',
        data: majorData
      });
    } catch (error) {
      console.error('Error creating major:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal membuat jurusan'
      });
    }
  },

  /**
   * Update major
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, code } = req.body;

      const major = await majorModel.getById(id);
      if (!major) {
        return res.status(404).json({
          success: false,
          message: 'Jurusan tidak ditemukan'
        });
      }

      // Cek code unik
      if (code && code !== major.code) {
        const existing = await pool.execute(
          'SELECT id FROM majors WHERE code = ? AND id != ? AND deleted_at IS NULL',
          [code, id]
        );
        if (existing[0].length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Kode jurusan sudah digunakan'
          });
        }
      }

      const updated = await majorModel.update(id, {
        name,
        code,
        updated_by: req.user.id
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Jurusan tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Jurusan berhasil diperbarui'
      });
    } catch (error) {
      console.error('Error updating major:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui jurusan'
      });
    }
  },

  /**
   * Soft delete major
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      const major = await majorModel.getById(id);
      if (!major) {
        return res.status(404).json({
          success: false,
          message: 'Jurusan tidak ditemukan'
        });
      }

      // Cek apakah ada kelas yang menggunakan jurusan ini
      const [classes] = await pool.execute(
        'SELECT id FROM classes WHERE major_id = ? AND deleted_at IS NULL LIMIT 1',
        [id]
      );
      if (classes.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Jurusan tidak bisa dihapus karena masih digunakan oleh kelas'
        });
      }

      const deleted = await majorModel.softDelete(id, req.user.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Jurusan tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Jurusan berhasil dihapus'
      });
    } catch (error) {
      console.error('Error deleting major:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus jurusan'
      });
    }
  },

  /**
   * Get majors for dropdown
   */
  async getForDropdown(req, res) {
    try {
      const majors = await majorModel.getAllForDropdown();
      res.json({
        success: true,
        data: majors
      });
    } catch (error) {
      console.error('Error getting majors for dropdown:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data jurusan'
      });
    }
  }
};

module.exports = majorController;