# CampusConnect 🎓

> Anonymous video chat exclusively for verified college students.

Connect randomly with peers from your campus — no names, no profiles. Just real conversations powered by WebRTC.

![Tech Stack](https://img.shields.io/badge/Next.js-14-black) ![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E)

---

## Features

- 🔐 **Verified Access** — Only `@lead.ac.in` emails can register (OTP-based)
- 🎥 **HD Video Chat** — WebRTC peer-to-peer video with STUN/ICE
- 💬 **Live Text Chat** — Real-time messaging alongside video
- 🔀 **Matchmaking** — Queue-based random pairing via Socket.IO
- 🚫 **Report System** — Flag inappropriate users
- 🛡️ **Admin Panel** — Block users, manage reports

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, Tailwind CSS, Socket.IO Client |
| Backend | Node.js, Express.js, Socket.IO |
| Database | PostgreSQL (Supabase) |
| Auth | Email OTP + JWT |
| Video | WebRTC (STUN/ICE) |
| Email | Nodemailer + Gmail SMTP |

---

## Local Development

### Prerequisites
- Node.js 18+
- A Supabase project (free tier works)
- Gmail account with **App Password** enabled

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/campusconnect.git
cd campusconnect

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Setup Database

Run `backend/schema.sql` in your Supabase SQL editor.

### 3. Configure Environment

**Backend** (`backend/.env`):
```env
PORT=5000
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres
JWT_SECRET=your-random-secret-key
EMAIL_USER=yourmail@gmail.com
EMAIL_PASS=your-gmail-app-password    # NOT your regular password!
FRONTEND_URL=http://localhost:3000
```

> **Gmail App Password**: Google Account → Security → 2-Step Verification → App Passwords

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 4. Run

```bash
# Terminal 1 — Backend
cd backend && npm start

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment

### Backend → Railway

1. Push code to GitHub
2. Create new project on [railway.app](https://railway.app) → Deploy from GitHub
3. Set environment variables in Railway dashboard
4. Copy the Railway public URL

### Frontend → Vercel

1. Import repository on [vercel.com](https://vercel.com)
2. Set root directory to `frontend`
3. Add environment variable `NEXT_PUBLIC_API_URL` = your Railway URL
4. Deploy!

### Update CORS

After deploying, update `FRONTEND_URL` in Railway to your Vercel URL:
```
FRONTEND_URL=https://campusconnect.vercel.app
```

---

## Project Structure

```
campusconnect/
├── backend/
│   ├── controllers/     # Business logic
│   ├── routes/          # Express routes
│   ├── services/        # DB + Email
│   ├── socket/          # Socket.IO matchmaking & signaling
│   └── server.js        # Entry point
└── frontend/
    └── src/
        ├── app/
        │   ├── chat/    # Video chat page
        │   └── page.js  # Landing page
        └── components/
            └── AuthModal.js
```

---

## License

MIT
