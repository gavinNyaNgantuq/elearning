const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Get all attendances with filters (Admin/Guru)
router.get(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  attendanceController.getAll
);

// Get attendance by class and date (for guru input) (must be before /:id)
router.get(
  '/class/:class_id/date/:date',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  attendanceController.getByClassAndDate
);

// Get attendance stats for student (must be before /student/:student_id)
router.get(
  '/student/:student_id/stats',
  authenticateToken,
  authorizeRoles('admin', 'guru', 'siswa'),
  attendanceController.getStatsByStudent
);

// Get attendance by student (must be before /:id)
router.get(
  '/student/:student_id',
  authenticateToken,
  authorizeRoles('admin', 'guru', 'siswa'),
  attendanceController.getByStudent
);

// Get attendance by ID
router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  attendanceController.getById
);

// Create attendance (Guru/Admin)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  attendanceController.create
);

// Bulk create attendance (for guru input multiple students) (must be before /)
router.post(
  '/bulk',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  attendanceController.bulkCreate
);

// Update attendance
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  attendanceController.update
);

// Delete attendance
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  attendanceController.delete
);

module.exports = router;
