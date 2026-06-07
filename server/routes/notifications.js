const express = require('express');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications — my notifications
router.get('/', protect, async (req, res) => {
  try {
    const notes = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
    const unread = await Notification.countDocuments({ userId: req.user._id, read: false });
    res.json({ notifications: notes, unread });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/notifications/read-all
router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    res.json({ message: 'All marked read' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', protect, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ message: 'Read' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
