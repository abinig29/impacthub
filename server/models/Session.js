const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    qrCode: { type: String, required: true, unique: true },
    qrCodeImage: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    activeStatus: { type: Boolean, default: true },
    location: { type: String, default: '' },
    eventDate: { type: Date, default: Date.now },
    maxVolunteers: { type: Number, default: 0 },
    volunteers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Session', sessionSchema);
