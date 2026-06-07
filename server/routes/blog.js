const express = require('express');
const BlogPost = require('../models/BlogPost');
const ActivityLog = require('../models/ActivityLog');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/blog — public
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { published: true };
    if (type) filter.type = type;
    const posts = await BlogPost.find(filter).populate('author', 'name role').sort({ createdAt: -1 }).limit(20);
    res.json(posts);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/blog/:id
router.get('/:id', async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id).populate('author', 'name role');
    if (!post) return res.status(404).json({ message: 'Not found' });
    post.views++;
    await post.save();
    res.json(post);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/blog — admin only
router.post('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const { title, content, excerpt, tags, type, eventDate } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'Title and content required' });
    const post = await BlogPost.create({ title, content, excerpt: excerpt || content.slice(0, 150) + '…', tags, type: type || 'blog', eventDate, author: req.user._id });
    await ActivityLog.create({ userId: req.user._id, userName: req.user.name, action: `Published "${title}"`, type: 'system' });
    res.status(201).json(post);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/blog/:id — admin
router.put('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(post);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// DELETE /api/blog/:id — admin
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    await BlogPost.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
