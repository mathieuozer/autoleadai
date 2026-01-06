'use client';

import { useState, useCallback } from 'react';
import { VehicleCondition, PhotoType, TradeInPhoto } from '@/types';
import { WIZARD_STEPS, TOTAL_WIZARD_STEPS } from '@/lib/trade-in-constants';

export interface WizardState {
  // Step 1: Registration
  registrationFrontUrl: string | null;
  registrationBackUrl: string | null;
  ocrData: {
    customerName?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleTrim?: string;
    vin?: string;
    plateNumber?: string;
    registrationYear?: number;
  };

  // Step 2: Vehicle Details
  mileage: string;
  expectedPrice: string;
  condition: VehicleCondition | null;
  features: string[];
  additionalNotes: string;

  // Step 3: Photos
  photos: Map<PhotoType, TradeInPhoto>;
}

const initialState: WizardState = {
  registrationFrontUrl: null,
  registrationBackUrl: null,
  ocrData: {},
  mileage: '',
  expectedPrice: '',
  condition: null,
  features: [],
  additionalNotes: '',
  photos: new Map(),
};

export function useTradeInWizard(appraisalId: string) {
  const [currentStep, setCurrentStep] = useState(1);
  const [state, setState] = useState<WizardState>(initialState);
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

  // Step 1: Registration
  const setRegistrationImages = useCallback(
    (front: string | null, back: string | null) => {
      setState((prev) => ({
        ...prev,
        registrationFrontUrl: front,
        registrationBackUrl: back,
      }));
    },
    []
  );

  const setOcrData = useCallback(
    (data: WizardState['ocrData']) => {
      setState((prev) => ({
        ...prev,
        ocrData: { ...prev.ocrData, ...data },
      }));
    },
    []
  );

  // Step 2: Vehicle Details
  const setMileage = useCallback((value: string) => {
    setState((prev) => ({ ...prev, mileage: value }));
  }, []);

  const setExpectedPrice = useCallback((value: string) => {
    setState((prev) => ({ ...prev, expectedPrice: value }));
  }, []);

  const setCondition = useCallback((condition: VehicleCondition) => {
    setState((prev) => ({ ...prev, condition }));
  }, []);

  const toggleFeature = useCallback((feature: string) => {
    setState((prev) => {
      const features = prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature];
      return { ...prev, features };
    });
  }, []);

  const setAdditionalNotes = useCallback((notes: string) => {
    setState((prev) => ({ ...prev, additionalNotes: notes }));
  }, []);

  // Step 3: Photos
  const addPhoto = useCallback((type: PhotoType, photo: TradeInPhoto) => {
    setState((prev) => {
      const photos = new Map(prev.photos);
      photos.set(type, photo);
      return { ...prev, photos };
    });
  }, []);

  const removePhoto = useCallback((type: PhotoType) => {
    setState((prev) => {
      const photos = new Map(prev.photos);
      photos.delete(type);
      return { ...prev, photos };
    });
  }, []);

  // Save to API
  const saveProgress = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/trade-ins/${appraisalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationFrontUrl: state.registrationFrontUrl,
          registrationBackUrl: state.registrationBackUrl,
          ocrCustomerName: state.ocrData.customerName,
          ocrVehicleMake: state.ocrData.vehicleMake,
          ocrVehicleModel: state.ocrData.vehicleModel,
          ocrVehicleTrim: state.ocrData.vehicleTrim,
          ocrVin: state.ocrData.vin,
          ocrPlateNumber: state.ocrData.plateNumber,
          ocrRegistrationYear: state.ocrData.registrationYear,
          mileage: state.mileage ? parseInt(state.mileage) : null,
          expectedPrice: state.expectedPrice ? parseFloat(state.expectedPrice) : null,
          condition: state.condition,
          features: state.features,
          additionalNotes: state.additionalNotes,
        }),
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
  }, [appraisalId, state]);

  // Submit for review
  const submitAppraisal = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First save current state
      const saved = await saveProgress();
      if (!saved) return false;

      // Then submit
      const response = await fetch(`/api/trade-ins/${appraisalId}/submit`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to submit');
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [appraisalId, saveProgress]);

  // Load existing data
  const loadAppraisal = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/trade-ins/${appraisalId}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to load');
      }

      const { data } = await response.json();

      // Map photos to state
      const photos = new Map<PhotoType, TradeInPhoto>();
      for (const photo of data.photos || []) {
        photos.set(photo.type.toLowerCase() as PhotoType, {
          id: photo.id,
          type: photo.type.toLowerCase() as PhotoType,
          url: photo.url,
          thumbnail: photo.thumbnail,
          timestamp: photo.createdAt,
          notes: photo.notes,
          annotations: photo.annotations,
        });
      }

      setState({
        registrationFrontUrl: data.registrationFrontUrl,
        registrationBackUrl: data.registrationBackUrl,
        ocrData: {
          customerName: data.ocrCustomerName,
          vehicleMake: data.ocrVehicleMake,
          vehicleModel: data.ocrVehicleModel,
          vehicleTrim: data.ocrVehicleTrim,
          vin: data.ocrVin,
          plateNumber: data.ocrPlateNumber,
          registrationYear: data.ocrRegistrationYear,
        },
        mileage: data.mileage?.toString() || '',
        expectedPrice: data.expectedPrice?.toString() || '',
        condition: data.condition?.toLowerCase() as VehicleCondition | null,
        features: data.features || [],
        additionalNotes: data.additionalNotes || '',
        photos,
      });

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [appraisalId]);

  // Validation helper (non-recursive)
  const isStep1Valid = !!state.registrationFrontUrl;
  const isStep2Valid = !!state.mileage && !!state.expectedPrice && !!state.condition;
  const isStep3Valid = (() => {
    const requiredTypes: PhotoType[] = [
      'front_view',
      'rear_view',
      'left_side',
      'right_side',
      'dashboard',
      'front_seats',
      'rear_seats',
      'trunk',
    ];
    return requiredTypes.every((type) => state.photos.has(type));
  })();

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

    // Step 1
    setRegistrationImages,
    setOcrData,

    // Step 2
    setMileage,
    setExpectedPrice,
    setCondition,
    toggleFeature,
    setAdditionalNotes,

    // Step 3
    addPhoto,
    removePhoto,

    // Actions
    saveProgress,
    submitAppraisal,
    loadAppraisal,
    canProceed,
  };
}
