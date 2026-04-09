const EmergencyRecording = require('../models/EmergencyRecording');
const { asyncHandler } = require('../utils/asyncHandler');
const { filePublicUrl } = require('../utils/publicUrl');

/**
 * Upload emergency audio/video; stores URL + metadata.
 */
const uploadRecording = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: 'file is required (field name: file)' });
    return;
  }

  const { durationSec, label } = req.body;
  const rel = `/uploads/emergency/${req.file.filename}`;
  const fileUrl = filePublicUrl(req, rel);

  const rec = await EmergencyRecording.create({
    user: req.user._id,
    fileUrl,
    mimeType: req.file.mimetype,
    originalName: req.file.originalname,
    sizeBytes: req.file.size,
    durationSec: durationSec != null && durationSec !== '' ? Number(durationSec) : null,
    label: label || '',
  });

  res.status(201).json({ recording: formatRecording(rec) });
});

/**
 * List current user's emergency recordings.
 */
const listRecordings = asyncHandler(async (req, res) => {
  const list = await EmergencyRecording.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  res.json({ recordings: list.map(formatRecording) });
});

function formatRecording(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: o._id,
    fileUrl: o.fileUrl,
    mimeType: o.mimeType,
    originalName: o.originalName,
    sizeBytes: o.sizeBytes,
    durationSec: o.durationSec,
    label: o.label,
    createdAt: o.createdAt,
  };
}

module.exports = { uploadRecording, listRecordings };
