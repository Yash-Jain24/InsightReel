const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getTranscriptionStatus, toggleTranscription } = require('../controllers/settingsController');
router.get('/transcription', auth, getTranscriptionStatus);
router.put('/transcription', auth, toggleTranscription);
module.exports = router;