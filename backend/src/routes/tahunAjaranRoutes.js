const express = require('express');
const router = express.Router();
const tahunAjaranController = require('../controllers/tahunAjaranController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Tahun ajaran aktif (semua role yang login)
router.get(
  '/aktif',
  authenticateToken,
  authorizeRoles('admin', 'guru', 'siswa'),
  tahunAjaranController.getActive
);

// List (Admin)
router.get(
  '/',
  authenticateToken,
  authorizeRoles('admin'),
  tahunAjaranController.getAll
);

// Aktifkan salah satu (Admin) (sebelum /:id)
router.put(
  '/:id/aktifkan',
  authenticateToken,
  authorizeRoles('admin'),
  tahunAjaranController.setActive
);

// Create (Admin)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin'),
  tahunAjaranController.create
);

// Update (Admin)
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  tahunAjaranController.update
);

// Soft delete (Admin)
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  tahunAjaranController.delete
);

module.exports = router;
