const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { registerUser, loginUser, getLoggedInUser } = require('../controllers/authController');

router.get('/me', auth, getLoggedInUser);

router.post('/register', registerUser);
router.post('/login', loginUser);
module.exports = router;