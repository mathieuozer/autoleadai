# Trade-In Portal - Implementation Plan

> **Detailed implementation plan for the 4-step trade-in appraisal wizard.**

## Executive Summary

Build a mobile-first, dark-themed trade-in portal that allows sales executives to capture vehicle appraisals using OCR for registration cards and guided photo capture.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TRADE-IN PORTAL                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐ │
│  │   Step 1    │ → │   Step 2    │ → │   Step 3    │ → │   Step 4    │ │
│  │Registration │   │  Details    │   │   Photos    │   │   Review    │ │
│  │  OCR Scan   │   │Vehicle Specs│   │Guided Capture   │  Submit     │ │
│  └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘ │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                        SHARED COMPONENTS                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ Stepper  │ │PhotoCard │ │Condition │ │FeatureChip│ │ DarkLayout  │  │
│  │          │ │          │ │ Selector │ │           │ │             │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                           API LAYER                                      │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐    │
│  │ /api/trade-ins │  │ /api/trade-ins │  │ /api/trade-ins/:id/    │    │
│  │     CRUD       │  │   /:id/photos  │  │    registration        │    │
│  └────────────────┘  └────────────────┘  └────────────────────────┘    │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                         DATABASE                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ TradeInAppraisal │ TradeInPhoto │ TradeInRegistration          │    │
│  └────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation (Reusable Components)
**Duration: Core infrastructure**

| Task | Description | Reuses |
|------|-------------|--------|
| 1.1 | Dark theme CSS variables | globals.css |
| 1.2 | DarkLayout component | PageContainer pattern |
| 1.3 | Stepper component | New |
| 1.4 | PhotoUploadCard component | Card pattern |
| 1.5 | ConditionSelector component | New |
| 1.6 | FeatureChip component | Badge pattern |
| 1.7 | FileUpload component | New |

### Phase 2: Database & API
**Duration: Backend infrastructure**

| Task | Description | Reuses |
|------|-------------|--------|
| 2.1 | Prisma schema for TradeIn | Existing schema patterns |
| 2.2 | API: POST /api/trade-ins | Response helpers |
| 2.3 | API: GET/PATCH /api/trade-ins/:id | Order API pattern |
| 2.4 | API: POST /api/trade-ins/:id/photos | New |
| 2.5 | API: POST /api/trade-ins/:id/submit | New |
| 2.6 | useTradeIn hook | useOrder pattern |

### Phase 3: Step Pages
**Duration: UI implementation**

| Task | Description | Reuses |
|------|-------------|--------|
| 3.1 | /trade-in/new - Entry point | New |
| 3.2 | Step 1: Registration scan | FileUpload |
| 3.3 | Step 2: Vehicle details | Input, Select |
| 3.4 | Step 3: Photo capture | PhotoUploadCard |
| 3.5 | Step 4: Review & submit | Card, Badge |
| 3.6 | Wizard state management | React Context |

### Phase 4: Polish & Testing
**Duration: Quality assurance**

| Task | Description |
|------|-------------|
| 4.1 | Unit tests for components |
| 4.2 | Mobile responsiveness |
| 4.3 | Form validation |
| 4.4 | Error handling |
| 4.5 | Navigation guards |

---

## Detailed Component Specifications

### 1. DarkLayout Component
```typescript
// src/components/layout/DarkLayout.tsx
interface DarkLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}
```

