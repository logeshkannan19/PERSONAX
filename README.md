# PERSONAX — AI Personalization Engine

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

PERSONAX is an AI-powered personalization engine that helps businesses dynamically customize user experiences across websites, apps, and digital products.

## 🎯 Features

- **User Behavior Tracking** - Track clicks, scrolls, time spent, navigation paths
- **User Profile Engine** - Build dynamic profiles with interests, behavior patterns, engagement scores
- **AI Personalization** - Content & product recommendations using collaborative filtering + AI
- **Real-Time Decision Engine** - Show personalized CTAs, modify UI dynamically
- **Admin Dashboard** - Analytics, segment management, rule builder
- **JavaScript SDK** - Easy integration with any website
- **Auto Segmentation** - AI-powered user clustering (New, Active, High-Value, At-Risk)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐   │
│  │ Landing │  │Dashboard│  │ Analytics│  │ Login/Auth  │   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend API                           │
│  ┌──────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐      │
│  │  Auth   │ │ Events  │ │Users    │ │Recommendations│      │
│  └──────────┘ └─────────┘ └─────────┘ └──────────────┘      │
│  ┌──────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐      │
│  │Segments  │ │ Rules   │ │Analytics│ │   Webhooks   │      │
│  └──────────┘ └─────────┘ └─────────┘ └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌───────────┐       ┌───────────┐       ┌───────────┐
    │ PostgreSQL│       │   Redis   │       │  OpenAI   │
    │  (Data)   │       │ (Cache)   │       │   (AI)    │
    └───────────┘       └───────────┘       └───────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+

### 1. Clone & Install

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your settings

# Frontend
cd ../frontend
npm install
```

### 2. Database Setup

```bash
cd backend
npx prisma generate
npx prisma db push
# Optional: npx prisma db seed
```

### 3. Run Development

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

- API: http://localhost:3001
- Frontend: http://localhost:3000
- Health: http://localhost:3001/health

### 4. Using Docker

```bash
cd docker
docker-compose up --build
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Create organization + admin user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Events (SDK)
- `POST /sdk/v1/track` - Track user event
- `POST /sdk/v1/track/batch` - Batch track events
- `GET /api/events/session/:id` - Get session events

### Users
- `GET /api/users` - List users
- `POST /api/users` - Create user

### Profiles
- `GET /api/profiles` - List user profiles
- `GET /api/profiles/:id` - Get profile details
- `PUT /api/profiles/:id` - Update profile

### Websites
- `GET /api/websites` - List websites
- `POST /api/websites` - Create website
- `GET /api/websites/:id/stats` - Get website stats

### Recommendations
- `GET /api/recommendations/:profileId` - Get recommendations
- `POST /api/recommendations/:id/click` - Track click
- `POST /api/recommendations/:id/convert` - Track conversion

### Analytics
- `GET /api/analytics/overview` - Dashboard overview
- `GET /api/analytics/realtime` - Real-time visitors
- `GET /api/analytics/segments` - Segment distribution
- `GET /api/analytics/content` - Top content

### Segments
- `GET /api/segments` - List segments
- `POST /api/segments/auto-generate` - Auto-generate segments

### Rules
- `GET /api/rules` - List personalization rules
- `POST /api/rules` - Create rule
- `PATCH /api/rules/:id/toggle` - Toggle rule

## 🔌 SDK Usage

```html
<!-- Add to your website -->
<script>
  window.personaxConfig = {
    apiKey: 'pk_your_api_key',
    websiteId: 'your_website_id',
    track: ['clicks', 'scroll', 'time', 'forms'],
    debug: true
  };
</script>
<script src="https://cdn.personax.ai/personax.js"></script>

<!-- Or use npm -->
<!-- npm install @personax/sdk -->
```

```javascript
import Personax from '@personax/sdk';

const personax = new Personax({
  apiKey: 'pk_xxx',
  websiteId: 'xxx',
  track: ['clicks', 'scroll']
});

// Track custom event
personax.track('purchase', { amount: 99, plan: 'pro' });

// Identify logged-in user
personax.identify('user_123', { email: 'user@example.com', plan: 'enterprise' });
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS, ShadCN UI, Recharts
- **Backend**: Node.js, Express, Prisma, Socket.IO
- **Database**: PostgreSQL, Redis
- **AI**: OpenAI GPT-4, Embeddings
- **Deployment**: Docker, AWS/Vercel/Railway

## 📁 Project Structure

```
personax/
├── backend/
│   ├── src/
│   │   ├── auth/           # Authentication
│   │   ├── users/          # User management
│   │   ├── events/         # Event tracking
│   │   ├── recommendations/# AI recommendations
│   │   ├── analytics/      # Analytics
│   │   ├── segments/      # User segmentation
│   │   ├── rules/          # Personalization rules
│   │   ├── common/         # Shared utilities
│   │   └── index.ts        # Entry point
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js pages
│   │   ├── components/     # UI components
│   │   └── lib/            # Utilities
│   └── package.json
├── sdk/
│   └── javascript/         # Client SDK
├── docker/
│   └── docker-compose.yml  # Docker setup
└── docs/
    └── README.md           # This file
```

## 🔐 Environment Variables

```env
# Backend (.env)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/personax
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-xxx

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 📊 Data Models

### User Profile
- `anonymousId` - Unique visitor ID
- `interests` - Array of interest tags
- `engagementScore` - 0-100 score
- `visitCount` - Total visits
- `totalDuration` - Total time on site
- `lastActiveAt` - Last activity timestamp

### Event Types
- `PAGE_VIEW` - Page visits
- `CLICK` - Button/link clicks
- `SCROLL` - Scroll depth
- `TIME_ON_PAGE` - Time tracking
- `FORM_SUBMIT` - Form submissions
- `PURCHASE` - Conversions
- `SIGNUP` / `LOGIN` - Authentication

### Segments
- `NEW` - ≤2 visits
- `ACTIVE` - 20-60 engagement score
- `HIGH_VALUE` - ≥60 engagement score
- `AT_RISK` - Inactive 7-14 days
- `DORMANT` - Inactive >14 days

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# With coverage
npm test -- --coverage
```

## 📝 License

MIT License - see LICENSE file for details.

## 👏 Acknowledgments

- Built with Next.js, Express, Prisma
- UI powered by ShadCN/Tailwind
- Charts by Recharts

---

**PERSONAX** — Transform anonymous visitors into engaged users with AI-powered personalization.