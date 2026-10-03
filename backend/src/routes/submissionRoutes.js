const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Get all submissions with filters (Admin/Guru)
router.get(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  submissionController.getAll
);

// Get submissions by assignment (Guru/Admin) (must be before /:id)
router.get(
  '/assignment/:assignment_id',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  submissionController.getByAssignment
);

// Get submissions by student (must be before /:id)
router.get(
  '/student/:student_id',
  authenticateToken,
  authorizeRoles('admin', 'guru', 'siswa'),
  submissionController.getByStudent
);

// Get submission by ID
router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('admin', 'guru', 'siswa'),
  submissionController.getById
);

// Create submission (Siswa)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('siswa'),
  submissionController.create
);

// Update submission (Siswa re-upload)
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('siswa', 'admin'),
  submissionController.update
);

// Delete submission
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('siswa', 'admin'),
  submissionController.delete
);

// Grade submission (Guru/Admin)
router.put(
  '/:id/grade',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  submissionController.grade
);

module.exports = router;
