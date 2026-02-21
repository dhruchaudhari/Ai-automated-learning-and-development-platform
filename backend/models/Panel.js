const mongoose = require('mongoose');

const expertSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Expert name is required'],
        trim: true
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        trim: true
    },
    role: {
        type: String,
        required: [true, 'Role is required'],
        trim: true
    },
    seniority: {
        type: Number,
        required: [true, 'Seniority (years) is required'],
        min: [5, 'Expert must have at least 5 years of experience']
    }
});

const panelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Panel name is required'],
        trim: true
    },
    experts: {
        type: [expertSchema],
        validate: {
            validator: function (v) {
                return v && v.length > 0;
            },
            message: 'A panel must have at least one expert'
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Panel', panelSchema);
