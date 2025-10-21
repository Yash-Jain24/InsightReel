const User = require('../models/User');

const adminAuth = async (req, res, next) => {
    try {
        // req.user.id is attached by the regular 'auth' middleware
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
        }
        
        // If user is an admin, proceed to the next function
        next();

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = adminAuth;