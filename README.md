# AutoLead.ai

> **Decision Intelligence for Automotive Sales** — An AI-powered layer that tells salespeople exactly WHO to act on, WHY, and WHAT to do next.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Prisma](https://img.shields.io/badge/Prisma-7.2-2D3748)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)

## Overview

AutoLead is not another CRM — it's an AI co-pilot that sits on top of existing Dealer Management Systems (DMS) and helps salespeople prioritize their work with intelligent recommendations.

### Key Features

- **AI Priority List** — Orders ranked by risk score with explanations
- **Next Best Action** — Specific recommendations (call, message, email) with timing
- **Risk Scoring** — Dynamic 0-100 score based on multiple factors
- **Trade-In Portal** — Mobile-first 4-step wizard for vehicle appraisals
- **Activity Timeline** — Full history of customer interactions

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL 16, Prisma 7 |
| Containerization | Docker |

## Quick Start

### Prerequisites

- Node.js 18+
- Docker Desktop
- Git

### Installation

```bash
# Clone the repository
git clone git@github.com:your-repo/autolead-mvp3.git
cd autolead-mvp3

# Install dependencies
npm install

# Setup database (starts Docker, creates DB, seeds data)
npm run setup

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── orders/        # Orders CRUD
│   │   ├── customers/     # Customer management
│   │   ├── users/         # User management
│   │   ├── trade-ins/     # Trade-in appraisals
│   │   ├── activities/    # Activity logging
│   │   └── priority-list/ # AI priority generation
│   ├── dashboard/         # Main dashboard
│   ├── orders/            # Order pages
│   └── trade-in/          # Trade-in wizard
├── components/
│   ├── ui/               # Base UI components
│   ├── ai/               # AI-specific components
│   ├── trade-in/         # Trade-in components
│   └── layout/           # Layout components
├── hooks/                # Custom React hooks
├── lib/                  # Business logic
│   ├── db/              # Database client
│   ├── risk-scoring.ts  # Risk algorithm
│   ├── next-best-action.ts # NBA rules
│   └── priority-list.ts # Priority generation
└── types/               # TypeScript types
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run setup` | Setup database (Docker + seed) |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed database with mock data |

## API Endpoints

### Orders
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/orders` | GET | List orders with filters |
| `/api/orders/[id]` | GET | Order details |
| `/api/orders/[id]` | PATCH | Update order |
| `/api/priority-list` | GET | AI priority list |

### Trade-In
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/trade-ins` | GET/POST | List/create appraisals |
| `/api/trade-ins/[id]` | GET/PATCH | Get/update appraisal |
| `/api/trade-ins/[id]/photos` | GET/POST | Manage photos |
| `/api/trade-ins/[id]/submit` | POST | Submit for review |
| `/api/trade-ins/[id]/review` | POST | Inspector review |

### Other
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/customers` | GET/POST | Customer management |
| `/api/users` | GET | User listing |
| `/api/activities` | GET/POST | Activity management |

## Trade-In Portal

Mobile-first 4-step wizard for vehicle trade-in appraisals:

1. **Registration** — Upload vehicle registration card (OCR extraction)
2. **Details** — Mileage, price, condition, features
3. **Photos** — 8 required vehicle photos
4. **Review** — Submit for inspector review

## Risk Scoring Algorithm

The risk score (0-100) is calculated from 5 factors:

| Factor | Max Points | Description |
|--------|------------|-------------|
| Silence | 25 | Days since last customer contact |
| Financing | 30 | Pending financing status duration |
| Delivery Delay | 20 | Days past expected delivery |
| Sentiment | 15 | Negative customer sentiment |
| Stagnation | 10 | Order stuck in same status |

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/autolead"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Documentation

- [CLAUDE.md](./CLAUDE.md) — Project context for AI assistants
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Technical architecture
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) — UI/UX guidelines
- [TRADE_IN_PORTAL.md](./TRADE_IN_PORTAL.md) — Trade-in feature spec
- [docs/API.md](./docs/API.md) — API documentation

## Deployment

See [docs/AZURE_DEPLOYMENT.md](./docs/AZURE_DEPLOYMENT.md) for Azure deployment guide.

## License

Proprietary - All rights reserved

---

Built with Claude Code
