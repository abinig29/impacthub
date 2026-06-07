const mongoose = require('mongoose');
const donationSchema = new mongoose.Schema({
  donorName: { type: String, default: 'Anonymous' },
  donorEmail: { type: String, default: '' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', default: null },
  projectTitle: { type: String, default: 'General Fund' },
  message: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'completed'], default: 'completed' },
}, { timestamps: true });
module.exports = mongoose.model('Donation', donationSchema);
