# CampusConnect

CampusConnect is a private Omegle-style video/text chat platform exclusively for verified college students.

## Features
- **Video Chat**: Real-time peer-to-peer video using WebRTC.
- **Text Chat**: Seamless messaging during video sessions.
- **Verification**: OTP-based signup with college email domain (`@lead.ac.in`).
- **Matchmaking**: Instant pairing with random online students.
- **Moderation**: Reporting system and admin dashboard for blocking users.

## Project Structure
- `frontend/`: Next.js web application.
- `backend/`: Node.js Express server with Socket.io.

## Quick Start

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL

### 2. Backend Setup
1. `cd backend`
2. `npm install`
3. Create a `.env` file (see `.env.example`).
4. `node server.js`

### 3. Frontend Setup
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Deployment
Refer to [deployment_guide.md](.deployment_guide.md) for instructions on Render and Vercel.
