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
        <h2 className="text-xl font-semibold text-white">Vehicle & Time Selection</h2>
        <p className="text-sm text-[#94a3b8] mt-1">
          Select the test drive vehicle and schedule a time slot
        </p>
      </div>

      {/* Customer Info */}
      {wizard.state.ocrData.fullName && (
        <div className="bg-[#0ea5e9]/10 border border-[#0ea5e9]/30 rounded-lg p-4">
          <p className="text-xs text-[#0ea5e9] font-medium">Customer</p>
          <p className="text-white font-medium">{wizard.state.ocrData.fullName}</p>
        </div>
      )}

      {/* Vehicle Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-[#f8fafc]">
          <Car className="w-4 h-4 inline mr-2 text-[#0ea5e9]" />
          Select Vehicle
        </label>

        {isLoadingVehicles ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-[#0ea5e9] animate-spin" />
          </div>
        ) : vehicles.length === 0 ? (
          <div className="bg-[#1e293b] rounded-lg p-6 text-center text-[#94a3b8]">
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
                    ? 'bg-[#22c55e]/10 border-2 border-[#22c55e]'
                    : 'bg-[#1e293b] hover:bg-[#334155] border-2 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </p>
                    <p className="text-sm text-[#94a3b8]">
                      {[vehicle.variant, vehicle.color].filter(Boolean).join(' • ')}
                    </p>
                  </div>
                  {wizard.state.vehicleId === vehicle.id && (
                    <CheckCircle className="w-5 h-5 text-[#22c55e]" />
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
          className="dark-btn-secondary"
        >
          Back
        </button>
        <button
          onClick={async () => {
            await wizard.saveProgress();
            wizard.nextStep();
          }}
          disabled={!canProceed || wizard.isLoading}
          className="dark-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {wizard.isLoading ? 'Saving...' : 'Continue to Agreement'}
        </button>
      </div>
    </div>
  );
}
