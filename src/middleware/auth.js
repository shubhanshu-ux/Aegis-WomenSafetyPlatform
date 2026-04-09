const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ROLES } = require('../config/constants');

/**
 * Verifies Bearer JWT and attaches user document (without password) to req.user.
 */
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Missing or invalid Authorization header' });
      return;
    }
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).lean();
    if (!user) {
      res.status(401).json({ message: 'User no longer exists' });
      return;
    }
    req.user = user;
    req.tokenPayload = payload;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      res.status(401).json({ message: 'Invalid or expired token' });
      return;
    }
    next(err);
  }
}

/**
 * Restricts route to given roles (after requireAuth).
 */
function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    if (!allowed.includes(req.user.role)) {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

function signToken(userId, role) {
  return jwt.sign(
    { sub: String(userId), role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

module.exports = {
  requireAuth,
  requireRole,
  signToken,
  ROLES,
};
