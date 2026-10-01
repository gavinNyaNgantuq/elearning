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

module.exports = router;
