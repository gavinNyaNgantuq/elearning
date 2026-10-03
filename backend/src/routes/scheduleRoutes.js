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

// Create schedule (Admin only)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin'),
  scheduleController.create
);

// Update schedule (Admin only)
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  scheduleController.update
);

// Soft delete schedule (Admin only)
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  scheduleController.delete
);

module.exports = router;
