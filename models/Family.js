const mongoose = require('mongoose');

const familySchema = new mongoose.Schema({
    familyId: { type: String, unique: true, required: true }, // Auto-generated e.g., DN-FAM-1001
    houseNumber: { type: String, required: true },
    buildingName: { type: String },
    streetArea: { type: String, required: true },
    landmark: { type: String },
    fullAddress: { type: String, required: true },
    wardNumber: { type: String },
    pinCode: { type: String, required: true },
    location: {
        lat: { type: Number },
        lng: { type: Number }
    },
    memberCount: { type: Number, default: 1 }, // Will auto-update
    remarks: { type: String }
}, { timestamps: true });

// Virtual for Head of Family (to easily populate HoF later)
familySchema.virtual('headOfFamily', {
    ref: 'Resident',
    localField: '_id',
    foreignField: 'familyId',
    justOne: true,
    match: { relationship: 'Head of Family' }
});

// Ensure virtuals are included when converting to JSON
familySchema.set('toObject', { virtuals: true });
familySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Family', familySchema);