const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const Admin = require('./models/Admin'); 

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB.');

        const existingAdmin = await Admin.findOne({ username: 'admin' });
        if (existingAdmin) {
            console.log('Admin user already exists. Exiting...');
            process.exit(0);
        }

        const newAdmin = new Admin({
            username: 'admin',
            password: 'SuperSecretPassword123!' 
        });

        await newAdmin.save();
        console.log('Success! First admin created.');
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
}; // <-- FIXED

seedAdmin();