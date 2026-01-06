'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ClipboardCheck,
  Car,
  User,
  CreditCard,
  Camera,
  DollarSign,
  Check,
  ArrowLeft,
  AlertTriangle,
  FileText,
  MessageSquare,
  Calendar,
  Gauge,
  X,
} from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Card } from '@/components/ui';

// Helper to check if URL is base64 data URL
const isDataUrl = (url: string) => url?.startsWith('data:');

interface TradeInDetail {
  id: string;
  status: string;
  submittedAt: string | null;
  tentativePrice: number | null;
  inspectorNotes: string | null;
  reviewedAt: string | null;
  registrationFrontUrl: string | null;
  registrationBackUrl: string | null;
  ocrCustomerName: string | null;
  ocrVehicleMake: string | null;
  ocrVehicleModel: string | null;
  ocrVehicleTrim: string | null;
  ocrVin: string | null;
  ocrPlateNumber: string | null;
  ocrRegistrationYear: number | null;
  mileage: number | null;
  expectedPrice: number | null;
  condition: string | null;
  features: string[];
  additionalNotes: string | null;
  customer: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  };
  salesExecutive: {
    id: string;
    name: string;
  };
  photos: {
    id: string;
    type: string;
    url: string;
    notes: string | null;
    annotations: unknown;
  }[];
}

