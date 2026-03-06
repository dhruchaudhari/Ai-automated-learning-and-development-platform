const mongoose = require('mongoose');
const User = require('./routes/../models/User'); // Adjust path to point to your model
const dotenv = require('dotenv');
dotenv.config();

// Replicating exactly what BulkUploadCorrectionModal generated in handleSave()
const mockRecord = {
    fullName: "Test User",
    fathersName: "Test Father",
    email: "test.bulk@example.com",
    mobile: "+919876543210",
    gender: "Male",
    dob: "1995-01-01",
    password: "User@123",
    confirmPassword: "User@123",
    isEmailVerified: true,
    permanentAddress: "123 Random Test Street",
    state: "Gujarat",
    skillSets: {
        technical: ["React"],
        creative: [],
        cognitive: [],
        tools: [],
        ethics: []
    },
    profileImage: "",
    resumeUrl: "",
    identityProofUrl: "",
    education: {
        tenth: {
            board: "GSEB",
            passingYear: 2010,
            percentage: 80,
            marksheetUrl: ""
        },
        twelfth: {
            board: "GSEB",
            passingYear: 2012,
            percentage: 80,
            marksheetUrl: ""
        },
        graduation: {
            degree: "Bachelor Technology / Bachelor Engineering",
            specialization: "Computer Science Engineering (CSE)",
            passingYear: 2016,
            percentage: 65,
            cgpa: null,
            marksheetUrl: ""
        },
        qualifyingDegree: {
            degree: "",
            specialization: "",
            percentage: 0,
            marksheetUrl: ""
        }
    },
    row: 2,
    originalData: {}
};

async function testInsert() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/LearningDevelopmentplatform');
        console.log("Connected to MongoDB.");

        // Remove existing if any
        await User.deleteOne({ email: mockRecord.email });

        // Backend bulk-register-many logic
        const { row: _row, originalData: _origData, advertisements: _ads, ...userFields } = mockRecord;

        const resolvedAds = []; // Mock resolving an advertisement

        const newUser = new User({
            ...userFields,
            password: userFields.password || 'User@123',
            role: 'user',
            status: 'pending',
            email: mockRecord.email.toLowerCase(),
            advertisements: resolvedAds,
            dummyuser: true,
            isEmailVerified: true
        });

        await newUser.save();
        console.log("Insert Success!");

    } catch (err) {
        console.error("Insert Failed. Error details:");
        console.error(err.message);
        if (err.errors) {
            Object.keys(err.errors).forEach(key => {
                console.error(`- ${key}: ${err.errors[key].message}`);
            });
        }
    } finally {
        mongoose.disconnect();
    }
}

testInsert();
