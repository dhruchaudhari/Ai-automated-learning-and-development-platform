// models/Job.js

const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({

    jobCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        index: true
    },

    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
        required: true,
        index: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        required: true,
        index: true
    },

    location: {
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        country: { type: String, trim: true },
        isRemote: { type: Boolean, default: false }
    },

    salaryRange: {
        min: { type: Number, min: 0 },
        max: { type: Number, min: 0 },
        currency: { type: String, default: "INR" }
    },

    openings: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },

    applicationDeadline: {
        type: Date,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    responsibilities: [{
        type: String,
        trim: true
    }]

}, { timestamps: true });

module.exports = mongoose.model("Job", jobSchema);