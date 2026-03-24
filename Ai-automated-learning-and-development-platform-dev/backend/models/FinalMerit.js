const mongoose = require('mongoose');

const finalMeritSchema = new mongoose.Schema({
    advertisementId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Advertisement',
        required: true,
        unique: true
    },
    results: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        sfmc: {
            type: Number,
            required: true
        },
        forces: {
            pef: Number,
            ssm: Number,
            dre: Number,
            lcp: Number,
            ids: Number
        },
        rank: {
            type: Number
        },
        imbalanceRatio: {
            type: Number
        }
    }],
    audit: {
        calculatedAt: {
            type: Date,
            default: Date.now
        },
        engineVersion: {
            type: String,
            default: '1.1.0-evolution-consolidated'
        },
        neuralMetrics: {
            loss: Number,
            accuracy: Number
        }
    }
}, {
    timestamps: true,
    collection: 'finalmerits'
});

// Indexing for faster lookups and sorting
finalMeritSchema.index({ advertisementId: 1, 'results.sfmc': -1 });
finalMeritSchema.index({ 'results.userId': 1 });

const FinalMerit = mongoose.model('FinalMerit', finalMeritSchema);

module.exports = FinalMerit;
