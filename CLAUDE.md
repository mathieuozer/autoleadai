# AutoLead.ai - Project Context for Claude

> **Read this file first when working on this codebase.**

## What is AutoLead?

AutoLead is **Decision Intelligence for Automotive Sales** — an AI-powered layer that sits on top of existing Dealer Management Systems (DMS) and ERP systems. It's not another CRM; it's an AI co-pilot that tells salespeople exactly WHO to act on, WHY, and WHAT to do next — from order to delivery.

## System Architecture

```
┌─────────────────────────────────┐
│   AutoLead Customer Portal      │  ← Customer-facing (Next Best Action, Delivery Risk)
├─────────────────────────────────┤
│   AutoLead DMS Layer            │  ← AI/Intelligence layer (THIS IS THE PRODUCT)
├─────────────────────────────────┤
│   DMS (Dealer Management)       │  ← Existing dealership system
├─────────────────────────────────┤
│   ERP                           │  ← Backend enterprise system
└─────────────────────────────────┘
```

## Core Capabilities

### 1. AI Lead / Order Prioritization (Order Risk Scoring)
Every active order gets a **Dynamic Priority Score** based on:
- Time since last customer contact
- Vehicle availability & ETA volatility
- Financing / approval status
- Trade-in dependency
- Customer sentiment (WhatsApp, calls, emails)
- Historical cancellation patterns
- Salesperson behavior patterns

**Output:** Daily AI Priority List with explanations

### 2. Next-Best-Action Engine (Human-Centric AI)
AI recommends specific actions, not generic reminders.

| Scenario | AI Recommendation |
|----------|-------------------|
| Delivery delay detected | "Proactively message customer with updated ETA + reassurance script" |
| Financing pending > 48h | "Call customer today – approval probability drops 23% after day 3" |
| Vehicle arrived in yard | "Confirm delivery slot + upsell accessories" |
| Silence > 7 days | "Check-in message – churn risk rising" |
| High-value customer | "Personal call instead of automated WhatsApp" |

**Action Format:**
- Channel (Call / WhatsApp / Email)
- Suggested timing
- Suggested message
- Expected impact (e.g., "reduces cancellation risk by 18%")

### 3. Sales Probability Forecasting
Each order has a **Live Fulfillment Probability Score**.
- Problem: "Order taken ≠ sale done" (cancellations, delays, financing fallout)
- Solution: Real-time probability that updates based on signals

### 4. AI Sales Coaching
- Talk-track suggestions
- Follow-up timing advice
- Performance benchmarking vs top sellers
- Personalized improvement insights

## UX Philosophy

```
Morning:     "Here's what you need to do today" (NOT 50 charts)
             - 2 high-risk orders to call
             - 1 delivery confirmation  
             - 1 upsell opportunity

During Day:  Event-triggered nudges + one-click actions
             - AI nudges triggered by events (ETA change, financing update)
             - Message suggestions one-click deployable
             - Human override always available

End of Day:  "You reduced cancellation risk by 24% today"
             - Clear value feedback loop
```

## Customer Journey (Order → Delivery)

1. Trade-in Appraisal (if applicable)
2. Test Drive
3. Browse Stock / Check Availability
4. Price & Finance Discussion
5. Create Order (E-sign)
6. Booking Fees (POS / Payment link)
7. Discount Approval Workflow
8. Ready Customer (Add-ons: insurance, accessories)
9. Payment Terms (Cash / Finance / Lease)
10. Purchase Done → Delivery
11. Customer Portal Access
12. Back Office Operations

## User Roles

| Role | Access Level | Key Features |
|------|--------------|--------------|
| **Salesperson** | Individual performance | Priority list, NBA, coaching |
| **Sales Executive** | Team/showroom view | All above + team metrics |
| **Contact Center Agent (Telecaller)** | Lead management | Lead list, call actions |
| **Branch Manager** | Branch performance | Dashboards, approvals |
| **GM / CFO** | Executive view | Revenue protection, forecasts |

## MVP Build Sequence

### Phase 1 (Fast ROI) ← START HERE
- Order risk scoring
- Priority list with explanations
- Simple next-best-action rules

### Phase 2 (Strong Differentiation)
- Predictive cancellation model
- Fulfillment probability forecasting
- AI coaching prompts

### Phase 3 (Unfair Advantage)
- Personalized decision logic per salesperson
- Cross-dealer learning
- EV-specific delivery intelligence

## Key Differentiators

1. **Embedded in Daily Behavior** - Becomes salesperson's operating system
2. **Learns From Local Data** - Each dealership becomes smarter over time
3. **Tied to Revenue Protection** - CFO & GM-level value, not "nice to have"

---

## Tech Stack & Conventions

See `DESIGN_SYSTEM.md` for UI/UX guidelines.
See `ARCHITECTURE.md` for technical decisions.

---

*"Most systems automate tasks. We tell salespeople WHO to act on, WHY, and WHAT to do next — from order to delivery."*
