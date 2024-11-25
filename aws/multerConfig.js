
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      console.log('Destination callback triggered');
      cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
      console.log('Filename callback triggered');
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });
// console.log(storage.des)
const upload = multer({ storage });

module.exports = upload;
