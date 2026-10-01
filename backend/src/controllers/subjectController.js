const subjectModel = require('../models/subjectModel');

const subjectController = {
  /**
   * Get semua subjects
   */
  async getAll(req, res) {
    try {
      const subjects = await subjectModel.getAll();
      res.json({
        success: true,
        data: subjects
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
  }
};

module.exports = subjectController;
