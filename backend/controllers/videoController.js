const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const { google } = require('googleapis');
const YTDlpWrap = require('yt-dlp-wrap').default;
const { S3Client, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Leopard } = require('@picovoice/leopard-node');

const Video = require('../models/Video');
const User = require('../models/User');
const AppSettings = require('../models/AppSettings');

const youtube = google.youtube({ version: 'v3', auth: process.env.YOUTUBE_API_KEY });
const ytDlpWrap = new YTDlpWrap();
const s3 = new S3Client({
    endpoint: `https://${process.env.B2_ENDPOINT}`,
    region: process.env.B2_REGION,
    credentials: { accessKeyId: process.env.B2_KEY_ID, secretAccessKey: process.env.B2_APP_KEY }
});

// Helper function to parse VTT subtitle files (with corrections)
const vttTimestampToSeconds = (timestamp) => {
    const parts = timestamp.split(':');
    const secondsParts = parts[2].split('.');
    return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(secondsParts[0], 10) + parseInt(secondsParts[1], 10) / 1000;
};
const parseVtt = (vttContent) => {
    const lines = vttContent.replace(/\r/g, '').split('\n');
    let fullTranscript = '';
    const transcriptWords = [];

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('-->')) {
            try {
                const timeParts = lines[i].split(' --> ');
                if (timeParts.length === 2 && timeParts[0] && timeParts[1]) {
                    const startTime = vttTimestampToSeconds(timeParts[0]);
                    const endTime = vttTimestampToSeconds(timeParts[1]);
                    let textLine = lines[i + 1] ? lines[i + 1].replace(/<[^>]+>/g, '').trim() : '';

                    if (textLine) {
                        fullTranscript += textLine + ' ';
                        const words = textLine.split(' ').filter(w => w);
                        const duration = endTime - startTime;
                        const durationPerWord = words.length > 0 ? duration / words.length : 0;
                        words.forEach((word, index) => {
                            transcriptWords.push({
                                word: word, start: startTime + (index * durationPerWord), end: startTime + ((index + 1) * durationPerWord),
                            });
                        });
                    }
                }
            } catch (e) { console.warn(`Skipping malformed VTT line.`); }
        }
    }
    return { fullTranscript: fullTranscript.trim(), transcriptWords };
};

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.B2_BUCKET_NAME,
        key: function (req, file, cb) { cb(null, `${req.user.id}/${Date.now().toString()}-${file.originalname}`); }
    })
}).single('video');

const uploadVideo = (req, res) => {
    upload(req, res, async (err) => {
        if (err) return res.status(500).json({ msg: `File upload error: ${err.message}` });
        const { title } = req.body;
        if (!req.file) return res.status(400).json({ msg: 'No video file uploaded.' });
        try {
            const newVideo = new Video({ title, originalFilename: req.file.originalname, storagePath: req.file.key, owner: req.user.id });
            await newVideo.save();
            const finalVideo = await processVideo(newVideo._id, req.user.id);
            res.status(201).json(finalVideo);
        } catch (err) {
            res.status(500).send('Server Error');
        }
    });
};

const getUserVideos = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        let query = (user.role === 'admin') ? {} : { owner: req.user.id };
        const videos = await Video.find(query).sort({ createdAt: -1 });
        res.json(videos);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

const getVideoById = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        let query = { _id: req.params.id };
        if (user.role !== 'admin') query.owner = req.user.id;
        const video = await Video.findOne(query);
        if (!video) return res.status(404).json({ msg: 'Video not found or access denied' });
        res.json(video);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

