const AppSettings = require('../models/AppSettings');

// Controller to get or set the global transcription status
exports.manageTranscriptionStatus = async (req, res) => {
    const { isEnabled } = req.body; // For PUT requests

    try {
        // Find the setting document, or create it if it doesn't exist (upsert)
        // This ensures we always have a setting to work with on the first run
        let settings = await AppSettings.findOneAndUpdate(
            { key: 'globalTranscriptionStatus' },
            // If the request is PUT, update the value. Otherwise, do nothing.
            req.method === 'PUT' ? { isEnabled } : {},
            { new: true, upsert: true } // Return the new doc, create if it doesn't exist
        );

        if (req.method === 'PUT') {
            res.json({ 
                msg: `Global transcription service has been ${isEnabled ? 'enabled' : 'disabled'}.`,
                settings 
            });
        } else { // For GET requests
            res.json(settings);
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};