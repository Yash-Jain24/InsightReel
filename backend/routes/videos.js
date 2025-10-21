const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
    uploadVideo, 
    getUserVideos, 
    getVideoById, 
    importFromYouTube,
    getPlayUrl,
    deleteVideo
} = require('../controllers/videoController');

router.post('/upload', auth, uploadVideo);
router.get('/', auth, getUserVideos);
router.get('/:id', auth, getVideoById);
router.get('/:id/play', auth, getPlayUrl);
router.post('/from-youtube', auth, importFromYouTube);
router.delete('/:id', auth, deleteVideo);

module.exports = router;