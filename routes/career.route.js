const express = require('express');
const router = express.Router();
const CareerController = require('../Controller/AdminController/FrontController/CareerController');

// Document Upload Routes
router.post('/generate-upload-link', CareerController.generateUploadLink);
router.get('/verify-upload-token/:token', CareerController.verifyUploadToken);
router.post('/upload-documents/:token', CareerController.uploadDocuments);
router.get('/test-token', CareerController.testToken);

// Existing Career Routes (add existing routes here if needed)
// router.get('/career', CareerController.careerView);
// router.post('/career', CareerController.careerInsert);
// router.put('/career/:id', CareerController.careerUpdate);
// router.get('/career/:id', CareerController.careerEdit);

module.exports = router;