const importFromYouTube = async (req, res) => {
    const { youtubeUrl, title } = req.body;
    if (!youtubeUrl) return res.status(400).json({ msg: 'A YouTube URL is required.' });

    let videoId;
    try {
        const url = new URL(youtubeUrl);
        videoId = url.searchParams.get('v') || url.pathname.split('/').pop();
        if (!videoId) throw new Error("Could not extract video ID.");
    } catch (e) {
        return res.status(400).json({ msg: `Invalid YouTube URL: ${e.message}` });
    }

    let videoTitle = title;
    const tempDir = path.join(__dirname, '..', 'uploads');
    fs.mkdirSync(tempDir, { recursive: true });
    
    try {
        console.log(`Fetching video details for ID: ${videoId} via YouTube Data API.`);
        const videoDetailsResponse = await youtube.videos.list({ part: 'snippet,contentDetails', id: videoId });
        const videoItem = videoDetailsResponse.data.items[0];
        if (!videoItem) throw new Error('YouTube video not found.');
        videoTitle = title || videoItem.snippet.title;

        if (videoItem.contentDetails.caption === 'true') {
            let tempSubtitlePath = null;
            try {
                const tempSubTemplate = path.join(tempDir, `${Date.now()}-${videoId}`);
                console.log(`Attempting to download subtitles with yt-dlp...`);
                await ytDlpWrap.execPromise([youtubeUrl, '--write-auto-sub', '--sub-lang', 'en', '--skip-download', '-o', tempSubTemplate]);
                tempSubtitlePath = `${tempSubTemplate}.en.vtt`;

                if (fs.existsSync(tempSubtitlePath)) {
                    console.log("✅ Successfully downloaded subtitles via yt-dlp.");
                    const vttContent = fs.readFileSync(tempSubtitlePath, 'utf8');
                    fs.unlinkSync(tempSubtitlePath);
                    const { fullTranscript, transcriptWords } = parseVtt(vttContent);
                    const newVideo = new Video({ title: videoTitle, originalFilename: youtubeUrl, status: 'completed', owner: req.user.id, fullTranscript, transcriptWords, storagePath: youtubeUrl });
                    await newVideo.save();
                    return res.status(201).json(newVideo);
                }
            } catch (subError) {
                console.warn(`Could not download subtitles with yt-dlp. Falling back. Error: ${subError.message}`);
                if (tempSubtitlePath && fs.existsSync(tempSubtitlePath)) fs.unlinkSync(tempSubtitlePath);
            }
        }
        
        // --- Fallback to Picovoice (using yt-dlp for audio) ---
        console.log(`⚠️ Falling back to Picovoice for "${videoTitle}"`);
        const tempAudioTemplate = path.join(tempDir, `${Date.now()}-${videoId}`);
        console.log(`🎥 Downloading audio stream using yt-dlp...`);
        await ytDlpWrap.execPromise([youtubeUrl, '-x', '--audio-format', 'm4a', '--referer', 'https://www.youtube.com/', '-o', `${tempAudioTemplate}.%(ext)s`]);
        
        const fileBaseName = path.basename(tempAudioTemplate);
        const downloadedFile = fs.readdirSync(tempDir).find(f => f.startsWith(fileBaseName));
        if (!downloadedFile) throw new Error('Failed to find downloaded audio file.');
        
        const finalAudioPath = path.join(tempDir, downloadedFile);
        console.log(`🎧 Audio downloaded to ${finalAudioPath}.`);
        
        const newVideo = new Video({ title: videoTitle, originalFilename: youtubeUrl, storagePath: youtubeUrl, owner: req.user.id, audioPath: finalAudioPath, status: 'processing' });
        await newVideo.save();

        const finalVideo = await processVideo(newVideo._id, req.user.id, finalAudioPath);
        return res.status(201).json(finalVideo);

    } catch (procError) {
        console.error(`Error in YouTube import process: ${procError.message}`);
        return res.status(500).json({ msg: `Failed to process YouTube video: ${procError.message}` });
    }
};

const getPlayUrl = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        let query = { _id: req.params.id };
        if (user.role !== 'admin') query.owner = req.user.id;
        const video = await Video.findOne(query);
        if (!video) return res.status(404).json({ msg: 'Video not found or access denied' });
        if (video.storagePath.startsWith('http')) return res.json({ url: video.storagePath });
        const command = new GetObjectCommand({ Bucket: process.env.B2_BUCKET_NAME, Key: video.storagePath });
        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
        res.json({ url: signedUrl });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

