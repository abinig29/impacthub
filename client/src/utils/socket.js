import { io } from 'socket.io-client'

let socket = null

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export function getSocket() {
  return socket
}

export function connectSocket(token) {
  if (socket?.connected) return socket

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  })

  socket.on('connect', () => console.log('🔌 Socket connected'))
  socket.on('disconnect', (reason) => console.log('❌ Socket disconnected:', reason))
  socket.on('connect_error', (err) => console.warn('⚠️ Socket error:', err.message))

  return socket
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null }
}
