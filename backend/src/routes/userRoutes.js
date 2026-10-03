const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Get all users with filters (Admin only)
router.get(
  '/',
  authenticateToken,
  authorizeRoles('admin'),
  userController.getAll
);

// Get users by role (Admin/Guru) (must be before /:id)
router.get(
  '/role/filter',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  userController.getByRole
);

// Update own phone (self-service, any authenticated role)
router.put(
  '/me/phone',
  authenticateToken,
  userController.updatePhone
);

// Get user by ID (Admin or self)
router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('admin', 'guru', 'siswa'),
  userController.getById
);

// Create user (Admin only)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin'),
  userController.create
);

// Update user (Admin only)
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  userController.update
);

// Delete user (Admin only)
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  userController.delete
);

// Change password (Admin or self)
router.put(
  '/:id/password',
  authenticateToken,
  authorizeRoles('admin', 'guru', 'siswa'),
  userController.changePassword
);

module.exports = router;
