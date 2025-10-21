const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db');
require('dotenv').config();

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

// Make uploads folder static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Define API Routes
app.get('/api', (req, res) => res.send('InsightReel API is running...'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/search', require('./routes/search'));
app.use('/api/admin', require('./routes/admin'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));