const jwt = require('jsonwebtoken');
const User = require('../models/User');

const SUPER_ADMIN_EMAIL = 'fnigus33@gmail.com';

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'Not authorized' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (!user.isApproved) return res.status(403).json({ message: 'Account pending approval' });
    // Ensure super_admin email always has super_admin role
    if (user.email === SUPER_ADMIN_EMAIL && user.role !== 'super_admin') {
      user.role = 'super_admin';
      await user.save();
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  const hierarchy = { super_admin: 4, admin: 3, volunteer: 2, guest: 1 };
  const userLevel = hierarchy[req.user?.role] || 0;
  const minRequired = Math.min(...roles.map(r => hierarchy[r] || 99));
  if (userLevel < minRequired) return res.status(403).json({ message: 'Insufficient permissions' });
  next();
};

const requireAnyRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) return res.status(403).json({ message: 'Access denied' });
  next();
};

const superAdminOnly = (req, res, next) => {
  if (req.user?.role !== 'super_admin') return res.status(403).json({ message: 'Super admin only' });
  next();
};

module.exports = { protect, requireRole, requireAnyRole, superAdminOnly };
