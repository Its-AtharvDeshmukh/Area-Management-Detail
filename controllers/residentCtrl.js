const Resident = require('../models/Resident');

exports.getAllResidents = async (req, res) => {
    try {
        const { search, gender, bloodGroup, occupation, voterStatus } = req.query;
        let query = {};
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } }, { mobile: { $regex: search, $options: 'i' } },
                { epicNumber: { $regex: search, $options: 'i' } }, { rollSerialNumber: { $regex: search, $options: 'i' } },
                { boothPartNumber: { $regex: search, $options: 'i' } }
            ];
        }
        if (gender) query.gender = gender; if (bloodGroup) query.bloodGroup = bloodGroup;
        if (occupation) query.occupationType = occupation; if (voterStatus === 'yes') query.hasVoterId = true;
        if (voterStatus === 'no') query.hasVoterId = false;

        const residents = await Resident.find(query).populate('familyId').sort({ createdAt: -1 });
        res.render('residents/index', { residents, search, gender, bloodGroup, occupation, voterStatus });
    } catch (error) {
        res.status(500).send("Error fetching residents");
    }
};

exports.getResidentProfile = async (req, res) => {
    try {
        const resident = await Resident.findById(req.params.id).populate('familyId').select('+aadhaarNumber +panNumber');
        if (!resident) return res.status(404).send('Resident not found');
        
        const isSuperAdmin = (req.session.user && req.session.user.role === 'super_admin') || req.session.admin !== undefined;
        const currentUser = req.session.user || req.session.admin;
        res.render('residents/profile', { resident, isSuperAdmin, currentUser }); 
    } catch (error) {
        res.status(500).send("Error loading profile");
    }
};

// ROW-LEVEL SECURITY ADDED HERE
exports.deleteResident = async (req, res) => {
    try {
        const resident = await Resident.findById(req.params.id);
        if (!resident) return res.status(404).send("Resident not found");

        const isSuperAdmin = (req.session.user && req.session.user.role === 'super_admin') || req.session.admin !== undefined;
        const currentUsername = req.session.user ? req.session.user.username : (req.session.admin ? req.session.admin.username : null);

        // Security Check
        if (!isSuperAdmin && resident.createdBy !== currentUsername) {
            return res.status(403).send("Access Denied: You can only delete residents you registered.");
        }

        if (resident.familyId) {
            const Family = require('../models/Family');
            await Family.findByIdAndUpdate(resident.familyId, { $inc: { memberCount: -1 } });
        }
        await Resident.findByIdAndDelete(req.params.id);
        res.redirect('/residents');
    } catch (error) {
        res.status(500).send("Error deleting resident");
    }
};

// ROW-LEVEL SECURITY ADDED HERE
exports.getEditResident = async (req, res) => {
    try {
        const resident = await Resident.findById(req.params.id).select('+aadhaarNumber +panNumber');
        if (!resident) return res.status(404).send('Resident not found');
        
        const isSuperAdmin = (req.session.user && req.session.user.role === 'super_admin') || req.session.admin !== undefined;
        const currentUsername = req.session.user ? req.session.user.username : (req.session.admin ? req.session.admin.username : null);

        // Security Check
        if (!isSuperAdmin && resident.createdBy !== currentUsername) {
            return res.status(403).send("Access Denied: You can only edit residents you registered.");
        }

        res.render('residents/edit', { resident, isSuperAdmin });
    } catch (error) {
        res.status(500).send("Error loading edit form");
    }
};

// ROW-LEVEL SECURITY ADDED HERE
exports.updateResident = async (req, res) => {
    try {
        const resident = await Resident.findById(req.params.id);
        const isSuperAdmin = (req.session.user && req.session.user.role === 'super_admin') || req.session.admin !== undefined;
        const currentUsername = req.session.user ? req.session.user.username : (req.session.admin ? req.session.admin.username : null);

        // Security Check
        if (!isSuperAdmin && resident.createdBy !== currentUsername) {
            return res.status(403).send("Access Denied: You can only edit residents you registered.");
        }

        const payload = req.body;
        payload.hasDisability = payload.hasDisability === 'true';
        payload.isPermanentResident = payload.isPermanentResident === 'true';
        payload.hasVoterId = payload.hasVoterId === 'true';
        payload.emergencyContact = { name: payload.emergencyName, number: payload.emergencyNumber, relationship: payload.emergencyRelation };
        
        if (!isSuperAdmin) {
            delete payload.aadhaarNumber;
            delete payload.panNumber;
        }
        await Resident.findByIdAndUpdate(req.params.id, payload);
        res.redirect(`/residents/${req.params.id}`);
    } catch (error) {
        res.status(500).send("Error updating resident: " + error.message);
    }
};