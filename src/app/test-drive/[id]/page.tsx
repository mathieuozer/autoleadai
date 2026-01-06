'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Card } from '@/components/ui';
import { LightStepper } from '@/components/trade-in';
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
      <PageContainer title="Test Drive">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-gray-500">Loading...</div>
        </div>
      </PageContainer>
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
    <PageContainer title="Test Drive">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Link
          href="/test-drive"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Test Drives</span>
        </Link>

        {/* Stepper */}
        <LightStepper steps={wizard.steps} currentStep={wizard.currentStep} />

        {/* Step Content */}
        <Card padding="lg">
          {renderStep()}
        </Card>

        {/* Error Message */}
        {wizard.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">
            {wizard.error}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
