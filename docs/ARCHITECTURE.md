# Architecture Documentation

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    AutoLead.ai Frontend                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Dashboard  │  │   Orders    │  │   Order Detail      │  │
│  │  /dashboard │  │   /orders   │  │   /orders/[id]      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Next.js API Routes                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ /api/orders  │  │/api/priority │  │ /api/activities  │   │
│  │              │  │    -list     │  │                  │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Business Logic                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │Risk Scoring  │  │ Next Best    │  │ Priority List    │   │
│  │  Algorithm   │  │   Action     │  │  Generation      │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Prisma ORM + PostgreSQL                   │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐   │
│  │  User  │ │Customer│ │Vehicle │ │ Order  │ │ Activity │   │
│  └────────┘ └────────┘ └────────┘ └────────┘ └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Priority List Generation

```
1. Request: GET /api/priority-list
                    │
                    ▼
2. Fetch active orders from database
   (exclude DELIVERED, CANCELLED)
                    │
                    ▼
3. For each order:
   ├── Calculate risk score (0-100)
   ├── Determine risk level (HIGH/MEDIUM/LOW)
   ├── Identify risk factors
   └── Generate next best action
                    │
                    ▼
4. Sort by risk score (descending)
                    │
                    ▼
5. Assign ranks (1, 2, 3...)
                    │
                    ▼
6. Return priority list with summary stats
```

### Risk Score Calculation

```
┌─────────────────────────────────────────────────────────┐
│                    Risk Score (0-100)                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Silence Score (max 25)                                 │
│  └── Based on lastContactDaysAgo                        │
│      • 0-3 days: 0 points                              │
│      • 7+ days: 15 points                              │
│      • 14+ days: 25 points                             │
│                                                         │
│  Financing Score (max 30)                               │
│  └── Based on financingStatus + days pending           │
│      • APPROVED/CASH: 0 points                         │
│      • PENDING 2+ days: 15 points                      │
│      • PENDING 5+ days: 30 points                      │
│                                                         │
│  Delivery Delay Score (max 20)                          │
│  └── Based on expectedDeliveryDate                     │
│      • On time: 0 points                               │
│      • 1-3 days late: 10 points                        │
│      • 3+ days late: 20 points                         │
│                                                         │
│  Sentiment Score (max 15)                               │
│  └── Based on recent activity sentiment                │
│      • POSITIVE: 0 points                              │
│      • NEUTRAL: 5 points                               │
│      • NEGATIVE: 15 points                             │
│                                                         │
│  Stagnation Score (max 10)                              │
│  └── Based on days in current status                   │
│      • 0-3 days: 0 points                              │
│      • 5+ days: 10 points                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Database Schema

### Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐
│     User     │       │   Customer   │
├──────────────┤       ├──────────────┤
│ id           │       │ id           │
│ email        │       │ name         │
│ name         │       │ email        │
│ role         │       │ phone        │
│ avatar       │       │ preferredCh. │
└──────┬───────┘       └──────┬───────┘
       │                      │
       │ salesperson          │ customer
       │                      │
       ▼                      ▼
┌──────────────────────────────────────┐
│               Order                   │
├──────────────────────────────────────┤
│ id                                   │
│ customerId ─────────────────────────►│
│ vehicleId ──────────────────────────►│
│ salespersonId ──────────────────────►│
│ status                               │
│ source                               │
│ totalAmount                          │
│ financingStatus                      │
│ riskScore                            │
│ riskLevel                            │
│ fulfillmentProbability               │
│ lastContactAt                        │
│ expectedDeliveryDate                 │
└──────────────┬───────────────────────┘
               │
               │ order
               ▼
┌──────────────────────────────────────┐
│             Activity                  │
├──────────────────────────────────────┤
│ id                                   │
│ orderId ────────────────────────────►│
│ type                                 │
│ channel                              │
│ summary                              │
│ sentiment                            │
│ performedById ──────────────────────►│
│ performedAt                          │
└──────────────────────────────────────┘

┌──────────────┐
│   Vehicle    │
├──────────────┤
│ id           │
│ make         │
│ model        │
│ variant      │
│ year         │
│ color        │
│ vin          │
└──────────────┘
```

