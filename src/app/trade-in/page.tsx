'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DarkLayout } from '@/components/trade-in';
import { Plus, Clock, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';

interface TradeInAppraisal {
  id: string;
  status: string;
  createdAt: string;
  expectedPrice: number | null;
  tentativePrice: number | null;
  customer: {
    name: string;
  };
  ocrVehicleMake?: string;
  ocrVehicleModel?: string;
}

const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  DRAFT: { icon: Clock, color: 'text-[#94a3b8]', label: 'Draft' },
  SUBMITTED: { icon: Clock, color: 'text-[#0ea5e9]', label: 'Submitted' },
  UNDER_REVIEW: { icon: Clock, color: 'text-[#f59e0b]', label: 'Under Review' },
  PRICED: { icon: DollarSign, color: 'text-[#22c55e]', label: 'Priced' },
  ACCEPTED: { icon: CheckCircle, color: 'text-[#22c55e]', label: 'Accepted' },
  REJECTED: { icon: AlertCircle, color: 'text-[#ef4444]', label: 'Rejected' },
};

export default function TradeInListPage() {
  const [appraisals, setAppraisals] = useState<TradeInAppraisal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAppraisals() {
      try {
        const response = await fetch('/api/trade-ins');
        if (response.ok) {
          const { data } = await response.json();
          setAppraisals(data);
        }
      } catch (error) {
        console.error('Failed to fetch appraisals:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAppraisals();
  }, []);

  return (
    <DarkLayout showBackButton backHref="/dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Trade-In Appraisals</h1>
            <p className="text-sm text-[#94a3b8] mt-1">
              Manage vehicle trade-in submissions
            </p>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-[#0ea5e9]/10 border border-[#0ea5e9]/30 rounded-lg p-4">
          <p className="text-sm text-[#0ea5e9]">
            To start a new trade-in appraisal, select a customer from the dashboard or orders page.
          </p>
        </div>

        {/* Appraisals List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-[#1e293b] rounded-lg p-4 animate-pulse"
              >
                <div className="h-4 bg-[#334155] rounded w-1/3 mb-2" />
                <div className="h-3 bg-[#334155] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : appraisals.length === 0 ? (
          <div className="bg-[#1e293b] rounded-lg p-8 text-center">
            <p className="text-[#94a3b8]">No trade-in appraisals yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appraisals.map((appraisal) => {
              const config = statusConfig[appraisal.status] || statusConfig.DRAFT;
              const StatusIcon = config.icon;

              return (
                <Link
                  key={appraisal.id}
                  href={`/trade-in/${appraisal.id}`}
                  className="block bg-[#1e293b] hover:bg-[#334155] rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">
                        {appraisal.customer.name}
                      </h3>
                      {(appraisal.ocrVehicleMake || appraisal.ocrVehicleModel) && (
                        <p className="text-sm text-[#94a3b8] mt-0.5">
                          {[appraisal.ocrVehicleMake, appraisal.ocrVehicleModel]
                            .filter(Boolean)
                            .join(' ')}
                        </p>
                      )}
                      <p className="text-xs text-[#64748b] mt-1">
                        {new Date(appraisal.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`flex items-center gap-1.5 ${config.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{config.label}</span>
                      </div>
                      {appraisal.tentativePrice && (
                        <p className="text-sm text-[#22c55e] mt-1">
                          AED {appraisal.tentativePrice.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DarkLayout>
  );
}
