const mongoose = require('mongoose');

const transcriptWordSchema = new mongoose.Schema({
  word: { type: String, required: true },
  start: { type: Number, required: true },
  end: { type: Number, required: true }
}, { _id: false });

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  originalFilename: { type: String, required: true },
  storagePath: { type: String, required: true }, // Path to video file
  audioPath: { type: String }, // Path to extracted audio file
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed', 'disabled'],
    default: 'processing'
  },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullTranscript: { type: String, default: '' },
  transcriptWords: [transcriptWordSchema],
  createdAt: { type: Date, default: Date.now }
});

// Create a text index on the fullTranscript field for searching
videoSchema.index({ fullTranscript: 'text' });

module.exports = mongoose.model('Video', videoSchema);