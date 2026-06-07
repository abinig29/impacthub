const express = require('express');
const CalendarEvent = require('../models/CalendarEvent');
const { protect, requireAnyRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = {};
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      filter.startDate = { $gte: start, $lte: end };
    }
    const events = await CalendarEvent.find(filter).populate('createdBy', 'name').sort({ startDate: 1 });
    res.json(events);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.post('/', protect, requireAnyRole('admin', 'super_admin'), async (req, res) => {
  try {
    const event = await CalendarEvent.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(event);
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.post('/:id/rsvp', protect, async (req, res) => {
  try {
    const { status } = req.body; // going|maybe|not_going
    const event = await CalendarEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Not found' });
    event.rsvps = event.rsvps.filter(r => r.userId.toString() !== req.user._id.toString());
    event.rsvps.push({ userId: req.user._id, status });
    await event.save();
    res.json(event);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.delete('/:id', protect, requireAnyRole('admin', 'super_admin'), async (req, res) => {
  try {
    await CalendarEvent.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
