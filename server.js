const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User');
require('dotenv').config();

const app = express();

// 1. Trust Proxy (Must be declared before session middleware for Render/HTTPS)
app.set('trust proxy', 1);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// 2. Consolidated Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // true on Render (HTTPS), false locally
        sameSite: 'lax'
    }
}));

// --- PASSPORT GOOGLE OAUTH CONFIGURATION ---
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
        // 1. Check if user already logged in with this Google ID before
        let user = await User.findOne({ googleId: profile.id });
        if (user) return done(null, user);

        // 2. If not, create a new Authorized User
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
// ------------------------------------------

// Routes Integration
app.use('/', require('./routes/indexRoutes'));
app.use('/admin', require('./routes/adminRoutes'));
app.use('/families', require('./routes/familyRoutes'));
app.use('/residents', require('./routes/residentRoutes'));

// DB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

app.listen(process.env.PORT || 3000, () => {
    console.log('Server running on port 3000');
});