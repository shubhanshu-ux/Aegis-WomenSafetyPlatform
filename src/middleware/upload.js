const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadsRoot = path.join(__dirname, '../../uploads');

/** Ensure upload directories exist on load */
function ensureDirs() {
  const dirs = [
    uploadsRoot,
    path.join(uploadsRoot, 'faces'),
    path.join(uploadsRoot, 'drivers'),
    path.join(uploadsRoot, 'emergency'),
  ];
  dirs.forEach((d) => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
}

ensureDirs();

function makeDiskStorage(subfolder) {
  return multer.diskStorage({
    destination(_req, _file, cb) {
      cb(null, path.join(uploadsRoot, subfolder));
    },
    filename(_req, file, cb) {
      const ext = path.extname(file.originalname) || '';
      const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
      cb(null, safe);
    },
  });
}

/** Volunteer face photo — images only */
const faceUpload = multer({
  storage: makeDiskStorage('faces'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Face upload must be an image'));
      return;
    }
    cb(null, true);
  },
});

/** Driver photo for travel safety */
const driverUpload = multer({
  storage: makeDiskStorage('drivers'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Driver image must be an image'));
      return;
    }
    cb(null, true);
  },
});

/** Emergency audio/video */
const emergencyUpload = multer({
  storage: makeDiskStorage('emergency'),
  limits: { fileSize: 80 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const ok =
      file.mimetype.startsWith('video/') ||
      file.mimetype.startsWith('audio/') ||
      file.mimetype === 'application/octet-stream';
    if (!ok) {
      cb(new Error('Emergency file must be audio or video'));
      return;
    }
    cb(null, true);
  },
});

module.exports = {
  uploadsRoot,
  faceUpload,
  driverUpload,
  emergencyUpload,
};
