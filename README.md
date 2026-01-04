# AutoLead.ai

> **Decision Intelligence for Automotive Sales** — An AI-powered layer that tells salespeople exactly WHO to act on, WHY, and WHAT to do next.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Prisma](https://img.shields.io/badge/Prisma-7.2-2D3748)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)
![Tests](https://img.shields.io/badge/Tests-209%20passing-green)

## Overview

AutoLead is not another CRM — it's an AI co-pilot that sits on top of existing Dealer Management Systems (DMS) and helps salespeople prioritize their work with intelligent recommendations.

### Key Features

- **AI Priority List** — Orders ranked by risk score with explanations
- **Next Best Action** — Specific recommendations (call, message, email) with timing
- **Risk Scoring** — Dynamic 0-100 score based on multiple factors
- **Fulfillment Probability** — Live probability that updates based on signals
- **Activity Timeline** — Full history of customer interactions

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL 16, Prisma 7 |
| Testing | Jest, React Testing Library |
| Containerization | Docker |

## Quick Start

### Prerequisites

- Node.js 18+
- Docker Desktop
- Git

### Installation

```bash
# Clone the repository
git clone git@github.com:mathieuozer/autoleadai.git
cd autoleadai

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
│   │   ├── activities/    # Activity logging
│   │   └── priority-list/ # AI priority generation
│   ├── dashboard/         # Main dashboard
│   └── orders/           # Order pages
├── components/
│   ├── ui/               # Base UI components
│   ├── ai/               # AI-specific components
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
| `npm run test` | Run all tests |
| `npm run setup` | Setup database (Docker + seed) |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed database with mock data |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/orders` | GET | List orders with filters |
| `/api/orders/[id]` | GET | Order details |
| `/api/orders/[id]` | PATCH | Update order |
| `/api/priority-list` | GET | AI priority list |
| `/api/activities` | GET/POST | Activity management |

## Risk Scoring Algorithm

The risk score (0-100) is calculated from 5 factors:

| Factor | Max Points | Description |
|--------|------------|-------------|
| Silence | 25 | Days since last customer contact |
| Financing | 30 | Pending financing status duration |
| Delivery Delay | 20 | Days past expected delivery |
| Sentiment | 15 | Negative customer sentiment |
| Stagnation | 10 | Order stuck in same status |

**Risk Levels:**
- **HIGH** (60-100): Immediate attention required
- **MEDIUM** (30-59): Monitor closely
- **LOW** (0-29): On track

## Next Best Action Rules

| Scenario | Action | Channel | Urgency |
|----------|--------|---------|---------|
| Financing pending > 2 days | Follow up on approval | Call | TODAY |
| Delivery delayed | Notify with new ETA | WhatsApp | NOW |
| Delivery delayed + negative sentiment | Escalation call | Call | NOW |
| Vehicle arrived | Schedule delivery | WhatsApp | TODAY |
| Silence > 7 days | Check-in message | WhatsApp | THIS_WEEK |
| High-value + silence > 3 days | Personal call | Call | TODAY |

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/autolead"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

**Current Coverage:** 209 tests passing

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Proprietary - All rights reserved

## Support

For questions or issues, contact the development team.

---

Built with Claude Code
