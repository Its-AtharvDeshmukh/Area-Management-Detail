const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authCtrl');
const adminCtrl = require('../controllers/adminCtrl');

// Import the updated middleware functions
const { isAuthenticated, isSuperAdmin } = require('../middlewares/auth');

// Optional Admin-prefixed auth aliases
router.get('/login', authCtrl.getLogin);
router.post('/login', authCtrl.postLogin);
router.get('/register', authCtrl.getRegister);
router.post('/register', authCtrl.postRegister);

// Protected Admin Dashboard Route
router.get('/dashboard', isAuthenticated, adminCtrl.getDashboard);

// Super Admin User Management Routes
router.get('/users', isSuperAdmin, adminCtrl.getUsers);
router.post('/users/:id/toggle', isSuperAdmin, adminCtrl.toggleUserStatus);
router.post('/users/:id/delete', isSuperAdmin, adminCtrl.deleteUser);

module.exports = router;