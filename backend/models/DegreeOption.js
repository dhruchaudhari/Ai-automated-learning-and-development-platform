const mongoose = require('mongoose');

const degreeOptionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Degree name is required'],
        unique: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['bachelor', 'master'],
        required: [true, 'Category is required']
    },
    specializations: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('DegreeOption', degreeOptionSchema);
