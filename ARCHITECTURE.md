# AutoLead.ai - Technical Architecture

## System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React/Next.js)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│  │ Salesperson │  │  Manager    │  │  Customer   │               │
│  │  Dashboard  │  │  Dashboard  │  │   Portal    │               │
│  └─────────────┘  └─────────────┘  └─────────────┘               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                     API GATEWAY / BFF                             │
│              (Authentication, Rate Limiting, Routing)             │
└──────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   Order       │    │   AI Engine   │    │  Integration  │
│   Service     │    │   Service     │    │   Service     │
│               │    │               │    │               │
│ - Orders      │    │ - Risk Score  │    │ - DMS Sync    │
│ - Customers   │    │ - NBA Engine  │    │ - ERP Sync    │
│ - Leads       │    │ - Probability │    │ - WhatsApp    │
│ - Activities  │    │ - Coaching    │    │ - Telephony   │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│  │ PostgreSQL  │  │    Redis    │  │ TimeSeries  │               │
│  │ (Primary)   │  │  (Cache)    │  │   (Events)  │               │
│  └─────────────┘  └─────────────┘  └─────────────┘               │
└──────────────────────────────────────────────────────────────────┘
```

## Core Services

### 1. Order Service
Manages the core business entities.

**Entities:**
- `Lead` - Potential customer before order
- `Customer` - Contact information, preferences
- `Order` - Vehicle order with status lifecycle
- `Activity` - All interactions (calls, messages, visits)
- `Vehicle` - Inventory items

**Key APIs:**
```
GET    /api/orders                    # List orders (with filters)
GET    /api/orders/:id                # Get order details
GET    /api/orders/:id/timeline       # Order activity timeline
POST   /api/orders/:id/activities     # Log new activity
GET    /api/leads                     # List leads
GET    /api/leads/priority            # Get prioritized lead list
```

### 2. AI Engine Service
Powers all intelligent features.

**Capabilities:**
- **Risk Scoring** - Calculate order risk scores
- **Priority Ranking** - Daily prioritized action list
- **Next-Best-Action** - Context-aware recommendations
- **Probability Forecast** - Fulfillment likelihood
- **Coaching Insights** - Performance-based suggestions

**Key APIs:**
```
GET    /api/ai/priority-list          # Today's priority list
GET    /api/ai/orders/:id/risk        # Risk score for order
GET    /api/ai/orders/:id/nba         # Next best action
GET    /api/ai/orders/:id/probability # Fulfillment probability
GET    /api/ai/coaching/:userId       # Coaching insights
POST   /api/ai/explain/:scoreId       # Explain a score/recommendation
```

### 3. Integration Service
Connects to external systems.

**Integrations:**
- DMS (Dealer Management System) - Vehicle data, orders
- ERP - Financial data, invoicing
- WhatsApp Business API - Messaging
- Telephony - Call logging, recordings
- Email - Communication tracking

**Key APIs:**
```
POST   /api/integrations/sync         # Trigger sync
GET    /api/integrations/status       # Integration health
POST   /api/integrations/whatsapp/send
POST   /api/integrations/email/send
```

## Data Models

### Order
```typescript
interface Order {
  id: string;
  customerId: string;
  vehicleId: string;
  status: OrderStatus;
  source: 'WALK_IN' | 'WHATSAPP' | 'WEBSITE' | 'PHONE' | 'REFERRAL';
  
  // Dates
  createdAt: DateTime;
  updatedAt: DateTime;
  expectedDeliveryDate: DateTime;
  
  // Financial
  totalAmount: number;
  bookingAmount: number;
  financingStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CASH';
  
  // AI Fields (computed)
  riskScore: number;           // 0-100
  fulfillmentProbability: number; // 0-100
  priorityRank: number;
  lastContactDaysAgo: number;
  
  // Relations
  customer: Customer;
  vehicle: Vehicle;
  activities: Activity[];
  salesperson: User;
}

