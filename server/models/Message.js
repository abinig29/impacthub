const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    roomId: { type: String, required: true },
    text: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now },
    type: { type: String, enum: ['text', 'system'], default: 'text' },
  },
  { timestamps: true }
);

messageSchema.index({ roomId: 1, timestamp: 1 });

module.exports = mongoose.model('Message', messageSchema);
