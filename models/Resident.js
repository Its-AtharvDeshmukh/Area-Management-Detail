const mongoose = require('mongoose');

const residentSchema = new mongoose.Schema({
    // 1. Personal Information
    fullName: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    dob: { type: Date, required: true },
    age: { type: Number },
    maritalStatus: { type: String, enum: ['Single', 'Married', 'Widowed', 'Divorced', 'Separated'] },
    relationship: { type: String, required: true }, 
    familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true },

    // 2. Contact Information
    mobile: { type: String, required: true }, 
    secondaryMobile: { type: String },
    whatsappNumber: { type: String },
    email: { type: String },

    // 3. Occupation & Education
    occupationType: { type: String, enum: ['Salaried Employee', 'Government Employee', 'Business', 'Self Employed', 'Farmer', 'Labour', 'Housewife', 'Student', 'Retired', 'Unemployed', 'Other'] },
    occupationOther: { type: String }, 
    education: { type: String, enum: ['No Formal Education', 'Primary', 'Secondary', 'Higher Secondary', 'Diploma', 'Graduate', 'Post Graduate', 'PhD', 'Other'] },

    // 4. Resident Status & Voter Information
    isPermanentResident: { type: Boolean, default: true },
    hasVoterId: { type: Boolean, default: false },
    epicNumber: { type: String, sparse: true, unique: true }, 
    rollSerialNumber: { type: String },
    boothPartNumber: { type: String },
    pollingStation: { type: String },

    // 5. Secure Identity Information
    aadhaarNumber: { type: String, sparse: true, unique: true, select: false }, 
    panNumber: { type: String, sparse: true, unique: true },

    // 6. Address specific to resident
    address: {
        houseNumber: String,
        landmark: String,
        fullAddress: String,
        location: { lat: Number, lng: Number }
    },

    // 7. Health & Emergency
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'] },
    hasDisability: { type: Boolean, default: false },
    disabilityType: { type: String },
    disabilityPercentage: { type: Number },
    medicalCondition: { type: String },
    emergencyContact: {
        name: String,
        number: String,
        relationship: String
    },
    adminRemarks: { type: String },
    createdBy: { type: String } // <--- RBAC Privacy tracking field
}, { timestamps: true });

// Mongoose 9 handles synchronous execution automatically.
residentSchema.pre('save', function() {
    if (this.dob) {
        const ageDifMs = Date.now() - this.dob.getTime();
        const ageDate = new Date(ageDifMs);
        this.age = Math.abs(ageDate.getUTCFullYear() - 1970);
    }
});

module.exports = mongoose.model('Resident', residentSchema);