type OrderStatus = 
  | 'NEW'
  | 'CONTACTED'
  | 'TEST_DRIVE_SCHEDULED'
  | 'TEST_DRIVE_DONE'
  | 'NEGOTIATION'
  | 'BOOKING_DONE'
  | 'FINANCING_PENDING'
  | 'FINANCING_APPROVED'
  | 'READY_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';
```

### AI Priority Item
```typescript
interface PriorityItem {
  id: string;
  orderId: string;
  order: Order;
  
  // Priority
  rank: number;
  riskScore: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  riskFactors: RiskFactor[];
  
  // Recommendation
  nextBestAction: NextBestAction;
  
  // Meta
  generatedAt: DateTime;
  expiresAt: DateTime;
}

interface RiskFactor {
  factor: string;           // e.g., "financing_pending"
  impact: number;           // contribution to risk score
  description: string;      // human-readable explanation
}

interface NextBestAction {
  action: string;           // e.g., "Call customer"
  channel: 'CALL' | 'WHATSAPP' | 'EMAIL' | 'IN_PERSON';
  urgency: 'NOW' | 'TODAY' | 'THIS_WEEK';
  suggestedMessage?: string;
  expectedImpact: string;   // e.g., "Reduces cancellation risk by 18%"
  reasoning: string;        // Why this action
}
```

### Activity
```typescript
interface Activity {
  id: string;
  orderId: string;
  type: ActivityType;
  channel: 'CALL' | 'WHATSAPP' | 'EMAIL' | 'IN_PERSON' | 'SYSTEM';
  
  // Content
  summary: string;
  details?: string;
  sentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  
  // Meta
  performedBy: string;      // userId or 'SYSTEM'
  performedAt: DateTime;
  duration?: number;        // for calls, in seconds
  
  // AI-generated
  aiSummary?: string;
  nextActionSuggested?: string;
}

type ActivityType = 
  | 'CALL_OUTBOUND'
  | 'CALL_INBOUND'
  | 'WHATSAPP_SENT'
  | 'WHATSAPP_RECEIVED'
  | 'EMAIL_SENT'
  | 'EMAIL_RECEIVED'
  | 'VISIT'
  | 'TEST_DRIVE'
  | 'STATUS_CHANGE'
  | 'NOTE';
```

## AI Engine Details

### Risk Score Calculation

```python
# Simplified risk scoring logic
def calculate_risk_score(order):
    score = 0
    factors = []
    
    # Time since last contact (max 25 points)
    days_silent = (now - order.last_contact_at).days
    if days_silent > 7:
        points = min(25, days_silent * 2)
        score += points
        factors.append(RiskFactor("silence", points, f"No contact for {days_silent} days"))
    
    # Financing status (max 30 points)
    if order.financing_status == 'PENDING':
        days_pending = (now - order.financing_submitted_at).days
        if days_pending > 2:
            points = min(30, days_pending * 5)
            score += points
            factors.append(RiskFactor("financing", points, f"Financing pending {days_pending} days"))
    
    # Delivery delay (max 20 points)
    if order.expected_delivery_date < order.original_delivery_date:
        delay_days = (order.expected_delivery_date - order.original_delivery_date).days
        points = min(20, delay_days * 4)
        score += points
        factors.append(RiskFactor("delay", points, f"Delivery delayed by {delay_days} days"))
    
    # Customer sentiment (max 15 points)
    if order.latest_sentiment == 'NEGATIVE':
        score += 15
        factors.append(RiskFactor("sentiment", 15, "Negative customer sentiment detected"))
    
    # Historical patterns (max 10 points)
    if customer_has_cancelled_before(order.customer_id):
        score += 10
        factors.append(RiskFactor("history", 10, "Customer has cancelled orders before"))
    
    return RiskScore(
        value=min(100, score),
        level='HIGH' if score >= 60 else 'MEDIUM' if score >= 30 else 'LOW',
        factors=factors
    )
