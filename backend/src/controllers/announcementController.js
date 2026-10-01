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
  }
};

module.exports = announcementController;
