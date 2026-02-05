const express = require('express');
const router = express.Router();
const {
  loginEmail,
  validateAccessCode,
  setupAccount,
  getProfile,
  updateProfile,
  getTasks,
  completeTask
} = require('../controllers/employeeController');

// Authentication routes
// employee login with email
router.post('/email', loginEmail);
// employee verify access code
router.post('/access-code/verify-email', validateAccessCode);
router.post('/setup-account', setupAccount);

// Profile routes
// employee get profile by id
router.get('/profile/:employeeId', getProfile);
// employee update profile
router.put('/profile', updateProfile);

// Task routes
router.get('/tasks/:employeeId', getTasks);
router.put('/task/:taskId/complete', completeTask);

module.exports = router;