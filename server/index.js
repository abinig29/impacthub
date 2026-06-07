require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const sessionRoutes = require('./routes/sessions');
const timelogRoutes = require('./routes/timelogs');
const messageRoutes = require('./routes/messages');
const donationRoutes = require('./routes/donations');
const blogRoutes = require('./routes/blog');
const analyticsRoutes = require('./routes/analytics');
const missionRoutes = require('./routes/missions');
const storiesRoutes = require('./routes/stories');
const notificationsRoutes = require('./routes/notifications');
const certificatesRoutes = require('./routes/certificates');
const calendarRoutes = require('./routes/calendar');
const galleryRoutes = require('./routes/gallery');
const { initSocket } = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET', 'POST'], credentials: true },
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use((req, res, next) => { req.io = io; next(); });

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/timelogs', timelogRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/certificates', certificatesRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/gallery', galleryRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '3.0', timestamp: new Date().toISOString() }));

initSocket(io);

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/impacthub')
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`🚀 ImpactHub v3 running on port ${PORT}`));
  })
  .catch((err) => { console.error('❌ MongoDB error:', err); process.exit(1); });

module.exports = { app, io };
