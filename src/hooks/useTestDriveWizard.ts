'use client';

import { useState, useCallback } from 'react';

export interface LicenseOcrData {
  fullName?: string;
  licenseNumber?: string;
  licenseExpiry?: string; // ISO date string
  dateOfBirth?: string; // ISO date string
  nationality?: string;
  licenseCategory?: string;
}

export interface NationalIdOcrData {
  fullNameEn?: string;
  fullNameAr?: string;
  emiratesIdNumber?: string;
  dateOfBirth?: string; // ISO date string
  nationality?: string;
  expiryDate?: string; // ISO date string
  gender?: string;
  isExpired?: boolean;
  expiryWarning?: string;
}

export interface TestDriveWizardState {
  // Step 1: Identity - Driving License
  drivingLicenseFrontUrl: string | null;
  drivingLicenseBackUrl: string | null;
  ocrData: LicenseOcrData;
  isLicenseExpired: boolean;
  expiryWarning: string | null;

  // Step 1: Identity - National ID (Emirates ID)
  nationalIdFrontUrl: string | null;
  nationalIdBackUrl: string | null;
  nationalIdOcrData: NationalIdOcrData;
  isNationalIdExpired: boolean;
  nationalIdExpiryWarning: string | null;
  nameMatchWarning: string | null;

  // Step 2: Vehicle & Time
  vehicleId: string | null;
  scheduledDate: string | null; // YYYY-MM-DD
  scheduledTime: string | null; // HH:mm
  duration: number; // minutes

  // Step 3: Agreement
  signatureData: string | null;
  termsAccepted: boolean;

  // Vehicle & Customer info (loaded from API)
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    color?: string;
    variant?: string;
  } | null;
  customer: {
    id: string;
    name: string;
    email?: string;
    phone: string;
  } | null;
}

const WIZARD_STEPS = [
  { number: 1, label: 'Identity', sublabel: 'Verify driving license' },
  { number: 2, label: 'Vehicle & Time', sublabel: 'Select vehicle and time slot' },
  { number: 3, label: 'Agreement', sublabel: 'Sign test drive agreement' },
  { number: 4, label: 'Confirmation', sublabel: 'Cleared for test drive' },
];

const TOTAL_WIZARD_STEPS = 4;

const initialState: TestDriveWizardState = {
  drivingLicenseFrontUrl: null,
  drivingLicenseBackUrl: null,
  ocrData: {},
  isLicenseExpired: false,
  expiryWarning: null,
  nationalIdFrontUrl: null,
  nationalIdBackUrl: null,
  nationalIdOcrData: {},
  isNationalIdExpired: false,
  nationalIdExpiryWarning: null,
  nameMatchWarning: null,
  vehicleId: null,
  scheduledDate: null,
  scheduledTime: null,
  duration: 30,
  signatureData: null,
  termsAccepted: false,
  vehicle: null,
  customer: null,
};

