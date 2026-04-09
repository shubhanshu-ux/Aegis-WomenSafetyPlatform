const express = require('express');
const cors = require('cors');
const { uploadsRoot } = require('./middleware/upload');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const alertRoutes = require('./routes/alertRoutes');
const travelRoutes = require('./routes/travelRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const geocodeRoutes = require('./routes/geocodeRoutes');

/**
 * Express application factory — mounts API routes and global middleware.
 */
function createApp() {
  const app = express();

  const fromEnv = process.env.ALLOWED_ORIGIN?.split(',').map((s) => s.trim()).filter(Boolean);
  const allowedOrigins =
    fromEnv && fromEnv.length > 0
      ? fromEnv
      : ['http://localhost:5173', 'http://127.0.0.1:5173'];

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  /** Public URLs for uploaded assets */
  app.use('/uploads', express.static(uploadsRoot));

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'womens-safety-backend', time: new Date().toISOString() });
  });

  app.get('/', (_req, res) => {
    res.json({
      name: "Women's Safety Platform API",
      docs: 'See README.md for routes and examples',
      health: '/health',
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/volunteers', volunteerRoutes);
  app.use('/api/alerts', alertRoutes);
  app.use('/api/travel', travelRoutes);
  app.use('/api/media', mediaRoutes);
  app.use('/api/geocode', geocodeRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
