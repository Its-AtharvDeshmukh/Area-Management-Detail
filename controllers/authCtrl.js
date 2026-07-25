const Admin = require('../models/Admin');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// --- LOGIN LOGIC ---
exports.getLogin = (req, res) => {
    if (req.session.admin || req.session.user) {
        return res.redirect('/admin/dashboard'); 
    }
    res.render('login', { error: null });
}; // <-- FIXED: Added missing closing bracket

exports.postLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // 1. Check if it is the Super Admin
        const admin = await Admin.findOne({ username });
        if (admin && await bcrypt.compare(password, admin.password)) {
            req.session.admin = { id: admin._id, username: admin.username, role: 'super_admin' };
            return res.redirect('/admin/dashboard');
        }
        
        // 2. Check if it is an Authorized User
        const user = await User.findOne({ username });
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.user = { id: user._id, username: user.username, role: user.role };
            return res.redirect('/admin/dashboard'); 
        }
        
        res.render('login', { error: 'Invalid username or password' });
    } catch (error) {
        res.render('login', { error: 'A server error occurred. Please try again.' });
    }
}; // <-- FIXED: Added missing closing bracket

// --- REGISTRATION LOGIC ---
exports.getRegister = (req, res) => {
    if (req.session.admin || req.session.user) {
        return res.redirect('/admin/dashboard'); 
    }
    res.render('register', { error: null, success: null });
}; // <-- FIXED: Added missing closing bracket

exports.postRegister = async (req, res) => {
    try {
        const { username, password, confirmPassword } = req.body;
        
        if (password !== confirmPassword) {
            return res.render('register', { error: 'Passwords do not match', success: null });
        }
        
        const existingUser = await User.findOne({ username });
        const existingAdmin = await Admin.findOne({ username });
        
        if (existingUser || existingAdmin) {
            return res.render('register', { error: 'Username is already taken', success: null });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser = new User({
            username,
            password: hashedPassword,
            role: 'authorized_user'
        });
        
        await newUser.save();
        res.render('register', { error: null, success: 'Registration successful! Please login.' });
    } catch (error) {
        res.render('register', { error: 'An error occurred during registration. Please try again.', success: null });
    }
}; // <-- FIXED: Added missing closing bracket

// --- LOGOUT LOGIC ---
exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) console.log(err);
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
}; // <-- FIXED: Added missing closing bracket