const express = require('express');
const router = express.Router();
const residentCtrl = require('../controllers/residentCtrl');
const { isAuthenticated } = require('../middlewares/auth');

// Global Resident Directory
router.get('/', isAuthenticated, residentCtrl.getAllResidents);

// Edit Resident Routes
router.get('/:id/edit', isAuthenticated, residentCtrl.getEditResident);
router.post('/:id/edit', isAuthenticated, residentCtrl.updateResident);

// View Specific Resident Profile
router.get('/:id', isAuthenticated, residentCtrl.getResidentProfile);

// Delete Resident (Now protected by Row-Level Security in the Controller)
router.post('/:id/delete', isAuthenticated, residentCtrl.deleteResident);

module.exports = router;