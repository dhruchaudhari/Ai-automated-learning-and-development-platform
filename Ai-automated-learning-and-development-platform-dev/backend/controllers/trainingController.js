const { spawn } = require('child_process');
const path = require('path');
const FitnessAllocation = require('../models/FitnessAllocation');

/**
 * Internal function to trigger VatsAi Self-Learning / Training
 * Can be called programmatically (e.g., after a save) or via controller.
 */
const runTrainingInternally = async () => {
    try {
        console.log('[AI Training] Autonomous session starting...');

        // 1. Fetch historical fitness allocations (consummations)
        const history = await FitnessAllocation.find().limit(100).sort({ createdAt: -1 });

        if (history.length === 0) {
            console.log('[AI Training] Insufficient historical data. Skipping.');
            return { success: false, message: 'Insufficient data' };
        }

        // 2. Prepare training records
        const trainingRecords = [];
        history.forEach(record => {
            // CRITICAL: Flatten Maps for iteration
            const doc = record.toObject({ flattenMaps: true });
            const { candidateBreakdowns, allocation } = doc;
            const hiredSet = new Set();

            if (allocation) {
                // allocation is a Map<jobId, [allocationEntry]> - now a plain object after flattenMaps
                Object.values(allocation).forEach(jobAllocations => {
                    if (Array.isArray(jobAllocations)) {
                        jobAllocations.forEach(a => hiredSet.add(a.candidateId));
                    }
                });
            }

            if (candidateBreakdowns) {
                // candidateBreakdowns is a Map<candidateId, breakdownEntry> - plain object now
                Object.entries(candidateBreakdowns).forEach(([cid, data]) => {
                    // Extract job components. Usually there is one main job or we take the first.
                    const jobsEntries = Object.values(data.jobs || {});
                    const jobDetails = jobsEntries[0];
                    if (jobDetails && jobDetails.components) {
                        trainingRecords.push({
                            components: {
                                CSF: jobDetails.components.CSF || 0,
                                SEA: jobDetails.components.SEA || 0,
                                SFMC: jobDetails.components.SFMC || 0,
                                EGC: jobDetails.components.EGC || 0,
                                IM: jobDetails.components.IM || 0
                            },
                            score: jobDetails.score,
                            hired: hiredSet.has(cid)
                        });
                    }
                });
            }
        });

        if (trainingRecords.length === 0) {
            console.log('[AI Training] No valid samples found. Skipping.');
            return { success: false, message: 'No valid samples' };
        }

        // 3. Initiate Python Training Script
        return new Promise((resolve, reject) => {
            const scriptPath = path.join(__dirname, '../../vatsAi/fitness/learning/train_weights.py');
            const pythonProcess = spawn('python', [scriptPath]);

            let outputData = '';
            let errorData = '';

            pythonProcess.stdout.on('data', (data) => outputData += data.toString());
            pythonProcess.stderr.on('data', (data) => errorData += data.toString());

            pythonProcess.on('close', async (code) => {
                if (code !== 0) {
                    console.error(`[AI Training] Error (code ${code}):`, errorData);
                    return resolve({ success: false, error: errorData });
                }

                try {
                    const result = JSON.parse(outputData);

                    if (result.success && history.length > 0) {
                        // Update the most recent record with training results
                        const latestRecord = history[0];

                        const before = result.old_weights;
                        const after = result.new_weights;

                        // Utility to map array to schema object
                        const toWeightObj = (arr) => ({
                            CSF: arr[0], SEA: arr[1], SFMC: arr[2], EGC: arr[3], IM: arr[4]
                        });

                        latestRecord.aiTraining = {
                            beforeWeights: toWeightObj(before),
                            afterWeights: toWeightObj(after),
                            samplesUsed: trainingRecords.length
                        };
                        latestRecord.audit.trainingTriggered = true;
                        await latestRecord.save();

                        console.log('[AI Training] Successfully updated weights and recorded to model');
                    }

                    console.log('[AI Training] Weights update details:', result.message || 'Done');
                    resolve({ success: true, details: result });
                } catch (err) {
                    console.error('[AI Training] Parse/Update error:', err);
                    resolve({ success: false, error: err.message });
                }
            });

            pythonProcess.stdin.write(JSON.stringify(trainingRecords));
            pythonProcess.stdin.end();
        });

    } catch (err) {
        console.error('[AI Training] Internal error:', err);
        return { success: false, error: err.message };
    }
};

/**
 * Controller to manually trigger VatsAi Training (Admin Only)
 */
exports.trainAi = async (req, res) => {
    const result = await runTrainingInternally();
    if (result.success) {
        res.json({
            success: true,
            message: 'VatsAi Training Session Completed Successfully',
            details: result.details
        });
    } else {
        res.status(500).json({
            success: false,
            message: result.message || 'AI Training failed',
            error: result.error
        });
    }
};

// Export internal function for use in other routes (e.g., after save)
exports.runTrainingInternally = runTrainingInternally;
