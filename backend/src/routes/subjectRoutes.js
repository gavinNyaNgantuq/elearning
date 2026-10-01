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

module.exports = router;
