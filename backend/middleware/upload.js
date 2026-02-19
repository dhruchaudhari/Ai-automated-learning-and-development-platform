// const multer = require('multer');
// const path = require('path');

// // Storage configuration
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     if (file.fieldname === 'profileImage') {
//       cb(null, 'uploads/images');
//     } else if (file.fieldname === 'document') {
//       cb(null, 'uploads/documents');
//     } else {
//       cb(new Error('Invalid field name'));
//     }
//   },
//   filename: (req, file, cb) => {
//     const userEmail = req.body.email
//       ? req.body.email.split('@')[0]
//       : 'user';

//     const ext = path.extname(file.originalname);
//     cb(null, `${userEmail}-${Date.now()}${ext}`);
//   }
// });

// // File filter
// const fileFilter = (req, file, cb) => {
//   if (file.fieldname === 'profileImage') {
//     if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
//       cb(null, true);
//     } else {
//       cb(new Error('Only JPEG images allowed'));
//     }
//   } 
//   else if (file.fieldname === 'document') {
//     if (file.mimetype === 'application/pdf') {
//       cb(null, true);
//     } else {
//       cb(new Error('Only PDF files allowed'));
//     }
//   }
// };

// // Multer instance ✅
// const upload = multer({
//   storage,
//   fileFilter,
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5MB
//     files: 2
//   }
// });

// // Multer error handler
// const handleUploadError = (err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     if (err.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json({ message: 'File size exceeded (max 5MB)' });
//     }
//     if (err.code === 'LIMIT_FILE_COUNT') {
//       return res.status(400).json({ message: 'Only 2 files allowed' });
//     }
//   }

//   if (err) {
//     return res.status(400).json({ message: err.message });
//   }

//   next();
// };

// module.exports = { upload, handleUploadError };

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directories if they don't exist
const createUploadDirectories = () => {
  const directories = [
    'uploads/images',
    'uploads/documents',
    'uploads/resumes',
    'uploads/marksheets'
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirectories();

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'profileImage') {
      cb(null, 'uploads/images');
    } else if (file.fieldname === 'resume') {
      cb(null, 'uploads/resumes');
    } else if (file.fieldname.includes('marksheet') || file.fieldname.includes('Marksheet')) {
      cb(null, 'uploads/marksheets');
    } else if (file.fieldname === 'document') {
      cb(null, 'uploads/documents');
    } else {
      cb(new Error('Invalid field name'));
    }
  },
  filename: (req, file, cb) => {
    const userEmail = req.body.email
      ? req.body.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_')
      : 'user';
    
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const originalName = path.basename(file.originalname, ext);
    
    // Create a safe filename
    const safeName = `${userEmail}_${originalName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}${ext}`;
    cb(null, safeName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  const allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  if (file.fieldname === 'profileImage') {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, JPG, PNG images allowed'));
    }
  } 
  else if (file.fieldname === 'resume') {
    if (allowedDocTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX files allowed'));
    }
  }
  else if (file.fieldname.includes('marksheet') || file.fieldname.includes('Marksheet') || file.fieldname === 'document') {
    if (allowedDocTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX files allowed'));
    }
  }
  else {
    cb(new Error('Invalid file type'));
  }
};

// Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10 // Allow up to 10 files for all uploads
  }
});

// Multer error handler
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false,
        message: 'File size exceeded (max 10MB)' 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        success: false,
        message: 'Maximum file count exceeded' 
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        success: false,
        message: 'Unexpected file field' 
      });
    }
  }

  if (err) {
    return res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }

  next();
};

module.exports = { upload, handleUploadError };