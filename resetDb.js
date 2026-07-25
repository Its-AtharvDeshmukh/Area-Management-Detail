const mongoose = require('mongoose');
require('dotenv').config();

const resetDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB. Dropping database...');
        
        await mongoose.connection.dropDatabase();
        console.log('Success! Database has been completely reset and wiped.');
        
        process.exit(0);
    } catch (error) {
        console.error('Error resetting database:', error);
        process.exit(1);
    }
};

resetDatabase();