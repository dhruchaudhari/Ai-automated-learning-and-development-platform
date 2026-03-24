/**
 * controllers/fitnesstfidfController.js
 * Business logic for Fitness TF-IDF: bulk upload + AI compute, fetch results, clear.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const FitnessTfidf = require('../models/FitnessTfidf');
const Job = require('../models/Job');
const Role = require('../models/Role');
const Department = require('../models/Department');

/**
 * Upload bulk PDFs and compute TF-IDF fitness against all jobs.
 */
const uploadAndCompute = async (req, res) => {
    try {
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No PDF files uploaded',
            });
        }

        // ── 1. Fetch all Jobs with populated Role + Department ──
        const jobs = await Job.find()
            .populate({
                path: 'role',
                populate: { path: 'department' },
            })
            .populate('department');

        if (!jobs || jobs.length === 0) {
            // Clean up uploaded files if no jobs exist
            files.forEach(f => {
                try { fs.unlinkSync(f.path); } catch (_) { /* noop */ }
            });
            return res.status(404).json({
                success: false,
                message: 'No jobs found in the system. Please create jobs first.',
            });
        }

        // ── 2. Build job tensor for Python engine ──
        const jobTensor = {};
        for (const job of jobs) {
            const role = job.role;
            const dept = job.department || role?.department;

            const requiredSkills = (role?.requiredSkills || []).map(s => s.name);
            const preferredSkills = (role?.preferredSkills || []).map(s => s.name);

            jobTensor[job._id.toString()] = {
                title: role?.title || job.jobCode || '',
                jobCode: job.jobCode || '',
                description: role?.description || job.description || '',
                requiredSkills,
                preferredSkills,
                minimumExperience: role?.criteriaSet?.minimumExperience || 0,
                education: role?.education || '',
                specializations: role?.criteriaSet?.specializations || [],
                departmentName: dept?.name || '',
                roleTitle: role?.title || '',
            };
        }

        // ── 3. Collect file paths ──
        const resumePaths = files.map(f => f.path.replace(/\\/g, '/'));

        // ── 4. Spawn Python TF-IDF engine ──
        const pythonScriptPath = path.join(
            __dirname,
            '../../vatsAi/fitness.tfidf/main.py'
        );
        const pythonProcess = spawn('py', [pythonScriptPath], {
            cwd: path.dirname(pythonScriptPath),
        });

        let outputData = '';
        let errorData = '';

        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
            // stderr is used for progress logs, not errors
            console.log('[TF-IDF Engine]', data.toString().trim());
        });

        pythonProcess.on('error', (err) => {
            console.error('[TF-IDF Engine] Failed to start Python process:', err);
            if (!res.headersSent) {
                return res.status(500).json({
                    success: false,
                    message: 'TF-IDF engine failed to start. Is Python installed?',
                    error: err.message,
                });
            }
        });

        pythonProcess.on('close', async (code) => {
            // REMOVED: Clean up uploaded files after processing
            // Resumes must persist for later viewing in the modal.
            // Cleanup now happens only in clearResults or deleteRecord.

            if (code !== 0 && !outputData) {
                console.error(`[TF-IDF] Python exited with code ${code}. Error: ${errorData}`);
                return res.status(500).json({
                    success: false,
                    message: 'TF-IDF engine execution failed',
                    error: errorData,
                });
            }

            try {
                const result = JSON.parse(outputData);

                if (!result.success) {
                    return res.status(500).json({
                        success: false,
                        message: 'TF-IDF engine reported failure',
                        error: result.error,
                    });
                }

                // ── 5. Save results to MongoDB ──
                const batchId = `tfidf_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
                const adminUserId = req.user?._id || null;

                const docsToSave = (result.results || []).map((r) => ({
                    resumeFile: r.resumeFile || 'unknown.pdf',
                    candidateName: r.candidateName || 'Unknown',
                    extractedData: r.extractedData || {},
                    fitnessByJob: r.fitnessByJob || {},
                    audit: {
                        processedAt: new Date(),
                        processedBy: adminUserId,
                        engineVersion: result.engineVersion || '1.0.0-tfidf-neural-reranker',
                        uploadBatchId: batchId,
                    },
                }));

                let savedCount = 0;
                const savedRecords = [];
                for (const doc of docsToSave) {
                    try {
                        const record = await FitnessTfidf.create(doc);
                        savedRecords.push(record);
                        savedCount++;
                    } catch (saveErr) {
                        console.error('[TF-IDF] Save error for', doc.resumeFile, ':', saveErr.message);
                    }
                }

                return res.json({
                    success: true,
                    message: `TF-IDF fitness computed for ${savedCount} resumes across ${jobs.length} jobs.`,
                    summary: {
                        totalResumes: files.length,
                        saved: savedCount,
                        totalJobs: jobs.length,
                        batchId,
                    },
                    engineMetrics: result.engineMetrics || {},
                    data: savedRecords,
                });
            } catch (parseErr) {
                console.error('[TF-IDF] Failed to parse engine output:', parseErr);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to process TF-IDF results',
                    error: parseErr.message,
                    rawOutput: outputData.substring(0, 500),
                });
            }
        });

        // Write input to Python process stdin
        const inputPayload = JSON.stringify({
            resume_paths: resumePaths,
            jobs: jobTensor,
        });
        pythonProcess.stdin.write(inputPayload);
        pythonProcess.stdin.end();

    } catch (err) {
        console.error('[TF-IDF] Upload and compute error:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during TF-IDF processing',
            error: err.message,
        });
    }
};

/**
 * Fetch all TF-IDF fitness results with optional filters.
 */
const getResults = async (req, res) => {
    try {
        const results = await FitnessTfidf.find()
            .sort({ createdAt: -1 })
            .lean();

        return res.json({
            success: true,
            count: results.length,
            data: results,
        });
    } catch (err) {
        console.error('[TF-IDF] Fetch results error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch TF-IDF results',
        });
    }
};

/**
 * Fetch TF-IDF fitness results for a specific Department Head
 */
const getDeptHeadResults = async (req, res) => {
    try {
        const { department } = req.query;
        if (!department) {
            return res.status(400).json({ success: false, message: 'Department is required' });
        }

        // Fetch all results, but filter them to only those that have a job fit for this department
        // that has status 'Sent' or 'Accepted' or 'Rejected'
        const results = await FitnessTfidf.find().sort({ createdAt: -1 }).lean();

        const filteredResults = [];
        for (const record of results) {
            if (!record.fitnessByJob) continue;

            const entries = record.fitnessByJob instanceof Map
                ? Array.from(record.fitnessByJob.entries())
                : Object.entries(record.fitnessByJob);

            let hasRelevantJob = false;
            for (const [jobId, jobFit] of entries) {
                if (jobFit.departmentName === department && ['Sent', 'Accepted', 'Rejected'].includes(jobFit.status)) {
                    hasRelevantJob = true;
                    break;
                }
            }
            if (hasRelevantJob) {
                filteredResults.push(record);
            }
        }

        return res.json({
            success: true,
            count: filteredResults.length,
            data: filteredResults,
        });
    } catch (err) {
        console.error('[TF-IDF] Fetch DeptHead results error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch DeptHead results',
        });
    }
};

/**
 * Clear all TF-IDF fitness results.
 */
const clearResults = async (req, res) => {
    try {
        // 1. Delete all physical files in the bulkresumes folder
        const directory = path.join(__dirname, '..', 'uploads', 'bulkresumes');
        if (fs.existsSync(directory)) {
            const files = fs.readdirSync(directory);
            for (const file of files) {
                try {
                    fs.unlinkSync(path.join(directory, file));
                } catch (err) {
                    console.error(`[TF-IDF] Failed to delete file ${file}:`, err);
                }
            }
        }

        // 2. Delete all records from MongoDB
        const deleteResult = await FitnessTfidf.deleteMany({});
        return res.json({
            success: true,
            message: `Cleared ${deleteResult.deletedCount} TF-IDF fitness records and associated files.`,
            deletedCount: deleteResult.deletedCount,
        });
    } catch (err) {
        console.error('[TF-IDF] Clear results error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to clear TF-IDF results',
        });
    }
};

/**
 * Delete a single TF-IDF fitness record.
 */
const deleteRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await FitnessTfidf.findById(id);

        if (record && record.resumeFile) {
            // Delete physical file
            const filePath = path.join(__dirname, '..', 'uploads', 'bulkresumes', record.resumeFile);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (unlinkErr) {
                    console.error(`[TF-IDF] Failed to delete file ${record.resumeFile}:`, unlinkErr);
                }
            }
        }

        const result = await FitnessTfidf.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Record not found' });
        }

        return res.json({
            success: true,
            message: 'Fitness record removed successfully.',
            id
        });
    } catch (err) {
        console.error('[TF-IDF] Delete record error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete TF-IDF record',
        });
    }
};

/**
 * Send a fitness record to DeptHead for a SPECIFIC job match (Updates status).
 */
const sendToDeptHead = async (req, res) => {
    try {
        const { id, jobId } = req.params;
        const record = await FitnessTfidf.findById(id);

        if (!record || !record.fitnessByJob || !record.fitnessByJob.has(jobId)) {
            return res.status(404).json({ success: false, message: 'Record or job match not found' });
        }

        const jobFit = record.fitnessByJob.get(jobId);
        jobFit.status = 'Sent';
        record.fitnessByJob.set(jobId, jobFit);
        await record.save();

        return res.json({
            success: true,
            message: 'Successfully sent to Department Head.',
            data: record
        });
    } catch (err) {
        console.error('[TF-IDF] Send to DeptHead error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to send record to Department Head',
        });
    }
};

/**
 * Accept a resume (Fulfills vacancy)
 */
const acceptResume = async (req, res) => {
    try {
        const { id, jobId } = req.params;
        const record = await FitnessTfidf.findById(id);

        if (!record || !record.fitnessByJob || !record.fitnessByJob.has(jobId)) {
            return res.status(404).json({ success: false, message: 'Record or job match not found' });
        }

        const jobFit = record.fitnessByJob.get(jobId);
        jobFit.status = 'Accepted';
        record.fitnessByJob.set(jobId, jobFit);
        await record.save();

        // Fulfill vacancy in Job collection
        const job = await Job.findOne({ jobCode: jobFit.jobCode });
        if (job) {
            // Ensure totalOpenings is initialized for legacy data
            if (!job.totalOpenings || job.totalOpenings === 0) {
                job.totalOpenings = job.openings;
            }

            if (job.openings > 0) {
                job.openings -= 1;
                await job.save();
            }
        }

        return res.json({ success: true, message: 'Resume accepted and vacancy fulfilled.', data: record });
    } catch (err) {
        console.error('[TF-IDF] Accept resume error:', err);
        return res.status(500).json({ success: false, message: 'Failed to accept resume' });
    }
};

/**
 * Reject a resume (Returns to admin)
 */
const rejectResume = async (req, res) => {
    try {
        const { id, jobId } = req.params;
        const { rejectedBy } = req.body;
        const record = await FitnessTfidf.findById(id);

        if (!record || !record.fitnessByJob || !record.fitnessByJob.has(jobId)) {
            return res.status(404).json({ success: false, message: 'Record or job match not found' });
        }

        const jobFit = record.fitnessByJob.get(jobId);
        jobFit.status = 'Rejected';
        jobFit.rejectedBy = rejectedBy || 'Department Head';
        record.fitnessByJob.set(jobId, jobFit);
        await record.save();

        return res.json({ success: true, message: 'Resume rejected.', data: record });
    } catch (err) {
        console.error('[TF-IDF] Reject resume error:', err);
        return res.status(500).json({ success: false, message: 'Failed to reject resume' });
    }
};

/**
 * Fetch live vacancies grouped by Department and Role
 */
const getLiveVacancies = async (req, res) => {
    try {
        const jobs = await Job.find().populate('role').populate('department');
        const vacancies = {};
        let totalUnfilled = 0;

        for (const job of jobs) {
            const deptName = job.department ? job.department.name : 'Unknown';
            const roleTitle = job.role ? job.role.title : (job.jobCode || 'Unknown');

            if (!vacancies[deptName]) vacancies[deptName] = {};
            if (!vacancies[deptName][roleTitle]) vacancies[deptName][roleTitle] = 0;

            vacancies[deptName][roleTitle] += job.openings;
            totalUnfilled += job.openings;
        }

        // Calculate filled vacancies from accepted resumes
        const tfidfRecords = await FitnessTfidf.find({}, 'fitnessByJob').lean();
        let totalFilled = 0;

        for (const record of tfidfRecords) {
            if (record.fitnessByJob) {
                const entries = Object.values(record.fitnessByJob);
                for (const jobFit of entries) {
                    if (jobFit.status === 'Accepted') {
                        totalFilled++;
                    }
                }
            }
        }

        return res.json({
            success: true,
            vacancies,
            totalUnfilled,
            totalFilled,
            totalVacancies: totalUnfilled + totalFilled
        });
    } catch (err) {
        console.error('[TF-IDF] Fetch live vacancies error:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch vacancies' });
    }
};

/**
 * Delete a specific job match from a TF-IDF fitness record.
 */
const deleteJobRecord = async (req, res) => {
    try {
        const { id, jobId } = req.params;
        const record = await FitnessTfidf.findById(id);

        if (!record) {
            return res.status(404).json({ success: false, message: 'Record not found' });
        }

        if (record.fitnessByJob && record.fitnessByJob.has(jobId)) {
            record.fitnessByJob.delete(jobId);

            // If the record has no more job fit matches, remove the entire candidate record
            if (record.fitnessByJob.size === 0) {
                if (record.resumeFile) {
                    const filePath = path.join(__dirname, '..', 'uploads', 'bulkresumes', record.resumeFile);
                    if (fs.existsSync(filePath)) {
                        try {
                            fs.unlinkSync(filePath);
                        } catch (err) {
                            console.error(`[TF-IDF] Cleanup failed for ${record.resumeFile}:`, err);
                        }
                    }
                }
                await FitnessTfidf.findByIdAndDelete(id);
                return res.json({
                    success: true,
                    message: 'Last fitness record removed; candidate deleted.',
                    deletedRecordId: id
                });
            }

            await record.save();
            return res.json({
                success: true,
                message: 'Specific fitness job match removed successfully.',
                id,
                jobId
            });
        }

        return res.status(404).json({ success: false, message: 'Job match not found in this record.' });
    } catch (err) {
        console.error('[TF-IDF] Delete job record error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete job fitness match',
        });
    }
};

/**
 * Bulk delete specific job matches from TF-IDF fitness records.
 */
const bulkDeleteJobRecords = async (req, res) => {
    try {
        const { selections } = req.body; // Array of { recordId, jobId }
        if (!selections || !Array.isArray(selections)) {
            return res.status(400).json({ success: false, message: 'Invalid selections' });
        }

        const groups = {};
        selections.forEach(item => {
            if (!groups[item.recordId]) groups[item.recordId] = [];
            groups[item.recordId].push(item.jobId);
        });

        let updatedCount = 0;
        let deletedCount = 0;

        for (const [recordId, jobIds] of Object.entries(groups)) {
            const record = await FitnessTfidf.findById(recordId);
            if (!record) continue;

            if (record.fitnessByJob) {
                jobIds.forEach(jid => record.fitnessByJob.delete(jid));

                if (record.fitnessByJob.size === 0) {
                    // Delete physical file
                    if (record.resumeFile) {
                        const filePath = path.join(__dirname, '..', 'uploads', 'bulkresumes', record.resumeFile);
                        if (fs.existsSync(filePath)) {
                            try { fs.unlinkSync(filePath); } catch (e) { }
                        }
                    }
                    await FitnessTfidf.findByIdAndDelete(recordId);
                    deletedCount++;
                } else {
                    await record.save();
                    updatedCount++;
                }
            }
        }

        return res.json({
            success: true,
            message: `Successfully processed deletions for ${selections.length} matches. ${deletedCount} candidates removed, ${updatedCount} candidates updated.`,
        });
    } catch (err) {
        console.error('[TF-IDF] Bulk delete error:', err);
        return res.status(500).json({ success: false, message: 'Failed to process bulk deletion' });
    }
};

/**
 * Serve a resume PDF file from the bulkresumes folder.
 */
const downloadResume = async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(__dirname, '..', 'uploads', 'bulkresumes', filename);

        if (fs.existsSync(filePath)) {
            // Set Content-Type correctly for PDF
            res.setHeader('Content-Type', 'application/pdf');
            // 'inline' will try to open in browser/iframe, 'attachment' would force download
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
            return res.sendFile(filePath);
        } else {
            return res.status(404).json({ success: false, message: 'Resume file not found' });
        }
    } catch (err) {
        console.error('[TF-IDF] Download error:', err);
        return res.status(500).json({ success: false, message: 'Server error retrieving file' });
    }
};

/**
 * Reset all accepted vacancies (Reverts 'Accepted' to 'Pending' and restores openings)
 */
const resetAllVacancies = async (req, res) => {
    try {
        const records = await FitnessTfidf.find({ fitnessByJob: { $exists: true } });
        let resetCount = 0;
        const jobCodesToReset = new Set();

        // 1. Revert statuses to Pending for all job matches
        for (const record of records) {
            let changed = false;

            // Reset top-level status if it was set
            if (record.status !== 'Pending') {
                record.status = 'Pending';
                changed = true;
            }

            for (const [jobId, jobFit] of record.fitnessByJob.entries()) {
                // Collect job codes for quota restoration
                if (jobFit.jobCode) {
                    jobCodesToReset.add(jobFit.jobCode);
                }

                // Count reset actions for the response message
                if (jobFit.status === 'Accepted' || jobFit.status === 'Sent' || jobFit.status === 'Sent to DeptHead') {
                    jobFit.status = 'Pending';
                    changed = true;
                    resetCount++;
                }

                if (changed) {
                    record.fitnessByJob.set(jobId, jobFit);
                }
            }

            if (changed) {
                record.markModified('fitnessByJob');
                await record.save();
            }
        }

        // 2. Restore all Job openings from totalOpenings
        const jobsToRestore = await Job.find({ jobCode: { $in: Array.from(jobCodesToReset) } });
        for (const job of jobsToRestore) {
            // Restore from totalOpenings if available, otherwise consider current openings as total
            if (job.totalOpenings && job.totalOpenings > 0) {
                job.openings = job.totalOpenings;
                await job.save();
            } else {
                // If totalOpenings is missing (legacy), set it now for future safety
                job.totalOpenings = job.openings;
                await job.save();
            }
        }

        return res.json({
            success: true,
            message: `Successfully reset ${resetCount} applications and restored openings for ${jobsToRestore.length} roles.`,
            resetCount
        });
    } catch (err) {
        console.error('[TF-IDF] Reset vacancies error:', err);
        return res.status(500).json({ success: false, message: 'Failed to reset vacancies' });
    }
};

module.exports = {
    uploadAndCompute,
    getResults,
    clearResults,
    deleteRecord,
    deleteJobRecord,
    sendToDeptHead,
    acceptResume,
    rejectResume,
    getLiveVacancies,
    getDeptHeadResults,
    downloadResume,
    bulkDeleteJobRecords,
    resetAllVacancies
};
