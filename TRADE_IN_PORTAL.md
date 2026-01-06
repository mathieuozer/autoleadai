# Trade-In Portal - Module Documentation

> Mobile-first vehicle trade-in appraisal wizard with OCR and guided capture.

## Overview

The Trade-In Portal is a streamlined 4-step wizard that allows sales executives to quickly capture and submit vehicle trade-in appraisals. It uses OCR to extract data from registration cards and provides guided photo capture for consistent vehicle documentation.

## Design Theme

**This module uses a DARK THEME** (different from the main dashboard):
- Background: Dark navy/charcoal (#0f172a or #1e293b)
- Cards: Slightly lighter dark (#1e293b or #334155)
- Text: White/gray-100 for primary, gray-400 for secondary
- Primary CTA: Teal/Cyan (#0ea5e9 or #06b6d4)
- Success: Green (#22c55e)
- Required badges: Orange/Amber (#f59e0b)
- Borders: Subtle dark borders (#334155)

## User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRADE-IN TRIGGER                              │
│  Active lead exists OR Walk-in customer is created               │
│                           ↓                                      │
│              System opens Trade-In Capture Mode                  │
│              Auto-links to Lead/Walk-in/Sales Exec               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Registration    →  STEP 2: Details  →  STEP 3: Photos  │
│         (OCR Scan)           (Vehicle Specs)    (Guided Capture) │
│                                                        ↓         │
│                                              STEP 4: Review      │
│                                                 (Submit)         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: Inspector Review & Tentative Pricing (Backend)          │
│  STEP 6: Real-Time Feedback → Sales Executive in AutoLead AI     │
└─────────────────────────────────────────────────────────────────┘
```

## Step 1: Registration Card Scan

**Purpose:** Extract vehicle and customer data automatically via OCR.

**UI Components:**
- Step progress indicator (horizontal stepper)
- Icon + title header
- Two upload zones: "Front Side" and "Back Side"
- Success message: "Registration cards uploaded successfully"
- Primary CTA: "Continue to Vehicle Details"

**Functionality:**
- OCR + entity extraction from UAE registration card
- Auto-fills:
  - Customer name
  - Vehicle make, model, trim
  - VIN / Plate number
  - Registration year
- System auto-matches vehicle to:
  - Existing lead, OR
  - Newly created walk-in profile

**Manual Completion (if OCR misses):**
- Mileage
- Model year
- Optional ownership notes

## Step 2: Vehicle Details

**Purpose:** Capture vehicle specifications and condition.

**UI Components:**
- Two input fields side-by-side:
  - Current Mileage (km) - with placeholder "e.g., 45000"
  - Customer Expected Price (AED) - with placeholder "e.g., 85000"
- Vehicle Condition selector (4 options, single select):
  - Excellent: "Like new, minimal wear"
  - Good: "Minor cosmetic issues" (selected state has border highlight)
  - Fair: "Visible wear, runs well"
  - Poor: "Significant issues"
- Vehicle Features (multi-select chips/tags)
- Additional Notes (textarea)
- Navigation: "< Back" and "Continue to Photos"

**Vehicle Features List:**
```
Row 1: Sunroof, Cruise Control, 18" Alloy Wheels, Leather Seats, Navigation System, Backup Camera
Row 2: Bluetooth, Heated Seats, Parking Sensors, Keyless Entry, Push Start, Apple CarPlay
Row 3: Android Auto, Blind Spot Monitor, Lane Departure Warning, Adaptive Cruise Control, Panoramic Roof
Row 4: 360° Camera, Premium Audio, Ventilated Seats
```

**Chip States:**
- Default: Dark background with border (#334155), gray text
- Selected: Teal/cyan border (#0ea5e9), white text

## Step 3: Vehicle Photos

**Purpose:** Guided photo capture for consistent vehicle documentation.

**UI Components:**
- Icon + title: "Vehicle Photos"
- Subtitle: "Upload at least 8 photos covering all angles"
- Upload Progress: "0 / 12" counter
- Info badge: "Minimum 8 required photos"
- Photo grid (4 columns × 3 rows)
- Navigation: "< Back" and "Review & Submit"

**Required Photos (8):**
| Photo | Badge |
|-------|-------|
| Front View | Required |
| Rear View | Required |
| Left Side | Required |
| Right Side | Required |
| Dashboard | Required |
| Front Seats | Required |
| Rear Seats | Required |
| Trunk | Required |

**Optional Photos (4):**
- Engine Bay
- Wheels
- Additional 1
- Additional 2

**Photo Upload Card:**
- Dashed border when empty
- "+" icon with "Add Photo" text
- "Required" badge (orange/amber) for mandatory photos
- Shows thumbnail when photo uploaded
- Click to view/annotate

**Smart Camera Features:**
- Visual overlay guides angles and framing
- Step-by-step guided capture prompts
- Annotations: Sales exec can add text notes per photo
- Mark visible scratches, dents, or wear
- All images are time-stamped

## Step 4: Review & Submit

**Purpose:** Final verification before submission.

**UI Components:**
- All steps marked complete (green checkmarks)
- Large checkmark icon + "Review & Submit" title
- Subtitle: "Verify all information before submitting"
- Three collapsible/visible sections:
  1. Registration Documents
  2. Vehicle Details
  3. Vehicle Photos
- Navigation: "< Back" and "Submit Appraisal" (with checkmark icon)

**Section 1: Registration Documents**
- Icon + "Registration Documents" title
- Subtitle: "Vehicle registration card scans"
- Horizontal scroll of registration card images (front + back, possibly multiple)

**Section 2: Vehicle Details**
- Icon + "Vehicle Details" title
- Subtitle: "Specifications and condition"
- Three columns: Mileage | Expected Price | Condition
- Example: "45,000 km" | "AED 85,000" | "Excellent"
- Features as chips/tags below

**Section 3: Vehicle Photos**
- Icon + "Vehicle Photos" title
- Subtitle: "11 photos uploaded" (count)
- Photo gallery grid/carousel
- "+9 more photos" indicator if collapsed

## Post-Submission Flow

**Step 5: Inspector Review & Tentative Pricing**
- Used Car Inspector views submission
- Sets tentative trade-in price
- Backend workflow

**Step 6: Real-Time Feedback to Sales Executive**
- Tentative trade-in price pushed to sales exec
- Appears in AutoLead AI system
- Sales exec can proceed with deal

## Component Specifications

### Progress Stepper
```tsx
interface StepperProps {
  steps: Array<{
    number: number;
    label: string;
    sublabel: string;
    status: 'completed' | 'current' | 'upcoming';
  }>;
}

// Steps configuration
const steps = [
  { number: 1, label: 'Registration', sublabel: 'Scan card', status: 'completed' },
  { number: 2, label: 'Details', sublabel: 'Vehicle specs', status: 'current' },
  { number: 3, label: 'Photos', sublabel: 'Upload images', status: 'upcoming' },
  { number: 4, label: 'Review', sublabel: 'Submit', status: 'upcoming' },
];
```

### Step Indicator Styles
```css
/* Completed step */
.step-completed {
  background: #22c55e; /* green-500 */
  color: white;
  /* Shows checkmark icon */
}

/* Current step */
.step-current {
  background: #0ea5e9; /* cyan-500 */
  color: white;
  /* Shows number */
}

/* Upcoming step */
.step-upcoming {
  background: #334155; /* slate-700 */
  color: #94a3b8; /* slate-400 */
  /* Shows number */
}

/* Connector line */
.step-connector {
  height: 2px;
  background: #334155; /* default */
}
.step-connector.completed {
  background: #22c55e;
}
```

### Photo Upload Card
```tsx
interface PhotoUploadCardProps {
  label: string;
  required?: boolean;
  photo?: {
    url: string;
    timestamp: Date;
    notes?: string;
  };
  onUpload: (file: File) => void;
  onAnnotate?: () => void;
}
```

### Vehicle Condition Selector
```tsx
type VehicleCondition = 'excellent' | 'good' | 'fair' | 'poor';

interface ConditionOption {
  value: VehicleCondition;
  label: string;
  description: string;
}

const conditions: ConditionOption[] = [
  { value: 'excellent', label: 'Excellent', description: 'Like new, minimal wear' },
  { value: 'good', label: 'Good', description: 'Minor cosmetic issues' },
  { value: 'fair', label: 'Fair', description: 'Visible wear, runs well' },
  { value: 'poor', label: 'Poor', description: 'Significant issues' },
];
```

### Feature Chip
```tsx
interface FeatureChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
}
```

## Data Model

```typescript
interface TradeInAppraisal {
  id: string;
  status: 'draft' | 'submitted' | 'under_review' | 'priced' | 'accepted' | 'rejected';
  
  // Linked entities
  leadId?: string;
  customerId: string;
  salesExecutiveId: string;
  
  // Step 1: Registration
  registrationCards: {
    frontImage: string;  // URL
    backImage: string;   // URL
    ocrData?: {
      customerName?: string;
      vehicleMake?: string;
      vehicleModel?: string;
      vehicleTrim?: string;
      vin?: string;
      plateNumber?: string;
      registrationYear?: number;
    };
  };
  
  // Step 2: Vehicle Details
  vehicleDetails: {
    mileage: number;           // in km
    expectedPrice: number;     // in AED
    condition: 'excellent' | 'good' | 'fair' | 'poor';
    features: string[];        // array of feature names
    additionalNotes?: string;
  };
  
  // Step 3: Photos
  photos: Array<{
    type: PhotoType;
    url: string;
    thumbnail?: string;
    timestamp: DateTime;
    notes?: string;
    annotations?: Annotation[];
  }>;
  
  // Metadata
  createdAt: DateTime;
  submittedAt?: DateTime;
  
  // Inspector fields (post-submission)
  inspectorReview?: {
    inspectorId: string;
    reviewedAt: DateTime;
    tentativePrice: number;
    notes?: string;
  };
}

type PhotoType = 
  | 'front_view'
  | 'rear_view'
  | 'left_side'
  | 'right_side'
  | 'dashboard'
  | 'front_seats'
  | 'rear_seats'
  | 'trunk'
  | 'engine_bay'
  | 'wheels'
  | 'additional_1'
  | 'additional_2';

interface Annotation {
  x: number;          // percentage position
  y: number;
  type: 'scratch' | 'dent' | 'wear' | 'note';
  text: string;
}
```

## API Endpoints

```
# Trade-In Appraisals
POST   /api/trade-ins                      # Create new appraisal
GET    /api/trade-ins/:id                  # Get appraisal details
PATCH  /api/trade-ins/:id                  # Update appraisal (draft)
POST   /api/trade-ins/:id/submit           # Submit for review

# Registration OCR
POST   /api/trade-ins/:id/registration     # Upload registration cards
GET    /api/trade-ins/:id/ocr-results      # Get OCR extraction results

# Photos
POST   /api/trade-ins/:id/photos           # Upload photo
DELETE /api/trade-ins/:id/photos/:photoId  # Remove photo
PATCH  /api/trade-ins/:id/photos/:photoId  # Update photo (annotations)

# Inspector (admin)
GET    /api/trade-ins/pending-review       # List submitted appraisals
POST   /api/trade-ins/:id/review           # Submit inspector review
```

## Color Reference (Dark Theme)

```css
:root {
  /* Backgrounds */
  --bg-page: #0f172a;        /* slate-900 */
  --bg-card: #1e293b;        /* slate-800 */
  --bg-input: #334155;       /* slate-700 */
  
  /* Text */
  --text-primary: #f8fafc;   /* slate-50 */
  --text-secondary: #94a3b8; /* slate-400 */
  --text-muted: #64748b;     /* slate-500 */
  
  /* Borders */
  --border-default: #334155; /* slate-700 */
  --border-focus: #0ea5e9;   /* cyan-500 */
  
  /* Primary Actions */
  --primary: #0ea5e9;        /* cyan-500 */
  --primary-hover: #06b6d4;  /* cyan-400 */
  
  /* Status */
  --success: #22c55e;        /* green-500 */
  --warning: #f59e0b;        /* amber-500 */
  --error: #ef4444;          /* red-500 */
  
  /* Feature chips */
  --chip-default-bg: #334155;
  --chip-default-border: #475569;
  --chip-selected-border: #0ea5e9;
}
```

## Mobile Considerations

This is a **mobile-first** module designed to be used on the showroom floor:
- Touch-friendly tap targets (min 44px)
- Camera integration for direct capture
- Swipe gestures for photo carousel
- Optimized for one-handed use where possible
- Offline-capable draft saving
- Progressive upload (photos upload as captured)
