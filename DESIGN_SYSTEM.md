# AutoLead.ai - Design System

> UI/UX guidelines extracted from design references. Follow these conventions for all frontend work.

## Design Philosophy

- **Clean, modern SaaS dashboard** — professional, not flashy
- **Actionable, not overwhelming** — show what matters, hide complexity
- **Card-based layouts** — modular, scannable sections
- **AI-first UX** — recommendations prominent, data supporting

## Color Palette

### Primary Colors
```css
:root {
  /* Primary Blue (Sidebar, CTAs) */
  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  --primary-200: #bfdbfe;
  --primary-300: #93c5fd;
  --primary-400: #60a5fa;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;  /* Main brand blue */
  --primary-700: #1d4ed8;
  --primary-800: #1e40af;
  --primary-900: #1e3a8a;

  /* Accent Orange (Highlights, Actions, Alerts) */
  --accent-orange: #f97316;
  --accent-coral: #fb923c;
  
  /* Success Green */
  --success-500: #22c55e;
  --success-600: #16a34a;
  
  /* Warning Yellow */
  --warning-500: #eab308;
  
  /* Error Red */
  --error-500: #ef4444;
  --error-600: #dc2626;
  
  /* Neutrals */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  
  /* Background */
  --bg-main: #f1f5f9;  /* Light gray page background */
  --bg-card: #ffffff;
  --bg-sidebar: linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%);
}
```

### Semantic Colors
```css
:root {
  /* Risk Levels */
  --risk-high: #ef4444;
  --risk-medium: #f97316;
  --risk-low: #22c55e;
  
  /* Priority Levels */
  --priority-urgent: #ef4444;
  --priority-high: #f97316;
  --priority-normal: #3b82f6;
  --priority-low: #6b7280;
  
  /* Status */
  --status-new: #3b82f6;
  --status-contacted: #22c55e;
  --status-pending: #eab308;
  --status-at-risk: #ef4444;
}
```

## Typography

```css
:root {
  /* Font Family */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  
  /* Font Sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  
  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
}
```

### Typography Usage
| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Page Title | text-2xl | semibold | gray-900 |
| Page Subtitle | text-sm | normal | gray-500 |
| Card Title | text-lg | semibold | primary-600 |
| Section Header | text-base | semibold | gray-800 |
| Body Text | text-sm | normal | gray-700 |
| Table Header | text-xs | medium | gray-500 (uppercase) |
| Table Cell | text-sm | normal | gray-700 |
| Label | text-xs | medium | gray-500 |
| Button | text-sm | medium | white/gray-700 |

## Spacing

```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
}
```

## Border Radius

```css
:root {
  --radius-sm: 0.25rem;   /* 4px - buttons, inputs */
  --radius-md: 0.5rem;    /* 8px - cards, dropdowns */
  --radius-lg: 0.75rem;   /* 12px - modals, large cards */
  --radius-xl: 1rem;      /* 16px - sidebar items when active */
  --radius-full: 9999px;  /* Pills, avatars */
}
```

## Shadows

```css
:root {
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
}
```

## Component Patterns

### Sidebar
- Width: 240px (expanded), 64px (collapsed)
- Background: Blue gradient (primary-600 → primary-700)
- Nav items: White text, rounded highlight on active
- Logo at top, user profile optional at bottom

### Cards
```css
.card {
  background: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  padding: var(--space-6);
}
```

### Buttons

**Primary (Orange CTA)**
```css
.btn-primary {
  background: var(--accent-orange);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  font-weight: 500;
}
```

**Secondary (Blue)**
```css
.btn-secondary {
  background: var(--primary-600);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
}
```

**Outline**
```css
.btn-outline {
  border: 1px solid var(--gray-300);
  background: white;
  color: var(--gray-700);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
}
```

### Tables
- Header: Gray background (#f9fafb), uppercase text-xs, font-medium
- Rows: White background, border-bottom gray-100
- Hover: Light blue tint (#f0f9ff)
- Actions column: Right-aligned with View/Edit buttons

### Form Inputs
```css
.input {
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-sm);
  padding: 0.5rem 0.75rem;
  font-size: var(--text-sm);
}
.input:focus {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px var(--primary-100);
}
```

### Dropdowns / Filters
- Border: 1px solid gray-300
- Background: White
- Icon: Chevron down on right
- Border-radius: radius-sm

## Charts & Data Visualization

### Colors for Charts
```javascript
const chartColors = {
  primary: '#3b82f6',   // Blue - actual/current
  secondary: '#fb923c', // Orange - target/comparison
  success: '#22c55e',   // Green - positive
  danger: '#ef4444',    // Red - negative/risk
  muted: '#9ca3af',     // Gray - inactive/baseline
};
```

### Funnel Chart Colors
- Stage 1 (Leads): #60a5fa (lighter blue)
- Stage 2 (Verified): #3b82f6
- Stage 3 (Walk-in): #2563eb
- Stage 4 (Test Drive): #1d4ed8
- Stage 5 (Order): #1e40af (darker blue)

## AI-Specific Components

### Risk Score Badge
```css
.risk-badge {
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 500;
}
.risk-badge.high { background: #fef2f2; color: #dc2626; }
.risk-badge.medium { background: #fff7ed; color: #ea580c; }
.risk-badge.low { background: #f0fdf4; color: #16a34a; }
```

### AI Recommendation Card
- Left border accent (4px, color by priority)
- Icon indicating channel (phone, message, email)
- Action text prominent
- Expected impact in muted text
- One-click action button

### Priority Score Display
- Large number (text-3xl, font-bold)
- Color-coded by risk level
- Trend indicator (arrow up/down)
- "Last updated X ago" timestamp

## Layout Grid

### Page Structure
```
┌─────────────────────────────────────────────────────────┐
│ [Sidebar 240px] │ [Main Content Area]                   │
│                 │ ┌─────────────────────────────────┐   │
│ Logo            │ │ Header: Title + Actions         │   │
│                 │ ├─────────────────────────────────┤   │
│ Navigation      │ │ Content Area (cards, tables)    │   │
│                 │ │                                 │   │
│                 │ │                                 │   │
│                 │ └─────────────────────────────────┘   │
│ User Profile    │                                       │
└─────────────────────────────────────────────────────────┘
```

### Responsive Breakpoints
```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

## Icons

Use **Lucide Icons** (or similar line-icon library):
- Navigation: LayoutDashboard, Users, TrendingUp, Settings
- Actions: Phone, MessageSquare, Mail, Plus, Filter
- Status: AlertCircle, CheckCircle, Clock, TrendingUp/Down
- Misc: ChevronDown, Search, MoreVertical

## Animation

Keep animations subtle and functional:
```css
.transition-default {
  transition: all 150ms ease-in-out;
}
.transition-slow {
  transition: all 300ms ease-in-out;
}
```

---

## Do's and Don'ts

✅ **Do:**
- Use orange for primary CTAs and important highlights
- Keep cards clean with generous whitespace
- Show AI insights prominently
- Use timestamps ("Last updated 12m ago")
- Color-code risk/priority levels consistently

❌ **Don't:**
- Overload dashboards with too many charts
- Use more than 3-4 colors per view
- Hide AI recommendations in secondary UI
- Use red except for actual risks/errors
- Create walls of text — be concise
