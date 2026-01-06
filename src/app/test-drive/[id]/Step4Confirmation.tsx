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
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Cleared for Test Drive!
        </h2>
        <p className="text-gray-500">
          The agreement has been signed and the customer is ready to proceed.
        </p>
      </div>

      {/* Status Badge */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200">
          <Gauge className="w-5 h-5 text-green-600" />
          <span className="font-semibold text-green-600">Test Drive Approved</span>
        </div>
      </div>

      {/* Details Card */}
      <div className="bg-gray-50 rounded-lg p-5 space-y-4">
        <h3 className="font-semibold text-gray-900 mb-4">Booking Details</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <User className="w-4 h-4 text-blue-600 mt-1" />
            <div>
              <p className="text-xs text-gray-400">Customer</p>
              <p className="text-gray-900 font-medium">{wizard.state.ocrData.fullName || wizard.state.customer?.name || 'Unknown'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Car className="w-4 h-4 text-green-600 mt-1" />
            <div>
              <p className="text-xs text-gray-400">Vehicle</p>
              <p className="text-gray-900 font-medium">{vehicleInfo}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-amber-600 mt-1" />
            <div>
              <p className="text-xs text-gray-400">Date</p>
              <p className="text-gray-900 font-medium">{scheduledInfo}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 text-purple-600 mt-1" />
            <div>
              <p className="text-xs text-gray-400">Time</p>
              <p className="text-gray-900 font-medium">{wizard.state.scheduledTime || 'Not scheduled'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Email Confirmation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
        <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <div>
          <p className="text-gray-900 font-medium">Confirmation Sent</p>
          <p className="text-sm text-gray-500">
            A copy of the signed agreement has been emailed to the customer.
          </p>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Next Steps</h4>
        <ul className="space-y-2 text-sm text-gray-500">
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Verify customer ID matches the signed agreement
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Brief customer on vehicle controls and features
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Accompany customer during test drive
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Complete post-drive feedback
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={() => router.push('/test-drive')}
          className="flex-1 light-btn-secondary justify-center"
        >
          Back to Test Drives
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="flex-1 light-btn-primary justify-center"
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
