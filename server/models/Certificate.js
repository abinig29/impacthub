const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const certSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  verificationId: { type: String, default: () => uuidv4().toUpperCase().slice(0,12) },
  recipientName: String,
  totalHours: Number,
  totalMinutes: Number,
  formattedDuration: String,
  missionsCompleted: Number,
  level: String,
  badges: [String],
  issuedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Certificate', certSchema);