## Component Architecture

### UI Components (`/components/ui`)

Base components with no business logic:

| Component | Purpose |
|-----------|---------|
| Button | Action buttons with variants |
| Card | Container with padding |
| Badge | Status labels with colors |
| Input | Form text input |
| Select | Dropdown selection |
| Avatar | User profile images |
| Table | Data tables |

### AI Components (`/components/ai`)

Business-specific components:

| Component | Purpose |
|-----------|---------|
| RiskBadge | HIGH/MEDIUM/LOW indicator |
| PriorityScore | Risk score display with trend |
| NextBestActionCard | Recommended action card |
| RiskFactorList | List of risk factors |
| PriorityListItem | Order row in priority list |
| ActivityTimeline | Chronological activity history |

### Layout Components (`/components/layout`)

Page structure:

| Component | Purpose |
|-----------|---------|
| Sidebar | Navigation menu |
| PageContainer | Page wrapper with title |

## API Design

### Response Format

All API responses follow this structure:

```typescript
// Success
{
  success: true,
  data: T,
  meta?: {
    page: number,
    pageSize: number,
    total: number,
    totalPages: number
  }
}

// Error
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: object
  }
}
```

### Authentication (Planned)

```
┌─────────────────────────────────────────────────────────┐
│                   Authentication Flow                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. User visits protected route                         │
│                    │                                    │
│                    ▼                                    │
│  2. Middleware checks session                           │
│                    │                                    │
│          ┌────────┴────────┐                           │
│          │                 │                           │
│          ▼                 ▼                           │
│     [No Session]     [Has Session]                     │
│          │                 │                           │
│          ▼                 ▼                           │
│     Redirect to       Continue to                      │
│     /login            requested page                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Performance Considerations

### Database Indexes

```sql
-- Orders
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_vehicle ON orders(vehicle_id);
CREATE INDEX idx_orders_salesperson ON orders(salesperson_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_risk ON orders(risk_level);
CREATE INDEX idx_orders_created ON orders(created_at);

-- Activities
CREATE INDEX idx_activities_order ON activities(order_id);
CREATE INDEX idx_activities_performed ON activities(performed_at);
```

### Caching Strategy (Future)

```
┌─────────────────────────────────────────────────────────┐
│                    Caching Layers                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Layer 1: React Query (Client)                          │
│  └── Cache API responses for 5 minutes                  │
│                                                         │
│  Layer 2: Redis (Server) [Future]                       │
│  └── Cache priority list for 1 minute                   │
│  └── Cache order details for 5 minutes                  │
│                                                         │
│  Layer 3: Database Connection Pool                      │
│  └── Reuse connections via Prisma                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Security

### Current Implementation

- Environment variables for secrets
- SQL injection prevention via Prisma
- Input validation on API routes
- CORS handled by Next.js

### Planned Improvements

- [ ] Authentication (NextAuth.js)
- [ ] Role-based access control
- [ ] Rate limiting
- [ ] Audit logging
- [ ] Data encryption at rest

## Deployment

### Docker Compose (Development)

```yaml
services:
  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: autolead
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
```

### Production (Planned)

```
┌─────────────────────────────────────────────────────────┐
│                   Production Stack                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌────────────┐  │
│  │   Vercel    │    │   Neon DB   │    │ Prisma     │  │
│  │  (Next.js)  │◄──►│ (Postgres)  │◄──►│ Accelerate │  │
│  └─────────────┘    └─────────────┘    └────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Future Roadmap

### Phase 2.3: Authentication
- NextAuth.js integration
- Login/logout flows
- Protected routes

### Phase 3: Enhanced Features
- Quick actions from dashboard
- Filtering and search
- Performance analytics

### Phase 4: Integrations
- WhatsApp Business API
- DMS connectors
- ML model training
