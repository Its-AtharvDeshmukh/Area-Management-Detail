const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, unique: true, sparse: true }, 
    password: { type: String, required: false }, // Optional for Google Auth users
    googleId: { type: String, unique: true, sparse: true }, // Maps to Google Profile
    role: { type: String, enum: ['super_admin', 'authorized_user'], default: 'authorized_user' },
    isActive: { type: Boolean, default: true },
    avatar: { type: String } // Stores their Google profile picture
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);