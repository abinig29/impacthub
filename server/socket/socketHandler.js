const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

const connectedUsers = new Map();
const videoRooms = new Map();

function initSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch { next(new Error('Invalid token')); }
  });

  io.on('connection', (socket) => {
    const { user } = socket;
    console.log(`🔌 ${user.name} (${user.role}) connected`);

    connectedUsers.set(socket.id, { userId: user._id.toString(), name: user.name, role: user.role, socketId: socket.id });
    io.emit('online_users', Array.from(connectedUsers.values()));

    // ── CHAT ──
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      socket.to(roomId).emit('user_joined', { name: user.name, roomId });
    });
    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      socket.to(roomId).emit('user_left', { name: user.name, roomId });
    });
    socket.on('send_message', async ({ roomId, text }) => {
      try {
        if (!roomId || !text?.trim()) return;
        const message = await Message.create({ senderId: user._id, roomId, text: text.trim(), timestamp: new Date() });
        const populated = await Message.findById(message._id).populate('senderId', 'name role');
        io.to(roomId).emit('receive_message', populated);
        // Increment collab score
        await User.findByIdAndUpdate(user._id, { $inc: { collaborationScore: 1 } });
        const updatedUser = await User.findById(user._id);
        if (updatedUser) { updatedUser.recalculate(); await updatedUser.save(); }
      } catch (err) { console.error('Message error:', err); }
    });
    socket.on('typing', ({ roomId }) => socket.to(roomId).emit('user_typing', { name: user.name, roomId }));
    socket.on('stop_typing', ({ roomId }) => socket.to(roomId).emit('user_stop_typing', { name: user.name, roomId }));

    // ── VIDEO CALL ──
    socket.on('join_video_room', (roomId) => {
      socket.join(`video:${roomId}`);
      const isHost = !videoRooms.has(roomId);
      if (isHost) videoRooms.set(roomId, { host: socket.id, participants: new Map() });
      const room = videoRooms.get(roomId);
      room.participants.set(socket.id, { name: user.name, role: user.role, handRaised: false, muted: false });
      socket.to(`video:${roomId}`).emit('peer_joined', { socketId: socket.id, name: user.name, isHost });
      const participants = Array.from(room.participants.entries()).map(([sid, info]) => ({ socketId: sid, ...info, isHost: sid === room.host }));
      socket.emit('room_participants', { participants, hostSocketId: room.host });
    });
    socket.on('leave_video_room', (roomId) => {
      socket.leave(`video:${roomId}`);
      const room = videoRooms.get(roomId);
      if (room) {
        room.participants.delete(socket.id);
        if (room.host === socket.id && room.participants.size > 0) {
          const newHost = room.participants.keys().next().value;
          room.host = newHost;
          io.to(newHost).emit('host_transferred', { newHostId: newHost });
        }
        if (room.participants.size === 0) videoRooms.delete(roomId);
      }
      socket.to(`video:${roomId}`).emit('peer_left', { socketId: socket.id });
    });
    socket.on('host_mute_participant', ({ roomId, targetSocketId }) => {
      const room = videoRooms.get(roomId);
      if (!room || room.host !== socket.id) return;
      io.to(targetSocketId).emit('force_muted', { by: user.name });
      if (room.participants.has(targetSocketId)) room.participants.get(targetSocketId).muted = true;
    });
    socket.on('host_kick_participant', ({ roomId, targetSocketId }) => {
      const room = videoRooms.get(roomId);
      if (!room || room.host !== socket.id) return;
      io.to(targetSocketId).emit('kicked_from_room', { by: user.name });
      room.participants.delete(targetSocketId);
      socket.to(`video:${roomId}`).emit('peer_left', { socketId: targetSocketId });
    });
    socket.on('raise_hand', ({ roomId }) => {
      const room = videoRooms.get(roomId);
      if (room?.participants.has(socket.id)) room.participants.get(socket.id).handRaised = true;
      io.to(`video:${roomId}`).emit('hand_raised', { socketId: socket.id, name: user.name });
    });
    socket.on('lower_hand', ({ roomId }) => {
      const room = videoRooms.get(roomId);
      if (room?.participants.has(socket.id)) room.participants.get(socket.id).handRaised = false;
      io.to(`video:${roomId}`).emit('hand_lowered', { socketId: socket.id });
    });
    socket.on('screen_share_start', ({ roomId }) => socket.to(`video:${roomId}`).emit('peer_screen_share', { socketId: socket.id, sharing: true }));
    socket.on('screen_share_stop', ({ roomId }) => socket.to(`video:${roomId}`).emit('peer_screen_share', { socketId: socket.id, sharing: false }));
    socket.on('webrtc_offer', ({ to, offer }) => io.to(to).emit('webrtc_offer', { from: socket.id, offer, name: user.name }));
    socket.on('webrtc_answer', ({ to, answer }) => io.to(to).emit('webrtc_answer', { from: socket.id, answer }));
    socket.on('ice_candidate', ({ to, candidate }) => io.to(to).emit('ice_candidate', { from: socket.id, candidate }));
    socket.on('generate_meeting_link', ({ roomId }) => {
      if (['admin','super_admin'].includes(user.role)) {
        const link = `${process.env.CLIENT_URL || 'http://localhost:5173'}/video?room=${roomId}`;
        socket.emit('meeting_link_generated', { link, roomId });
      }
    });

    // ── NOTIFICATIONS broadcast ──
    socket.on('broadcast_notification', async (data) => {
      if (!['admin','super_admin'].includes(user.role)) return;
      io.emit('notification', data);
    });

    // ── ACTIVITY TICKER ──
    socket.on('activity_update', (data) => io.emit('activity_update', data));

    // ── DISCONNECT ──
    socket.on('disconnect', () => {
      connectedUsers.delete(socket.id);
      io.emit('online_users', Array.from(connectedUsers.values()));
      for (const [roomId, room] of videoRooms.entries()) {
        if (room.participants.has(socket.id)) {
          room.participants.delete(socket.id);
          socket.to(`video:${roomId}`).emit('peer_left', { socketId: socket.id });
          if (room.participants.size === 0) videoRooms.delete(roomId);
        }
      }
      console.log(`❌ ${user.name} disconnected`);
    });
  });
}

module.exports = { initSocket };
