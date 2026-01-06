'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DarkLayout, Stepper } from '@/components/trade-in';
import { useTradeInWizard } from '@/hooks/useTradeInWizard';
import { Step1Registration } from './Step1Registration';
import { Step2Details } from './Step2Details';
import { Step3Photos } from './Step3Photos';
import { Step4Review } from './Step4Review';
import { PriceResponseView } from './PriceResponseView';

interface AppraisalData {
  id: string;
  status: string;
  tentativePrice: number | null;
  inspectorNotes: string | null;
  reviewedAt: string | null;
  customer: { name: string };
  inspector?: { name: string } | null;
  ocrVehicleMake?: string;
  ocrVehicleModel?: string;
  ocrRegistrationYear?: number;
  mileage?: number;
  expectedPrice?: number;
  condition?: string;
}

export default function TradeInWizardPage() {
  const params = useParams();
  const router = useRouter();
  const appraisalId = params.id as string;

  const wizard = useTradeInWizard(appraisalId);
  const [isInitialized, setIsInitialized] = useState(false);
  const [appraisalData, setAppraisalData] = useState<AppraisalData | null>(null);

  // Load existing appraisal data on mount
  useEffect(() => {
    async function init() {
      const data = await wizard.loadAppraisal();
      if (!data) {
        // Appraisal not found, redirect
        router.push('/dashboard');
        return;
      }
      setAppraisalData(data);
      setIsInitialized(true);
    }
    init();
  }, [appraisalId]);

  if (!isInitialized) {
    return (
      <DarkLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-[#94a3b8]">Loading...</div>
        </div>
      </DarkLayout>
    );
  }

  // Show price response view for PRICED, ACCEPTED, or REJECTED status
  if (appraisalData && ['PRICED', 'ACCEPTED', 'REJECTED'].includes(appraisalData.status)) {
    return (
      <PriceResponseView
        appraisalId={appraisalId}
        appraisal={appraisalData}
        onStatusChange={(newStatus) => {
          setAppraisalData(prev => prev ? { ...prev, status: newStatus } : null);
        }}
      />
    );
  }

  // Render current step
  const renderStep = () => {
    switch (wizard.currentStep) {
      case 1:
        return <Step1Registration wizard={wizard} />;
      case 2:
        return <Step2Details wizard={wizard} />;
      case 3:
        return <Step3Photos wizard={wizard} appraisalId={appraisalId} />;
      case 4:
        return <Step4Review wizard={wizard} />;
      default:
        return null;
    }
  };

  return (
    <DarkLayout showBackButton backHref="/dashboard">
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
