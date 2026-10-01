const classModel = require('../models/classModel');

const classController = {
  /**
   * Get semua classes
   */
  async getAll(req, res) {
    try {
      const classes = await classModel.getAll();
      res.json({
        success: true,
        data: classes
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
  }
};

module.exports = classController;
