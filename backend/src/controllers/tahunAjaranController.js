const tahunAjaranModel = require('../models/tahunAjaranModel');

const tahunAjaranController = {
  /**
   * Get semua tahun ajaran (Admin)
   */
  async getAll(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const data = await tahunAjaranModel.getAll({
        page: parseInt(page),
        limit: parseInt(limit)
      });
      const total = await tahunAjaranModel.getCount();
      res.json({
        success: true,
        data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error getting tahun ajaran:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data tahun ajaran'
      });
    }
  },

  /**
   * Get tahun ajaran aktif (semua role)
   */
  async getActive(req, res) {
    try {
      const active = await tahunAjaranModel.getActive();
      res.json({
        success: true,
        data: active
      });
    } catch (error) {
      console.error('Error getting active tahun ajaran:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil tahun ajaran aktif'
      });
    }
  },

  /**
   * Create tahun ajaran (Admin)
   */
  async create(req, res) {
    try {
      const { name, semester, start_date, end_date, is_active } = req.body;

      if (!name || !semester) {
        return res.status(400).json({
          success: false,
          message: 'Tahun ajaran dan semester wajib diisi'
        });
      }

      if (!['ganjil', 'genap'].includes(semester)) {
        return res.status(400).json({
          success: false,
          message: 'Semester harus ganjil atau genap'
        });
      }

      const duplicate = await tahunAjaranModel.findDuplicate(name, semester);
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Tahun ajaran dengan semester tersebut sudah ada'
        });
      }

      // Bila ingin langsung aktif, nonaktifkan yang lain dulu
      if (is_active) {
        await tahunAjaranModel.deactivateAll(req.user.id);
      }

      const id = await tahunAjaranModel.create({
        name,
        semester,
        start_date,
        end_date,
        is_active: !!is_active,
        created_by: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Tahun ajaran berhasil dibuat',
        data: { id }
      });
    } catch (error) {
      console.error('Error creating tahun ajaran:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal membuat tahun ajaran'
      });
    }
  },

  /**
   * Update tahun ajaran (Admin)
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, semester, start_date, end_date, is_active } = req.body;

      const existing = await tahunAjaranModel.getById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Tahun ajaran tidak ditemukan'
        });
      }

      if (semester && !['ganjil', 'genap'].includes(semester)) {
        return res.status(400).json({
          success: false,
          message: 'Semester harus ganjil atau genap'
        });
      }

      const newName = name || existing.name;
      const newSemester = semester || existing.semester;
      const duplicate = await tahunAjaranModel.findDuplicate(newName, newSemester, id);
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Tahun ajaran dengan semester tersebut sudah ada'
        });
      }

      if (is_active) {
        await tahunAjaranModel.deactivateAll(req.user.id);
      }

      const updated = await tahunAjaranModel.update(id, {
        name: newName,
        semester: newSemester,
        start_date,
        end_date,
        is_active: is_active !== undefined ? !!is_active : !!existing.is_active,
        updated_by: req.user.id
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Tahun ajaran tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Tahun ajaran berhasil diperbarui'
      });
    } catch (error) {
      console.error('Error updating tahun ajaran:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui tahun ajaran'
      });
    }
  },

  /**
   * Soft delete tahun ajaran (Admin)
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      const existing = await tahunAjaranModel.getById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Tahun ajaran tidak ditemukan'
        });
      }

      const deleted = await tahunAjaranModel.softDelete(id, req.user.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Tahun ajaran tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Tahun ajaran berhasil dihapus'
      });
    } catch (error) {
      console.error('Error deleting tahun ajaran:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus tahun ajaran'
      });
    }
  },

  /**
   * Aktifkan tahun ajaran tertentu (Admin)
   */
  async setActive(req, res) {
    try {
      const { id } = req.params;

      const existing = await tahunAjaranModel.getById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Tahun ajaran tidak ditemukan'
        });
      }

      await tahunAjaranModel.deactivateAll(req.user.id);
      await tahunAjaranModel.update(id, {
        name: existing.name,
        semester: existing.semester,
        start_date: existing.start_date,
        end_date: existing.end_date,
        is_active: true,
        updated_by: req.user.id
      });

      res.json({
        success: true,
        message: 'Tahun ajaran diaktifkan'
      });
    } catch (error) {
      console.error('Error activating tahun ajaran:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengaktifkan tahun ajaran'
      });
    }
  }
};

module.exports = tahunAjaranController;