```

### Next-Best-Action Rules (Phase 1 MVP)

```python
NBA_RULES = [
    {
        "condition": "financing_pending_days > 2",
        "action": "Call customer",
        "channel": "CALL",
        "urgency": "TODAY",
        "message": "Follow up on financing application",
        "impact": "Approval probability drops 23% after day 3"
    },
    {
        "condition": "delivery_delayed AND not_notified",
        "action": "Proactive update",
        "channel": "WHATSAPP",
        "urgency": "NOW",
        "message": "Send updated ETA with reassurance",
        "impact": "Reduces cancellation risk by 18%"
    },
    {
        "condition": "vehicle_arrived AND status != DELIVERY_SCHEDULED",
        "action": "Schedule delivery",
        "channel": "CALL",
        "urgency": "TODAY",
        "message": "Confirm delivery slot + upsell accessories",
        "impact": "Closes order faster, upsell opportunity"
    },
    {
        "condition": "days_since_contact > 7",
        "action": "Check-in message",
        "channel": "WHATSAPP",
        "urgency": "TODAY",
        "message": "Friendly check-in, churn risk rising",
        "impact": "Re-engages customer before they go cold"
    },
    {
        "condition": "order_value > HIGH_VALUE_THRESHOLD",
        "action": "Personal attention",
        "channel": "CALL",
        "urgency": "THIS_WEEK",
        "message": "Personal call instead of automated message",
        "impact": "High-value customers expect premium service"
    }
]
```

## Frontend Architecture

### State Management
```
/store
  /auth          # User session, permissions
  /orders        # Order data, filters, pagination
  /priorities    # Today's priority list
  /ui            # Sidebar state, modals, notifications
```

### Key Pages
```
/dashboard                    # Morning view - today's priorities
/orders                       # Order list with filters
/orders/:id                   # Order detail + AI insights
/leads                        # Lead management
/performance                  # Personal/team metrics
/coaching                     # AI coaching insights
/settings                     # User preferences
```

### Component Structure
```
/components
  /layout
    Sidebar.tsx
    Header.tsx
    PageContainer.tsx
  /orders
    OrderTable.tsx
    OrderCard.tsx
    OrderTimeline.tsx
  /ai
    PriorityList.tsx
    RiskBadge.tsx
    NextBestActionCard.tsx
    ProbabilityGauge.tsx
    CoachingTip.tsx
  /charts
    FunnelChart.tsx
    TrendChart.tsx
    BarChart.tsx
  /common
    Button.tsx
    Input.tsx
    Select.tsx
    Card.tsx
    Badge.tsx
    Avatar.tsx
```

## API Response Formats

### Standard Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 150
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid order status",
    "details": { ... }
  }
}
```

### Priority List Response
```json
{
  "success": true,
  "data": {
    "date": "2025-10-15",
    "generatedAt": "2025-10-15T06:00:00Z",
    "summary": {
      "highRisk": 2,
      "mediumRisk": 5,
      "lowRisk": 12,
      "totalActions": 8
    },
    "items": [
      {
        "rank": 1,
        "order": { ... },
        "riskScore": 78,
        "riskLevel": "HIGH",
        "riskFactors": [...],
        "nextBestAction": {
          "action": "Call customer about financing",
          "channel": "CALL",
          "urgency": "NOW",
          "expectedImpact": "Reduces cancellation risk by 23%"
        }
      }
    ]
  }
}
```

## Environment Variables

```bash
# API
API_URL=http://localhost:3001
API_TIMEOUT=30000

# Auth
AUTH_SECRET=your-secret
AUTH_EXPIRY=24h

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/autolead

# Redis
REDIS_URL=redis://localhost:6379

# Integrations
DMS_API_URL=https://dms.example.com/api
DMS_API_KEY=xxx
WHATSAPP_API_URL=https://api.whatsapp.com
WHATSAPP_TOKEN=xxx

# AI
AI_MODEL_ENDPOINT=https://ai.autolead.com/v1
AI_MODEL_KEY=xxx
```

---

This architecture is designed to be:
- **Modular** - Services can be developed/deployed independently
- **Scalable** - Stateless services, caching layer, async processing
- **Extensible** - Easy to add new AI capabilities and integrations
- **Observable** - Clear data flows, logging points, metrics
