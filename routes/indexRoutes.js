const express = require('express');
const router = express.Router();
const passport = require('passport');
const homeCtrl = require('../controllers/homeCtrl');
const authCtrl = require('../controllers/authCtrl');

router.get('/', homeCtrl.getHomePage);

router.get('/login', authCtrl.getLogin);
router.post('/login', authCtrl.postLogin);
router.get('/register', authCtrl.getRegister);
router.post('/register', authCtrl.postRegister);
router.get('/logout', authCtrl.logout);

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        req.session.user = { 
            id: req.user._id, 
            username: req.user.username, 
            role: req.user.role 
        };
        res.redirect('/admin/dashboard');
    }
);

module.exports = router;