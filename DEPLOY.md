# Vercel Deployment Guide for PERSONAX

## Frontend (Vercel)
The frontend can be deployed directly to Vercel:

1. Go to https://vercel.com
2. Import your GitHub repo: `logeshkannan19/PERSONAX`
3. Select "Frontend" directory as root
4. Add environment variable: `NEXT_PUBLIC_API_URL`
5. Deploy!

## Backend (Railway/Render/AWS)
The backend needs a separate host. Recommended options:

### Option 1: Railway (Easiest)
1. Go to https://railway.app
2. Create new project, connect GitHub
3. Select PERSONAX repo
4. Set environment variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `REDIS_URL` - Redis connection string  
   - `JWT_SECRET` - Your secret key
   - `OPENAI_API_KEY` - Your OpenAI key
5. Deploy!

### Option 2: Render
1. Go to https://render.com
2. Create Web Service
3. Connect GitHub repo
4. Build command: `npm run build`
5. Start command: `npm start`

## Database Setup
Use Supabase or Neon for free PostgreSQL:
- https://supabase.com
- https://neon.tech

## Redis
Use Upstash for free Redis:
- https://upstash.com

## Demo
After deployment:
- Frontend: https://personax-frontend.vercel.app
- Backend API: https://personax-api.onrailway.app
- API Health: https://personax-api.onrailway.app/health