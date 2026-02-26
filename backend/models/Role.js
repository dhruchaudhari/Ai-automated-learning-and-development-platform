// models/Role.js

const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true,
        trim: true
    },

    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        required: true,
        index: true
    },

    level: {
        type: String,
        enum: ["Intern", "Junior", "Mid", "Senior", "Lead", "Manager"],
        required: true
    },

    employmentType: {
        type: String,
        enum: ["Full-time", "Part-time", "Contract", "Internship"],
        required: true
    },



    requiredSkills: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        weight: {
            type: Number,
            default: 1.0,
            min: 0,
            max: 1
        }
    }],

    preferredSkills: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        weight: {
            type: Number,
            default: 0.5,
            min: 0,
            max: 1
        }
    }],

    criteriaSet: {
        min10thPercentage: { type: Number, min: 0, max: 100 },
        min12thPercentage: { type: Number, min: 0, max: 100 },
        minGraduationPercentage: { type: Number, min: 0, max: 100 },
        minPGPercentage: { type: Number, min: 0, max: 100 },
        minAge: { type: Number, min: 14 },
        maxAge: { type: Number, min: 14 },
        minimumExperience: { type: Number, default: 0, min: 0 },
        specificDegrees: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "DegreeOption"
        }],
        specializations: [{ type: String, trim: true }]
    },

    education: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        required: true
    }

}, { timestamps: true });

/* Validation: At least one criteria must be required */
roleSchema.pre('validate', function (next) {
    if (this.criteriaSet) {
        const cs = this.criteriaSet;
        const hasCriteria = cs.min10thPercentage !== undefined ||
            cs.min12thPercentage !== undefined ||
            cs.minGraduationPercentage !== undefined ||
            cs.minPGPercentage !== undefined ||
            cs.minAge !== undefined ||
            cs.maxAge !== undefined ||
            cs.minimumExperience !== undefined ||
            (cs.specificDegrees && cs.specificDegrees.length > 0) ||
            (cs.specializations && cs.specializations.length > 0);

        if (!hasCriteria) {
            this.invalidate('criteriaSet', 'At least one criteria in criteriaSet must be provided');
        }
    } else {
        this.invalidate('criteriaSet', 'criteriaSet is required');
    }
    next();
});

/* Prevent duplicate roles inside same department */
roleSchema.index(
    { title: 1, department: 1, level: 1 },
    { unique: true }
);

module.exports = mongoose.model("Role", roleSchema);