'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DarkLayout } from '@/components/trade-in';

function NewTradeInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function createAppraisal() {
      const customerId = searchParams.get('customerId');
      const salesExecutiveId = searchParams.get('salesExecutiveId');
      const leadId = searchParams.get('leadId');

      if (!customerId || !salesExecutiveId) {
        setError('Missing required parameters: customerId and salesExecutiveId');
        return;
      }

      try {
        const response = await fetch('/api/trade-ins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId,
            salesExecutiveId,
            leadId: leadId || null,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error?.message || 'Failed to create appraisal');
        }

        const { data } = await response.json();

        // Redirect to the wizard
        router.replace(`/trade-in/${data.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create appraisal');
      }
    }

    createAppraisal();
  }, [searchParams, router]);

  if (error) {
    return (
      <DarkLayout showBackButton backHref="/dashboard">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-red-400 mb-2">Error</h2>
            <p className="text-sm text-[#94a3b8]">{error}</p>
          </div>
        </div>
      </DarkLayout>
    );
  }

  return (
    <DarkLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-[#94a3b8]">
          Creating trade-in appraisal...
        </div>
      </div>
    </DarkLayout>
  );
}

export default function NewTradeInPage() {
  return (
    <Suspense
      fallback={
        <DarkLayout>
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="animate-pulse text-[#94a3b8]">Loading...</div>
          </div>
        </DarkLayout>
      }
    >
      <NewTradeInContent />
    </Suspense>
  );
}
