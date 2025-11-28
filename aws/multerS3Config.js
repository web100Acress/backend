const multer = require("multer");
const multerS3 = require("multer-s3");
const { s3, BUCKET, isAWSConfigured } = require("./s3Config");
const uploadLimits = require("../config/uploadLimits");
const path = require("path");
const fs = require("fs");

// Fallback to disk storage for local development
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
try {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} catch (e) {
  console.error("Failed to ensure uploads directory:", e?.message || e);
}

// Disk storage fallback
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.originalname}`;
    cb(null, fileName);
  },
});

// S3 storage configuration
const s3Storage = multerS3({
  s3: s3,
  bucket: BUCKET,
  key: (req, file, cb) => {
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.originalname}`;
    const folder = 'contact-cards'; // Specific folder for contact card images
    const key = `${folder}/${fileName}`;
    cb(null, key);
  },
  contentType: multerS3.AUTO_CONTENT_TYPE,
});

// Choose storage based on AWS configuration
const storage = isAWSConfigured() ? s3Storage : diskStorage;

console.log(`📁 Contact card uploads using: ${isAWSConfigured() ? 'S3 Storage' : 'Disk Storage (local development)'}`);

const uploadS3 = multer({
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
    
    // Check file size before processing
    if (file.size && file.size > uploadLimits.fileSize) {
      return cb(new Error('File size too large. Please reduce file size and try again.'));
    }
    
    if (!isImage) return cb(new Error('Only image files are allowed for contact cards'));
    cb(null, true);
  },
});

module.exports = uploadS3;
