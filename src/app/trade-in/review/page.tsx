'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ClipboardCheck,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Car,
  User,
  Calendar,
  ArrowLeft,
} from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Card } from '@/components/ui';

interface TradeInItem {
  id: string;
  status: string;
  submittedAt: string | null;
  tentativePrice: number | null;
  ocrVehicleMake: string | null;
  ocrVehicleModel: string | null;
  ocrRegistrationYear: number | null;
  ocrPlateNumber: string | null;
  mileage: number | null;
  expectedPrice: number | null;
  condition: string | null;
  customer: {
    id: string;
    name: string;
    phone: string | null;
  };
  salesExecutive: {
    id: string;
    name: string;
  };
  _count: {
    photos: number;
  };
}

export default function InspectorReviewPage() {
  const router = useRouter();
  const [appraisals, setAppraisals] = useState<TradeInItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAppraisals();
  }, [filter]);

  const fetchAppraisals = async () => {
    setIsLoading(true);
    try {
      const statusParam = filter === 'pending' ? 'SUBMITTED' : filter === 'reviewed' ? 'PRICED' : '';
      const response = await fetch(`/api/trade-ins?status=${statusParam}`);
      const data = await response.json();
      setAppraisals(data.data || []);
    } catch (error) {
      console.error('Failed to fetch appraisals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAppraisals = appraisals.filter((a) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      a.customer.name.toLowerCase().includes(query) ||
      a.ocrVehicleMake?.toLowerCase().includes(query) ||
      a.ocrVehicleModel?.toLowerCase().includes(query) ||
      a.ocrPlateNumber?.toLowerCase().includes(query)
    );
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'PRICED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'Pending Review';
      case 'PRICED':
        return 'Priced';
      default:
        return status;
    }
  };

  return (
    <PageContainer title="Trade-In Review">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Link
          href="/trade-in"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Trade-Ins</span>
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
            <ClipboardCheck className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Trade-In Review</h1>
            <p className="text-sm text-gray-500">
              Review submissions and set tentative pricing
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {(['pending', 'reviewed', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {f === 'pending' ? 'Pending' : f === 'reviewed' ? 'Reviewed' : 'All'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, vehicle, or plate..."
            className="light-input w-full !pl-10"
          />
        </div>

        {/* Appraisals List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full" />
          </div>
        ) : filteredAppraisals.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {filter === 'pending' ? 'No pending reviews' : 'No appraisals found'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAppraisals.map((appraisal) => (
              <button
                key={appraisal.id}
                onClick={() => router.push(`/trade-in/review/${appraisal.id}`)}
                className="w-full bg-white border border-gray-200 rounded-lg p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    {/* Vehicle Info */}
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-900">
                        {[
                          appraisal.ocrRegistrationYear,
                          appraisal.ocrVehicleMake,
                          appraisal.ocrVehicleModel,
                        ]
                          .filter(Boolean)
                          .join(' ') || 'Vehicle Details Pending'}
                      </span>
                      {appraisal.ocrPlateNumber && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                          {appraisal.ocrPlateNumber}
                        </span>
                      )}
                    </div>

                    {/* Customer & Sales */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {appraisal.customer.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {appraisal.submittedAt
                          ? new Date(appraisal.submittedAt).toLocaleDateString()
                          : 'Not submitted'}
                      </span>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-4 text-xs">
                      {appraisal.mileage && (
                        <span className="text-gray-400">
                          {appraisal.mileage.toLocaleString()} km
                        </span>
                      )}
                      {appraisal.expectedPrice && (
                        <span className="text-gray-400">
                          Expected: AED {appraisal.expectedPrice.toLocaleString()}
                        </span>
                      )}
                      {appraisal.tentativePrice && (
                        <span className="text-green-600 font-medium">
                          Tentative: AED {appraisal.tentativePrice.toLocaleString()}
                        </span>
                      )}
                      <span className="text-gray-400">
                        {appraisal._count.photos} photos
                      </span>
                    </div>
                  </div>

                  {/* Status & Arrow */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs">
                      {getStatusIcon(appraisal.status)}
                      <span className="text-gray-500">{getStatusLabel(appraisal.status)}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
