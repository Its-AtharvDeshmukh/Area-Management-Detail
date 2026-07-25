const Resident = require('../models/Resident');
const Family = require('../models/Family');

exports.getHomePage = async (req, res) => {
    try {
        // Core statistics
        const totalFamilies = await Family.countDocuments();
        const totalResidents = await Resident.countDocuments();
                 
        // Gender demographics
        const totalMales = await Resident.countDocuments({ gender: 'Male' });
        const totalFemales = await Resident.countDocuments({ gender: 'Female' });
        // Age demographics (Children: 0-15, Adults: 16-59, Seniors: 60+)
        const childrenCount = await Resident.countDocuments({ age: { $lte: 15 } });
        const adultsCount = await Resident.countDocuments({ age: { $gte: 16, $lte: 59 } });
        const seniorsCount = await Resident.countDocuments({ age: { $gte: 60 } });
        
        // Pass all variables including mapToken to the EJS view
        res.render('home', {
            totalFamilies,
            totalResidents,
            totalMales,
            totalFemales,
            childrenCount,
            adultsCount,
            seniorsCount,
            user: req.session.admin,
            mapToken: process.env.MAP_TOKEN
        });
    } catch (error) {
        res.status(500).send("Error loading the landing page: " + error.message);
    }
};