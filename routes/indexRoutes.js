const express = require('express');
const router = express.Router();
const passport = require('passport');
const homeCtrl = require('../controllers/homeCtrl');
const authCtrl = require('../controllers/authCtrl');

// Public Landing Page
router.get('/', homeCtrl.getHomePage);

// Standard Authentication Routes
router.get('/login', authCtrl.getLogin);
router.post('/login', authCtrl.postLogin);
router.get('/register', authCtrl.getRegister);
router.post('/register', authCtrl.postRegister);
router.get('/logout', authCtrl.logout);

// --- GOOGLE OAUTH ROUTES ---
// 1. Triggers the Google Login Screen
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// 2. Handles the callback from Google (FIXED: properly closed with );)
router.get('/auth/google/callback',      
    passport.authenticate('google', { failureRedirect: '/login' }),     
    (req, res) => {         
        // Upon successful Google Auth, sync Passport user with our custom session structure         
        req.session.user = {              
            id: req.user._id,              
            username: req.user.username,              
            role: req.user.role          };         
        res.redirect('/admin/dashboard');     
    }
);

module.exports = router;