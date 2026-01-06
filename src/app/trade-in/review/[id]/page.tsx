'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
} from 'lucide-react';
import { DarkLayout } from '@/components/trade-in';

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
      setAppraisal(data.data);
      if (data.data.tentativePrice) {
        setTentativePrice(data.data.tentativePrice.toString());
      }
      if (data.data.inspectorNotes) {
        setInspectorNotes(data.data.inspectorNotes);
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
      <DarkLayout showBackButton backHref="/trade-in/review">
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-[#8b5cf6] border-t-transparent rounded-full" />
        </div>
      </DarkLayout>
    );
  }

  if (!appraisal) {
    return (
      <DarkLayout showBackButton backHref="/trade-in/review">
        <div className="text-center py-20">
          <p className="text-[#94a3b8]">Appraisal not found</p>
        </div>
      </DarkLayout>
    );
  }

  if (saveSuccess) {
    return (
      <DarkLayout>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-[#22c55e]/10 flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-[#22c55e]" />
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">
            Review Submitted!
          </h2>
          <p className="text-[#94a3b8] mb-4">
            Tentative price of AED {parseFloat(tentativePrice).toLocaleString()} has been set.
          </p>
          <p className="text-sm text-[#64748b]">
            The sales executive will be notified.
          </p>
          <div className="animate-pulse text-[#64748b] text-sm mt-4">
            Redirecting...
          </div>
        </div>
      </DarkLayout>
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
    <DarkLayout showBackButton backHref="/trade-in/review">
      <div className="space-y-6 pb-32">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#8b5cf6]/10 flex items-center justify-center">
            <ClipboardCheck className="w-6 h-6 text-[#8b5cf6]" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">{vehicleTitle || 'Trade-In Review'}</h1>
            <p className="text-sm text-[#94a3b8]">
              Submitted {appraisal.submittedAt ? new Date(appraisal.submittedAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          {appraisal.status === 'REVIEWED' && (
            <span className="bg-[#22c55e]/20 text-[#22c55e] text-xs px-2 py-1 rounded">
              Reviewed
            </span>
          )}
        </div>

        {/* Vehicle Details */}
        <div className="bg-[#334155] rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2 text-white font-medium">
            <Car className="w-4 h-4 text-[#0ea5e9]" />
            Vehicle Information
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            {appraisal.ocrPlateNumber && (
              <div>
                <span className="text-[#64748b]">Plate</span>
                <p className="text-white font-medium">{appraisal.ocrPlateNumber}</p>
              </div>
            )}
            {appraisal.ocrVin && (
              <div className="col-span-2">
                <span className="text-[#64748b]">VIN</span>
                <p className="text-white font-mono text-xs">{appraisal.ocrVin}</p>
              </div>
            )}
            {appraisal.mileage && (
              <div>
                <span className="text-[#64748b]">Mileage</span>
                <p className="text-white">{appraisal.mileage.toLocaleString()} km</p>
              </div>
            )}
            {appraisal.condition && (
              <div>
                <span className="text-[#64748b]">Condition</span>
                <p className="text-white capitalize">{appraisal.condition}</p>
              </div>
            )}
            {appraisal.expectedPrice && (
              <div>
                <span className="text-[#64748b]">Customer Expected</span>
                <p className="text-[#f59e0b] font-medium">AED {appraisal.expectedPrice.toLocaleString()}</p>
              </div>
            )}
          </div>

          {appraisal.features.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {appraisal.features.map((feature) => (
                <span key={feature} className="text-xs bg-[#475569] text-[#94a3b8] px-2 py-0.5 rounded">
                  {feature}
                </span>
              ))}
            </div>
          )}

          {appraisal.additionalNotes && (
            <div className="pt-2 border-t border-[#475569]">
              <span className="text-[#64748b] text-xs">Ownership Notes</span>
              <p className="text-[#94a3b8] text-sm mt-1">{appraisal.additionalNotes}</p>
            </div>
          )}
        </div>

        {/* Customer Info */}
        <div className="bg-[#334155] rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-white font-medium">
            <User className="w-4 h-4 text-[#0ea5e9]" />
            Customer & Sales
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[#64748b]">Customer</span>
              <p className="text-white">{appraisal.customer.name}</p>
              {appraisal.customer.phone && (
                <p className="text-[#94a3b8] text-xs">{appraisal.customer.phone}</p>
              )}
            </div>
            <div>
              <span className="text-[#64748b]">Sales Executive</span>
              <p className="text-white">{appraisal.salesExecutive.name}</p>
            </div>
          </div>
        </div>

        {/* Registration Cards */}
        {(appraisal.registrationFrontUrl || appraisal.registrationBackUrl) && (
          <div className="bg-[#334155] rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-white font-medium">
              <CreditCard className="w-4 h-4 text-[#0ea5e9]" />
              Registration Documents
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {appraisal.registrationFrontUrl && (
                <div className="relative w-40 h-28 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={appraisal.registrationFrontUrl}
                    alt="Registration Front"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              {appraisal.registrationBackUrl && (
                <div className="relative w-40 h-28 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={appraisal.registrationBackUrl}
                    alt="Registration Back"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Photos */}
        <div className="bg-[#334155] rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-white font-medium">
            <Camera className="w-4 h-4 text-[#0ea5e9]" />
            Vehicle Photos ({appraisal.photos.length})
          </div>
          <div className="grid grid-cols-4 gap-2">
            {appraisal.photos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="relative aspect-square rounded-lg overflow-hidden group"
              >
                <Image
                  src={photo.url}
                  alt={photo.type}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs">{photo.type.replace('_', ' ')}</span>
                </div>
                {(photo.notes || (photo.annotations as unknown[])?.length > 0) && (
                  <div className="absolute top-1 right-1 flex gap-0.5">
                    {photo.notes && (
                      <div className="bg-[#0ea5e9] p-0.5 rounded">
                        <MessageSquare className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                    {(photo.annotations as unknown[])?.length > 0 && (
                      <div className="bg-[#f59e0b] p-0.5 rounded">
                        <AlertTriangle className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Photo Detail Modal */}
        {selectedPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <div className="bg-[#1e293b] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
              <div className="p-4 border-b border-[#334155] flex items-center justify-between">
                <h3 className="text-white font-medium capitalize">
                  {selectedPhoto.type.replace('_', ' ')}
                </h3>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="text-[#94a3b8] hover:text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>
              <div className="relative aspect-video">
                <Image
                  src={selectedPhoto.url}
                  alt={selectedPhoto.type}
                  fill
                  className="object-contain bg-black"
                />
              </div>
              {(selectedPhoto.notes || (selectedPhoto.annotations as unknown[])?.length > 0) && (
                <div className="p-4 space-y-2">
                  {selectedPhoto.notes && (
                    <div>
                      <span className="text-[#64748b] text-xs">Notes</span>
                      <p className="text-[#94a3b8] text-sm">{selectedPhoto.notes}</p>
                    </div>
                  )}
                  {(selectedPhoto.annotations as unknown[])?.length > 0 && (
                    <div className="flex items-center gap-2 text-[#f59e0b] text-sm">
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
        <div className="fixed bottom-0 left-0 right-0 bg-[#1e293b] border-t border-[#334155] p-4 space-y-4">
          <div className="max-w-md mx-auto space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#22c55e]" />
                Tentative Trade-In Price (AED)
              </label>
              <input
                type="number"
                value={tentativePrice}
                onChange={(e) => setTentativePrice(e.target.value)}
                placeholder="Enter tentative price"
                className="dark-input w-full text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#94a3b8]" />
                Inspector Notes (Optional)
              </label>
              <textarea
                value={inspectorNotes}
                onChange={(e) => setInspectorNotes(e.target.value)}
                placeholder="Any notes about the valuation..."
                rows={2}
                className="dark-input w-full resize-none"
              />
            </div>

            <button
              onClick={handleSubmitReview}
              disabled={!tentativePrice || isSaving}
              className="dark-btn-primary w-full justify-center bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-50"
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
    </DarkLayout>
  );
}
