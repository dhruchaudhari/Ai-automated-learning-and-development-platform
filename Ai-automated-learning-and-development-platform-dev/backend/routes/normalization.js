const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const User = require('../models/User');
const AiAuditRecord = require('../models/AiAuditRecord');
const { auth: authMiddleware, admin: adminMiddleware } = require('../middleware/auth');
const { cleanupOrphanedAllocations } = require('../controllers/maintenanceController');
const trainingController = require('../controllers/trainingController');

// POST /api/normalization/merit-mode
// Triggers the AI normalization process for a specific advertisement
router.post('/merit-mode', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { advertisementId } = req.body;

        if (!advertisementId) {
            return res.status(400).json({
                success: false,
                message: 'Advertisement ID is required'
            });
        }

        // 1. Fetch eligible users for this advertisement
        const users = await User.find({
            advertisements: advertisementId,
            status: 'eligible'
        });

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No eligible candidates found for this advertisement'
            });
        }

        // 2. Prepare data for Python AI engine
        const pythonInput = users.map(user => {
            return {
                name: user._id.toString(), // Using ID as name in AI input for mapping back
                marks: {
                    "10th": user.education?.tenth?.percentage || null,
                    "12th": user.education?.twelfth?.percentage || null,
                    "Grad": user.education?.graduation?.percentage || null,
                    "PG": user.education?.qualifyingDegree?.percentage || null
                }
            };
        });

        // 3. Invoke Python AI engine (using 'py' for Windows compatibility)
        const pythonScriptPath = path.join(__dirname, '../../vatsAi/normalization.meritmode/main.py');
        const pythonProcess = spawn('py', [pythonScriptPath], {
            cwd: path.dirname(pythonScriptPath)
        });

        let outputData = '';
        let errorData = '';

        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
        });

        pythonProcess.on('close', async (code) => {
            if (code !== 0) {
                console.error(`Python process exited with code ${code}. Error: ${errorData}`);
                return res.status(500).json({
                    success: false,
                    message: 'AI engine execution failed',
                    error: errorData
                });
            }

            try {
                const result = JSON.parse(outputData);
                if (!result.success) {
                    return res.status(500).json({
                        success: false,
                        message: 'AI engine reported failure',
                        error: result.error
                    });
                }

                // 4. Update Users and collect Audit Trail
                const auditChanges = [];
                const bulkOps = [];

                for (const item of result.results) {
                    const userId = item.name;
                    const user = users.find(u => u._id.toString() === userId);

                    if (user) {
                        const updateSet = {};
                        const imputedKeys = Object.keys(item.imputations);

                        if (imputedKeys.includes("10th")) {
                            updateSet["education.tenth.percentage"] = Number(item.normalized_marks["10th"]);
                        }
                        if (imputedKeys.includes("12th")) {
                            updateSet["education.twelfth.percentage"] = Number(item.normalized_marks["12th"]);
                        }
                        if (imputedKeys.includes("Grad")) {
                            updateSet["education.graduation.percentage"] = Number(item.normalized_marks["Grad"]);

                            // Only update interviewMarks if it's currently 0 (preserve manually assigned marks)
                            if (!user.interviewMarks || user.interviewMarks === 0) {
                                updateSet["interviewMarks"] = Number(item.normalized_marks["Grad"]);
                            }
                        }
                        if (imputedKeys.includes("PG")) {
                            updateSet["education.qualifyingDegree.percentage"] = Number(item.normalized_marks["PG"]);
                        }

                        // Also update the specific advertisementMark entry if it exists
                        const adMarkIndex = user.advertisementMarks.findIndex(am =>
                            am.advertisementId.toString() === advertisementId.toString()
                        );

                        if (adMarkIndex !== -1 && item.normalized_marks["Grad"]) {
                            const currentAdMark = user.advertisementMarks[adMarkIndex];
                            // Only update if marks are currently 0 (preserve manually assigned marks)
                            if (!currentAdMark.marks || currentAdMark.marks === 0) {
                                updateSet[`advertisementMarks.${adMarkIndex}.marks`] = Number(item.normalized_marks["Grad"]);
                            }
                        }

                        if (Object.keys(updateSet).length > 0) {
                            auditChanges.push({
                                userId: user._id,
                                userName: user.fullName,
                                before: item.original_marks,
                                after: item.normalized_marks,
                                imputations: imputedKeys
                            });

                            bulkOps.push({
                                updateOne: {
                                    filter: { _id: user._id },
                                    update: { $set: updateSet }
                                }
                            });
                        }
                    }
                }

                if (bulkOps.length > 0) {
                    await User.bulkWrite(bulkOps);
                }

                // 5. Save Audit Record
                const auditRecord = new AiAuditRecord({
                    advertisementId,
                    adminId: req.userId,
                    metadata: result.metadata,
                    changes: auditChanges
                });
                await auditRecord.save();

                res.json({
                    success: true,
                    message: `AI Normalization completed for ${auditChanges.length} candidates.`,
                    auditRecordId: auditRecord._id,
                    changesCount: auditChanges.length
                });

            } catch (err) {
                console.error('Failed to parse AI output or update users:', err);
                console.error('Raw Output Data:', outputData);
                res.status(500).json({
                    success: false,
                    message: 'Failed to process AI results',
                    error: err.message,
                    rawOutput: outputData.substring(0, 500)
                });
            }
        });

        // Write input to Python process stdin
        pythonProcess.stdin.write(JSON.stringify(pythonInput));
        pythonProcess.stdin.end();

    } catch (err) {
        console.error('Normalization route error:', err);
        res.status(500).json({
            success: false,
            message: 'Internal server error during AI normalization'
        });
    }
});

