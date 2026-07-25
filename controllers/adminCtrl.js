const Resident = require('../models/Resident');
const Family = require('../models/Family');
const User = require('../models/User');

exports.getDashboard = async (req, res) => {
    try {
        const totalFamilies = await Family.countDocuments();
        const totalResidents = await Resident.countDocuments();
        const totalMales = await Resident.countDocuments({ gender: 'Male' });
        const totalFemales = await Resident.countDocuments({ gender: 'Female' });

        // Age Distribution
        const ageStats = await Resident.aggregate([
            {
                $bucket: {
                    groupBy: "$age",
                    boundaries: [0, 16, 60, 150],
                    default: "Unknown",
                    output: { count: { $sum: 1 } }
                }
            }
        ]);

        const ageData = [0, 0, 0];
        ageStats.forEach(stat => {
            if (stat._id === 0) ageData[0] = stat.count;
            else if (stat._id === 16) ageData[1] = stat.count;
            else if (stat._id === 60) ageData[2] = stat.count;
        });

        // Blood Group Distribution
        const bloodStats = await Resident.aggregate([
            { $match: { bloodGroup: { $ne: null, $ne: 'Unknown' } } },
            { $group: { _id: "$bloodGroup", count: { $sum: 1 } } }
        ]);

        const bloodLabels = bloodStats.map(stat => stat._id);
        const bloodData = bloodStats.map(stat => stat.count);

        // --- AUTOMATED BIRTHDAY CHECKER ---
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();

        const todaysBirthdays = await Resident.find({
            $expr: {
                $and: [
                    { $eq: [{ $month: "$dob" }, currentMonth] },
                    { $eq: [{ $dayOfMonth: "$dob" }, currentDay] }
                ]
            }
        }).populate('familyId');

        // Recent Activity & Metrics
        const recentResidents = await Resident.find().sort({ createdAt: -1 }).limit(5);
        const recentFamilies = await Family.find().sort({ createdAt: -1 }).limit(5).populate('headOfFamily');
        const gpsFamilies = await Family.countDocuments({ "location.lat": { $ne: null } });

        const isSuperAdmin = (req.session.user && req.session.user.role === 'super_admin') || req.session.admin !== undefined;

        res.render('dashboard', {
            totalFamilies,
            totalResidents,
            totalMales,
            totalFemales,
            ageData: JSON.stringify(ageData),
            bloodLabels: JSON.stringify(bloodLabels),
            bloodData: JSON.stringify(bloodData),
            todaysBirthdays, // Passed to view for automated greetings
            recentResidents,
            recentFamilies,
            gpsFamilies,
            boysCount: await Resident.countDocuments({ age: { $lte: 18 }, gender: 'Male' }),
            girlsCount: await Resident.countDocuments({ age: { $lte: 18 }, gender: 'Female' }),
            adultMen: await Resident.countDocuments({ age: { $gte: 19, $lte: 59 }, gender: 'Male' }),
            adultWomen: await Resident.countDocuments({ age: { $gte: 19, $lte: 59 }, gender: 'Female' }),
            seniorMen: await Resident.countDocuments({ age: { $gte: 60 }, gender: 'Male' }),
            seniorWomen: await Resident.countDocuments({ age: { $gte: 60 }, gender: 'Female' }),
            workingPros: await Resident.countDocuments({ occupationType: 'Salaried Employee' }),
            farmers: await Resident.countDocuments({ occupationType: 'Farmer' }),
            graduates: await Resident.countDocuments({ education: 'Graduate' }),
            postGrads: await Resident.countDocuments({ education: { $in: ['Post Graduate', 'PhD'] } }),
            totalVoters: await Resident.countDocuments({ hasVoterId: true }),
            disabledCount: await Resident.countDocuments({ hasDisability: true }),
            averageFamilySize: totalFamilies > 0 ? (totalResidents / totalFamilies).toFixed(1) : 0,
            averageAge: totalResidents > 0 ? Math.round(await Resident.aggregate([{ $group: { _id: null, avgAge: { $avg: "$age" } } }]).then(res => res[0]?.avgAge || 0)) : 0,
            oldestResident: await Resident.findOne().sort({ age: -1 }),
            youngestResident: await Resident.findOne().sort({ age: 1 }),
            isSuperAdmin
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error loading dashboard data: " + error.message);
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({ role: 'authorized_user' }).sort({ createdAt: -1 });
        const isSuperAdmin = true;
        res.render('admin/users', { users, isSuperAdmin });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error loading user management panel.");
    }
};

exports.toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.isActive = !user.isActive;
            await user.save();
        }
        res.redirect('/admin/users');
    } catch (error) {
        res.status(500).send("Error updating user status.");
    }
};

exports.deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.redirect('/admin/users');
    } catch (error) {
        res.status(500).send("Error deleting user.");
    }
};

exports.exportCensusCSV = async (req, res) => {
    try {
        const residents = await Resident.find({}).populate('familyId').select('+aadhaarNumber +panNumber');
        
        let csv = 'Family ID,Full Name,Relationship,Gender,Age,Mobile,Email,Occupation,Blood Group,Permanent Resident,Voter ID,EPIC Number\n';

        residents.forEach(r => {
            const familyId = r.familyId ? r.familyId.familyId : 'N/A';
            const row = [
                familyId,
                `"${r.fullName || ''}"`,
                `"${r.relationship || ''}"`,
                r.gender || '',
                r.age || '',
                r.mobile || '',
                r.email || '',
                `"${r.occupationType || ''}"`,
                r.bloodGroup || '',
                r.isPermanentResident ? 'Yes' : 'No',
                r.hasVoterId ? 'Yes' : 'No',
                r.epicNumber || 'N/A'
            ];
            csv += row.join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=dattaham-nagar-census-report.csv');
        res.status(200).send(csv);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error generating census export.");
    }
};