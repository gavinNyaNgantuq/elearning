const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// Get all students with filters (Admin/Guru)
router.get(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  studentController.getAll
);

// Get students by class (must be before /:id)
router.get(
  '/class/:class_id',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  studentController.getByClass
);

// Import students from CSV (Admin only) (must be before /:id)
router.post(
  '/import',
  authenticateToken,
  authorizeRoles('admin'),
  upload.single('file'),
  studentController.importFromCSV
);

// Get own student data (siswa)
router.get(
  '/me',
  authenticateToken,
  authorizeRoles('siswa'),
  studentController.getMe
);

// Get student by ID
router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('admin', 'guru', 'siswa'),
  studentController.getById
);

// Create student (Admin only)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin'),
  studentController.create
);

// Update student (Admin only)
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  studentController.update
);

// Delete student (Admin only)
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  studentController.delete
);

module.exports = router;
