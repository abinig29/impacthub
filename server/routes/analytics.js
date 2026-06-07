const express = require('express');
const User = require('../models/User');
const Session = require('../models/Session');
const TimeLog = require('../models/TimeLog');
const Donation = require('../models/Donation');
const ActivityLog = require('../models/ActivityLog');
const Mission = require('../models/Mission');
const { protect, requireAnyRole } = require('../middleware/auth');

const router = express.Router();

router.get('/public', async (req, res) => {
  try {
    const [totalUsers, totalSessions, donations, logs, missions] = await Promise.all([
      User.countDocuments({ role: { $ne: 'guest' } }),
      Session.countDocuments(),
      Donation.aggregate([{ $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      TimeLog.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, totalSeconds: { $sum: '$durationSeconds' }, totalMinutes: { $sum: '$durationMinutes' } } }]),
      Mission.countDocuments({ status: 'completed' }),
    ]);
    const totalSeconds = logs[0]?.totalSeconds || 0;
    const totalMinutes = logs[0]?.totalMinutes || 0;
    const allUsers = await User.find({ role: { $ne: 'guest' } }).select('peopleHelped');
    const peopleHelped = allUsers.reduce((a, u) => a + (u.peopleHelped || 0), 0);
    const activity = await ActivityLog.find().sort({ createdAt: -1 }).limit(12).lean();
    res.json({
      totalUsers, totalSessions, missions,
      totalHours: parseFloat((totalSeconds / 3600).toFixed(1)),
      formattedTotalTime: TimeLog.formatDuration(totalSeconds),
      totalDonations: donations[0]?.total || 0,
      donationCount: donations[0]?.count || 0,
      peopleHelped, activity,
    });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.get('/admin', protect, requireAnyRole('admin', 'super_admin'), async (req, res) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now - 7 * 86400000);
    const [totalUsers, activeSessions, weeklyLogs, topContributors, recentActivity, donations, urgentMissions] = await Promise.all([
      User.countDocuments(),
      Session.countDocuments({ activeStatus: true }),
      TimeLog.aggregate([{ $match: { status: 'completed', createdAt: { $gte: weekAgo } } }, { $group: { _id: null, totalSeconds: { $sum: '$durationSeconds' }, totalMinutes: { $sum: '$durationMinutes' }, count: { $sum: 1 } } }]),
      User.find({ role: 'volunteer' }).select('name totalHours totalMinutes impactScore level badges peopleHelped').sort({ impactScore: -1 }).limit(10),
      ActivityLog.find().sort({ createdAt: -1 }).limit(20).lean(),
      Donation.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Mission.countDocuments({ isUrgent: true, status: 'active' }),
    ]);
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now - i * 86400000);
      const dayStr = day.toISOString().split('T')[0];
      const dayLogs = await TimeLog.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: new Date(dayStr), $lt: new Date(new Date(dayStr).getTime() + 86400000) } } },
        { $group: { _id: null, seconds: { $sum: '$durationSeconds' }, minutes: { $sum: '$durationMinutes' } } }
      ]);
      const secs = dayLogs[0]?.seconds || 0;
      dailyData.push({ date: dayStr.slice(5), hours: parseFloat((secs / 3600).toFixed(2)), minutes: parseFloat((dayLogs[0]?.minutes || 0).toFixed(1)) });
    }
    const weekSeconds = weeklyLogs[0]?.totalSeconds || 0;
    res.json({
      totalUsers, activeSessions, urgentMissions,
      weeklyHours: parseFloat((weekSeconds / 3600).toFixed(2)),
      weeklyFormattedTime: TimeLog.formatDuration(weekSeconds),
      weeklyCheckins: weeklyLogs[0]?.count || 0,
      topContributors, recentActivity, dailyData,
      totalDonations: donations[0]?.total || 0,
    });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.get('/user/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    const allUsers = await User.find({ role: { $ne: 'guest' } }).select('impactScore').sort({ impactScore: -1 });
    const rank = allUsers.findIndex(u => u._id.toString() === req.params.id) + 1;
    const percentile = Math.max(1, Math.round(((allUsers.length - rank + 1) / allUsers.length) * 100));
    const logs = await TimeLog.find({ userId: req.params.id, status: 'completed' }).populate('sessionId', 'title').sort({ createdAt: -1 });
    const now = new Date();
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now - i * 86400000);
      const dayStr = day.toISOString().split('T')[0];
      const daySeconds = logs.filter(l => l.endTime && l.endTime.toISOString().startsWith(dayStr)).reduce((a, l) => a + (l.durationSeconds || 0), 0);
      chartData.push({ date: dayStr.slice(5), hours: parseFloat((daySeconds / 3600).toFixed(2)), minutes: parseFloat((daySeconds / 60).toFixed(1)) });
    }
    const totalSeconds = logs.reduce((a, l) => a + (l.durationSeconds || 0), 0);
    res.json({ user, rank, percentile, logs, chartData, formattedTotalTime: TimeLog.formatDuration(totalSeconds) });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
