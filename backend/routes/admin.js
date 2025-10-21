const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth'); // First, check if user is logged in
const adminAuth = require('../middleware/adminAuth'); // THEN, check if they are an admin
const { manageTranscriptionStatus } = require('../controllers/adminController');

// This endpoint is protected by BOTH middlewares
// A user must be logged in AND be an admin to access it
router.route('/transcription')
    .get([auth, adminAuth], manageTranscriptionStatus) // Get the current status
    .put([auth, adminAuth], manageTranscriptionStatus); // Update the status

module.exports = router;