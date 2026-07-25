const Resident = require('../models/Resident');

exports.getAllResidents = async (req, res) => {
    try {
        const { search, gender, bloodGroup, occupation, voterStatus } = req.query;
        let query = {};
        
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } },
                { epicNumber: { $regex: search, $options: 'i' } },
                { rollSerialNumber: { $regex: search, $options: 'i' } },
                { boothPartNumber: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (gender) query.gender = gender;
        if (bloodGroup) query.bloodGroup = bloodGroup;
        if (occupation) query.occupationType = occupation;
        if (voterStatus === 'yes') query.hasVoterId = true;
        if (voterStatus === 'no') query.hasVoterId = false;

        const residents = await Resident.find(query)
            .populate('familyId')
            .sort({ createdAt: -1 });

        res.render('residents/index', { residents, search, gender, bloodGroup, occupation, voterStatus });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching residents");
    }
}; // <-- FIXED: Added missing closing bracket

exports.getResidentProfile = async (req, res) => {
    try {
        const resident = await Resident.findById(req.params.id)
            .populate('familyId')
            .select('+aadhaarNumber +panNumber');
            
        if (!resident) return res.status(404).send('Resident not found');

        const isSuperAdmin = (req.session.user && req.session.user.role === 'super_admin') || req.session.admin !== undefined;

        res.render('residents/profile', { resident, isSuperAdmin });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error loading profile");
    }
}; // <-- FIXED: Added missing closing bracket

exports.deleteResident = async (req, res) => {
    try {
        const resident = await Resident.findById(req.params.id);
        if (resident) {
            if (resident.familyId) {
                const Family = require('../models/Family');
                await Family.findByIdAndUpdate(resident.familyId, { $inc: { memberCount: -1 } });
            }
            await Resident.findByIdAndDelete(req.params.id);
        }
        res.redirect('/residents');
    } catch (error) {
        res.status(500).send("Error deleting resident");
    }
}; // <-- FIXED: Added missing closing bracket

// --- NEW EDIT LOGIC ---

exports.getEditResident = async (req, res) => {
    try {
        const resident = await Resident.findById(req.params.id).select('+aadhaarNumber +panNumber');
        if (!resident) return res.status(404).send('Resident not found');
        
        const isSuperAdmin = (req.session.user && req.session.user.role === 'super_admin') || req.session.admin !== undefined;
        res.render('residents/edit', { resident, isSuperAdmin });
    } catch (error) {
        res.status(500).send("Error loading edit form");
    }
}; // <-- FIXED: Added missing closing bracket

exports.updateResident = async (req, res) => {
    try {
        const payload = req.body;
        
        // Convert string representations to Booleans
        payload.hasDisability = payload.hasDisability === 'true';
        payload.isPermanentResident = payload.isPermanentResident === 'true';
        payload.hasVoterId = payload.hasVoterId === 'true';
        
        payload.emergencyContact = {
            name: payload.emergencyName,
            number: payload.emergencyNumber,
            relationship: payload.emergencyRelation
        };

        const isSuperAdmin = (req.session.user && req.session.user.role === 'super_admin') || req.session.admin !== undefined;
        
        // Strict Data Sanitization: Do not allow standard users to inject Aadhaar/PAN
        if (!isSuperAdmin) {
            delete payload.aadhaarNumber;
            delete payload.panNumber;
        }

        await Resident.findByIdAndUpdate(req.params.id, payload);
        res.redirect(`/residents/${req.params.id}`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error updating resident: " + error.message);
    }
};