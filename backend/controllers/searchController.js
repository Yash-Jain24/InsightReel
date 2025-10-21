const Video = require('../models/Video');
const User = require('../models/User');

exports.searchUserVideos = async (req, res) => {
    const { query } = req.query;
    const searchTerm = query ? query.trim() : '';

    if (!searchTerm) {
        return res.status(200).json([]);
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        let dbQuery = { 
            status: 'completed',
            $text: { $search: searchTerm } 
        };
        
        if (user.role !== 'admin') {
            dbQuery.owner = req.user.id;
        }

        const videos = await Video.find(
            dbQuery, 
            { score: { $meta: "textScore" } }
        ).sort(
            { score: { $meta: "textScore" } }
        );

        res.json(videos);
    } catch (err) {
        console.error("Search API Error:", err.message);
        res.status(500).json({ msg: `Search failed. Please ensure the database text index is active.` });
    }
};