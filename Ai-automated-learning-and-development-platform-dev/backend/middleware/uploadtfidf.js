/**
 * middleware/uploadtfidf.js
 * Dedicated multer middleware for Fitness TF-IDF bulk resume uploads.
 * PDF only, max 5 MB per file, up to 5 000 files per request.
 * Keeps existing upload.js completely untouched.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ─── Create upload directory ───
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'bulkresumes');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ─── Storage ───
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
        const timestamp = Date.now();
        const safeName = file.originalname
            .replace(/[^a-zA-Z0-9.\-_]/g, '_')
            .replace(/_{2,}/g, '_');
        cb(null, `${timestamp}_${safeName}`);
    },
});

// ─── File Filter: PDF only ───
const fileFilter = (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed for TF-IDF resume upload'));
    }
};

// ─── Multer Instance ───
const uploadTfidf = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,  // 5 MB per file
        files: 5000,                  // up to 5 000 files per request
    },
});

// ─── Error Handler ───
const handleTfidfUploadError = (err, _req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size exceeded (max 5 MB per PDF)',
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Maximum 5 000 files allowed per upload',
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected file field',
            });
        }
    }

    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }

    next();
};

module.exports = { uploadTfidf, handleTfidfUploadError };
