import { ConditionOption, PhotoType } from '@/types';

// Vehicle Features for Trade-In Appraisal
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

export type VehicleFeature = (typeof VEHICLE_FEATURES)[number];

// Vehicle Condition Options
export const CONDITION_OPTIONS: ConditionOption[] = [
  {
    value: 'excellent',
    label: 'Excellent',
    description: 'Like new, minimal wear',
  },
  {
    value: 'good',
    label: 'Good',
    description: 'Minor cosmetic issues',
  },
  {
    value: 'fair',
    label: 'Fair',
    description: 'Visible wear, runs well',
  },
  {
    value: 'poor',
    label: 'Poor',
    description: 'Significant issues',
  },
];

// Photo Requirements
export interface PhotoRequirement {
  type: PhotoType;
  label: string;
  required: boolean;
  guide: string;
  icon: string;
}

export const PHOTO_REQUIREMENTS: PhotoRequirement[] = [
  // Required Photos (8)
  { type: 'front_view', label: 'Front View', required: true, guide: 'Stand 3-4m away, capture full front including bumper and headlights', icon: '🚗' },
  { type: 'rear_view', label: 'Rear View', required: true, guide: 'Capture full rear including bumper, taillights and license plate', icon: '🔙' },
  { type: 'left_side', label: 'Left Side', required: true, guide: 'Stand back to capture entire side profile including all wheels', icon: '⬅️' },
  { type: 'right_side', label: 'Right Side', required: true, guide: 'Stand back to capture entire side profile including all wheels', icon: '➡️' },
  { type: 'dashboard', label: 'Dashboard & Odometer', required: true, guide: 'Clear shot of dashboard showing odometer reading', icon: '🎛️' },
  { type: 'front_seats', label: 'Front Interior', required: true, guide: 'From rear seat, capture front seats, console and steering wheel', icon: '💺' },
  { type: 'rear_seats', label: 'Rear Interior', required: true, guide: 'From front, capture rear seats and floor area', icon: '🪑' },
  { type: 'trunk', label: 'Trunk/Boot', required: true, guide: 'Open trunk fully, capture entire cargo area', icon: '📦' },
  // Optional Photos (4)
  { type: 'engine_bay', label: 'Engine Bay', required: false, guide: 'Open hood, capture engine compartment clearly', icon: '🔧' },
  { type: 'wheels', label: 'Wheels & Tires', required: false, guide: 'Close-up of wheel and tire condition', icon: '⭕' },
  { type: 'additional_1', label: 'Damage/Wear', required: false, guide: 'Document any scratches, dents or wear', icon: '⚠️' },
  { type: 'additional_2', label: 'Additional', required: false, guide: 'Any other relevant details', icon: '📷' },
];

export const REQUIRED_PHOTO_COUNT = PHOTO_REQUIREMENTS.filter((p) => p.required).length;
export const TOTAL_PHOTO_COUNT = PHOTO_REQUIREMENTS.length;

// Wizard Steps Configuration
export const WIZARD_STEPS = [
  { number: 1, label: 'Registration', sublabel: 'Scan card' },
  { number: 2, label: 'Details', sublabel: 'Vehicle specs' },
  { number: 3, label: 'Photos', sublabel: 'Upload images' },
  { number: 4, label: 'Review', sublabel: 'Submit' },
] as const;

export const TOTAL_WIZARD_STEPS = WIZARD_STEPS.length;
