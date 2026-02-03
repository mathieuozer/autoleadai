'use client';

import { useState, useMemo, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout';
import { StatCard } from '@/components/ui/StatCard';
import { DealProgressTimeline, DocumentCard, VehicleCard } from '@/components/portal';
import type { TimelineStep, DocumentItem, VehicleInfo } from '@/components/portal';
import { useCustomerOrder, useDocuments, formatDocumentStatus, formatDocumentType, formatFileSize } from '@/hooks';

// Modal components for quick actions
function ScheduleDeliveryModal({
  isOpen,
  onClose,
  onSchedule,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (date: string, notes?: string) => Promise<void>;
  isLoading: boolean;
}) {
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSchedule(date, notes);
    onClose();
  };

  // Calculate min date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Delivery</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Delivery Date
              </label>
              <input
                type="date"
                min={minDate}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any special requests or preferences..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed] resize-none"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!date || isLoading}
              className="flex-1 px-4 py-2.5 bg-[#7c3aed] text-white rounded-xl font-medium hover:bg-[#6d28d9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SupportModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (subject: string, message: string, category?: string) => Promise<void>;
  isLoading: boolean;
}) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(subject, message, category);
    onClose();
    setSubject('');
    setMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Support</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed]"
              >
                <option value="general">General Inquiry</option>
                <option value="documents">Documents</option>
                <option value="financing">Financing</option>
                <option value="delivery">Delivery</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="Brief description of your inquiry"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                placeholder="Please describe your question or issue..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed] resize-none"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!subject || !message || isLoading}
              className="flex-1 px-4 py-2.5 bg-[#7c3aed] text-white rounded-xl font-medium hover:bg-[#6d28d9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UploadDocumentModal({
  isOpen,
  onClose,
  onUpload,
  orderId,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: { orderId: string; type: string; name: string; fileUrl?: string; fileName?: string; fileSize?: number; mimeType?: string }) => Promise<void>;
  orderId: string;
  isLoading: boolean;
}) {
  const [docType, setDocType] = useState('ID_PROOF');
  const [file, setFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd upload the file to blob storage first
    // For now, we'll just create the document record
    await onUpload({
      orderId,
      type: docType,
      name: formatDocumentType(docType),
      fileName: file?.name,
      fileSize: file?.size,
      mimeType: file?.type,
      // fileUrl would come from blob storage upload
    });
    onClose();
    setFile(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Document</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed]"
              >
                <option value="ID_PROOF">ID Proof</option>
                <option value="ADDRESS_PROOF">Address Proof</option>
                <option value="INCOME_CERTIFICATE">Income Certificate</option>
                <option value="INSURANCE">Insurance Document</option>
                <option value="BANK_STATEMENT">Bank Statement</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#7c3aed]/50 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {file ? (
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatFileSize(file.size)}</p>
                    </div>
                  ) : (
                    <div>
                      <svg className="w-10 h-10 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <p className="text-sm text-gray-500 mt-2">Click to select a file</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, DOC up to 10MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || isLoading}
              className="flex-1 px-4 py-2.5 bg-[#7c3aed] text-white rounded-xl font-medium hover:bg-[#6d28d9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Orders Dashboard component for when no orderId is provided
function OrdersDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Array<{
    id: string;
    status: string;
    customerName: string;
    customerPhone: string;
    vehicle: string;
    vehicleColor: string | null;
    createdAt: string;
    expectedDeliveryDate: string | null;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/portal/orders')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setOrders(result.data);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const filteredOrders = orders.filter(order =>
    !searchQuery ||
    order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'READY_FOR_DELIVERY': return 'bg-blue-100 text-blue-800';
      case 'FINANCING_APPROVED': return 'bg-purple-100 text-purple-800';
      case 'FINANCING_PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'BOOKING_DONE': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <PageContainer
      title="Customer Portal"
      subtitle="View and manage your vehicle orders"
    >
      <div className="max-w-7xl mx-auto">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, vehicle, or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed]"
            />
          </div>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#7c3aed] border-t-transparent" />
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="grid gap-4">
            {filteredOrders.map(order => (
              <div
                key={order.id}
                onClick={() => router.push(`/customer-portal?orderId=${order.id}`)}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#7c3aed]/30 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{order.customerName}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {formatStatus(order.status)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-1">{order.vehicle}</p>
                    {order.vehicleColor && (
                      <p className="text-sm text-gray-500">Color: {order.vehicleColor}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span>Order: {order.id.slice(-8).toUpperCase()}</span>
                      {order.expectedDeliveryDate && (
                        <span>
                          ETA: {new Date(order.expectedDeliveryDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Found</h3>
            <p className="text-gray-500">
              {searchQuery ? 'No orders match your search criteria' : 'There are no orders in the system'}
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

// Timeline step definitions
const TIMELINE_STEPS = [
  { id: '1', title: 'Order Placed', description: 'Your order has been confirmed' },
  { id: '2', title: 'Documents Submitted', description: 'All required documents received' },
  { id: '3', title: 'Financing Approved', description: 'Your financing has been approved' },
  { id: '4', title: 'Vehicle Allocated', description: 'VIN assigned to your order' },
  { id: '5', title: 'Pre-Delivery Inspection', description: 'Quality check in progress' },
  { id: '6', title: 'Ready for Delivery', description: 'Schedule your pickup' },
];

function CustomerPortalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId') || '';

  // If no orderId, show order selection or redirect
  const { order, isLoading, error, refetch, scheduleDelivery, submitSupportRequest } = useCustomerOrder(orderId);
  const { downloadDocument, uploadDocument, isUploading } = useDocuments();

  // Modal states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Transform order data to timeline steps
  const timelineSteps: TimelineStep[] = useMemo(() => {
    if (!order) return TIMELINE_STEPS.map((s) => ({ ...s, status: 'pending' as const }));

    const currentStep = order.stats.currentStep;
    return TIMELINE_STEPS.map((step, index) => {
      const stepNumber = index + 1;
      let status: 'completed' | 'current' | 'pending';
      if (stepNumber < currentStep) {
        status = 'completed';
      } else if (stepNumber === currentStep) {
        status = 'current';
      } else {
        status = 'pending';
      }
      return { ...step, status };
    });
  }, [order]);

  // Transform documents to DocumentItem format
  const documents: DocumentItem[] = useMemo(() => {
    if (!order) return [];
    return order.documents.map((doc) => ({
      id: doc.id,
      name: doc.name || formatDocumentType(doc.type),
      type: 'PDF',
      status: formatDocumentStatus(doc.status),
      uploadDate: doc.uploadedAt
        ? new Date(doc.uploadedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : undefined,
      size: doc.fileSize ? formatFileSize(doc.fileSize) : undefined,
    }));
  }, [order]);

  // Transform vehicle data
  const vehicle: VehicleInfo | null = useMemo(() => {
    if (!order) return null;
    return {
      id: order.vehicle.id,
      make: order.vehicle.make,
      model: order.vehicle.model,
      variant: order.vehicle.variant || '',
      year: order.vehicle.year,
      color: order.vehicle.color || 'TBD',
      vin: order.vehicle.vin || 'Pending allocation',
      estimatedDelivery: order.expectedDeliveryDate
        ? new Date(order.expectedDeliveryDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
        : 'TBD',
    };
  }, [order]);

  const handleDocumentDownload = (id: string) => {
    downloadDocument(id);
  };

  const handleDocumentUpload = (id: string) => {
    // For now, open the upload modal
    setShowUploadModal(true);
  };

  const handleScheduleDelivery = async (date: string, notes?: string) => {
    setIsSubmitting(true);
    await scheduleDelivery(date, notes);
    setIsSubmitting(false);
  };

  const handleSupportSubmit = async (subject: string, message: string, category?: string) => {
    setIsSubmitting(true);
    const result = await submitSupportRequest(subject, message, category);
    setIsSubmitting(false);
    if (result && result.ticketNumber) {
      alert(`Support request submitted! Ticket #${result.ticketNumber}`);
    }
  };

  const handleUploadDocument = async (data: { orderId: string; type: string; name: string; fileUrl?: string; fileName?: string; fileSize?: number; mimeType?: string }) => {
    await uploadDocument(data);
    await refetch();
  };

  // Loading state
  if (isLoading) {
    return (
      <PageContainer title="Loading..." subtitle="Please wait">
        <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#7c3aed] border-t-transparent" />
        </div>
      </PageContainer>
    );
  }

  // No order ID provided - show dashboard with all orders
  if (!orderId) {
    return <OrdersDashboard />;
  }

  // Error state
  if (error || !order) {
    return (
      <PageContainer title="Error" subtitle="Unable to load order">
        <div className="max-w-md mx-auto py-20 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Not Found</h3>
            <p className="text-gray-500 mb-4">{error || 'The order you are looking for could not be found.'}</p>
            <button
              onClick={() => router.push('/customer-portal')}
              className="px-4 py-2 bg-[#7c3aed] text-white rounded-xl font-medium hover:bg-[#6d28d9] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </PageContainer>
    );
  }

  const pendingDocuments = documents.filter((d) => d.status === 'pending').length;

  return (
    <PageContainer
      title={`Welcome back, ${order.customer.name.split(' ')[0]}`}
      subtitle="Here's the latest update on your vehicle order"
    >
      <div className="max-w-7xl mx-auto">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Order Status"
            value="In Progress"
            subtitle={`Step ${order.stats.currentStep} of ${order.stats.totalSteps}`}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
          <StatCard
            title="Days to Delivery"
            value={order.stats.daysToDelivery?.toString() || 'TBD'}
            subtitle="Estimated"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <StatCard
            title="Documents"
            value={`${order.stats.documentsApproved}/${order.stats.documentsTotal || documents.length || 4}`}
            subtitle="Approved"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          <StatCard
            title="Payment Status"
            value={`${order.stats.paymentPercentage}%`}
            subtitle={`AED ${order.stats.amountPaid.toLocaleString()} paid`}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Timeline & Documents */}
          <div className="lg:col-span-2 space-y-8">
            {/* Deal Progress Timeline */}
            <DealProgressTimeline steps={timelineSteps} />

            {/* Documents Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="text-sm font-medium text-[#7c3aed] hover:text-[#6d28d9] transition-colors"
                >
                  + Upload
                </button>
              </div>
              {documents.length > 0 ? (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      onDownload={handleDocumentDownload}
                      onUpload={handleDocumentUpload}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>No documents uploaded yet</p>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="mt-2 text-[#7c3aed] font-medium hover:text-[#6d28d9]"
                  >
                    Upload your first document
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Vehicle & Quick Actions */}
          <div className="space-y-8">
            {/* Vehicle Card */}
            {vehicle && <VehicleCard vehicle={vehicle} />}

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-[#7c3aed]/5 hover:bg-[#7c3aed]/10 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-[#7c3aed]/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#7c3aed]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Schedule Delivery</p>
                    <p className="text-sm text-gray-500">Choose your preferred date</p>
                  </div>
                </button>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Upload Document</p>
                    <p className="text-sm text-gray-500">{pendingDocuments > 0 ? `${pendingDocuments} document(s) pending` : 'Add more documents'}</p>
                  </div>
                </button>
                <button
                  onClick={() => setShowSupportModal(true)}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Contact Support</p>
                    <p className="text-sm text-gray-500">Get help with your order</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ScheduleDeliveryModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSchedule={handleScheduleDelivery}
        isLoading={isSubmitting}
      />
      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
        onSubmit={handleSupportSubmit}
        isLoading={isSubmitting}
      />
      <UploadDocumentModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUploadDocument}
        orderId={orderId}
        isLoading={isUploading}
      />
    </PageContainer>
  );
}

function LoadingFallback() {
  return (
    <PageContainer title="Loading..." subtitle="Please wait">
      <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#7c3aed] border-t-transparent" />
      </div>
    </PageContainer>
  );
}

export default function CustomerPortalPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CustomerPortalContent />
    </Suspense>
  );
}
