const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User');
require('dotenv').config();

const app = express();

app.set('trust proxy', 1);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.NODE_ENV === 'production' 
        ? "https://area-management-detail.onrender.com/auth/google/callback" 
        : "http://localhost:3000/auth/google/callback"
},
async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        if (user) return done(null, user);

        const newUser = new User({
            googleId: profile.id,
            username: profile.displayName,
            email: profile.emails[0].value,
            role: 'authorized_user',
            avatar: profile.photos[0].value
        });
        await newUser.save();
        return done(null, newUser);
    } catch (error) {
        return done(error, false);
    }
}));

// ==========================================
// GLOBAL RBAC VARIABLE INJECTION (FIXED)
// ==========================================
app.use((req, res, next) => {
    res.locals.currentUser = (req.session && req.session.user) || (req.session && req.session.admin) || null;
    res.locals.isSuperAdmin = (req.session && req.session.user && req.session.user.role === 'super_admin') || (req.session && req.session.admin !== undefined);
    next();
});

// Routes Integration
app.use('/', require('./routes/indexRoutes'));
app.use('/admin', require('./routes/adminRoutes'));
app.use('/families', require('./routes/familyRoutes'));
app.use('/residents', require('./routes/residentRoutes'));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

app.listen(process.env.PORT || 3000, () => {
    console.log('Server running on port 3000');
});