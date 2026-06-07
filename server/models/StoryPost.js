const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: String,
  text: String,
  createdAt: { type: Date, default: Date.now },
});

const storySchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, maxlength: 1000 },
  imageUrl: { type: String, default: '' },
  missionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mission', default: null },
  missionTitle: { type: String, default: '' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reactions: {
    heart: { type: Number, default: 0 },
    fire: { type: Number, default: 0 },
    clap: { type: Number, default: 0 },
    star: { type: Number, default: 0 },
  },
  comments: [commentSchema],
  tags: [{ type: String }],
  isAchievement: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('StoryPost', storySchema);
