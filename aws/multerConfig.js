const multer = require("multer");
const path = require("path");
const fs = require("fs");
const uploadLimits = require("../config/uploadLimits");

// Ensure uploads directory exists (helps in production where folder may be missing)
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
try {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} catch (e) {
  // Log and proceed; multer will error if directory truly not writable
  console.error("Failed to ensure uploads directory:", e?.message || e);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { 
    fileSize: uploadLimits.fileSize,
    files: uploadLimits.maxFiles,
    fieldSize: 20 * 1024 * 1024, // 20MB for non-file fields
    fieldNameSize: 500, // Max field name size
    fields: 50, // Max number of non-file fields
  },
  fileFilter: (req, file, cb) => {
    const isImage = (file.mimetype || '').toLowerCase().startsWith('image/');
    const isPDF = (file.mimetype || '').toLowerCase() === 'application/pdf';
    
    // Check file size before processing
    if (file.size && file.size > uploadLimits.fileSize) {
      return cb(new Error('File size too large. Please reduce file size and try again.'));
    }
    
    if (!isImage && !isPDF) return cb(new Error('Only image files and PDF documents are allowed'));
    cb(null, true);
  },
});

// A dedicated uploader for resumes (PDF/DOC/DOCX/TXT)
const resumeUpload = multer({
  storage,
  limits: { fileSize: uploadLimits.resumeSize }, // Environment-specific resume size
  fileFilter: (req, file, cb) => {
    const mime = (file.mimetype || '').toLowerCase();
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    if (mime.startsWith('image/')) return cb(new Error('Images are not allowed for resume'));
    if (!allowed.includes(mime)) return cb(new Error('Only PDF, DOC, DOCX, or TXT resumes are allowed'));
    cb(null, true);
  },
});

module.exports = upload;
module.exports.resumeUpload = resumeUpload;
