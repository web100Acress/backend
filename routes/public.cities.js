const express = require('express');
const router = express.Router();
const CityController = require('../Controller/AdminController/CityController');

// Public routes for cities (no authentication required)
router.get('/active', CityController.getAllCities);
router.get('/category/:category', CityController.getCitiesByCategory);
router.get('/search', CityController.searchCities);
router.get('/:id/localities', CityController.getCityLocalities);

module.exports = router;
