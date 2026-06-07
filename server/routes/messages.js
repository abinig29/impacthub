const express = require('express');
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/:roomId', protect, async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.roomId }).populate('senderId', 'name role').sort({ timestamp: 1 }).limit(100);
    res.json(messages);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.get('/rooms/list', protect, async (req, res) => {
  try {
    const rooms = await Message.distinct('roomId');
    res.json(rooms);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
