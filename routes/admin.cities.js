const express = require('express');
const router = express.Router();
const CityController = require('../Controller/AdminController/CityController');
const adminVerify = require('../middleware/adminVerify');

// All routes require admin verification
router.use(adminVerify);

// City routes
router.get('/', CityController.getAllCities);
router.get('/category/:category', CityController.getCitiesByCategory);
router.post('/', CityController.addCity);
router.get('/search', CityController.searchCities);
router.get('/:id/localities', CityController.getCityLocalities);
router.put('/:id', CityController.updateCity);
router.delete('/:id', CityController.deleteCity);

module.exports = router;
