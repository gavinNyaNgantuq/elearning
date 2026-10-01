const assignmentModel = require('../models/assignmentModel');

const assignmentController = {
  /**
   * Get tugas untuk siswa
   */
  async getStudentAssignments(req, res) {
    try {
      const assignments = await assignmentModel.getByClass(req.user.class_id);
      res.json({
        success: true,
        data: assignments
      });
    } catch (error) {
      console.error('Error getting student assignments:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data tugas'
      });
    }
  },

  /**
   * Get tugas untuk guru
   */
  async getTeacherAssignments(req, res) {
    try {
      const assignments = await assignmentModel.getByTeacher(req.user.teacher_id);
      res.json({
        success: true,
        data: assignments
      });
    } catch (error) {
      console.error('Error getting teacher assignments:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data tugas'
      });
    }
  }
};

module.exports = assignmentController;
