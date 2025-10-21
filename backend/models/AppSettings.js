const mongoose = require('mongoose');

const appSettingsSchema = new mongoose.Schema({
  // Use a single, known key to easily find this document
  key: { 
    type: String, 
    required: true, 
    unique: true, 
    default: 'globalTranscriptionStatus' 
  },
  isEnabled: { type: Boolean, default: true }
});

module.exports = mongoose.model('AppSettings', appSettingsSchema);