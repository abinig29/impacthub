const mongoose = require('mongoose');

const calendarSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['mission', 'meeting', 'reminder', 'event'], default: 'event' },
  missionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mission', default: null },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rsvps: [{ userId: mongoose.Schema.Types.ObjectId, status: String }],
  location: String,
  isAllDay: { type: Boolean, default: false },
  color: { type: String, default: '#16b36e' },
}, { timestamps: true });

module.exports = mongoose.model('CalendarEvent', calendarSchema);