**Design:**
- Background: slate-900 (#0f172a)
- Card background: slate-800 (#1e293b)
- Text: slate-50 (primary), slate-400 (secondary)
- Full-height, mobile-optimized

### 2. Stepper Component
```typescript
// src/components/ui/Stepper.tsx
interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

interface Step {
  label: string;
  sublabel: string;
}
```

**States:**
- Completed: Green circle with checkmark
- Current: Cyan circle with number
- Upcoming: Dark gray circle with number

### 3. PhotoUploadCard Component
```typescript
// src/components/trade-in/PhotoUploadCard.tsx
interface PhotoUploadCardProps {
  label: string;
  required?: boolean;
  photo?: PhotoData;
  onUpload: (file: File) => void;
  onRemove?: () => void;
  onAnnotate?: () => void;
}

interface PhotoData {
  url: string;
  timestamp: string;
  notes?: string;
}
```

**States:**
- Empty: Dashed border, + icon, "Add Photo" text
- Uploaded: Thumbnail, timestamp, remove button
- Required badge: Amber/orange indicator

### 4. ConditionSelector Component
```typescript
// src/components/trade-in/ConditionSelector.tsx
interface ConditionSelectorProps {
  value: VehicleCondition | null;
  onChange: (condition: VehicleCondition) => void;
}

type VehicleCondition = 'excellent' | 'good' | 'fair' | 'poor';
```

**Design:**
- 4 horizontal cards (2x2 on mobile)
- Selected: Cyan border highlight
- Shows label + description

### 5. FeatureChip Component
```typescript
// src/components/trade-in/FeatureChip.tsx
interface FeatureChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
}
```

**States:**
- Default: Dark background, gray border
- Selected: Cyan border, white text

---

## Database Schema

```prisma
// Addition to prisma/schema.prisma

enum TradeInStatus {
  DRAFT
  SUBMITTED
  UNDER_REVIEW
  PRICED
  ACCEPTED
  REJECTED
}

enum VehicleCondition {
  EXCELLENT
  GOOD
  FAIR
  POOR
}

enum PhotoType {
  FRONT_VIEW
  REAR_VIEW
  LEFT_SIDE
  RIGHT_SIDE
  DASHBOARD
  FRONT_SEATS
  REAR_SEATS
  TRUNK
  ENGINE_BAY
  WHEELS
  ADDITIONAL_1
  ADDITIONAL_2
  REGISTRATION_FRONT
  REGISTRATION_BACK
}

model TradeInAppraisal {
  id                String          @id @default(cuid())
  status            TradeInStatus   @default(DRAFT)

  // Links
  customerId        String?
  salesExecutiveId  String?
  leadId            String?

  // Step 1: Registration OCR Data
  customerName      String?
  vehicleMake       String?
  vehicleModel      String?
  vehicleTrim       String?
  vin               String?
  plateNumber       String?
  registrationYear  Int?

  // Step 2: Vehicle Details
  mileage           Int?
  expectedPrice     Decimal?        @db.Decimal(12, 2)
  condition         VehicleCondition?
  features          String[]        // Array of feature names
  additionalNotes   String?

  // Inspector Review
  tentativePrice    Decimal?        @db.Decimal(12, 2)
  inspectorNotes    String?
  inspectorId       String?
  reviewedAt        DateTime?

  // Timestamps
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  submittedAt       DateTime?

  // Relations
  photos            TradeInPhoto[]
  customer          Customer?       @relation(fields: [customerId], references: [id])
  salesExecutive    User?           @relation("SalesExecutive", fields: [salesExecutiveId], references: [id])
  inspector         User?           @relation("Inspector", fields: [inspectorId], references: [id])

  @@index([customerId])
  @@index([salesExecutiveId])
  @@index([status])
}

model TradeInPhoto {
  id              String    @id @default(cuid())
  tradeInId       String
  type            PhotoType
  url             String
  thumbnailUrl    String?
  notes           String?
  annotations     Json?     // Array of annotation objects

  createdAt       DateTime  @default(now())

  tradeIn         TradeInAppraisal @relation(fields: [tradeInId], references: [id], onDelete: Cascade)

  @@index([tradeInId])
  @@index([type])
}
```

---

## API Endpoints

### POST /api/trade-ins
Create new trade-in appraisal.

```typescript
// Request
{ }  // Empty body, creates draft

// Response
{
  "success": true,
  "data": {
    "id": "clx...",
    "status": "DRAFT",
    "createdAt": "2024-01-04T..."
  }
}
```

### GET /api/trade-ins/:id
Get appraisal with all details.

### PATCH /api/trade-ins/:id
Update appraisal (steps 1-3 data).

```typescript
// Request
{
  // Step 1
  "customerName": "Mohammed Al Rashid",
  "vehicleMake": "Toyota",
  "vehicleModel": "Camry",
  // Step 2
  "mileage": 45000,
  "expectedPrice": 85000,
  "condition": "GOOD",
  "features": ["Sunroof", "Leather Seats"]
}
```

### POST /api/trade-ins/:id/photos
Upload photo.

```typescript
// Request (multipart/form-data)
{
  "type": "FRONT_VIEW",
  "file": File,
  "notes": "Minor scratch on bumper"
}
```

### POST /api/trade-ins/:id/submit
Submit for review.

---

## File Structure

```
src/
├── app/
│   ├── trade-in/
│   │   ├── page.tsx              # Entry/list page
│   │   ├── new/
│   │   │   └── page.tsx          # Create & redirect
│   │   └── [id]/
│   │       ├── page.tsx          # Wizard container
│   │       ├── step-1/
│   │       │   └── page.tsx      # Registration
│   │       ├── step-2/
│   │       │   └── page.tsx      # Details
│   │       ├── step-3/
│   │       │   └── page.tsx      # Photos
│   │       └── step-4/
│   │           └── page.tsx      # Review
│   └── api/
│       └── trade-ins/
│           ├── route.ts          # List/Create
│           └── [id]/
│               ├── route.ts      # Get/Update
│               ├── photos/
│               │   └── route.ts  # Upload photos
│               └── submit/
│                   └── route.ts  # Submit
├── components/
│   ├── layout/
│   │   └── DarkLayout.tsx        # Dark theme wrapper
│   ├── ui/
│   │   └── Stepper.tsx           # Step indicator
│   └── trade-in/
│       ├── index.ts
│       ├── PhotoUploadCard.tsx
│       ├── PhotoGrid.tsx
│       ├── ConditionSelector.tsx
│       ├── FeatureChip.tsx
│       ├── FeatureList.tsx
│       ├── RegistrationUpload.tsx
│       ├── ReviewSection.tsx
│       └── __tests__/
│           ├── PhotoUploadCard.test.tsx
│           ├── ConditionSelector.test.tsx
│           └── FeatureChip.test.tsx
├── hooks/
│   └── use-trade-in.ts           # Trade-in data hook
├── lib/
│   └── trade-in/
│       ├── constants.ts          # Features list, photo types
│       ├── validation.ts         # Form validation
│       └── types.ts              # TypeScript types
└── types/
    └── trade-in.ts               # Shared types
```

---

## Dark Theme CSS Variables

```css
/* Add to globals.css */

/* Trade-In Portal - Dark Theme */
.dark-theme {
  --bg-page: #0f172a;        /* slate-900 */
  --bg-card: #1e293b;        /* slate-800 */
  --bg-input: #334155;       /* slate-700 */
  --bg-hover: #475569;       /* slate-600 */

  --text-primary: #f8fafc;   /* slate-50 */
  --text-secondary: #94a3b8; /* slate-400 */
  --text-muted: #64748b;     /* slate-500 */

  --border-default: #334155; /* slate-700 */
  --border-focus: #0ea5e9;   /* cyan-500 */

  --primary: #0ea5e9;        /* cyan-500 */
  --primary-hover: #06b6d4;  /* cyan-400 */

  --success: #22c55e;        /* green-500 */
  --warning: #f59e0b;        /* amber-500 */
  --error: #ef4444;          /* red-500 */
}
```

---

## Vehicle Features List

```typescript
// src/lib/trade-in/constants.ts

export const VEHICLE_FEATURES = [
  // Row 1
  'Sunroof',
  'Cruise Control',
  '18" Alloy Wheels',
  'Leather Seats',
  'Navigation System',
  'Backup Camera',
  // Row 2
  'Bluetooth',
  'Heated Seats',
  'Parking Sensors',
  'Keyless Entry',
  'Push Start',
  'Apple CarPlay',
  // Row 3
  'Android Auto',
  'Blind Spot Monitor',
  'Lane Departure Warning',
  'Adaptive Cruise Control',
  'Panoramic Roof',
  // Row 4
  '360° Camera',
  'Premium Audio',
  'Ventilated Seats',
] as const;

export const REQUIRED_PHOTOS: PhotoType[] = [
  'FRONT_VIEW',
  'REAR_VIEW',
  'LEFT_SIDE',
  'RIGHT_SIDE',
  'DASHBOARD',
  'FRONT_SEATS',
  'REAR_SEATS',
  'TRUNK',
];

export const OPTIONAL_PHOTOS: PhotoType[] = [
  'ENGINE_BAY',
  'WHEELS',
  'ADDITIONAL_1',
  'ADDITIONAL_2',
];
```

---

## Wizard State Management

```typescript
// src/app/trade-in/[id]/context.tsx

interface TradeInWizardState {
  currentStep: number;
  appraisal: TradeInAppraisal | null;
  isLoading: boolean;
  isSaving: boolean;
  errors: Record<string, string>;
}

interface TradeInWizardActions {
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateAppraisal: (data: Partial<TradeInAppraisal>) => Promise<void>;
  uploadPhoto: (type: PhotoType, file: File) => Promise<void>;
  removePhoto: (photoId: string) => Promise<void>;
  submit: () => Promise<void>;
}
```

---

## Implementation Order

### Week 1: Foundation
1. ✅ Create plan documentation
2. Add dark theme CSS variables
3. Create DarkLayout component
4. Create Stepper component
5. Create FeatureChip component
6. Create ConditionSelector component
7. Create PhotoUploadCard component

### Week 2: Backend
1. Add Prisma schema for TradeIn
2. Run migration
3. Create API routes
4. Create useTradeIn hook
5. Add seed data

### Week 3: Pages
1. Create entry page (/trade-in)
2. Create new appraisal flow
3. Implement Step 1: Registration
4. Implement Step 2: Details
5. Implement Step 3: Photos
6. Implement Step 4: Review

### Week 4: Polish
1. Form validation
2. Error handling
3. Mobile optimization
4. Unit tests
5. Integration testing

---

## Success Criteria

- [ ] All 4 steps functional on mobile
- [ ] Photos upload and display correctly
- [ ] Form data persists across steps
- [ ] Submit creates complete appraisal
- [ ] Dark theme consistent throughout
- [ ] Touch-friendly (44px+ tap targets)
- [ ] All components have unit tests
- [ ] Works offline (draft saving)

---

## Dependencies

### Existing (Reuse)
- Next.js App Router
- Tailwind CSS
- Prisma ORM
- Lucide Icons
- Jest + RTL

### New (To Install)
- None required (using native file upload)

### Optional (For OCR - Future)
- Tesseract.js (client-side OCR)
- OR Google Vision API (server-side)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Large photo uploads | Compress before upload, show progress |
| OCR accuracy | Manual fallback fields, editable results |
| Mobile camera access | Progressive enhancement, file picker fallback |
| Offline usage | Local storage for drafts, sync when online |
| Dark theme conflicts | Scoped CSS, separate component variants |

---

*Ready for implementation. Start with Phase 1: Foundation.*
