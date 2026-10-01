const materialModel = require('../models/materialModel');

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
  }
};

module.exports = materialController;
