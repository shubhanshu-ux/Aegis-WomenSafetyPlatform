const User = require('../models/User');
const { signToken } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const { asyncHandler } = require('../utils/asyncHandler');

/**
 * Register a new account with role user or volunteer.
 */
const register = asyncHandler(async (req, res) => {
  const { email, password, name, phone, role = ROLES.USER } = req.body;
  if (!email || !password || !name || !phone) {
    res.status(400).json({ message: 'email, password, name, and phone are required' });
    return;
  }
  if (![ROLES.USER, ROLES.VOLUNTEER].includes(role)) {
    res.status(400).json({ message: 'Invalid role' });
    return;
  }
  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    email,
    passwordHash,
    name,
    phone,
    role,
  });
  const token = signToken(user._id, user.role);
  res.status(201).json({
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
    },
  });
});

/**
 * Login with email + password.
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: 'email and password are required' });
    return;
  }
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }
  const token = signToken(user._id, user.role);
  res.json({
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
    },
  });
});

/**
 * Current user from JWT.
 */
const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).lean();
  res.json({
    id: user._id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
  });
});

module.exports = { register, login, me };
