const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const User = require('../models/User');
const AiAuditRecord = require('../models/AiAuditRecord');
const { auth: authMiddleware, admin: adminMiddleware } = require('../middleware/auth');

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

module.exports = router;
