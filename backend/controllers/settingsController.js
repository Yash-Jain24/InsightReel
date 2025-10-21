const User = require('../models/User');

exports.getTranscriptionStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('isTranscriptionEnabled');
        res.json({ isTranscriptionEnabled: user.isTranscriptionEnabled });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.toggleTranscription = async (req, res) => {
    try {
        const { enabled } = req.body;
        if (typeof enabled !== 'boolean') {
            return res.status(400).json({ msg: 'Invalid value for enabled flag.' });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { isTranscriptionEnabled: enabled },
            { new: true }
        ).select('isTranscriptionEnabled');
        
        res.json({ 
            msg: `Transcription service has been ${enabled ? 'enabled' : 'disabled'}.`,
            isTranscriptionEnabled: user.isTranscriptionEnabled
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};