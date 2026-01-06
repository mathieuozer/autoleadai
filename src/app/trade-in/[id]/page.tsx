'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Card } from '@/components/ui';
import { LightStepper } from '@/components/trade-in';
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
      <PageContainer title="Trade-In Appraisal">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-gray-500">Loading...</div>
        </div>
      </PageContainer>
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
    <PageContainer title="Trade-In Appraisal">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Link
          href="/trade-in"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Trade-Ins</span>
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
