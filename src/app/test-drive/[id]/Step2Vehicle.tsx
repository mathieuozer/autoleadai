'use client';

import { useState, useEffect } from 'react';
import { Car, CheckCircle, Loader2 } from 'lucide-react';
import { TimeSlotPicker } from '@/components/test-drive';
import { useTestDriveWizard } from '@/hooks/useTestDriveWizard';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  variant?: string;
  testDriveAvailable: boolean;
}

interface Step2VehicleProps {
  wizard: ReturnType<typeof useTestDriveWizard>;
}

export function Step2Vehicle({ wizard }: Step2VehicleProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);

  // Fetch available vehicles
  useEffect(() => {
    async function fetchVehicles() {
      try {
        const response = await fetch('/api/vehicles?testDriveAvailable=true');
        if (response.ok) {
          const { data } = await response.json();
          setVehicles(data.filter((v: Vehicle) => v.testDriveAvailable));
        }
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
      } finally {
        setIsLoadingVehicles(false);
      }
    }

    fetchVehicles();
  }, []);

  const handleVehicleSelect = (vehicle: Vehicle) => {
    wizard.setVehicle(vehicle.id, {
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      variant: vehicle.variant,
    });
  };

  const canProceed = wizard.canProceed(2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Vehicle & Time Selection</h2>
        <p className="text-sm text-gray-500 mt-1">
          Select the test drive vehicle and schedule a time slot
        </p>
      </div>

      {/* Customer Info */}
      {wizard.state.ocrData.fullName && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-600 font-medium">Customer</p>
          <p className="text-gray-900 font-medium">{wizard.state.ocrData.fullName}</p>
        </div>
      )}

      {/* Vehicle Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          <Car className="w-4 h-4 inline mr-2 text-blue-600" />
          Select Vehicle
        </label>

        {isLoadingVehicles ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        ) : vehicles.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
            No vehicles available for test drive
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
            {vehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => handleVehicleSelect(vehicle)}
                className={`w-full text-left rounded-lg p-4 transition-colors ${
                  wizard.state.vehicleId === vehicle.id
                    ? 'bg-green-50 border-2 border-green-500'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </p>
                    <p className="text-sm text-gray-500">
                      {[vehicle.variant, vehicle.color].filter(Boolean).join(' • ')}
                    </p>
                  </div>
                  {wizard.state.vehicleId === vehicle.id && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Time Slot Selection */}
      {wizard.state.vehicleId && (
        <TimeSlotPicker
          vehicleId={wizard.state.vehicleId}
          selectedDate={wizard.state.scheduledDate}
          selectedTime={wizard.state.scheduledTime}
          onDateChange={wizard.setScheduledDate}
          onTimeChange={wizard.setScheduledTime}
        />
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          onClick={() => wizard.prevStep()}
          className="light-btn-secondary"
        >
          Back
        </button>
        <button
          onClick={async () => {
            await wizard.saveProgress();
            wizard.nextStep();
          }}
          disabled={!canProceed || wizard.isLoading}
          className="light-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {wizard.isLoading ? 'Saving...' : 'Continue to Agreement'}
        </button>
      </div>
    </div>
  );
}
