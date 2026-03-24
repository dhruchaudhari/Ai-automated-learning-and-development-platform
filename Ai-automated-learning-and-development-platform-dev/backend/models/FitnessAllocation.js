const mongoose = require('mongoose');

// ─── Component Breakdown Sub-Schema ───
// Each fitness component (CSF, SEA, SFMC, EGC, IM) is scored 0.0–1.0
const componentBreakdownSchema = new mongoose.Schema({
    CSF: { type: Number, default: 0 },   // Criteria Satisfaction Factor — Boolean+Margin threshold match
    SEA: { type: Number, default: 0 },   // Skill Expertise Alignment — Weighted skill-to-requirement neural mapping
    SFMC: { type: Number, default: 0 },  // Standard Foundation Merit Criteria
    EGC: { type: Number, default: 0 },   // Experience Growth Coefficient — Diminishing-return career trajectory
    IM: { type: Number, default: 0 }    // Interview/Exam Merit — Actual test performance score
}, { _id: false });

// ─── Weight Vector Sub-Schema ───
// The BETA weights used by the engine for this computation
const weightVectorSchema = new mongoose.Schema({
    CSF: { type: Number, default: 0 },
    SEA: { type: Number, default: 0 },
    SFMC: { type: Number, default: 0 },
    EGC: { type: Number, default: 0 },
    IM: { type: Number, default: 0 }
}, { _id: false });

// ─── Per-Job Fitness Detail ───
// For each candidate-job pair: final score + component breakdown + weight vector used
const jobFitnessDetailSchema = new mongoose.Schema({
    score: { type: Number, required: true },    // Final weighted fitness score (0.0–1.0)
    components: { type: componentBreakdownSchema },  // Individual component scores
    weights: { type: weightVectorSchema }          // BETA weights applied during this run
}, { _id: false });

// ─── Candidate Breakdown Entry ───
// Full analysis of one candidate across all jobs in this advertisement
const candidateBreakdownEntrySchema = new mongoose.Schema({
    name: { type: String, required: true },          // Candidate's full name (denormalized)
    jobs: { type: Map, of: jobFitnessDetailSchema }  // Map<jobId, fitnessDetail>
}, { _id: false });

// ─── Allocation Entry ───
// One candidate successfully allocated to a job vacancy
const allocationEntrySchema = new mongoose.Schema({
    candidateId: { type: String, required: true },  // User ObjectId as string
    name: { type: String },                   // Candidate name (denormalized)
    fitnessScore: { type: Number, required: true }   // Score at time of allocation (0.0–1.0)
}, { _id: false });

// ─── Analytics Sub-Schema ───
// Aggregate intelligence metrics for this fitness run
const analyticsSchema = new mongoose.Schema({
    totalCandidates: { type: Number, default: 0 },  // Total candidates evaluated
    totalJobs: { type: Number, default: 0 },  // Total jobs in this advertisement
    totalOpenings: { type: Number, default: 0 },  // Sum of all job openings
    totalAllocated: { type: Number, default: 0 },  // Candidates successfully placed
    unallocatedCount: { type: Number, default: 0 },  // Candidates not placed
    disqualifiedCount: { type: Number, default: 0 },  // Below dynamic quality gate
    outcompetedCount: { type: Number, default: 0 },  // Qualified but no vacancy left
    averageFitness: { type: Number, default: 0 },  // Mean fitness across all pairs
    maxFitness: { type: Number, default: 0 },  // Highest individual fitness score
    minFitness: { type: Number, default: 0 },  // Lowest individual fitness score
    fillRate: { type: Number, default: 0 },  // (totalAllocated / totalOpenings) * 100
    dynamicThreshold: { type: Number, default: 0 }   // Self-adjusting quality gate threshold
}, { _id: false });

// ─── Audit Trail Sub-Schema ───
// Who processed this, when, with what engine, and in which batch
const auditSchema = new mongoose.Schema({
    processedAt: {
        type: Date,
        default: Date.now
    },
    processedBy: {                                     // Admin who triggered this analysis
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    engineVersion: {                                   // VatsAi engine version used
        type: String,
        default: '1.1.0-fitness-optimized'
    },
    batchId: {                                         // Groups records saved in the same batch operation
        type: String,
        default: null
    },
    trainingTriggered: {                               // Whether AI self-learning was fired after this save
        type: Boolean,
        default: false
    }
}, { _id: false });

// ═══════════════════════════════════════════════════════════════════
// ─── MAIN SCHEMA: FitnessAllocation ───
// Stores the complete output of one VatsAi Fitness & Allocation run
// for a specific Advertisement + Merit List pair.
// ═══════════════════════════════════════════════════════════════════
const fitnessAllocationSchema = new mongoose.Schema({

    // ── Identity ──
    advertisementId: {                                 // Which advertisement this analysis is for
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Advertisement',
        required: true
    },
    meritListId: {                                     // Which merit list (FinalMerit) was used
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FinalMerit',
        required: true
    },

    // ── Denormalized Titles (for fast display without populate) ──
    advertisementTitle: { type: String, default: '' }, // e.g. "Advt No. 01/2026"
    jobTitle: { type: String, default: '' }, // e.g. "Assistant Engineer"

    // ── Core Data ──
    fitnessMatrix: {                                   // Cross-fitness matrix: { jobId: { candidateId: score } }
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    candidateBreakdowns: {                             // Deep per-candidate analysis: { candidateId: breakdownEntry }
        type: Map,
        of: candidateBreakdownEntrySchema
    },
    allocation: {                                      // Final greedy allocation: { jobId: [allocationEntry] }
        type: Map,
        of: [allocationEntrySchema]
    },

    // ── Intelligence Metrics ──
    analytics: analyticsSchema,

    // ── Audit Trail ──
    audit: auditSchema,

    // ── AI Training ──
    aiTraining: {                                       // Track autonomous session details
        beforeWeights: weightVectorSchema,
        afterWeights: weightVectorSchema,
        samplesUsed: { type: Number, default: 0 }
    }

}, {
    timestamps: true,                                  // Adds createdAt, updatedAt automatically
    collection: 'fitnessallocations'
});

// ── Unique Compound Index ──
// Prevents duplicate records for the same advertisement + merit list pair
fitnessAllocationSchema.index({ advertisementId: 1, meritListId: 1 }, { unique: true });

module.exports = mongoose.model('FitnessAllocation', fitnessAllocationSchema);
