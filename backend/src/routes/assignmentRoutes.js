const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get(
  '/student',
  authenticateToken,
  authorizeRoles('siswa'),
  assignmentController.getStudentAssignments
);

router.get(
  '/teacher',
  authenticateToken,
  authorizeRoles('guru'),
  assignmentController.getTeacherAssignments
);

module.exports = router;
