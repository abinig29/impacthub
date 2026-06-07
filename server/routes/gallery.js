const express = require('express');
const Mission = require('../models/Mission');
const ActivityLog = require('../models/ActivityLog');
const { protect, requireAnyRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/gallery — all mission photos across all missions
router.get('/', protect, async (req, res) => {
  try {
    const { missionId, category } = req.query;
    const filter = {};
    if (missionId) filter._id = missionId;
    if (category) filter.category = category;
    
    const missions = await Mission.find(filter).select('title category photos coverImage status').sort({ createdAt: -1 });
    
    const albums = missions.map(m => ({
      missionId: m._id,
      title: m.title,
      category: m.category,
      status: m.status,
      cover: m.coverImage || (m.photos[0]?.url) || '',
      photoCount: m.photos.length,
      photos: m.photos,
    }));
    
    res.json(albums);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/gallery/:missionId/upload — add photo to mission (base64)
router.post('/:missionId/upload', protect, requireAnyRole('admin', 'super_admin', 'volunteer'), async (req, res) => {
  try {
    const { url, caption } = req.body;
    if (!url) return res.status(400).json({ message: 'Image URL or base64 required' });
    
    const mission = await Mission.findById(req.params.missionId);
    if (!mission) return res.status(404).json({ message: 'Mission not found' });
    
    // Check if volunteer is part of mission
    if (req.user.role === 'volunteer' && !mission.volunteers.includes(req.user._id)) {
      return res.status(403).json({ message: 'You must be part of this mission to upload photos' });
    }
    
    mission.photos.push({ url, caption: caption || '', uploadedAt: new Date() });
    if (!mission.coverImage && url) mission.coverImage = url;
    await mission.save();
    
    await ActivityLog.create({ userId: req.user._id, userName: req.user.name, action: `Uploaded photo to "${mission.title}"`, type: 'system' });
    
    res.json({ message: 'Photo uploaded', photos: mission.photos });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

// DELETE /api/gallery/:missionId/photo/:photoIndex
router.delete('/:missionId/photo/:photoIndex', protect, requireAnyRole('admin', 'super_admin'), async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.missionId);
    if (!mission) return res.status(404).json({ message: 'Not found' });
    mission.photos.splice(parseInt(req.params.photoIndex), 1);
    await mission.save();
    res.json({ message: 'Deleted', photos: mission.photos });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
