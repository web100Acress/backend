const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 30 // Maximum 30 files
  },
  fileFilter: (req, file, cb) => {
    const isImage = (file.mimetype || '').toLowerCase().startsWith('image/');
    const isPDF = (file.mimetype || '').toLowerCase() === 'application/pdf';
    if (!isImage && !isPDF) return cb(new Error('Only image files and PDF documents are allowed'));
    cb(null, true);
  },
});

// A dedicated uploader for resumes (PDF/DOC/DOCX/TXT)
const resumeUpload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB for resumes
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
