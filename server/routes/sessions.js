const express = require('express');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const Session = require('../models/Session');
const { protect, requireAnyRole } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, requireAnyRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { title, description, location, eventDate, maxVolunteers } = req.body;
    if (!title) return res.status(400).json({ message: 'Title required' });
    const qrCode = uuidv4();
    const qrCodeImage = await QRCode.toDataURL(qrCode, { width: 300 });
    const session = await Session.create({ title, description, location, eventDate: eventDate || Date.now(), maxVolunteers: maxVolunteers || 0, qrCode, qrCodeImage, createdBy: req.user._id });
    res.status(201).json(session);
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.get('/', protect, async (req, res) => {
  try {
    const sessions = await Session.find().populate('createdBy', 'name email').sort({ createdAt: -1 });
    res.json(sessions);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('createdBy', 'name email');
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.put('/:id', protect, requireAnyRole('admin', 'super_admin'), async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!session) return res.status(404).json({ message: 'Not found' });
    res.json(session);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.delete('/:id', protect, requireAnyRole('admin', 'super_admin'), async (req, res) => {
  try {
    await Session.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