const deleteVideo = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        let query = { _id: req.params.id };
        if (user.role !== 'admin') query.owner = req.user.id;
        const video = await Video.findOne(query);
        if (!video) return res.status(404).json({ msg: 'Video not found or access denied' });
        if (!video.storagePath.startsWith('http')) {
            const command = new DeleteObjectCommand({ Bucket: process.env.B2_BUCKET_NAME, Key: video.storagePath });
            await s3.send(command);
        }
        await Video.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Video deleted successfully' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

const extractAudio = (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(inputPath)) return reject(new Error(`Input file not found for FFmpeg: ${inputPath}`));
        ffmpeg(inputPath).output(outputPath).audioChannels(1).audioFrequency(16000)
            .on('end', () => resolve(outputPath)).on('error', (err) => reject(new Error(`FFmpeg error: ${err.message}`)))
            .run();
    });
};

const processVideo = async (videoId, userId, existingAudioPath = null) => {
    let video = await Video.findById(videoId);
    if (!video) throw new Error(`Video not found.`);
    
    const tempLocalPaths = [];
    try {
        const globalSettings = await AppSettings.findOne({ key: 'globalTranscriptionStatus' });
        if (globalSettings && !globalSettings.isEnabled) {
            video.status = 'disabled'; video.fullTranscript = 'Transcription service is globally disabled.';
            return await video.save();
        }
        const user = await User.findById(userId);
        if (!user) throw new Error(`User not found.`);
        if (!user.isTranscriptionEnabled) {
            video.status = 'disabled'; video.fullTranscript = 'Transcription service was disabled by the user.';
            return await video.save();
        }

        let audioToConvert = existingAudioPath;
        if (existingAudioPath) tempLocalPaths.push(existingAudioPath);

        if (!audioToConvert) { // B2 upload
            const tempDir = path.join(__dirname, '..', 'uploads');
            fs.mkdirSync(tempDir, { recursive: true });
            const tempDownloadPath = path.join(tempDir, path.basename(video.storagePath));
            tempLocalPaths.push(tempDownloadPath);
            console.log(`⬇️ Downloading ${video.storagePath} from B2 to process...`);
            const command = new GetObjectCommand({ Bucket: process.env.B2_BUCKET_NAME, Key: video.storagePath });
            const { Body } = await s3.send(command);
            await new Promise((resolve, reject) => {
                Body.pipe(fs.createWriteStream(tempDownloadPath)).on('finish', resolve).on('error', reject);
            });
            audioToConvert = tempDownloadPath;
        }

        const createdWavPath = path.join(path.dirname(audioToConvert), `${path.basename(audioToConvert, path.extname(audioToConvert))}.wav`);
        tempLocalPaths.push(createdWavPath);
        console.log(`🔄 Converting audio to WAV for Picovoice...`);
        await extractAudio(audioToConvert, createdWavPath);

        console.log(`🎤 Leopard: Transcribing...`);
        const leopard = new Leopard(process.env.PICOVOICE_ACCESS_KEY);
        const { transcript, words } = leopard.processFile(createdWavPath);
        leopard.release();

        video.status = 'completed';
        video.fullTranscript = transcript;
        video.transcriptWords = words.map(w => ({ word: w.word, start: w.startSec, end: w.endSec }));
        console.log(`✅ Leopard: Transcription complete.`);
        return await video.save();
    } catch (error) {
        console.error(`❌ Failed to process video ${videoId}:`, error.message);
        video.status = 'failed';
        video.fullTranscript = error.message || 'Processing failed.';
        return await video.save();
    } finally {
        tempLocalPaths.forEach(filePath => {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
});
    }
};

module.exports = { uploadVideo, getUserVideos, getVideoById, importFromYouTube, getPlayUrl, deleteVideo };