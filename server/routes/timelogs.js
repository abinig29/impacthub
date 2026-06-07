const express = require('express');
const TimeLog = require('../models/TimeLog');
const Session = require('../models/Session');
const User = require('../models/User');
const Mission = require('../models/Mission');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const { protect, requireAnyRole } = require('../middleware/auth');

const router = express.Router();

function getDayStr(d) { return d.toISOString().split('T')[0]; }

async function updateStreak(user) {
  const today = getDayStr(new Date());
  const last = user.lastActiveDate ? getDayStr(user.lastActiveDate) : null;
  const yesterday = getDayStr(new Date(Date.now() - 86400000));
  if (last === today) return;
  user.currentStreak = (last === yesterday) ? (user.currentStreak || 0) + 1 : 1;
  if (user.currentStreak > (user.longestStreak || 0)) user.longestStreak = user.currentStreak;
  user.lastActiveDate = new Date();
}

// POST /api/timelogs/scan — admin/super_admin ONLY
router.post('/scan', protect, requireAnyRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { qrCode } = req.body;
    if (!qrCode) return res.status(400).json({ message: 'QR code required' });

    // Check if scanning a session QR
    const session = await Session.findOne({ qrCode });
    if (session) return res.json({ action: 'info', session, message: `Session: ${session.title} (${session.activeStatus ? 'Active' : 'Inactive'})` });

    // Try volunteer's personal QR
    const volunteer = await User.findOne({ qrCode });
    if (!volunteer) return res.status(404).json({ message: 'No volunteer or session found for this QR code' });

    const activeSession = await Session.findOne({ activeStatus: true }).sort({ createdAt: -1 });
    if (!activeSession) return res.status(404).json({ message: 'No active session. Create one first.' });

    const activeLog = await TimeLog.findOne({ userId: volunteer._id, sessionId: activeSession._id, status: 'active' });

    if (activeLog) {
      // CHECKOUT — precise time calculation
      const endTime = new Date();
      const durationSeconds = Math.floor((endTime - activeLog.startTime) / 1000);
      const durationMinutes = parseFloat((durationSeconds / 60).toFixed(2));
      const totalHours = parseFloat((durationSeconds / 3600).toFixed(4));
      const formattedDuration = TimeLog.formatDuration(durationSeconds);

      activeLog.endTime = endTime;
      activeLog.durationSeconds = durationSeconds;
      activeLog.durationMinutes = durationMinutes;
      activeLog.totalHours = totalHours;
      activeLog.formattedDuration = formattedDuration;
      activeLog.status = 'completed';
      await activeLog.save();

      // Update volunteer stats
      volunteer.totalMinutes = (volunteer.totalMinutes || 0) + durationMinutes;
      volunteer.totalHours = parseFloat((volunteer.totalMinutes / 60).toFixed(2));
      volunteer.weeklyMinutes = (volunteer.weeklyMinutes || 0) + durationMinutes;
      volunteer.monthlyMinutes = (volunteer.monthlyMinutes || 0) + durationMinutes;
      volunteer.sessionsAttended = (volunteer.sessionsAttended || 0) + 1;

      // Update weekly chart data
      const todayStr = getDayStr(new Date());
      const wData = volunteer.weeklyActivityData || [];
      const td = wData.find(d => d.date === todayStr);
      if (td) td.minutes += durationMinutes;
      else wData.push({ date: todayStr, minutes: durationMinutes });
      volunteer.weeklyActivityData = wData.slice(-7);

      await updateStreak(volunteer);

      if (!activeSession.volunteers?.includes(volunteer._id)) {
        activeSession.volunteers = [...(activeSession.volunteers || []), volunteer._id];
        volunteer.projectsJoined = (volunteer.projectsJoined || 0) + 1;
        await activeSession.save();
      }

      volunteer.recalculate();
      await volunteer.save();

      await ActivityLog.create({ userId: volunteer._id, userName: volunteer.name, action: `Checked out of "${activeSession.title}" (${formattedDuration})`, type: 'checkout', detail: formattedDuration });

      return res.json({
        action: 'stopped', volunteerName: volunteer.name,
        message: `✅ ${volunteer.name} checked OUT — ${formattedDuration}`,
        log: activeLog, session: activeSession, formattedDuration,
        totalHours: volunteer.totalHours, impactScore: volunteer.impactScore, level: volunteer.level, badges: volunteer.badges
      });
    } else {
      // CHECK-IN
      const log = await TimeLog.create({ userId: volunteer._id, sessionId: activeSession._id, startTime: new Date(), status: 'active' });
      await ActivityLog.create({ userId: volunteer._id, userName: volunteer.name, action: `Checked into "${activeSession.title}"`, type: 'checkin' });
      return res.json({ action: 'started', volunteerName: volunteer.name, message: `🟢 ${volunteer.name} checked IN to "${activeSession.title}"`, log, session: activeSession });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/timelogs/my
router.get('/my', protect, async (req, res) => {
  try {
    const logs = await TimeLog.find({ userId: req.user._id })
      .populate('sessionId', 'title location')
      .populate('missionId', 'title')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/timelogs — admin/super_admin
router.get('/', protect, requireAnyRole('admin', 'super_admin'), async (req, res) => {
  try {
    const logs = await TimeLog.find().populate('userId', 'name email').populate('sessionId', 'title').sort({ createdAt: -1 });
    res.json(logs);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
