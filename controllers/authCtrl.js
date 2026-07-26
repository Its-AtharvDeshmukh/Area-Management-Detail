const Admin = require('../models/Admin');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getLogin = (req, res) => {
    if (req.session.admin || req.session.user) {
        return res.redirect('/admin/dashboard'); 
    }
    res.render('login', { error: null });
};

exports.postLogin = async (req, res) => {
    try {
        let { username, password } = req.body;
        username = username ? username.trim() : '';

        const admin = await Admin.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
        if (admin && await bcrypt.compare(password, admin.password)) {
            req.session.admin = { id: admin._id, username: admin.username, role: 'super_admin' };
            return res.redirect('/admin/dashboard');
        }

        const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.user = { id: user._id, username: user.username, role: user.role };
            return res.redirect('/admin/dashboard'); 
        }

        res.render('login', { error: 'Invalid username or password' });
    } catch (error) {
        res.render('login', { error: 'A server error occurred. Please try again.' });
    }
};

exports.getRegister = (req, res) => {
    if (req.session.admin || req.session.user) {
        return res.redirect('/admin/dashboard'); 
    }
    res.render('register', { error: null, success: null });
};

exports.postRegister = async (req, res) => {
    try {
        let { username, password, confirmPassword } = req.body;
        username = username ? username.trim() : '';

        if (password !== confirmPassword) {
            return res.render('register', { error: 'Passwords do not match', success: null });
        }

        const existingUser = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
        const existingAdmin = await Admin.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });

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
};

exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) console.log(err);
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
};