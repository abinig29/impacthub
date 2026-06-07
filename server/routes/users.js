const express = require('express');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const { protect, requireAnyRole, superAdminOnly } = require('../middleware/auth');

const router = express.Router();
const SUPER_ADMIN_EMAIL = 'fnigus33@gmail.com';

// GET /api/users — admin+
router.get('/', protect, requireAnyRole('admin', 'super_admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/users/leaderboard
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'guest' }, isApproved: true })
      .select('name role totalHours totalMinutes impactScore level badges peopleHelped currentStreak xp createdAt')
      .sort({ impactScore: -1 }).limit(20);
    const total = await User.countDocuments({ role: { $ne: 'guest' } });
    const result = users.map((u, i) => ({ ...u.toJSON(), rank: i + 1, percentile: Math.max(1, Math.round(((total - i) / total) * 100)) }));
    res.json(result);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/users/community
router.get('/community', protect, async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'guest' }, isApproved: true })
      .select('name email role totalHours totalMinutes skills bio impactScore level badges peopleHelped currentStreak location createdAt')
      .sort({ impactScore: -1 });
    res.json(users);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/users/recommendations/:id
router.get('/recommendations/:id', protect, async (req, res) => {
  try {
    const Mission = require('../models/Mission');
    const TimeLog = require('../models/TimeLog');
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    const attended = await TimeLog.distinct('sessionId', { userId: user._id });
    const recommended = await Mission.find({ status: 'active', volunteers: { $ne: user._id } }).populate('leader', 'name').sort({ isUrgent: -1, createdAt: -1 }).limit(3);
    const dow = new Date().getDay();
    const pattern = (dow === 0 || dow === 6) ? 'Weekend volunteer! Great time to help.' : 'Weekday warrior! Your consistency is impressive.';
    res.json({ recommended, pattern, weeklyActivity: user.weeklyActivityData || [] });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/users/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const qrCodeImage = await QRCode.toDataURL(user.qrCode || user._id.toString(), { width: 300 });
    res.json({ ...user.toJSON(), qrCodeImage });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/users/:id
router.put('/:id', protect, async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id && !['admin','super_admin'].includes(req.user.role)) return res.status(403).json({ message: 'Not authorized' });
    const { name, bio, skills, location, language } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { name, bio, skills, location, language }, { new: true }).select('-password');
    res.json(user);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/users/:id/role — admin promotes, super_admin can do anything
router.put('/:id/role', protect, requireAnyRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { role } = req.body;
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'Not found' });
    // Only super_admin can assign admin/super_admin
    if (['admin','super_admin'].includes(role) && req.user.role !== 'super_admin') return res.status(403).json({ message: 'Only super admin can assign admin roles' });
    // Nobody can override super_admin email
    if (target.email === SUPER_ADMIN_EMAIL) return res.status(403).json({ message: 'Cannot change super admin role' });
    target.role = role;
    await target.save();
    await ActivityLog.create({ userId: req.user._id, userName: req.user.name, action: `Changed ${target.name}'s role to ${role}`, type: 'system' });
    res.json(target);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/users/:id/approve
router.put('/:id/approve', protect, requireAnyRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { isApproved } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isApproved }, { new: true }).select('-password');
    if (isApproved) {
      await Notification.create({ userId: user._id, type: 'approval', title: 'Account Approved!', message: 'Your volunteer account has been approved. Welcome to ImpactHub!', priority: 'high' });
    }
    res.json(user);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/users/create-guest — admin+
router.post('/create-guest', protect, requireAnyRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields required' });
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email in use' });
    const qrId = uuidv4();
    const user = await User.create({ name, email, password, role: 'guest', qrCode: qrId, isApproved: true });
    res.status(201).json(user);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// DELETE /api/users/:id — admin+
router.delete('/:id', protect, requireAnyRole('admin', 'super_admin'), async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'Not found' });
    if (target.email === SUPER_ADMIN_EMAIL) return res.status(403).json({ message: 'Cannot delete super admin' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