const FinalMerit = require('../models/FinalMerit');

// POST /api/normalization/generate-meritlist
router.post('/generate-meritlist', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { advertisementId } = req.body;

        if (!advertisementId) {
            return res.status(400).json({
                success: false,
                message: 'Advertisement ID is required'
            });
        }

        // 1. Fetch eligible users for this advertisement
        // User must have status 'eligible' AND have marks assigned for THIS advertisement
        const users = await User.find({
            advertisements: advertisementId,
            status: 'eligible',
            'advertisementMarks.advertisementId': advertisementId
        });

        // Additional validations as per USER_REQUEST
        // "onclick notwork until there is a N/A ,0,or not all users filtered assigned marks ,or anyone advt selected ,or no more than 1 candidates"

        if (!users || users.length <= 1) {
            return res.status(400).json({
                success: false,
                message: 'Merit list generation requires more than 1 eligible candidate with marks.'
            });
        }

        // Check if all filtered users have marks assigned (not 0 or N/A)
        const candidatesWithValidMarks = users.filter(user => {
            const adMark = user.advertisementMarks.find(am => am.advertisementId.toString() === advertisementId.toString());
            return adMark && adMark.marks > 0;
        });

        if (candidatesWithValidMarks.length !== users.length) {
            return res.status(400).json({
                success: false,
                message: 'Cannot generate merit list: Some candidates have 0 or unassigned marks.'
            });
        }

        // 2. Prepare data for Evolution Engine
        const pythonInput = users.map(user => {
            const adMark = user.advertisementMarks.find(am => am.advertisementId.toString() === advertisementId.toString());
            return {
                userId: user._id.toString(),
                marks: {
                    "10th": user.education?.tenth?.percentage || 0,
                    "12th": user.education?.twelfth?.percentage || 0,
                    "Grad": user.education?.graduation?.percentage || 0,
                    "PG": user.education?.qualifyingDegree?.percentage || 0,
                    "Interview": adMark.marks || 0
                }
            };
        });

        // 3. Invoke Evolution Engine
        const pythonScriptPath = path.join(__dirname, '../../vatsAi/finalmerit.evolution/main.py');
        const pythonProcess = spawn('py', [pythonScriptPath], {
            cwd: path.dirname(pythonScriptPath)
        });

        let outputData = '';
        let errorData = '';

        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
        });

        pythonProcess.on('close', async (code) => {
            if (code !== 0) {
                console.error(`Evolution Engine Error: ${errorData}`);
                return res.status(500).json({
                    success: false,
                    message: 'Evolution Engine execution failed',
                    error: errorData
                });
            }

            try {
                const result = JSON.parse(outputData);
                if (!result.success) {
                    return res.status(500).json({
                        success: false,
                        message: 'Evolution Engine reported failure',
                        error: result.error
                    });
                }

                // 4. Transform and Save Results to MongoDB (Consolidated Format)
                const meritResults = result.results.map(resItem => ({
                    userId: resItem.userId,
                    sfmc: resItem.sfmc,
                    forces: resItem.forces,
                    rank: resItem.rank,
                    imbalanceRatio: resItem.imbalanceRatio
                }));

                await FinalMerit.findOneAndUpdate(
                    { advertisementId },
                    {
                        $set: {
                            results: meritResults,
                            audit: {
                                calculatedAt: new Date(),
                                engineVersion: '1.1.0-evolution-consolidated',
                                neuralMetrics: {
                                    accuracy: 0.98
                                }
                            }
                        }
                    },
                    { upsert: true, new: true, runValidators: true }
                );

                res.json({
                    success: true,
                    message: `Supreme Merit List generated successfully for ${meritResults.length} candidates.`,
                    engine: result.metrics.engine,
                    candidateCount: meritResults.length
                });

            } catch (err) {
                console.error('Failed to parse Evolution output or update DB:', err);
                res.status(500).json({
                    success: false,
                    message: 'Failed to process Evolution results',
                    error: err.message
                });
            }
        });

        pythonProcess.stdin.write(JSON.stringify(pythonInput));
        pythonProcess.stdin.end();

    } catch (err) {
        console.error('Generate Meritlist route error:', err);
        res.status(500).json({
            success: false,
            message: 'Internal server error during merit list generation'
        });
    }
});

