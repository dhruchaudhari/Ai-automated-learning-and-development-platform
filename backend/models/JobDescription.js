const mongoose = require('mongoose');

const jobDescriptionSchema = new mongoose.Schema({
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: [true, 'Department is required']
    },
    jobTitle: {
        type: String,
        required: [true, 'Job title/role is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    responsibilities: {
        type: String,
        required: [true, 'Responsibilities are required'],
        trim: true
    },
    requiredSkillset: {
        type: String,
        required: [true, 'Required skillset is required'],
        trim: true
    },
    qualifications: {
        type: String,
        required: [true, 'Qualifications are required'],
        trim: true
    }
}, {
    timestamps: true
});

// Index for fast lookup by department
jobDescriptionSchema.index({ department: 1 });

module.exports = mongoose.model('JobDescription', jobDescriptionSchema);
