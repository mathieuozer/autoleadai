'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DarkLayout, Stepper } from '@/components/trade-in';
import { useTestDriveWizard } from '@/hooks/useTestDriveWizard';
import { Step1Identity } from './Step1Identity';
import { Step2Vehicle } from './Step2Vehicle';
import { Step3Agreement } from './Step3Agreement';
import { Step4Confirmation } from './Step4Confirmation';

export default function TestDriveWizardPage() {
  const params = useParams();
  const router = useRouter();
  const testDriveId = params.id as string;

  const wizard = useTestDriveWizard(testDriveId);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load existing test drive data on mount
  useEffect(() => {
    async function init() {
      const data = await wizard.loadTestDrive();
      if (!data) {
        // Test drive not found, redirect
        router.push('/test-drive');
        return;
      }
      setIsInitialized(true);
    }
    init();
  }, [testDriveId]);

  if (!isInitialized) {
    return (
      <DarkLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-[#94a3b8]">Loading...</div>
        </div>
      </DarkLayout>
    );
  }

  // Render current step
  const renderStep = () => {
    switch (wizard.currentStep) {
      case 1:
        return <Step1Identity wizard={wizard} />;
      case 2:
        return <Step2Vehicle wizard={wizard} />;
      case 3:
        return <Step3Agreement wizard={wizard} />;
      case 4:
        return <Step4Confirmation wizard={wizard} />;
      default:
        return null;
    }
  };

  return (
    <DarkLayout showBackButton backHref="/test-drive">
      <div className="space-y-6">
        {/* Stepper */}
        <Stepper steps={wizard.steps} currentStep={wizard.currentStep} />

        {/* Step Content */}
        <div className="dark-card p-6">
          {renderStep()}
        </div>

        {/* Error Message */}
        {wizard.error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
            {wizard.error}
          </div>
        )}
      </div>
    </DarkLayout>
  );
}
