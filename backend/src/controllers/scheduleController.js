const scheduleModel = require('../models/scheduleModel');

const scheduleController = {
  /**
   * Get jadwal berdasarkan hari
   */
  async getByDay(req, res) {
    try {
      const schedules = await scheduleModel.getByDay(req.params.day);
      res.json({
        success: true,
        data: schedules
      });
    } catch (error) {
      console.error('Error getting schedules:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data jadwal'
      });
    }
  },

  /**
   * Get jadwal untuk siswa
   */
  async getStudentSchedule(req, res) {
    try {
      const schedules = await scheduleModel.getByClass(req.user.class_id);
      res.json({
        success: true,
        data: schedules
      });
    } catch (error) {
      console.error('Error getting student schedules:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data jadwal'
      });
    }
  },

  /**
   * Get jadwal untuk guru
   */
  async getTeacherSchedule(req, res) {
    try {
      const schedules = await scheduleModel.getByTeacher(req.user.teacher_id);
      res.json({
        success: true,
        data: schedules
      });
    } catch (error) {
      console.error('Error getting teacher schedules:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data jadwal'
      });
    }
  }
};

module.exports = scheduleController;
