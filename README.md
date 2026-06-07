# ImpactHub v3 — Intelligent Volunteer Platform

A production-ready fullstack volunteer management platform.

## Quick Start

### Requirements
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Backend
```bash
cd server
cp .env.example .env      # edit MONGODB_URI
npm install
npm run dev               # http://localhost:5000
```

### 2. Frontend
```bash
cd client
npm install
npm run dev               # http://localhost:5173
```

Open http://localhost:5173

---

## Environment Variables

### server/.env
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/impacthub
JWT_SECRET=change_this_to_something_long_and_random
CLIENT_URL=http://localhost:5173
SUPER_ADMIN_EMAIL=fnigus33@gmail.com
NODE_ENV=development
```

### client/.env (production only)
```
VITE_API_URL=https://your-backend.onrender.com
```
For local dev, the Vite proxy handles API routing automatically — no client .env needed.

---

## First Admin Setup
1. Register at /register with email `fnigus33@gmail.com`
2. That account is **automatically** given `super_admin` role
3. Or register any account, then set `role: "admin"` in MongoDB Compass

---

## Features
- **QR Attendance** — Admin scans volunteer QR codes, precise time tracking
- **Live Missions** — Create/manage humanitarian missions with goals, urgency, media
- **Real-Time Chat** — 4 channels, typing indicators, emoji, online presence
- **WebRTC Video** — Peer-to-peer calls, host controls, screen share, raise hand
- **AI Assistant** — Built-in chatbot for mission recommendations and stats
- **Impact Map** — Leaflet.js live mission map with markers
- **Gamification** — Impact scores, XP levels, badges, leaderboard
- **Certificates** — Auto-generated verified volunteer certificates
- **Fundraising** — Project-based donation goals with progress tracking
- **Admin Panel** — Full user/session/mission management, analytics charts
- **Multi-language** — English + Amharic (i18next)
- **Story Feed** — Instagram-style impact stories with likes/comments

---

## Tech Stack
**Frontend:** React 18 · Vite · Tailwind CSS · Recharts · Socket.io-client · html5-qrcode · i18next  
**Backend:** Node.js · Express · MongoDB (Mongoose) · Socket.io · JWT · bcryptjs · QRCode  
**Real-time:** Socket.io for chat + WebRTC signaling  
**Video:** WebRTC peer-to-peer  

---

## Deployment

### Frontend → Vercel
```bash
cd client
npm run build
# Push to GitHub, connect to Vercel
# Set VITE_API_URL=https://your-backend.onrender.com
```

### Backend → Render
```bash
# Set environment variables in Render dashboard
# Build: npm install
# Start: npm start
```

---

## Project Structure
```
impacthub/
├── server/
│   ├── index.js              # Express + Socket.io entry
│   ├── middleware/auth.js    # JWT + role guards (4 roles)
│   ├── models/               # 12 Mongoose models
│   ├── routes/               # 14 API route files
│   └── socket/socketHandler.js
│
└── client/src/
    ├── App.jsx               # Routes (all lazy-loaded)
    ├── main.jsx
    ├── index.css             # Design system
    ├── context/              # AuthContext, NotificationContext
    ├── utils/                # api.js (Axios), socket.js
    ├── i18n/                 # EN + Amharic translations
    ├── components/
    │   ├── layout/Layout.jsx # Sidebar navigation
    │   └── ui/               # LoadingScreen, Toast, AIAssistant
    └── pages/                # 19 pages
```

---

## Roles
| Role | Access |
|------|--------|
| `super_admin` | Full platform control, manage admins |
| `admin` | Sessions, missions, users, QR scanner |
| `volunteer` | Join missions, chat, video, stories |
| `guest` | Read-only + video calls |

Super admin email is hardcoded: `fnigus33@gmail.com`
