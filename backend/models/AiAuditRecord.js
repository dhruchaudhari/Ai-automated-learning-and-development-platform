const mongoose = require('mongoose');

const aiAuditRecordSchema = new mongoose.Schema({
    advertisementId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Advertisement',
        required: true
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    metadata: {
        // Detailed weights and parameters for each column from AI engine
        "10th": {
            stability_score: Number,
            weight_core: Number,
            weight_peripheral: Number,
            min_val: Number,
            max_val: Number,
            core_midpoint: Number
        },
        "12th": {
            stability_score: Number,
            weight_core: Number,
            weight_peripheral: Number,
            min_val: Number,
            max_val: Number,
            core_midpoint: Number
        },
        "Grad": {
            stability_score: Number,
            weight_core: Number,
            weight_peripheral: Number,
            min_val: Number,
            max_val: Number,
            core_midpoint: Number
        },
        "PG": {
            stability_score: Number,
            weight_core: Number,
            weight_peripheral: Number,
            min_val: Number,
            max_val: Number,
            core_midpoint: Number
        }
    },
    changes: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        userName: String,
        before: {
            "10th": Number,
            "12th": Number,
            "Grad": Number,
            "PG": Number
        },
        after: {
            "10th": Number,
            "12th": Number,
            "Grad": Number,
            "PG": Number
        },
        imputations: [String] // List of keys that were imputed (e.g. ["Grad", "PG"])
    }]
}, {
    timestamps: true
});

const AiAuditRecord = mongoose.model('AiAuditRecord', aiAuditRecordSchema);
module.exports = AiAuditRecord;
