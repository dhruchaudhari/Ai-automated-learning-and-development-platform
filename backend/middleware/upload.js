const multer = require('multer');
const path = require('path');

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'profileImage') {
      cb(null, 'uploads/images');
    } else if (file.fieldname === 'document') {
      cb(null, 'uploads/documents');
    } else {
      cb(new Error('Invalid field name'));
    }
  },
  filename: (req, file, cb) => {
    const userEmail = req.body.email
      ? req.body.email.split('@')[0]
      : 'user';

    const ext = path.extname(file.originalname);
    cb(null, `${userEmail}-${Date.now()}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'profileImage') {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG images allowed'));
    }
  } 
  else if (file.fieldname === 'document') {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files allowed'));
    }
  }
};

// Multer instance ✅
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 2
  }
});

// Multer error handler
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size exceeded (max 5MB)' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Only 2 files allowed' });
    }
  }

  if (err) {
    return res.status(400).json({ message: err.message });
  }

  next();
};

module.exports = { upload, handleUploadError };
