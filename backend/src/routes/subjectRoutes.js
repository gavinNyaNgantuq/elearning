const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  subjectController.getAll
);

router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  subjectController.getById
);

// Create subject (Admin only)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin'),
  subjectController.create
);

// Update subject (Admin only)
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  subjectController.update
);

// Soft delete subject (Admin only)
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  subjectController.delete
);

module.exports = router;
