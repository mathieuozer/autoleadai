'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { PageContainer } from '@/components/layout';
import { Card, CardTitle, Badge, Button } from '@/components/ui';
import { RiskBadge, PriorityScore, NextBestActionCard, RiskFactorList, ActivityTimeline } from '@/components/ai';
import { useOrder, useLogActivity } from '@/hooks';
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Mail,
  User,
  Car,
  Calendar,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  FileText,
  TrendingUp,
} from 'lucide-react';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

// Format currency
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Format date
function formatDate(dateString: string | null): string {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Status color mapping
const statusColors: Record<string, 'default' | 'primary' | 'warning' | 'success' | 'danger'> = {
  NEW: 'primary',
  CONTACTED: 'primary',
  TEST_DRIVE_SCHEDULED: 'primary',
  TEST_DRIVE_DONE: 'primary',
  NEGOTIATION: 'warning',
  BOOKING_DONE: 'warning',
  FINANCING_PENDING: 'warning',
  FINANCING_APPROVED: 'success',
  READY_FOR_DELIVERY: 'success',
  DELIVERED: 'success',
  CANCELLED: 'danger',
};

// Format status for display
function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = use(params);
  const { order, isLoading, error, refetch, updateOrder } = useOrder(id);
  const { logActivity, isLoading: isLoggingActivity } = useLogActivity();
  const [showLogModal, setShowLogModal] = useState(false);
  const [logType, setLogType] = useState<'CALL_OUTBOUND' | 'WHATSAPP_SENT' | 'EMAIL_SENT' | 'NOTE'>('CALL_OUTBOUND');

  if (isLoading) {
    return (
      <PageContainer title="Loading..." subtitle="Fetching order details">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </PageContainer>
    );
  }

  if (error || !order) {
    return (
      <PageContainer title="Order Not Found" subtitle="Unable to load order">
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="mb-4 text-red-600">{error || 'Order not found'}</p>
          <div className="flex justify-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <Button onClick={refetch}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </Card>
      </PageContainer>
    );
  }

  const handleLogActivity = async (summary: string) => {
    const channelMap: Record<string, string> = {
      CALL_OUTBOUND: 'CALL',
      WHATSAPP_SENT: 'WHATSAPP',
      EMAIL_SENT: 'EMAIL',
      NOTE: 'SYSTEM',
    };

    const success = await logActivity({
      orderId: order.id,
      type: logType,
      channel: channelMap[logType],
      summary,
    });

    if (success) {
      setShowLogModal(false);
      refetch();
    }
  };

  const handleQuickAction = async (type: 'CALL_OUTBOUND' | 'WHATSAPP_SENT') => {
    setLogType(type);
    setShowLogModal(true);
  };

  return (
    <PageContainer
      title={`${order.customer.name}`}
      subtitle={`${order.vehicle.year} ${order.vehicle.make} ${order.vehicle.model}${order.vehicle.variant ? ` ${order.vehicle.variant}` : ''}`}
    >
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Left 2 columns */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order Status Card */}
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusColors[order.status] || 'default'} size="lg">
                    {formatStatus(order.status)}
                  </Badge>
                  <RiskBadge level={order.riskLevel as 'HIGH' | 'MEDIUM' | 'LOW'} />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Order ID: {order.id.slice(0, 8)}...
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('CALL_OUTBOUND')}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Log Call
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('WHATSAPP_SENT')}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Log Message
                </Button>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-100 pt-6 sm:grid-cols-4">
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-lg font-semibold">{formatCurrency(order.totalAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Booking Amount</p>
                <p className="text-lg font-semibold">
                  {order.bookingAmount ? formatCurrency(order.bookingAmount) : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Financing</p>
                <Badge variant={order.financingStatus === 'APPROVED' ? 'success' : order.financingStatus === 'REJECTED' ? 'danger' : 'warning'}>
                  {order.financingStatus}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fulfillment</p>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-lg font-semibold">{order.fulfillmentProbability}%</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Next Best Action */}
          {order.latestPriority && (
            <Card>
              <CardTitle className="mb-4">Recommended Action</CardTitle>
              <NextBestActionCard
                action={order.latestPriority.nextBestAction as {
                  action: string;
                  channel: 'CALL' | 'WHATSAPP' | 'EMAIL' | 'IN_PERSON' | 'SYSTEM';
                  urgency: 'NOW' | 'TODAY' | 'THIS_WEEK';
                  suggestedMessage?: string;
                  expectedImpact: string;
                  reasoning: string;
                }}
                onTakeAction={() => {
                  const channelTypeMap: Record<string, 'CALL_OUTBOUND' | 'WHATSAPP_SENT' | 'EMAIL_SENT'> = {
                    CALL: 'CALL_OUTBOUND',
                    WHATSAPP: 'WHATSAPP_SENT',
                    EMAIL: 'EMAIL_SENT',
                  };
                  setLogType(channelTypeMap[order.latestPriority!.nextBestAction.channel] || 'CALL_OUTBOUND');
                  setShowLogModal(true);
                }}
              />
            </Card>
          )}

          {/* Risk Factors */}
          {order.latestPriority && order.latestPriority.riskFactors.length > 0 && (
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <CardTitle>Risk Factors</CardTitle>
                <PriorityScore score={order.riskScore} level={order.riskLevel as 'HIGH' | 'MEDIUM' | 'LOW'} />
              </div>
              <RiskFactorList factors={order.latestPriority.riskFactors} />
            </Card>
          )}

          {/* Activity Timeline */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <CardTitle>Activity History</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLogType('NOTE');
                  setShowLogModal(true);
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Add Note
              </Button>
            </div>
            <ActivityTimeline activities={order.activities} />
          </Card>
        </div>

        {/* Sidebar - Right column */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardTitle className="mb-4">Customer</CardTitle>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{order.customer.name}</p>
                  <p className="text-sm text-gray-500">{order.customer.phone}</p>
                </div>
              </div>
              {order.customer.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  {order.customer.email}
                </div>
              )}
              {order.customer.preferredChannel && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MessageSquare className="h-4 w-4" />
                  Prefers {order.customer.preferredChannel}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <a href={`tel:${order.customer.phone}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Phone className="mr-2 h-4 w-4" />
                    Call
                  </Button>
                </a>
                <a href={`https://wa.me/${order.customer.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          </Card>

          {/* Vehicle Info */}
          <Card>
            <CardTitle className="mb-4">Vehicle</CardTitle>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                  <Car className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium">
                    {order.vehicle.year} {order.vehicle.make} {order.vehicle.model}
                  </p>
                  {order.vehicle.variant && (
                    <p className="text-sm text-gray-500">{order.vehicle.variant}</p>
                  )}
                </div>
              </div>
              {order.vehicle.color && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Color</span>
                  <span>{order.vehicle.color}</span>
                </div>
              )}
              {order.vehicle.vin && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">VIN</span>
                  <span className="font-mono text-xs">{order.vehicle.vin}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Dates */}
          <Card>
            <CardTitle className="mb-4">Timeline</CardTitle>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-500">
                  <Calendar className="h-4 w-4" />
                  Created
                </span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-500">
                  <Clock className="h-4 w-4" />
                  Last Contact
                </span>
                <span>
                  {order.lastContactDaysAgo !== null
                    ? order.lastContactDaysAgo === 0
                      ? 'Today'
                      : `${order.lastContactDaysAgo} days ago`
                    : 'Never'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-500">
                  <Car className="h-4 w-4" />
                  Expected Delivery
                </span>
                <span>{formatDate(order.expectedDeliveryDate)}</span>
              </div>
              {order.deliveredAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Delivered
                  </span>
                  <span className="text-green-600">{formatDate(order.deliveredAt)}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Salesperson */}
          {order.salesperson && (
            <Card>
              <CardTitle className="mb-4">Assigned To</CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">{order.salesperson.name}</p>
                  <p className="text-sm text-gray-500">{order.salesperson.email}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Log Activity Modal */}
      {showLogModal && (
        <LogActivityModal
          type={logType}
          isLoading={isLoggingActivity}
          onClose={() => setShowLogModal(false)}
          onSubmit={handleLogActivity}
        />
      )}
    </PageContainer>
  );
}

// Log Activity Modal Component
function LogActivityModal({
  type,
  isLoading,
  onClose,
  onSubmit,
}: {
  type: string;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (summary: string) => void;
}) {
  const [summary, setSummary] = useState('');

  const typeLabels: Record<string, string> = {
    CALL_OUTBOUND: 'Log Call',
    WHATSAPP_SENT: 'Log WhatsApp Message',
    EMAIL_SENT: 'Log Email',
    NOTE: 'Add Note',
  };

  const placeholders: Record<string, string> = {
    CALL_OUTBOUND: 'e.g., Discussed delivery timeline, customer confirmed availability',
    WHATSAPP_SENT: 'e.g., Sent financing update, shared delivery schedule',
    EMAIL_SENT: 'e.g., Sent quotation, shared vehicle specifications',
    NOTE: 'e.g., Customer mentioned travel plans, prefers morning calls',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold">{typeLabels[type]}</h2>
        <textarea
          className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={4}
          placeholder={placeholders[type]}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          autoFocus
        />
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit(summary)}
            disabled={!summary.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Activity'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
