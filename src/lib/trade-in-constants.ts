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
}

export const PHOTO_REQUIREMENTS: PhotoRequirement[] = [
  // Required Photos (8)
  { type: 'front_view', label: 'Front View', required: true },
  { type: 'rear_view', label: 'Rear View', required: true },
  { type: 'left_side', label: 'Left Side', required: true },
  { type: 'right_side', label: 'Right Side', required: true },
  { type: 'dashboard', label: 'Dashboard', required: true },
  { type: 'front_seats', label: 'Front Seats', required: true },
  { type: 'rear_seats', label: 'Rear Seats', required: true },
  { type: 'trunk', label: 'Trunk', required: true },
  // Optional Photos (4)
  { type: 'engine_bay', label: 'Engine Bay', required: false },
  { type: 'wheels', label: 'Wheels', required: false },
  { type: 'additional_1', label: 'Additional 1', required: false },
  { type: 'additional_2', label: 'Additional 2', required: false },
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
