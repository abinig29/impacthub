const express = require('express');
const Mission = require('../models/Mission');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const { protect, requireAnyRole } = require('../middleware/auth');

const router = express.Router();

async function notifyAllVolunteers(title, message, link, type = 'mission', priority = 'normal') {
  const volunteers = await User.find({ role: { $in: ['volunteer', 'admin', 'super_admin'] }, isApproved: true }).select('_id');
  const notes = volunteers.map(v => ({ userId: v._id, type, title, message, link, priority }));
  await Notification.insertMany(notes);
}

// GET /api/missions
router.get('/', protect, async (req, res) => {
  try {
    const { status, urgent } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (urgent === 'true') filter.isUrgent = true;
    const missions = await Mission.find(filter)
      .populate('leader', 'name email role impactScore')
      .populate('volunteers', 'name email impactScore level')
      .sort({ isUrgent: -1, createdAt: -1 });
    res.json(missions);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/missions/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id)
      .populate('leader', 'name email impactScore level badges')
      .populate('volunteers', 'name email impactScore level badges');
    if (!mission) return res.status(404).json({ message: 'Mission not found' });
    res.json(mission);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/missions — admin+
router.post('/', protect, requireAnyRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { title, description, category, location, coordinates, startDate, endDate, goalDescription, goalTarget, goalUnit, maxVolunteers, isUrgent, urgencyReason } = req.body;
    if (!title || !description) return res.status(400).json({ message: 'Title and description required' });

    const mission = await Mission.create({
      title, description, category: category || 'Other', location, coordinates, startDate, endDate,
      goalDescription, goalTarget: goalTarget || 100, goalUnit: goalUnit || 'people', maxVolunteers: maxVolunteers || 0,
      isUrgent: isUrgent || false, urgencyReason: urgencyReason || '',
      leader: req.user._id, status: 'active',
    });

    await ActivityLog.create({ userId: req.user._id, userName: req.user.name, action: `Created mission "${title}"`, type: 'system' });

    const notifPriority = isUrgent ? 'urgent' : 'normal';
    const notifTitle = isUrgent ? `🚨 URGENT: ${title}` : `New Mission: ${title}`;
    await notifyAllVolunteers(notifTitle, description.slice(0, 100), `/missions/${mission._id}`, 'mission', notifPriority);

    res.status(201).json(mission);
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

// PUT /api/missions/:id — admin+
router.put('/:id', protect, requireAnyRole('admin', 'super_admin'), async (req, res) => {
  try {
    const mission = await Mission.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('leader', 'name email').populate('volunteers', 'name email');
    if (!mission) return res.status(404).json({ message: 'Not found' });
    if (req.body.isUrgent && !mission.wasUrgent) {
      await notifyAllVolunteers(`🚨 URGENT: ${mission.title}`, req.body.urgencyReason || 'This mission needs urgent attention!', `/missions/${mission._id}`, 'urgent', 'urgent');
    }
    res.json(mission);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/missions/:id/join
router.post('/:id/join', protect, requireAnyRole('volunteer', 'admin', 'super_admin'), async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);
    if (!mission) return res.status(404).json({ message: 'Not found' });
    if (mission.volunteers.includes(req.user._id)) return res.status(400).json({ message: 'Already joined' });
    if (mission.maxVolunteers > 0 && mission.volunteers.length >= mission.maxVolunteers) return res.status(400).json({ message: 'Mission is full' });

    mission.volunteers.push(req.user._id);
    await mission.save();

    await User.findByIdAndUpdate(req.user._id, { $addToSet: { joinedMissions: mission._id }, $inc: { projectsJoined: 1 } });
    await ActivityLog.create({ userId: req.user._id, userName: req.user.name, action: `Joined mission "${mission.title}"`, type: 'system' });

    res.json({ message: 'Joined mission', mission });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/missions/:id/leave
router.post('/:id/leave', protect, async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);
    if (!mission) return res.status(404).json({ message: 'Not found' });
    mission.volunteers = mission.volunteers.filter(v => v.toString() !== req.user._id.toString());
    await mission.save();
    await User.findByIdAndUpdate(req.user._id, { $pull: { joinedMissions: mission._id } });
    res.json({ message: 'Left mission' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/missions/:id/progress — update goal progress
router.put('/:id/progress', protect, requireAnyRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { goalProgress, peopleHelped } = req.body;
    const mission = await Mission.findByIdAndUpdate(req.params.id, { goalProgress, peopleHelped }, { new: true });
    res.json(mission);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// DELETE /api/missions/:id
router.delete('/:id', protect, requireAnyRole('admin', 'super_admin'), async (req, res) => {
  try {
    await Mission.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
