// middlewares/auth.js

// Checks if ANY valid user (Super Admin or Authorized User) is logged in
exports.isAuthenticated = (req, res, next) => {
    if (req.session && (req.session.admin || req.session.user)) {
        return next();
    }
    res.redirect('/login');
}; // <-- FIXED: Added missing closing bracket

// Checks specifically for Super Admin privileges
exports.isSuperAdmin = (req, res, next) => {
    if (req.session && req.session.admin) {
        return next();
    }
    if (req.session && req.session.user && req.session.user.role === 'super_admin') {
        return next();
    }
    res.status(403).send('Access Denied: Super Admin privileges required.');
}; // <-- FIXED: Added missing closing bracket