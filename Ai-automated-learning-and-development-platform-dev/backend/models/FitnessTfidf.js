const mongoose = require('mongoose');

// ─── Component Breakdown Sub-Schema ───
// Each fitness component is scored 0.0–1.0
const componentSchema = new mongoose.Schema({
    skillOverlap: { type: Number, default: 0 },   // AI Skill intersection ratio
    educationMatch: { type: Number, default: 0 },   // AI Degree / specialization alignment
}, { _id: false });

// ─── Per-Job Fitness Detail ───
const jobFitnessSchema = new mongoose.Schema({
    score: { type: Number, required: true },   // Neural re-ranker score 0.0–1.0
    components: { type: componentSchema },          // Individual signal scores
    jobCode: { type: String, default: '' },
    roleTitle: { type: String, default: '' },
    departmentName: { type: String, default: '' },

    // Delegation fields per job match
    status: { type: String, enum: ['Pending', 'Sent', 'Accepted', 'Rejected'], default: 'Pending' },
    rejectedBy: { type: String, default: null }
}, { _id: false });

// ─── Extracted Resume Data ───
const extractedDataSchema = new mongoose.Schema({
    skills: [{ type: String }],
    education: [{ type: String }],
    summary: { type: String, default: '' },

}, { _id: false });

// ─── Audit Sub-Schema ───
const auditSchema = new mongoose.Schema({
    processedAt: { type: Date, default: Date.now },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    engineVersion: { type: String, default: '1.0.0-tfidf-neural-reranker' },
    uploadBatchId: { type: String, default: null },
}, { _id: false });

// ═══════════════════════════════════════════════════════════════
// ─── MAIN SCHEMA: FitnessTfidf ───
// Stores TF-IDF fitness analysis for one uploaded resume
// across all jobs/roles/departments.
// ═══════════════════════════════════════════════════════════════
const fitnessTfidfSchema = new mongoose.Schema({

    resumeFile: { type: String, required: true },           // Original PDF filename
    candidateName: { type: String, default: 'Unknown' },       // Extracted candidate name

    extractedData: { type: extractedDataSchema },              // Parsed resume data

    fitnessByJob: { type: Map, of: jobFitnessSchema },        // Map<jobId, fitnessDetail>

    audit: { type: auditSchema },

    status: { type: String, enum: ['Pending', 'Sent to DeptHead'], default: 'Pending' },

}, {
    timestamps: true,
    collection: 'fitnesstfidfs',
});

// Index for fast lookups by batch
fitnessTfidfSchema.index({ 'audit.uploadBatchId': 1 });
fitnessTfidfSchema.index({ candidateName: 1 });

module.exports = mongoose.model('FitnessTfidf', fitnessTfidfSchema);
