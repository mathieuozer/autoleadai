# AutoLead.ai - AI Context Rules

You are working on **AutoLead.ai**, a Decision Intelligence platform for automotive sales. Read the documentation files in this project for full context.

## Quick Reference

**What is AutoLead?**
An AI-powered layer on top of DMS/ERP systems that tells salespeople WHO to act on, WHY, and WHAT to do next — from order to delivery.

**Core Features:**
1. Order Risk Scoring (Dynamic Priority Score)
2. Next-Best-Action Engine (specific recommendations)
3. Sales Probability Forecasting
4. AI Sales Coaching

**UX Philosophy:**
- Morning: "Here's what you need to do today" (not 50 charts)
- During Day: Event-triggered nudges + one-click actions
- End of Day: Clear value feedback ("You reduced risk by 24%")

## Design System (Quick Reference)

**Colors:**
- Primary Blue: #2563eb (sidebar, buttons)
- Accent Orange: #f97316 (CTAs, highlights)
- Risk High: #ef4444 (red)
- Risk Medium: #f97316 (orange)
- Risk Low: #22c55e (green)
- Background: #f1f5f9 (light gray)
- Cards: #ffffff

**Typography:**
- Font: Inter (or system sans-serif)
- Titles: text-2xl, semibold, gray-900
- Body: text-sm, normal, gray-700

**Components:**
- Cards: white bg, rounded-lg, subtle shadow
- Tables: header gray-50, body white, hover blue tint
- Buttons: Primary (orange), Secondary (blue), Outline (gray border)
- Risk Badges: Pill-shaped, color-coded

## Code Conventions

**File Structure:**
```
/src
  /components     # Reusable UI components
  /pages          # Route pages
  /hooks          # Custom React hooks
  /services       # API calls
  /store          # State management
  /utils          # Helpers
  /types          # TypeScript interfaces
```

**Naming:**
- Components: PascalCase (OrderCard.tsx)
- Files: kebab-case for non-components
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Types/Interfaces: PascalCase with I prefix optional

**Component Pattern:**
```tsx
// Prefer functional components with hooks
const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  // hooks first
  // handlers next
  // render
};
```

## Key Types

```typescript
type OrderStatus = 'NEW' | 'CONTACTED' | 'TEST_DRIVE_SCHEDULED' | 
  'BOOKING_DONE' | 'FINANCING_PENDING' | 'READY_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

type Channel = 'CALL' | 'WHATSAPP' | 'EMAIL' | 'IN_PERSON';

type Urgency = 'NOW' | 'TODAY' | 'THIS_WEEK';
```

## Important Files to Reference

- `CLAUDE.md` - Full project context
- `DESIGN_SYSTEM.md` - UI/UX guidelines
- `ARCHITECTURE.md` - Technical architecture

## When Building Features

1. **Always check risk level color coding** - High=red, Medium=orange, Low=green
2. **AI recommendations should be prominent** - Not buried in UI
3. **Include "why" explanations** - Users need to trust AI suggestions
4. **One-click actions** - Reduce friction for salespeople
5. **Show expected impact** - "Reduces risk by X%"
6. **Timestamps matter** - "Last updated 12m ago"
7. **Mobile-friendly** - Salespeople are often on the floor

## Don't

- Don't create overwhelming dashboards with too many charts
- Don't hide AI insights in secondary tabs
- Don't use red for non-risk items
- Don't create generic CRM interfaces
- Don't forget the "why" behind recommendations
