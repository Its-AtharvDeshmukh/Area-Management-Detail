const express = require('express');
const router = express.Router();
const familyCtrl = require('../controllers/familyCtrl');
const { isAuthenticated } = require('../middlewares/auth');

// List all families
router.get('/', isAuthenticated, familyCtrl.getAllFamilies);

// Wizard Routes
router.get('/wizard', isAuthenticated, familyCtrl.renderWizard);
router.post('/register-wizard', isAuthenticated, familyCtrl.registerFamilyAndHoF);

// Edit Family Routes
router.get('/:id/edit', isAuthenticated, familyCtrl.getEditFamily);
router.post('/:id/edit', isAuthenticated, familyCtrl.updateFamily);

// Family Profile & Member Management
router.get('/:id', isAuthenticated, familyCtrl.getFamilyProfile);
router.post('/:id/add-member', isAuthenticated, familyCtrl.addFamilyMember);

module.exports = router;