const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get(
  '/day/:day',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  scheduleController.getByDay
);

router.get(
  '/student',
  authenticateToken,
  authorizeRoles('siswa'),
  scheduleController.getStudentSchedule
);

router.get(
  '/teacher',
  authenticateToken,
  authorizeRoles('guru'),
  scheduleController.getTeacherSchedule
);

module.exports = router;
