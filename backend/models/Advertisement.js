const mongoose = require('mongoose');

const advertisementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Advertisement title is required'],
        trim: true
    },
    detail: {
        type: String, // PDF URL
        required: [true, 'Advertisement PDF is required'],
        unique: true,
        get: function (v) {
            if (v && !v.startsWith('http')) {
                return `/${v}`;
            }
            return v;
        }
    },
    lastDateToApply: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        index: true
    },
    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        index: true
    },
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true,
        index: true
    }
}, {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
});

module.exports = mongoose.model('Advertisement', advertisementSchema);