export default function ReviewAppraisalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [appraisal, setAppraisal] = useState<TradeInDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [tentativePrice, setTentativePrice] = useState('');
  const [inspectorNotes, setInspectorNotes] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<TradeInDetail['photos'][0] | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchAppraisal();
  }, [id]);

  const fetchAppraisal = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/trade-ins/${id}`);
      const data = await response.json();
      if (data.data) {
        setAppraisal(data.data);
        if (data.data.tentativePrice) {
          setTentativePrice(data.data.tentativePrice.toString());
        }
        if (data.data.inspectorNotes) {
          setInspectorNotes(data.data.inspectorNotes);
        }
      }
    } catch (error) {
      console.error('Failed to fetch appraisal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!tentativePrice) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/trade-ins/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tentativePrice: parseFloat(tentativePrice),
          inspectorNotes,
        }),
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => {
          router.push('/trade-in/review');
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Trade-In Review">
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full" />
        </div>
      </PageContainer>
    );
  }

  if (!appraisal) {
    return (
      <PageContainer title="Trade-In Review">
        <div className="text-center py-20">
          <p className="text-gray-500">Appraisal not found</p>
        </div>
      </PageContainer>
    );
  }

  if (saveSuccess) {
    return (
      <PageContainer title="Trade-In Review">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Review Submitted!
          </h2>
          <p className="text-gray-500 mb-4">
            Tentative price of AED {parseFloat(tentativePrice).toLocaleString()} has been set.
          </p>
          <p className="text-sm text-gray-400">
            The sales executive will be notified.
          </p>
          <div className="animate-pulse text-gray-400 text-sm mt-4">
            Redirecting...
          </div>
        </div>
      </PageContainer>
    );
  }

  const vehicleTitle = [
    appraisal.ocrRegistrationYear,
    appraisal.ocrVehicleMake,
    appraisal.ocrVehicleModel,
    appraisal.ocrVehicleTrim,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <PageContainer title="Trade-In Review">
      <div className="max-w-4xl mx-auto space-y-6 pb-48">
        {/* Back Button */}
        <Link
          href="/trade-in/review"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Reviews</span>
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
            <ClipboardCheck className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">{vehicleTitle || 'Trade-In Review'}</h1>
            <p className="text-sm text-gray-500">
              Submitted {appraisal.submittedAt ? new Date(appraisal.submittedAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          {appraisal.status === 'REVIEWED' && (
            <span className="bg-green-50 text-green-600 text-xs px-2 py-1 rounded">
              Reviewed
            </span>
          )}
        </div>

        {/* Vehicle Details */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2 text-gray-900 font-medium">
            <Car className="w-4 h-4 text-blue-600" />
            Vehicle Information
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            {appraisal.ocrPlateNumber && (
              <div>
                <span className="text-gray-400">Plate</span>
                <p className="text-gray-900 font-medium">{appraisal.ocrPlateNumber}</p>
              </div>
            )}
            {appraisal.ocrVin && (
              <div className="col-span-2">
                <span className="text-gray-400">VIN</span>
                <p className="text-gray-900 font-mono text-xs">{appraisal.ocrVin}</p>
              </div>
            )}
            {appraisal.mileage && (
              <div>
                <span className="text-gray-400">Mileage</span>
                <p className="text-gray-900">{appraisal.mileage.toLocaleString()} km</p>
              </div>
            )}
            {appraisal.condition && (
              <div>
                <span className="text-gray-400">Condition</span>
                <p className="text-gray-900 capitalize">{appraisal.condition}</p>
              </div>
            )}
            {appraisal.expectedPrice && (
              <div>
                <span className="text-gray-400">Customer Expected</span>
                <p className="text-amber-600 font-medium">AED {appraisal.expectedPrice.toLocaleString()}</p>
              </div>
            )}
          </div>

          {appraisal.features && appraisal.features.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {appraisal.features.map((feature) => (
                <span key={feature} className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                  {feature}
                </span>
              ))}
            </div>
          )}

          {appraisal.additionalNotes && (
            <div className="pt-2 border-t border-gray-200">
              <span className="text-gray-400 text-xs">Ownership Notes</span>
              <p className="text-gray-500 text-sm mt-1">{appraisal.additionalNotes}</p>
            </div>
          )}
        </div>

        {/* Customer Info */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-gray-900 font-medium">
            <User className="w-4 h-4 text-blue-600" />
            Customer & Sales
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Customer</span>
              <p className="text-gray-900">{appraisal.customer.name}</p>
              {appraisal.customer.phone && (
                <p className="text-gray-500 text-xs">{appraisal.customer.phone}</p>
              )}
            </div>
            <div>
              <span className="text-gray-400">Sales Executive</span>
              <p className="text-gray-900">{appraisal.salesExecutive.name}</p>
            </div>
          </div>
        </div>

        {/* Registration Cards */}
        {(appraisal.registrationFrontUrl || appraisal.registrationBackUrl) && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-gray-900 font-medium">
              <CreditCard className="w-4 h-4 text-blue-600" />
              Registration Documents
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {appraisal.registrationFrontUrl && (
                <div className="relative w-40 h-28 rounded-lg overflow-hidden flex-shrink-0">
                  {isDataUrl(appraisal.registrationFrontUrl) ? (
                    <img
                      src={appraisal.registrationFrontUrl}
                      alt="Registration Front"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={appraisal.registrationFrontUrl}
                      alt="Registration Front"
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
              )}
              {appraisal.registrationBackUrl && (
                <div className="relative w-40 h-28 rounded-lg overflow-hidden flex-shrink-0">
                  {isDataUrl(appraisal.registrationBackUrl) ? (
                    <img
                      src={appraisal.registrationBackUrl}
                      alt="Registration Back"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={appraisal.registrationBackUrl}
                      alt="Registration Back"
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Photos */}
        {appraisal.photos && appraisal.photos.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-gray-900 font-medium">
            <Camera className="w-4 h-4 text-blue-600" />
            Vehicle Photos ({appraisal.photos.length})
          </div>
          <div className="grid grid-cols-4 gap-2">
            {appraisal.photos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="relative aspect-square rounded-lg overflow-hidden group"
              >
                {isDataUrl(photo.url) ? (
                  <img
                    src={photo.url}
                    alt={photo.type}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={photo.url}
                    alt={photo.type}
                    fill
                    className="object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs">{photo.type.replace('_', ' ')}</span>
                </div>
                {(photo.notes || (photo.annotations as unknown[])?.length > 0) && (
                  <div className="absolute top-1 right-1 flex gap-0.5">
                    {photo.notes && (
                      <div className="bg-blue-600 p-0.5 rounded">
                        <MessageSquare className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                    {(photo.annotations as unknown[])?.length > 0 && (
                      <div className="bg-amber-500 p-0.5 rounded">
                        <AlertTriangle className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
        )}

        {/* Photo Detail Modal */}
        {selectedPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-gray-900 font-medium capitalize">
                  {selectedPhoto.type.replace('_', ' ')}
                </h3>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="text-gray-400 hover:text-gray-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative aspect-video">
                {isDataUrl(selectedPhoto.url) ? (
                  <img
                    src={selectedPhoto.url}
                    alt={selectedPhoto.type}
                    className="w-full h-full object-contain bg-gray-100"
                  />
                ) : (
                  <Image
                    src={selectedPhoto.url}
                    alt={selectedPhoto.type}
                    fill
                    className="object-contain bg-gray-100"
                  />
                )}
              </div>
              {(selectedPhoto.notes || (selectedPhoto.annotations as unknown[])?.length > 0) && (
                <div className="p-4 space-y-2">
                  {selectedPhoto.notes && (
                    <div>
                      <span className="text-gray-400 text-xs">Notes</span>
                      <p className="text-gray-500 text-sm">{selectedPhoto.notes}</p>
                    </div>
                  )}
                  {(selectedPhoto.annotations as unknown[])?.length > 0 && (
                    <div className="flex items-center gap-2 text-amber-600 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      {(selectedPhoto.annotations as unknown[]).length} damage marker(s)
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pricing Section - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="max-w-md mx-auto space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                Tentative Trade-In Price (AED)
              </label>
              <input
                type="number"
                value={tentativePrice}
                onChange={(e) => setTentativePrice(e.target.value)}
                placeholder="Enter tentative price"
                className="light-input w-full text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                Inspector Notes (Optional)
              </label>
              <textarea
                value={inspectorNotes}
                onChange={(e) => setInspectorNotes(e.target.value)}
                placeholder="Any notes about the valuation..."
                rows={2}
                className="light-input w-full resize-none"
              />
            </div>

            <button
              onClick={handleSubmitReview}
              disabled={!tentativePrice || isSaving}
              className="light-btn-success w-full justify-center disabled:opacity-50"
            >
              {isSaving ? (
                'Submitting...'
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Submit Review & Price
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
