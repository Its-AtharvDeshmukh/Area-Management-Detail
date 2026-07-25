const express = require('express');
const router = express.Router();
const residentCtrl = require('../controllers/residentCtrl');
const { isAuthenticated, isSuperAdmin } = require('../middlewares/auth');

// Global Resident Directory
router.get('/', isAuthenticated, residentCtrl.getAllResidents);

// Edit Resident Routes
router.get('/:id/edit', isAuthenticated, residentCtrl.getEditResident);
router.post('/:id/edit', isAuthenticated, residentCtrl.updateResident);

// View Specific Resident Profile
router.get('/:id', isAuthenticated, residentCtrl.getResidentProfile);

// Delete Resident (Restricted to Super Admin)
router.post('/:id/delete', isSuperAdmin, residentCtrl.deleteResident);

module.exports = router;