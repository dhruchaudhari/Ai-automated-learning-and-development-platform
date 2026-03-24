/**
 * routes/fitnesstfidf.js
 * API routes for Fitness TF-IDF feature.
 *
 * POST /api/fitnesstfidf/upload   – Bulk upload PDFs + compute fitness
 * GET  /api/fitnesstfidf/results  – Fetch all fitness results
 * DELETE /api/fitnesstfidf/clear  – Clear all results
 */

const express = require('express');
const router = express.Router();
const { auth: authMiddleware, admin: adminMiddleware } = require('../middleware/auth');
const { uploadTfidf, handleTfidfUploadError } = require('../middleware/uploadtfidf');
const fitnesstfidfController = require('../controllers/fitnesstfidfController');

// POST /api/fitnesstfidf/upload
// Accepts up to 5 000 PDF files via "resumes" field, processes through TF-IDF engine
router.post(
    '/upload',
    authMiddleware,
    adminMiddleware,
    uploadTfidf.array('resumes', 5000),
    handleTfidfUploadError,
    fitnesstfidfController.uploadAndCompute
);

// GET /api/fitnesstfidf/results
// Fetch all saved TF-IDF fitness records
router.get(
    '/results',
    authMiddleware,
    adminMiddleware,
    fitnesstfidfController.getResults
);

// GET /api/fitnesstfidf/depthead/results
// Fetch TF-IDF records assigned to a specific Dept Head's department
router.get(
    '/depthead/results',
    authMiddleware,
    fitnesstfidfController.getDeptHeadResults
);

// DELETE /api/fitnesstfidf/clear
// Remove all TF-IDF fitness records
router.delete(
    '/clear',
    authMiddleware,
    adminMiddleware,
    fitnesstfidfController.clearResults
);

// DELETE /api/fitnesstfidf/record/:id
// Remove a single TF-IDF fitness record
router.delete(
    '/record/:id',
    authMiddleware,
    adminMiddleware,
    fitnesstfidfController.deleteRecord
);

// POST /api/fitnesstfidf/send/:id/job/:jobId
// Send a fitness record to DeptHead for a specific job match
router.post(
    '/send/:id/job/:jobId',
    authMiddleware,
    adminMiddleware,
    fitnesstfidfController.sendToDeptHead
);

// POST /api/fitnesstfidf/accept/:id/job/:jobId
// Accept a specific resume for a job (decrements vacancy)
router.post(
    '/accept/:id/job/:jobId',
    authMiddleware,
    fitnesstfidfController.acceptResume
);

// POST /api/fitnesstfidf/reject/:id/job/:jobId
// Reject a specific resume for a job (returns to Admin)
router.post(
    '/reject/:id/job/:jobId',
    authMiddleware,
    fitnesstfidfController.rejectResume
);

// GET /api/fitnesstfidf/vacancies
// Fetch live job vacancies grouped by department and role
router.get(
    '/vacancies',
    authMiddleware,
    fitnesstfidfController.getLiveVacancies
);

// GET /api/fitnesstfidf/download/:filename
// Serve a resume PDF file securely
router.get(
    '/download/:filename',
    authMiddleware,
    fitnesstfidfController.downloadResume
);

// DELETE /api/fitnesstfidf/record/:id/job/:jobId
// Remove a specific job entry from a fitness record
router.delete(
    '/record/:id/job/:jobId',
    authMiddleware,
    adminMiddleware,
    fitnesstfidfController.deleteJobRecord
);

// POST /api/fitnesstfidf/bulk-delete
// Remove multiple job entries or records at once
router.post(
    '/bulk-delete',
    authMiddleware,
    adminMiddleware,
    fitnesstfidfController.bulkDeleteJobRecords
);

// POST /api/fitnesstfidf/reset-vacancies
// Revert all accepted vacancies back to pending and restore opening counts
router.post(
    '/reset-vacancies',
    authMiddleware,
    adminMiddleware,
    fitnesstfidfController.resetAllVacancies
);

module.exports = router;
