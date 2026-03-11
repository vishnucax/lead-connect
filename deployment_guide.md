# Deployment Guide - CampusConnect

Follow these steps to deploy CampusConnect to production.

## 1. Database Setup (PostgreSQL)

You can use **Render PostgreSQL** or any hosted PostgreSQL service (like Supabase or Aiven).

1. Create a new PostgreSQL instance.
2. Copy the **External Database URL**.
3. Run the initial schema by connecting to your DB and executing the content of `backend/schema.sql`.
   - *Tip*: You can use a tool like **DBeaver** or the **psql** CLI:
     ```bash
     psql -h <host> -U <user> -d <database> -f backend/schema.sql
     ```

## 2. Backend Deployment (Render)

1. **Dashboard**: Go to [Render](https://render.com/) and create a **New Web Service**.
2. **Repository**: Connect your GitHub repository.
3. **Configurations**:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. **Environment Variables**:
   - `PORT`: `5000`
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `JWT_SECRET`: A long random string.
   - `EMAIL_USER`: Your Gmail address.
   - `EMAIL_PASS`: Your Gmail [App Password](https://support.google.com/accounts/answer/185833).
   - `FRONTEND_URL`: Your Vercel URL (e.g., `https://campus-connect.vercel.app`).

## 3. Frontend Deployment (Vercel)

1. **Dashboard**: Go to [Vercel](https://vercel.com/) and **New Project**.
2. **Repository**: Select your repository.
3. **Configurations**:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Next.js`
4. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: Your Render backend URL (e.g., `https://campus-connect-api.onrender.com`).
5. **CORS Note**: Ensure that the `FRONTEND_URL` in the backend matches the final URL Vercel gives you.

## 4. Final Verification
- Once both are deployed, go to the Vercel URL.
- Test the OTP flow (requires a valid `@lead.ac.in` email).
- If testing locally, ensure you use `http://localhost:3000` as the `FRONTEND_URL` in your `.env`.
