const mongoose = require('mongoose');

const timeLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  missionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mission', default: null },
  startTime: { type: Date, default: null },
  endTime: { type: Date, default: null },
  // Precise duration
  durationSeconds: { type: Number, default: 0 },
  durationMinutes: { type: Number, default: 0 },
  totalHours: { type: Number, default: 0 }, // kept for compat
  formattedDuration: { type: String, default: '' },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
}, { timestamps: true });

// Helper: format seconds → "2h 14m" or "45m 30s"
timeLogSchema.statics.formatDuration = function(seconds) {
  if (!seconds || seconds < 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  if (m > 0 && s > 0) return `${m}m ${s}s`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
};

module.exports = mongoose.model('TimeLog', timeLogSchema);