export function useTestDriveWizard(testDriveId: string) {
  const [currentStep, setCurrentStep] = useState(1);
  const [state, setState] = useState<TestDriveWizardState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get wizard steps with current status
  const steps = WIZARD_STEPS.map((step) => ({
    ...step,
    status:
      step.number < currentStep
        ? ('completed' as const)
        : step.number === currentStep
          ? ('current' as const)
          : ('upcoming' as const),
  }));

  // Navigation
  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= TOTAL_WIZARD_STEPS) {
      setCurrentStep(step);
    }
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < TOTAL_WIZARD_STEPS) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // Step 1: Identity
  const setLicenseImages = useCallback(
    (front: string | null, back: string | null) => {
      setState((prev) => ({
        ...prev,
        drivingLicenseFrontUrl: front,
        drivingLicenseBackUrl: back,
      }));
    },
    []
  );

  const setNationalIdImages = useCallback(
    (front: string | null, back: string | null) => {
      setState((prev) => ({
        ...prev,
        nationalIdFrontUrl: front,
        nationalIdBackUrl: back,
      }));
    },
    []
  );

  const setOcrData = useCallback(
    (data: LicenseOcrData, isExpired?: boolean, expiryWarning?: string | null) => {
      setState((prev) => ({
        ...prev,
        ocrData: { ...prev.ocrData, ...data },
        isLicenseExpired: isExpired ?? prev.isLicenseExpired,
        expiryWarning: expiryWarning ?? prev.expiryWarning,
      }));
    },
    []
  );

  const setNationalIdOcrData = useCallback(
    (data: NationalIdOcrData, isExpired?: boolean, expiryWarning?: string | null) => {
      setState((prev) => {
        // Cross-validate names if both license and national ID names are available
        let nameMatchWarning: string | null = null;
        const licenseName = prev.ocrData.fullName?.toLowerCase().trim();
        const nationalIdName = data.fullNameEn?.toLowerCase().trim();

        if (licenseName && nationalIdName && licenseName !== nationalIdName) {
          // Check if names are similar (allowing for minor differences)
          const licenseWords = new Set(licenseName.split(/\s+/));
          const nationalIdWords = new Set(nationalIdName.split(/\s+/));
          const commonWords = [...licenseWords].filter(w => nationalIdWords.has(w));

          if (commonWords.length < Math.min(licenseWords.size, nationalIdWords.size) / 2) {
            nameMatchWarning = 'Names on license and Emirates ID do not match';
          }
        }

        return {
          ...prev,
          nationalIdOcrData: { ...prev.nationalIdOcrData, ...data },
          isNationalIdExpired: isExpired ?? prev.isNationalIdExpired,
          nationalIdExpiryWarning: expiryWarning ?? prev.nationalIdExpiryWarning,
          nameMatchWarning,
        };
      });
    },
    []
  );

  // Step 2: Vehicle & Time
  const setVehicle = useCallback((vehicleId: string, vehicle: TestDriveWizardState['vehicle']) => {
    setState((prev) => ({
      ...prev,
      vehicleId,
      vehicle,
    }));
  }, []);

  const setScheduledDate = useCallback((date: string | null) => {
    setState((prev) => ({
      ...prev,
      scheduledDate: date,
      scheduledTime: null, // Reset time when date changes
    }));
  }, []);

  const setScheduledTime = useCallback((time: string | null) => {
    setState((prev) => ({ ...prev, scheduledTime: time }));
  }, []);

  const setDuration = useCallback((duration: number) => {
    setState((prev) => ({ ...prev, duration }));
  }, []);

  // Step 3: Agreement
  const setSignatureData = useCallback((signature: string | null) => {
    setState((prev) => ({ ...prev, signatureData: signature }));
  }, []);

  const setTermsAccepted = useCallback((accepted: boolean) => {
    setState((prev) => ({ ...prev, termsAccepted: accepted }));
  }, []);

  // Save to API
  const saveProgress = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const updateData: Record<string, unknown> = {
        // Driving License
        drivingLicenseFrontUrl: state.drivingLicenseFrontUrl,
        drivingLicenseBackUrl: state.drivingLicenseBackUrl,
        ocrFullName: state.ocrData.fullName,
        ocrLicenseNumber: state.ocrData.licenseNumber,
        ocrLicenseExpiry: state.ocrData.licenseExpiry,
        ocrDateOfBirth: state.ocrData.dateOfBirth,
        ocrNationality: state.ocrData.nationality,
        ocrLicenseCategory: state.ocrData.licenseCategory,
        // National ID (Emirates ID)
        nationalIdFrontUrl: state.nationalIdFrontUrl,
        nationalIdBackUrl: state.nationalIdBackUrl,
        ocrEmiratesIdNumber: state.nationalIdOcrData.emiratesIdNumber,
        ocrNationalIdExpiry: state.nationalIdOcrData.expiryDate,
        ocrNationalIdNameEn: state.nationalIdOcrData.fullNameEn,
        ocrNationalIdNameAr: state.nationalIdOcrData.fullNameAr,
      };

      // Add scheduling data if step 2 is complete
      if (state.scheduledDate && state.scheduledTime) {
        updateData.scheduledDate = state.scheduledDate;
        updateData.scheduledTime = state.scheduledTime;
        updateData.duration = state.duration;
        updateData.status = 'VEHICLE_SELECTED';
      } else if (state.drivingLicenseFrontUrl && state.ocrData.fullName) {
        updateData.status = 'IDENTITY_VERIFIED';
      }

      // Update vehicle if changed
      if (state.vehicleId) {
        updateData.vehicleId = state.vehicleId;
      }

      const response = await fetch(`/api/test-drives/${testDriveId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to save');
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [testDriveId, state]);

  // Sign agreement
  const signAgreement = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!state.signatureData) {
        throw new Error('Signature is required');
      }

      // First save current progress
      await saveProgress();

      // Then sign
      const response = await fetch(`/api/test-drives/${testDriveId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureData: state.signatureData,
          termsVersion: '1.0',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to sign agreement');
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign agreement');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [testDriveId, state.signatureData, saveProgress]);

  // Load existing data
  const loadTestDrive = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/test-drives/${testDriveId}`);

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to load');
      }

      const { data } = await response.json();

      // Determine which step to start on based on status
      let startStep = 1;
      switch (data.status) {
        case 'IDENTITY_VERIFIED':
          startStep = 2;
          break;
        case 'VEHICLE_SELECTED':
          startStep = 3;
          break;
        case 'AGREEMENT_SIGNED':
        case 'IN_PROGRESS':
        case 'COMPLETED':
          startStep = 4;
          break;
      }
      setCurrentStep(startStep);

      setState({
        drivingLicenseFrontUrl: data.drivingLicenseFrontUrl,
        drivingLicenseBackUrl: data.drivingLicenseBackUrl,
        ocrData: {
          fullName: data.ocrFullName,
          licenseNumber: data.ocrLicenseNumber,
          licenseExpiry: data.ocrLicenseExpiry?.split('T')[0],
          dateOfBirth: data.ocrDateOfBirth?.split('T')[0],
          nationality: data.ocrNationality,
          licenseCategory: data.ocrLicenseCategory,
        },
        isLicenseExpired: data.ocrLicenseExpiry ? new Date(data.ocrLicenseExpiry) < new Date() : false,
        expiryWarning: null,
        nationalIdFrontUrl: data.nationalIdFrontUrl,
        nationalIdBackUrl: data.nationalIdBackUrl,
        nationalIdOcrData: {
          fullNameEn: data.ocrNationalIdNameEn,
          fullNameAr: data.ocrNationalIdNameAr,
          emiratesIdNumber: data.ocrEmiratesIdNumber,
          expiryDate: data.ocrNationalIdExpiry?.split('T')[0],
        },
        isNationalIdExpired: data.ocrNationalIdExpiry ? new Date(data.ocrNationalIdExpiry) < new Date() : false,
        nationalIdExpiryWarning: null,
        nameMatchWarning: null,
        vehicleId: data.vehicleId,
        scheduledDate: data.scheduledDate?.split('T')[0] || null,
        scheduledTime: data.scheduledTime,
        duration: data.duration || 30,
        signatureData: data.signatureUrl,
        termsAccepted: !!data.signedAt,
        vehicle: data.vehicle ? {
          id: data.vehicle.id,
          make: data.vehicle.make,
          model: data.vehicle.model,
          year: data.vehicle.year,
          color: data.vehicle.color,
          variant: data.vehicle.variant,
        } : null,
        customer: data.customer ? {
          id: data.customer.id,
          name: data.customer.name,
          email: data.customer.email,
          phone: data.customer.phone,
        } : null,
      });

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [testDriveId]);

  // Validation helpers
  const isStep1Valid = !!(
    state.drivingLicenseFrontUrl &&
    state.ocrData.fullName &&
    state.ocrData.licenseNumber &&
    !state.isLicenseExpired
  );

  const isStep2Valid = !!(
    state.vehicleId &&
    state.scheduledDate &&
    state.scheduledTime
  );

  const isStep3Valid = !!(
    state.signatureData &&
    state.termsAccepted
  );

  const canProceed = useCallback(
    (step: number): boolean => {
      switch (step) {
        case 1:
          return isStep1Valid;
        case 2:
          return isStep2Valid;
        case 3:
          return isStep3Valid;
        case 4:
          return isStep1Valid && isStep2Valid && isStep3Valid;
        default:
          return false;
      }
    },
    [isStep1Valid, isStep2Valid, isStep3Valid]
  );

  return {
    // State
    currentStep,
    steps,
    state,
    isLoading,
    error,

    // Navigation
    goToStep,
    nextStep,
    prevStep,

    // Step 1: Identity
    setLicenseImages,
    setNationalIdImages,
    setOcrData,
    setNationalIdOcrData,

    // Step 2: Vehicle & Time
    setVehicle,
    setScheduledDate,
    setScheduledTime,
    setDuration,

    // Step 3: Agreement
    setSignatureData,
    setTermsAccepted,

    // Actions
    saveProgress,
    signAgreement,
    loadTestDrive,
    canProceed,
  };
}
