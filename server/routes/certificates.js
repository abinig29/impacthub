const express = require('express');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const TimeLog = require('../models/TimeLog');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/certificates/generate — generate for self
router.post('/generate', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const completedLogs = await TimeLog.find({ userId: req.user._id, status: 'completed' });
    const totalSeconds = completedLogs.reduce((a, l) => a + (l.durationSeconds || 0), 0);
    const formattedDuration = TimeLog.formatDuration(totalSeconds);

    const cert = await Certificate.create({
      userId: user._id,
      recipientName: user.name,
      totalHours: user.totalHours,
      totalMinutes: user.totalMinutes,
      formattedDuration,
      missionsCompleted: user.missionsCompleted || 0,
      level: user.level,
      badges: user.badges,
    });

    res.status(201).json(cert);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/certificates/my
router.get('/my', protect, async (req, res) => {
  try {
    const certs = await Certificate.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(certs);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/certificates/verify/:id
router.get('/verify/:verificationId', async (req, res) => {
  try {
    const cert = await Certificate.findOne({ verificationId: req.params.verificationId });
    if (!cert) return res.status(404).json({ message: 'Certificate not found' });
    res.json({ valid: true, certificate: cert });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
