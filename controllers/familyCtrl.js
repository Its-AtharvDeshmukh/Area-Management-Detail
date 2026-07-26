const mongoose = require('mongoose');
const Family = require('../models/Family');
const Resident = require('../models/Resident');

exports.getAllFamilies = async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};
        if (search) {
            const matchedResidents = await Resident.find({
                $or: [
                    { fullName: { $regex: search, $options: 'i' } },
                    { epicNumber: { $regex: search, $options: 'i' } },
                    { mobile: { $regex: search, $options: 'i' } }
                ]
            }).select('familyId');
            const familyIds = matchedResidents.map(r => r.familyId);
            query.$or = [
                { familyId: { $regex: search, $options: 'i' } },
                { houseNumber: { $regex: search, $options: 'i' } },
                { streetArea: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } },
                { _id: { $in: familyIds } }
            ];
        }
        const families = await Family.find(query).populate('headOfFamily').sort({ createdAt: -1 });
        res.render('families/index', { families, search });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching families");
    }
};

exports.renderWizard = (req, res) => {
    const isSuperAdmin = (req.session.user && req.session.user.role === 'super_admin') || req.session.admin !== undefined;
    res.render('families/wizard', { isSuperAdmin, mapToken: process.env.MAP_TOKEN });
};

exports.getEditFamily = async (req, res) => {
    try {
        const family = await Family.findById(req.params.id);
        if (!family) return res.status(404).send('Family not found');

        const isSuperAdmin = (req.session.user && req.session.user.role === 'super_admin') || req.session.admin !== undefined;
        const currentUsername = req.session.user ? req.session.user.username : (req.session.admin ? req.session.admin.username : null);

        if (!isSuperAdmin && family.createdBy !== currentUsername) {
            return res.status(403).send("Access Denied: You can only edit family records you created.");
        }

        res.render('families/edit', { family, mapToken: process.env.MAP_TOKEN });
    } catch (error) {
        res.status(500).send("Error loading edit form");
    }
};

exports.registerFamilyAndHoF = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const payload = req.body;
        const creator = req.session.user ? req.session.user.username : (req.session.admin ? req.session.admin.username : 'System');
        const count = await Family.countDocuments();
        const familyId = `DN-FAM-${1000 + count + 1}`;
        
        const newFamily = new Family({
            familyId, houseNumber: payload.houseNumber, buildingName: payload.buildingName,
            streetArea: payload.streetArea, landmark: payload.landmark, fullAddress: payload.fullAddress,
            wardNumber: payload.wardNumber, pinCode: payload.pinCode, location: { lat: payload.lat, lng: payload.lng },
            remarks: payload.familyRemarks, memberCount: 1, createdBy: creator
        });
        const savedFamily = await newFamily.save({ session });

        const newHoF = new Resident({
            familyId: savedFamily._id, relationship: 'Head of Family', fullName: payload.fullName,
            gender: payload.gender, dob: payload.dob, maritalStatus: payload.maritalStatus,
            mobile: payload.mobile, secondaryMobile: payload.secondaryMobile, whatsappNumber: payload.whatsappNumber,
            email: payload.email, occupationType: payload.occupationType, occupationOther: payload.occupationOther,
            education: payload.education, bloodGroup: payload.bloodGroup, hasDisability: payload.hasDisability === 'true',
            disabilityType: payload.disabilityType, disabilityPercentage: payload.disabilityPercentage,
            medicalCondition: payload.medicalCondition,
            emergencyContact: { name: payload.emergencyName, number: payload.emergencyNumber, relationship: payload.emergencyRelation },
            isPermanentResident: payload.isPermanentResident === 'true', hasVoterId: payload.hasVoterId === 'true',
            epicNumber: payload.epicNumber || undefined, rollSerialNumber: payload.rollSerialNumber,
            boothPartNumber: payload.boothPartNumber, pollingStation: payload.pollingStation, createdBy: creator
        });
        if (payload.aadhaarNumber) newHoF.aadhaarNumber = payload.aadhaarNumber;
        if (payload.panNumber) newHoF.panNumber = payload.panNumber;
        await newHoF.save({ session });

        await session.commitTransaction();
        session.endSession();

        // Passes trigger flag for the free Click-to-Chat banner on the profile page
        res.redirect(`/families/${savedFamily._id}?newRegistration=true`);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(error);
        res.status(500).send("Error registering family. Transaction rolled back: " + error.message);
    }
};

