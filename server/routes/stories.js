const express = require('express');
const StoryPost = require('../models/StoryPost');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/stories
router.get('/', protect, async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query;
    const stories = await StoryPost.find()
      .populate('author', 'name role level badges impactScore')
      .populate('missionId', 'title category')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));
    res.json(stories);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/stories
router.post('/', protect, async (req, res) => {
  try {
    const { text, imageUrl, missionId, missionTitle, tags, isAchievement } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Story text required' });

    const story = await StoryPost.create({ author: req.user._id, text, imageUrl: imageUrl || '', missionId: missionId || null, missionTitle: missionTitle || '', tags: tags || [], isAchievement: isAchievement || false });
    const populated = await StoryPost.findById(story._id).populate('author', 'name role level badges impactScore');

    await ActivityLog.create({ userId: req.user._id, userName: req.user.name, action: `Shared a story: "${text.slice(0,60)}…"`, type: 'system' });
    res.status(201).json(populated);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/stories/:id/like
router.post('/:id/like', protect, async (req, res) => {
  try {
    const story = await StoryPost.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Not found' });
    const liked = story.likes.includes(req.user._id);
    if (liked) story.likes = story.likes.filter(l => l.toString() !== req.user._id.toString());
    else story.likes.push(req.user._id);
    await story.save();
    res.json({ liked: !liked, likeCount: story.likes.length });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/stories/:id/react
router.post('/:id/react', protect, async (req, res) => {
  try {
    const { reaction } = req.body; // heart|fire|clap|star
    const story = await StoryPost.findById(req.params.id);
    if (!story || !['heart','fire','clap','star'].includes(reaction)) return res.status(400).json({ message: 'Invalid' });
    story.reactions[reaction] = (story.reactions[reaction] || 0) + 1;
    await story.save();
    res.json({ reactions: story.reactions });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/stories/:id/comment
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text required' });
    const story = await StoryPost.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Not found' });
    story.comments.push({ userId: req.user._id, userName: req.user.name, text });
    await story.save();
    res.json({ comments: story.comments });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// DELETE /api/stories/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const story = await StoryPost.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Not found' });
    if (story.author.toString() !== req.user._id.toString() && !['admin','super_admin'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    await story.deleteOne();
    res.json({ message: 'Deleted' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
