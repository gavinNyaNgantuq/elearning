const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Get all teachers with filters (Admin/Guru)
router.get(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  teacherController.getAll
);

// Get teachers with subjects (for dropdown) (must be before /:id)
router.get(
  '/list/with-subjects',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  teacherController.getWithSubjects
);

// Get teacher by ID
router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  teacherController.getById
);

// Create teacher (Admin only)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin'),
  teacherController.create
);

// Update teacher (Admin only)
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  teacherController.update
);

// Delete teacher (Admin only)
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  teacherController.delete
);

// Get teacher subjects
router.get(
  '/:id/subjects',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  teacherController.getSubjects
);

// Assign subject to teacher (Admin only)
router.post(
  '/:id/subjects',
  authenticateToken,
  authorizeRoles('admin'),
  teacherController.assignSubject
);

// Remove subject from teacher (Admin only)
router.delete(
  '/:id/subjects/:subject_id',
  authenticateToken,
  authorizeRoles('admin'),
  teacherController.removeSubject
);

module.exports = router;
