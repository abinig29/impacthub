const express = require('express');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();
const SUPER_ADMIN_EMAIL = 'fnigus33@gmail.com';

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });

const buildUserPayload = async (user) => {
  const qrCodeImage = await QRCode.toDataURL(user.qrCode || user._id.toString(), {
    width: 300, margin: 2, color: { dark: '#0d1117', light: '#ffffff' }
  });
  const unread = await Notification.countDocuments({ userId: user._id, read: false });
  return { ...user.toJSON(), qrCodeImage, token: generateToken(user._id), unreadNotifications: unread };
};

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields required' });
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already in use' });

    const role = email === SUPER_ADMIN_EMAIL ? 'super_admin' : 'volunteer';
    const qrId = uuidv4();
    const user = await User.create({ name, email, password, role, qrCode: qrId });
    user.recalculate();
    await user.save();

    await ActivityLog.create({ userId: user._id, userName: user.name, action: 'Joined ImpactHub', type: 'system' });
    res.status(201).json(await buildUserPayload(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (!user.isApproved) return res.status(403).json({ message: 'Account pending admin approval' });
    if (!(await user.comparePassword(password))) return res.status(401).json({ message: 'Invalid credentials' });
    res.json(await buildUserPayload(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(await buildUserPayload(user));
  } catch { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
