const mongoose = require('mongoose');

const missionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['Food Distribution', 'School Support', 'Community Cleanup', 'Medical Support', 'Flood Relief', 'Emergency Response', 'Other'], default: 'Other' },
  status: { type: String, enum: ['planning', 'active', 'completed', 'cancelled'], default: 'planning' },
  isUrgent: { type: Boolean, default: false },
  urgencyReason: { type: String, default: '' },
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  volunteers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  maxVolunteers: { type: Number, default: 0 },
  // Location
  location: { type: String, default: '' },
  coordinates: { lat: { type: Number, default: 0 }, lng: { type: Number, default: 0 } },
  // Schedule
  startDate: { type: Date },
  endDate: { type: Date },
  // Goals
  goalDescription: { type: String, default: '' },
  goalTarget: { type: Number, default: 100 },
  goalProgress: { type: Number, default: 0 },
  goalUnit: { type: String, default: 'people' },
  // Media
  coverImage: { type: String, default: '' },
  photos: [{ url: String, caption: String, uploadedAt: { type: Date, default: Date.now } }],
  // Stats
  totalHoursLogged: { type: Number, default: 0 },
  totalMinutesLogged: { type: Number, default: 0 },
  peopleHelped: { type: Number, default: 0 },
  // RSVP
  rsvps: [{ userId: mongoose.Schema.Types.ObjectId, status: { type: String, enum: ['going', 'maybe', 'not_going'] } }],
}, { timestamps: true });

module.exports = mongoose.model('Mission', missionSchema);
