const express = require('express');
const Donation = require('../models/Donation');
const Session = require('../models/Session');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/donations — public list
router.get('/', async (req, res) => {
  try {
    const donations = await Donation.find().sort({ createdAt: -1 }).limit(50);
    const stats = await Donation.aggregate([{ $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]);
    res.json({ donations, total: stats[0]?.total || 0, count: stats[0]?.count || 0 });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/donations/goals — per-project goals
router.get('/goals', async (req, res) => {
  try {
    const sessions = await Session.find().select('title description');
    const goals = [
      { id: 'general', title: 'General Fund', goal: 5000, description: 'Support all volunteer operations' },
      ...sessions.slice(0, 5).map(s => ({ id: s._id, title: s.title, goal: 1000, description: s.description })),
    ];
    const raised = await Promise.all(goals.map(async g => {
      const agg = await Donation.aggregate([{ $match: { projectTitle: g.title } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
      return { ...g, raised: agg[0]?.total || 0 };
    }));
    res.json(raised);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/donations — make donation (no auth required for guests)
router.post('/', async (req, res) => {
  try {
    const { donorName, donorEmail, amount, projectTitle, message } = req.body;
    if (!amount || amount < 1) return res.status(400).json({ message: 'Minimum donation is $1' });
    const donation = await Donation.create({ donorName: donorName || 'Anonymous', donorEmail, amount: parseFloat(amount), projectTitle: projectTitle || 'General Fund', message });
    await ActivityLog.create({ action: `${donorName || 'Anonymous'} donated $${amount}`, type: 'donation', detail: projectTitle || 'General Fund' });
    res.status(201).json(donation);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// DELETE /api/donations/:id — admin
router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    await Donation.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