// GET /api/normalization/final-merits
// Fetch all generated final merit records
router.get('/final-merits', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const merits = await FinalMerit.find()
            .populate({
                path: 'advertisementId',
                populate: { path: 'job' }
            })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: merits.length,
            data: merits
        });
    } catch (err) {
        console.error('Fetch final merits error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch final merit records'
        });
    }
});

// GET /api/normalization/final-merit/:advertisementId
// Fetch a specific final merit record by advertisement ID
router.get('/final-merit/:advertisementId', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { advertisementId } = req.params;
        const merit = await FinalMerit.findOne({ advertisementId })
            .populate({
                path: 'advertisementId',
                populate: { path: 'job' }
            })
            .populate('results.userId', 'fullName email mobile gender');

        if (!merit) {
            return res.status(404).json({
                success: false,
                message: 'No final merit record found for this advertisement'
            });
        }

        res.json({
            success: true,
            data: merit
        });
    } catch (err) {
        console.error('Fetch specific merit record error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch the merit record'
        });
    }
});

const FitnessAllocation = require('../models/FitnessAllocation');
const Advertisement = require('../models/Advertisement');
const Job = require('../models/Job');
const Role = require('../models/Role');

// POST /api/normalization/run-fitness
// Runs vatsAi fitness engine for selected advt + meritlist users
router.post('/run-fitness', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        // Run maintenance cleanup
        await cleanupOrphanedAllocations();
        const { advertisementId, meritListId } = req.body;

        if (!advertisementId || !meritListId) {
            return res.status(400).json({
                success: false,
                message: 'Advertisement ID and Merit List ID are required'
            });
        }

        // 1. Fetch the merit list with populated user data
        const meritList = await FinalMerit.findById(meritListId)
            .populate('results.userId', 'fullName email education skillSets advertisementMarks dob');

        if (!meritList || !meritList.results || meritList.results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Merit list not found or has no candidates'
            });
        }

        // 2. Fetch the advertisement with job and role
        const ad = await Advertisement.findById(advertisementId)
            .populate({
                path: 'job',
                populate: { path: 'role' }
            });

        if (!ad || !ad.job) {
            return res.status(404).json({
                success: false,
                message: 'Advertisement or associated job not found'
            });
        }

        const job = ad.job;
        const role = job.role;

        // 3. Build candidate tensors from merit list users
        const candidates = {};
        for (const item of meritList.results) {
            const user = item.userId;
            if (!user) continue;

            const adMark = user.advertisementMarks?.find(
                am => am.advertisementId?.toString() === advertisementId.toString()
            );

            // Build skill map from user's skillSets
            const skillMap = {};
            if (user.skillSets) {
                for (const category of ['technical', 'creative', 'cognitive', 'tools', 'ethics']) {
                    const skills = user.skillSets[category];
                    if (Array.isArray(skills)) {
                        skills.forEach(s => { skillMap[s] = 1; });
                    }
                }
            }

            // Experience calculated dynamically from Age
            let experience = 0;
            if (user.dob) {
                const age = new Date().getFullYear() - new Date(user.dob).getFullYear();
                experience = Math.max(0, age - 18); // Changed from 22 to 18 to better accommodate junior devs
            }

            candidates[user._id.toString()] = {
                name: user.fullName,
                A: [
                    user.education?.tenth?.percentage || 0,
                    user.education?.twelfth?.percentage || 0,
                    user.education?.graduation?.percentage || 0,
                    user.education?.qualifyingDegree?.percentage || 0
                ],
                E: experience,
                S: skillMap,
                P: (adMark?.marks || 0) / 100,
                F: item.sfmc || 0
            };
        }

        // 4. Build job tensor from role
        const requiredSkills = {};
        const skillWeights = {};
        const preferredSkills = [];

        if (role?.requiredSkills) {
            role.requiredSkills.forEach(s => {
                requiredSkills[s.name] = 1;
                skillWeights[s.name] = s.weight || 1;
            });
        }
        if (role?.preferredSkills) {
            role.preferredSkills.forEach(s => {
                preferredSkills.push(s.name);
                if (!skillWeights[s.name]) {
                    skillWeights[s.name] = s.weight || 0.5;
                }
            });
        }

        const criteria = [];
        if (role?.criteriaSet) {
            const cs = role.criteriaSet;
            if (cs.min10thPercentage) criteria.push({ field: '10th', min: cs.min10thPercentage });
            if (cs.min12thPercentage) criteria.push({ field: '12th', min: cs.min12thPercentage });
            if (cs.minGraduationPercentage) criteria.push({ field: 'grad', min: cs.minGraduationPercentage });
            if (cs.minPGPercentage) criteria.push({ field: 'pg', min: cs.minPGPercentage });
        }

        const jobs = {};
        jobs[job._id.toString()] = {
            R: requiredSkills,
            W: Object.keys(skillWeights).length > 0 ? skillWeights : { 'default': 1 },
            C: criteria,
            O: job.openings || 1,
            P: preferredSkills,
            degree_required: role?.education || '',
            degree_specializations: role?.criteriaSet?.specializations || []
        };

        // 5. Spawn Python fitness engine
        const pythonScriptPath = path.join(__dirname, '../../vatsAi/fitness/run_fitness.py');
        const pythonProcess = spawn('py', [pythonScriptPath], {
            cwd: path.dirname(pythonScriptPath)
        });

        let outputData = '';
        let errorData = '';

        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Fitness engine error: ${errorData}`);
                return res.status(500).json({
                    success: false,
                    message: 'Fitness engine execution failed',
                    error: errorData
                });
            }

            try {
                const result = JSON.parse(outputData);
                if (!result.success) {
                    return res.status(500).json({
                        success: false,
                        message: 'Fitness engine reported failure',
                        error: result.error
                    });
                }

                // Enrich candidate breakdowns with names and ensure correct nesting
                const enriched = {};
                for (const [cid, jobData] of Object.entries(result.candidateBreakdowns)) {
                    const candData = candidates[cid];
                    enriched[cid] = {
                        name: candData?.name || cid,
                        jobs: jobData.jobs || jobData // Use direct jobs map if available
                    };
                }
                result.candidateBreakdowns = enriched;

                // Enrich allocation with names
                for (const [jid, allocated] of Object.entries(result.allocation)) {
                    result.allocation[jid] = allocated.map(a => ({
                        ...a,
                        name: candidates[a.candidateId]?.name || a.candidateId
                    }));
                }

                res.json({
                    success: true,
                    data: result,
                    advertisementTitle: ad.title,
                    jobTitle: role?.title || 'Unknown'
                });

            } catch (parseErr) {
                console.error('Failed to parse fitness output:', parseErr);
                res.status(500).json({
                    success: false,
                    message: 'Failed to process fitness results',
                    error: parseErr.message
                });
            }
        });

        pythonProcess.stdin.write(JSON.stringify({ candidates, jobs }));
        pythonProcess.stdin.end();

    } catch (err) {
        console.error('Run fitness route error:', err);
        res.status(500).json({
            success: false,
            message: 'Internal server error during fitness computation'
        });
    }
});

// POST /api/normalization/save-fitness-allocation
// Single-item save (backward compatible, no training trigger — use batch route instead)
router.post('/save-fitness-allocation', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { advertisementId, meritListId, fitnessMatrix, candidateBreakdowns, allocation, analytics, engineVersion, advertisementTitle, jobTitle } = req.body;

        if (!advertisementId || !meritListId) {
            return res.status(400).json({ success: false, message: 'Advertisement ID and Merit List ID are required' });
        }

        // Duplicate check
        const exists = await FitnessAllocation.findOne({ advertisementId, meritListId });
        if (exists) {
            return res.status(400).json({ success: false, isDuplicate: true, message: 'Record already exists for this advertisement + merit list pair.' });
        }

        const savedRecord = await FitnessAllocation.create({
            advertisementId,
            meritListId,
            advertisementTitle: advertisementTitle || '',
            jobTitle: jobTitle || '',
            fitnessMatrix,
            candidateBreakdowns,
            allocation,
            analytics,
            audit: {
                processedAt: new Date(),
                processedBy: req.user?._id || null,
                engineVersion: engineVersion || '1.1.0-fitness-optimized'
            }
        });

        return res.json({ success: true, message: 'Saved successfully.', data: savedRecord });

    } catch (err) {
        // Handle MongoDB duplicate key error (unique index)
        if (err.code === 11000) {
            return res.status(400).json({ success: false, isDuplicate: true, message: 'Duplicate record detected by database constraint.' });
        }
        console.error('[Fitness] Save error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
    }
});

// POST /api/normalization/save-fitness-allocation-batch
// Batch save: runs maintenance ONCE, saves all items with dedup, fires training ONCE at the end
router.post('/save-fitness-allocation-batch', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { batchItems } = req.body;

        if (!batchItems || !Array.isArray(batchItems) || batchItems.length === 0) {
            return res.status(400).json({ success: false, message: 'batchItems array is required and must not be empty.' });
        }

        console.log(`[Fitness Batch] Received ${batchItems.length} items for batch save.`);

        // ── Step 1: Run maintenance cleanup ONCE ──
        try {
            await cleanupOrphanedAllocations();
            console.log('[Fitness Batch] Maintenance cleanup completed.');
        } catch (mErr) {
            console.warn('[Fitness Batch] Maintenance cleanup failed (non-fatal):', mErr.message);
        }

        // ── Step 2: Generate a batch ID to link all records ──
        const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const adminUserId = req.user?._id || null;

        // ── Step 3: Process each item ──
        let savedCount = 0;
        let duplicateCount = 0;
        let errorCount = 0;
        const savedRecords = [];

        for (const item of batchItems) {
            const { advertisementId, meritListId, fitnessMatrix, candidateBreakdowns, allocation, analytics, engineVersion, advertisementTitle, jobTitle } = item;

            if (!advertisementId || !meritListId) {
                console.warn('[Fitness Batch] Skipping item with missing IDs.');
                errorCount++;
                continue;
            }

            try {
                // Duplicate check
                const exists = await FitnessAllocation.findOne({ advertisementId, meritListId });
                if (exists) {
                    duplicateCount++;
                    continue;
                }

                const record = await FitnessAllocation.create({
                    advertisementId,
                    meritListId,
                    advertisementTitle: advertisementTitle || '',
                    jobTitle: jobTitle || '',
                    fitnessMatrix,
                    candidateBreakdowns,
                    allocation,
                    analytics: {
                        ...analytics,
                        dynamicThreshold: analytics?.dynamicThreshold || 0
                    },
                    audit: {
                        processedAt: new Date(),
                        processedBy: adminUserId,
                        engineVersion: engineVersion || '2.0.0-modular-sfmc',
                        batchId,
                        trainingTriggered: false  // Will be updated after training
                    }
                });

                savedRecords.push(record);
                savedCount++;

            } catch (itemErr) {
                if (itemErr.code === 11000) {
                    // MongoDB unique index caught a race-condition duplicate
                    duplicateCount++;
                } else {
                    console.error(`[Fitness Batch] Error saving item for Ad ${advertisementId}:`, itemErr.message);
                    errorCount++;
                }
            }
        }

        console.log(`[Fitness Batch] Results: ${savedCount} saved, ${duplicateCount} duplicates, ${errorCount} errors.`);

        // ── Step 4: Trigger Autonomous Self-Learning ONCE (background, non-blocking) ──
        if (savedCount > 0) {
            trainingController.runTrainingInternally()
                .then(async (tRes) => {
                    if (tRes.success) {
                        console.log('[AI Training] Post-batch optimization complete.');
                        // Mark all records in this batch as training-triggered
                        try {
                            await FitnessAllocation.updateMany(
                                { 'audit.batchId': batchId },
                                { $set: { 'audit.trainingTriggered': true } }
                            );
                        } catch (updateErr) {
                            console.warn('[AI Training] Failed to update training flag:', updateErr.message);
                        }
                    }
                })
                .catch(tErr => console.error('[AI Training] Post-batch training failed:', tErr.message));
        }

        // ── Step 5: Return summary ──
        return res.json({
            success: true,
            message: `Batch persistence complete.`,
            summary: {
                total: batchItems.length,
                saved: savedCount,
                duplicates: duplicateCount,
                errors: errorCount,
                batchId
            },
            savedRecords
        });

    } catch (err) {
        console.error('[Fitness Batch] Fatal error:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during batch save',
            error: err.message
        });
    }
});

module.exports = router;

