const Resident = require('../models/Resident');
const Family = require('../models/Family');

exports.getLandingPage = async (req, res) => {
    try {
        const totalFamilies = await Family.countDocuments();
        const totalResidents = await Resident.countDocuments();
        
        // Base demographics
        const totalMales = await Resident.countDocuments({ gender: 'Male' });
        const totalFemales = await Resident.countDocuments({ gender: 'Female' });

        // Age brackets
        const childrenCount = await Resident.countDocuments({ age: { $lte: 15 } });
        const adultsCount = await Resident.countDocuments({ age: { $gte: 16, $lte: 59 } });
        const seniorsCount = await Resident.countDocuments({ age: { $gte: 60 } });

        res.render('public/home', {
            totalFamilies,
            totalResidents,
            totalMales,
            totalFemales,
            childrenCount,
            adultsCount,
            seniorsCount
        });
    } catch (error) {
        res.status(500).send("Error loading the landing page.");
    }
};