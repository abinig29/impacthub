const mongoose = require('mongoose');
const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  excerpt: { type: String, default: '' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tags: [{ type: String }],
  published: { type: Boolean, default: true },
  coverImage: { type: String, default: '' },
  views: { type: Number, default: 0 },
  type: { type: String, enum: ['blog', 'event', 'news'], default: 'blog' },
  eventDate: { type: Date },
}, { timestamps: true });
module.exports = mongoose.model('BlogPost', blogSchema);
