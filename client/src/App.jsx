import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import Layout from './components/layout/Layout'
import LoadingScreen from './components/ui/LoadingScreen'
import ToastContainer from './components/ui/ToastContainer'
import AIAssistant from './components/ui/AIAssistant'

// Eager — auth critical
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'

// Lazy — all protected pages
const Dashboard      = lazy(() => import('./pages/Dashboard'))
const MissionsPage   = lazy(() => import('./pages/MissionsPage'))
const StoriesPage    = lazy(() => import('./pages/StoriesPage'))
const QRScanner      = lazy(() => import('./pages/QRScanner'))
const ChatPage       = lazy(() => import('./pages/ChatPage'))
const VideoCall      = lazy(() => import('./pages/VideoCall'))
const Community      = lazy(() => import('./pages/Community'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const Profile        = lazy(() => import('./pages/Profile'))
const Leaderboard    = lazy(() => import('./pages/Leaderboard'))
const ImpactPage     = lazy(() => import('./pages/ImpactPage'))
const DonatePage     = lazy(() => import('./pages/DonatePage'))
const GalleryPage    = lazy(() => import('./pages/GalleryPage'))
const ImpactMap      = lazy(() => import('./pages/ImpactMap'))
const CalendarPage   = lazy(() => import('./pages/CalendarPage'))
const CertificatePage= lazy(() => import('./pages/CertificatePage'))

const Loader = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'50vh' }}>
    <div style={{ display:'flex', gap:'6px' }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#3dd68a', opacity:0.7, animation:'bounce 1s infinite', animationDelay:`${i*0.15}s` }} />
      ))}
    </div>
  </div>
)

function Protected({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

function AppContent() {
  const { user } = useAuth()
  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login"    element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

        {/* Public with layout */}
        <Route element={<Layout />}>
          <Route path="/impact" element={<Suspense fallback={<Loader />}><ImpactPage /></Suspense>} />
          <Route path="/donate" element={<Suspense fallback={<Loader />}><DonatePage /></Suspense>} />
        </Route>

        {/* Protected */}
        <Route element={<Layout />}>
          <Route path="/dashboard"   element={<Protected><Suspense fallback={<Loader />}><Dashboard /></Suspense></Protected>} />
          <Route path="/missions"    element={<Protected><Suspense fallback={<Loader />}><MissionsPage /></Suspense></Protected>} />
          <Route path="/stories"     element={<Protected><Suspense fallback={<Loader />}><StoriesPage /></Suspense></Protected>} />
          <Route path="/scanner"     element={<Protected roles={['admin','super_admin']}><Suspense fallback={<Loader />}><QRScanner /></Suspense></Protected>} />
          <Route path="/chat"        element={<Protected><Suspense fallback={<Loader />}><ChatPage /></Suspense></Protected>} />
          <Route path="/video"       element={<Protected><Suspense fallback={<Loader />}><VideoCall /></Suspense></Protected>} />
          <Route path="/community"   element={<Protected><Suspense fallback={<Loader />}><Community /></Suspense></Protected>} />
          <Route path="/leaderboard" element={<Protected><Suspense fallback={<Loader />}><Leaderboard /></Suspense></Protected>} />
          <Route path="/map"         element={<Protected><Suspense fallback={<Loader />}><ImpactMap /></Suspense></Protected>} />
          <Route path="/gallery"     element={<Protected><Suspense fallback={<Loader />}><GalleryPage /></Suspense></Protected>} />
          <Route path="/calendar"    element={<Protected><Suspense fallback={<Loader />}><CalendarPage /></Suspense></Protected>} />
          <Route path="/certificates"element={<Protected><Suspense fallback={<Loader />}><CertificatePage /></Suspense></Protected>} />
          <Route path="/profile"     element={<Protected><Suspense fallback={<Loader />}><Profile /></Suspense></Protected>} />
          <Route path="/admin"       element={<Protected roles={['admin','super_admin']}><Suspense fallback={<Loader />}><AdminDashboard /></Suspense></Protected>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {user && <AIAssistant />}
      <ToastContainer />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  )
}
