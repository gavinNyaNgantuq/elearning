const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  classController.getAll
);

router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  classController.getById
);

// Create class (Admin only)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin'),
  classController.create
);

// Update class (Admin only)
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  classController.update
);

// Soft delete class (Admin only)
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  classController.delete
);

module.exports = router;
