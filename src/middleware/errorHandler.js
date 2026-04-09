const mongoose = require('mongoose');

/**
 * Central error handler: consistent JSON shape for API clients.
 */
function errorHandler(err, req, res, _next) {
  // Multer errors
  if (err.name === 'MulterError') {
    res.status(400).json({ message: err.message, code: 'UPLOAD_ERROR' });
    return;
  }

  if (err.message && err.message.includes('upload')) {
    res.status(400).json({ message: err.message, code: 'UPLOAD_ERROR' });
    return;
  }

  // Mongoose validation
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => e.message);
    res.status(400).json({ message: 'Validation failed', details });
    return;
  }

  if (err.code === 11000) {
    res.status(409).json({ message: 'Duplicate key', field: Object.keys(err.keyPattern || {})[0] });
    return;
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (status >= 500) {
    console.error('[error]', err);
  }

  res.status(status).json({ message });
}

/**
 * Express 404 for unknown API routes (mounted after routes).
 */
function notFoundHandler(req, res) {
  res.status(404).json({ message: `Cannot ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFoundHandler };
