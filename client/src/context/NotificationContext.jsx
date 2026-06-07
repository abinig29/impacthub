import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import api from '../utils/api'
import { getSocket } from '../utils/socket'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [toasts, setToasts] = useState([])

  const load = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await api.get('/notifications')
      setNotifications(data.notifications || [])
      setUnread(data.unread || 0)
    } catch {}
  }, [user])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const onNotif = (notif) => {
      setNotifications(prev => [notif, ...prev])
      setUnread(prev => prev + 1)
      addToast(notif.title, notif.message, notif.priority === 'urgent' ? 'urgent' : 'info')
    }
    socket.on('notification', onNotif)
    return () => socket.off('notification', onNotif)
  }, [])

  const addToast = useCallback((title, message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, title, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000)
  }, [])

  const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), [])

  const markAllRead = async () => {
    await api.put('/notifications/read-all')
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnread(0)
  }

  return (
    <NotificationContext.Provider value={{ notifications, unread, toasts, load, addToast, removeToast, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be inside NotificationProvider')
  return ctx
}
