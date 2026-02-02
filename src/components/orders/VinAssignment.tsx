'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

interface VinAssignmentProps {
  orderId: string;
  currentVin: string | null;
  hasDownPayment: boolean;
  portalActivated: boolean;
  portalActivatedAt: string | null;
  onAssignVin: (vin: string) => void;
  onActivatePortal: () => void;
  isAssigning?: boolean;
  isActivating?: boolean;
}

export function VinAssignment({
  orderId,
  currentVin,
  hasDownPayment,
  portalActivated,
  portalActivatedAt,
  onAssignVin,
  onActivatePortal,
  isAssigning,
  isActivating,
}: VinAssignmentProps) {
  const [vin, setVin] = useState(currentVin || '');
  const [error, setError] = useState('');

  const validateVin = (value: string): boolean => {
    // VIN must be 17 characters, alphanumeric (no I, O, Q)
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;
    return vinRegex.test(value);
  };

  const handleSubmit = () => {
    setError('');

    if (!vin) {
      setError('VIN is required');
      return;
    }

    if (!validateVin(vin)) {
      setError('Invalid VIN format. Must be 17 alphanumeric characters (excluding I, O, Q)');
      return;
    }

    onAssignVin(vin.toUpperCase());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Vehicle Identification
          {currentVin && (
            <Badge variant="success">VIN Assigned</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full ${hasDownPayment ? 'bg-green-500' : 'bg-gray-300'}`}
              />
              <span className="text-sm">Down payment collected</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div
                className={`h-3 w-3 rounded-full ${currentVin ? 'bg-green-500' : 'bg-gray-300'}`}
              />
              <span className="text-sm">VIN assigned</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div
                className={`h-3 w-3 rounded-full ${portalActivated ? 'bg-green-500' : 'bg-gray-300'}`}
              />
              <span className="text-sm">Customer portal activated</span>
            </div>
          </div>
        </div>

        {/* VIN Assignment */}
        {!currentVin ? (
          <div className="space-y-3">
            <Input
              label="Vehicle Identification Number (VIN)"
              value={vin}
              onChange={(e) => {
                setVin(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="Enter 17-character VIN"
              maxLength={17}
              error={error}
              disabled={!hasDownPayment}
            />
            {!hasDownPayment && (
              <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                Down payment must be collected before assigning VIN
              </p>
            )}
            <Button
              onClick={handleSubmit}
              isLoading={isAssigning}
              disabled={!hasDownPayment || !vin}
            >
              Assign VIN
            </Button>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Assigned VIN</p>
            <p className="text-xl font-mono font-semibold text-gray-900 tracking-wide">
              {currentVin}
            </p>
          </div>
        )}

        {/* Portal Activation */}
        {currentVin && !portalActivated && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-2">Customer Portal</h4>
            <p className="text-sm text-gray-600 mb-3">
              Activate the customer portal to allow the customer to track their order online.
            </p>
            <Button
              variant="secondary"
              onClick={onActivatePortal}
              isLoading={isActivating}
            >
              Activate Customer Portal
            </Button>
          </div>
        )}

        {portalActivated && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between bg-green-50 rounded-lg p-4">
              <div>
                <p className="font-medium text-green-800">Customer Portal Active</p>
                <p className="text-sm text-green-600">
                  Activated {portalActivatedAt && new Date(portalActivatedAt).toLocaleDateString()}
                </p>
              </div>
              <svg
                className="h-8 w-8 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
