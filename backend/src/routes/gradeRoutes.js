const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Get all grades with filters (Admin/Guru)
router.get(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  gradeController.getAll
);

// Get grades by class and subject (must be before /:id)
router.get(
  '/class/:class_id/subject/:subject_id',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  gradeController.getByClassAndSubject
);

// Get grades by student (must be before /:id)
router.get(
  '/student/:student_id',
  authenticateToken,
  authorizeRoles('admin', 'guru', 'siswa'),
  gradeController.getByStudent
);

// Get grade by ID
router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  gradeController.getById
);

// Create grade (Guru/Admin)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  gradeController.create
);

// Update grade
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  gradeController.update
);

// Delete grade
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  gradeController.delete
);

module.exports = router;
