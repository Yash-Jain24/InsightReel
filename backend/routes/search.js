const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { searchUserVideos } = require('../controllers/searchController');

// This line registers a GET request for the '/api/search' path
router.get('/', auth, searchUserVideos);

module.exports = router;