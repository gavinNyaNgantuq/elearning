const announcementModel = require('../models/announcementModel');

const announcementController = {
  /**
   * Get pengumuman terbaru
   */
  async getLatest(req, res) {
    try {
      const announcements = await announcementModel.getLatest(5);
      res.json({
        success: true,
        data: announcements
      });
    } catch (error) {
      console.error('Error getting announcements:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data pengumuman'
      });
    }
  },

  /**
   * Get all announcements with pagination and filters (Admin/Guru)
   */
  async getAll(req, res) {
    try {
      const { search, page = 1, limit = 20 } = req.query;
      const announcements = await announcementModel.getAll({
        search,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      const total = await announcementModel.getCount({ search });
      
      res.json({
        success: true,
        data: announcements,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting announcements:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data pengumuman'
      });
    }
  },

  /**
   * Get announcement by ID
   */
  async getById(req, res) {
    try {
      const announcement = await announcementModel.getById(req.params.id);
      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: 'Pengumuman tidak ditemukan'
        });
      }
      res.json({
        success: true,
        data: announcement
      });
    } catch (error) {
      console.error('Error getting announcement:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data pengumuman'
      });
    }
  },

  /**
   * Create announcement
   */
  async create(req, res) {
    try {
      const { title, content } = req.body;

      if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: 'Judul dan isi pengumuman wajib diisi'
        });
      }

      const announcementData = await announcementModel.create({
        title,
        content,
        created_by: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Pengumuman berhasil dibuat',
        data: announcementData
      });
    } catch (error) {
      console.error('Error creating announcement:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal membuat pengumuman'
      });
    }
  },

  /**
   * Update announcement
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { title, content } = req.body;

      const announcement = await announcementModel.getById(id);
      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: 'Pengumuman tidak ditemukan'
        });
      }

      // Cek authorization
      if (req.user.role !== 'admin' && req.user.id !== announcement.created_by) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki izin mengubah pengumuman ini'
        });
      }

      const updated = await announcementModel.update(id, {
        title,
        content,
        updated_by: req.user.id
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Pengumuman tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Pengumuman berhasil diperbarui'
      });
    } catch (error) {
      console.error('Error updating announcement:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui pengumuman'
      });
    }
  },

  /**
   * Soft delete announcement
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      const announcement = await announcementModel.getById(id);
      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: 'Pengumuman tidak ditemukan'
        });
      }

      // Cek authorization
      if (req.user.role !== 'admin' && req.user.id !== announcement.created_by) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki izin menghapus pengumuman ini'
        });
      }

      const deleted = await announcementModel.softDelete(id, req.user.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Pengumuman tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Pengumuman berhasil dihapus'
      });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus pengumuman'
      });
    }
  },

};

module.exports = announcementController;