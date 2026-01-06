'use client';

import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  User,
  Car,
  Calendar,
  Clock,
  Mail,
  Gauge,
  ArrowRight,
} from 'lucide-react';
import { useTestDriveWizard } from '@/hooks/useTestDriveWizard';

interface Step4ConfirmationProps {
  wizard: ReturnType<typeof useTestDriveWizard>;
}

export function Step4Confirmation({ wizard }: Step4ConfirmationProps) {
  const router = useRouter();

  const vehicleInfo = wizard.state.vehicle
    ? `${wizard.state.vehicle.year} ${wizard.state.vehicle.make} ${wizard.state.vehicle.model}`
    : 'Not selected';

  const scheduledInfo = wizard.state.scheduledDate && wizard.state.scheduledTime
    ? new Date(wizard.state.scheduledDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : 'Not scheduled';

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      <div className="bg-gradient-to-r from-[#22c55e]/20 to-[#0ea5e9]/20 border border-[#22c55e]/30 rounded-xl p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#22c55e]/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-[#22c55e]" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Cleared for Test Drive!
        </h2>
        <p className="text-[#94a3b8]">
          The agreement has been signed and the customer is ready to proceed.
        </p>
      </div>

      {/* Status Badge */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30">
          <Gauge className="w-5 h-5 text-[#22c55e]" />
          <span className="font-semibold text-[#22c55e]">Test Drive Approved</span>
        </div>
      </div>

      {/* Details Card */}
      <div className="bg-[#1e293b] rounded-lg p-5 space-y-4">
        <h3 className="font-semibold text-white mb-4">Booking Details</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <User className="w-4 h-4 text-[#0ea5e9] mt-1" />
            <div>
              <p className="text-xs text-[#64748b]">Customer</p>
              <p className="text-white font-medium">{wizard.state.ocrData.fullName || wizard.state.customer?.name || 'Unknown'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Car className="w-4 h-4 text-[#22c55e] mt-1" />
            <div>
              <p className="text-xs text-[#64748b]">Vehicle</p>
              <p className="text-white font-medium">{vehicleInfo}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-[#f59e0b] mt-1" />
            <div>
              <p className="text-xs text-[#64748b]">Date</p>
              <p className="text-white font-medium">{scheduledInfo}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 text-[#8b5cf6] mt-1" />
            <div>
              <p className="text-xs text-[#64748b]">Time</p>
              <p className="text-white font-medium">{wizard.state.scheduledTime || 'Not scheduled'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Email Confirmation */}
      <div className="bg-[#0ea5e9]/10 border border-[#0ea5e9]/30 rounded-lg p-4 flex items-center gap-3">
        <Mail className="w-5 h-5 text-[#0ea5e9] flex-shrink-0" />
        <div>
          <p className="text-white font-medium">Confirmation Sent</p>
          <p className="text-sm text-[#94a3b8]">
            A copy of the signed agreement has been emailed to the customer.
          </p>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-[#1e293b] rounded-lg p-4">
        <h4 className="font-medium text-white mb-3">Next Steps</h4>
        <ul className="space-y-2 text-sm text-[#94a3b8]">
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#22c55e]" />
            Verify customer ID matches the signed agreement
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#22c55e]" />
            Brief customer on vehicle controls and features
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#22c55e]" />
            Accompany customer during test drive
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#22c55e]" />
            Complete post-drive feedback
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={() => router.push('/test-drive')}
          className="flex-1 dark-btn-secondary justify-center"
        >
          Back to Test Drives
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="flex-1 dark-btn-primary justify-center"
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