exports.getFamilyProfile = async (req, res) => {
    try {
        const family = await Family.findById(req.params.id);
        if (!family) return res.status(404).send('Family not found');

        const members = await Resident.find({ familyId: family._id }).select('+aadhaarNumber +panNumber'); 
        const headOfFamily = members.find(m => m.relationship === 'Head of Family');
        const dependents = members.filter(m => m.relationship !== 'Head of Family');
        const stats = {
            males: members.filter(m => m.gender === 'Male').length,
            females: members.filter(m => m.gender === 'Female').length,
            children: members.filter(m => m.age <= 15).length,
            adults: members.filter(m => m.age >= 16 && m.age <= 59).length,
            seniors: members.filter(m => m.age >= 60).length
        };

        const isSuperAdmin = (req.session.user && req.session.user.role === 'super_admin') || req.session.admin !== undefined;
        const currentUser = req.session.user || req.session.admin;
        res.render('families/profile', { family, headOfFamily, dependents, stats, members, isSuperAdmin, currentUser, req });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error loading family profile");
    }
};

exports.addFamilyMember = async (req, res) => {
    try {
        const familyId = req.params.id;
        const payload = req.body;
        const creator = req.session.user ? req.session.user.username : (req.session.admin ? req.session.admin.username : 'System');

        const newMember = new Resident({
            familyId: familyId, fullName: payload.fullName, relationship: payload.relationship,
            gender: payload.gender, dob: payload.dob, maritalStatus: payload.maritalStatus,
            mobile: payload.mobile, secondaryMobile: payload.secondaryMobile, whatsappNumber: payload.whatsappNumber,
            email: payload.email, occupationType: payload.occupationType, occupationOther: payload.occupationOther,
            education: payload.education, bloodGroup: payload.bloodGroup, hasDisability: payload.hasDisability === 'true',
            disabilityType: payload.disabilityType, medicalCondition: payload.medicalCondition,
            isPermanentResident: payload.isPermanentResident === 'true', hasVoterId: payload.hasVoterId === 'true',
            epicNumber: payload.epicNumber || undefined, rollSerialNumber: payload.rollSerialNumber,
            boothPartNumber: payload.boothPartNumber, pollingStation: payload.pollingStation, createdBy: creator
        });
        if (payload.aadhaarNumber) newMember.aadhaarNumber = payload.aadhaarNumber;
        if (payload.panNumber) newMember.panNumber = payload.panNumber;

        await newMember.save();
        await Family.findByIdAndUpdate(familyId, { $inc: { memberCount: 1 } });
        res.redirect(`/families/${familyId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error adding family member: " + error.message);
    }
};

exports.updateFamily = async (req, res) => {
    try {
        const family = await Family.findById(req.params.id);
        const isSuperAdmin = (req.session.user && req.session.user.role === 'super_admin') || req.session.admin !== undefined;
        const currentUsername = req.session.user ? req.session.user.username : (req.session.admin ? req.session.admin.username : null);

        if (!isSuperAdmin && family.createdBy !== currentUsername) {
            return res.status(403).send("Access Denied: You can only update family records you created.");
        }

        const payload = req.body;
        const updateData = {
            houseNumber: payload.houseNumber, buildingName: payload.buildingName, streetArea: payload.streetArea,
            landmark: payload.landmark, fullAddress: payload.fullAddress, wardNumber: payload.wardNumber,
            pinCode: payload.pinCode, remarks: payload.remarks, location: { lat: payload.lat, lng: payload.lng }
        };
        await Family.findByIdAndUpdate(req.params.id, updateData);
        res.redirect(`/families/${req.params.id}`);
    } catch (error) {
        res.status(500).send("Error updating family: " + error.message);
    }
};