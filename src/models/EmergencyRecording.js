const mongoose = require('mongoose');

/**
 * Uploaded emergency audio/video with metadata for evidence trail (demo).
 */
const emergencyRecordingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileUrl: { type: String, required: true },
    mimeType: { type: String, default: '' },
    originalName: { type: String, default: '' },
    sizeBytes: { type: Number, default: 0 },
    durationSec: { type: Number, default: null },
    label: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmergencyRecording', emergencyRecordingSchema);
