const mongoose = require('mongoose');
const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String },
  action: { type: String, required: true },
  detail: { type: String, default: '' },
  type: { type: String, enum: ['checkin', 'checkout', 'chat', 'video', 'badge', 'donation', 'system'], default: 'system' },
}, { timestamps: true });
activitySchema.index({ createdAt: -1 });
module.exports = mongoose.model('ActivityLog', activitySchema);
