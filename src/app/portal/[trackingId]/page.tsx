'use client';

import { use, useState, useEffect } from 'react';
import { Card, CardTitle, Badge } from '@/components/ui';
import {
  Loader2,
  AlertCircle,
  Car,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  Phone,
  MessageSquare,
  FileText,
  Package,
  Truck,
  Home,
  Sparkles,
} from 'lucide-react';

interface OrderStatus {
  id: string;
  trackingId: string;
  customer: {
    name: string;
  };
  vehicle: {
    make: string;
    model: string;
    variant: string | null;
    year: number;
    color: string | null;
    vin: string | null;
  };
  status: string;
  createdAt: string;
  expectedDeliveryDate: string | null;
  deliveredAt: string | null;
  salesperson: {
    name: string;
    phone: string;
  } | null;
  timeline: Array<{
    step: string;
    status: 'completed' | 'current' | 'pending';
    date: string | null;
    description: string;
  }>;
  documents: Array<{
    name: string;
    type: string;
    available: boolean;
  }>;
}

interface PortalPageProps {
  params: Promise<{ trackingId: string }>;
}

export default function CustomerPortalPage({ params }: PortalPageProps) {
  const { trackingId } = use(params);
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // In production, this would fetch from the API
        // For now, using mock data
        const mockOrder: OrderStatus = {
          id: 'ord-123',
          trackingId,
          customer: { name: 'Ahmed' },
          vehicle: {
            make: 'Toyota',
            model: 'Land Cruiser',
            variant: 'GXR',
            year: 2024,
            color: 'Pearl White',
            vin: 'JTMCY7AJ5N4123456'
          },
          status: 'READY_FOR_DELIVERY',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
          expectedDeliveryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
          deliveredAt: null,
          salesperson: {
            name: 'Mohammed Al Rashid',
            phone: '+971501234567'
          },
          timeline: [
            { step: 'Order Placed', status: 'completed', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), description: 'Your order has been confirmed' },
            { step: 'Payment Received', status: 'completed', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(), description: 'Down payment processed successfully' },
            { step: 'Vehicle Allocated', status: 'completed', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), description: 'VIN: JTMCY7AJ5N4123456' },
            { step: 'Quality Check', status: 'completed', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), description: 'Pre-delivery inspection completed' },
            { step: 'Ready for Delivery', status: 'current', date: new Date().toISOString(), description: 'Your vehicle is ready!' },
            { step: 'Delivered', status: 'pending', date: null, description: 'Scheduled for delivery' }
          ],
          documents: [
            { name: 'Sales Agreement', type: 'PDF', available: true },
            { name: 'Price Quotation', type: 'PDF', available: true },
            { name: 'Vehicle Specifications', type: 'PDF', available: true },
            { name: 'Insurance Certificate', type: 'PDF', available: false },
            { name: 'Registration Card', type: 'PDF', available: false }
          ]
        };

        setOrder(mockOrder);
      } catch (err) {
        setError('Order not found. Please check your tracking ID.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [trackingId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Pending';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h2 className="text-xl font-bold mb-2">Order Not Found</h2>
          <p className="text-gray-600">{error}</p>
        </Card>
      </div>
    );
  }

  const statusConfig: Record<string, { color: string; label: string }> = {
    NEW: { color: 'bg-blue-100 text-blue-700', label: 'Order Placed' },
    BOOKING_DONE: { color: 'bg-violet-100 text-violet-700', label: 'Confirmed' },
    FINANCING_PENDING: { color: 'bg-amber-100 text-amber-700', label: 'Processing' },
    FINANCING_APPROVED: { color: 'bg-green-100 text-green-700', label: 'Approved' },
    READY_FOR_DELIVERY: { color: 'bg-emerald-100 text-emerald-700', label: 'Ready!' },
    DELIVERED: { color: 'bg-green-500 text-white', label: 'Delivered' }
  };

  const currentStatus = statusConfig[order.status] || { color: 'bg-gray-100 text-gray-700', label: order.status };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-violet-900">AutoLead</h1>
              <p className="text-sm text-gray-500">Order Tracking</p>
            </div>
            <Badge className={currentStatus.color} size="lg">
              {currentStatus.label}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Card */}
        <Card className="mb-6 bg-gradient-to-r from-violet-500 to-purple-600 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
              <Car className="h-8 w-8" />
            </div>
            <div>
              <p className="text-violet-100">Hello, {order.customer.name}!</p>
              <h2 className="text-2xl font-bold">
                {order.vehicle.year} {order.vehicle.make} {order.vehicle.model}
              </h2>
              {order.vehicle.variant && (
                <p className="text-violet-100">{order.vehicle.variant} • {order.vehicle.color}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Delivery Info */}
        {order.expectedDeliveryDate && order.status !== 'DELIVERED' && (
          <Card className="mb-6 border-l-4 border-emerald-500">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <Sparkles className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Expected Delivery</p>
                <p className="text-xl font-bold text-emerald-600">
                  {formatDate(order.expectedDeliveryDate)}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Timeline */}
        <Card className="mb-6">
          <CardTitle className="mb-6">Order Timeline</CardTitle>
          <div className="relative">
            {order.timeline.map((item, index) => {
              const isLast = index === order.timeline.length - 1;
              const Icon = item.step.includes('Placed') ? Package :
                          item.step.includes('Payment') ? CheckCircle :
                          item.step.includes('Allocated') ? Car :
                          item.step.includes('Quality') ? CheckCircle :
                          item.step.includes('Ready') ? Sparkles :
                          Home;

              return (
                <div key={index} className="flex gap-4 pb-6 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      item.status === 'completed' ? 'bg-green-100' :
                      item.status === 'current' ? 'bg-violet-100 ring-2 ring-violet-500' :
                      'bg-gray-100'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        item.status === 'completed' ? 'text-green-600' :
                        item.status === 'current' ? 'text-violet-600' :
                        'text-gray-400'
                      }`} />
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 flex-1 ${
                        item.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium ${
                        item.status === 'pending' ? 'text-gray-400' : 'text-gray-900'
                      }`}>
                        {item.step}
                      </h3>
                      {item.status === 'current' && (
                        <Badge variant="primary" size="sm">Current</Badge>
                      )}
                    </div>
                    <p className={`text-sm ${
                      item.status === 'pending' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {item.description}
                    </p>
                    {item.date && item.status !== 'pending' && (
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(item.date)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Vehicle Details */}
          <Card>
            <CardTitle className="mb-4">Vehicle Details</CardTitle>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Make & Model</span>
                <span className="font-medium">{order.vehicle.make} {order.vehicle.model}</span>
              </div>
              {order.vehicle.variant && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Variant</span>
                  <span className="font-medium">{order.vehicle.variant}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Year</span>
                <span className="font-medium">{order.vehicle.year}</span>
              </div>
              {order.vehicle.color && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Color</span>
                  <span className="font-medium">{order.vehicle.color}</span>
                </div>
              )}
              {order.vehicle.vin && (
                <div className="flex justify-between">
                  <span className="text-gray-500">VIN</span>
                  <span className="font-mono text-sm">{order.vehicle.vin}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Contact */}
          {order.salesperson && (
            <Card>
              <CardTitle className="mb-4">Your Sales Advisor</CardTitle>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100">
                  <span className="text-lg font-bold text-violet-600">
                    {order.salesperson.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{order.salesperson.name}</p>
                  <p className="text-sm text-gray-500">Sales Advisor</p>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={`tel:${order.salesperson.phone}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  Call
                </a>
                <a
                  href={`https://wa.me/${order.salesperson.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp
                </a>
              </div>
            </Card>
          )}
        </div>

        {/* Documents */}
        <Card className="mt-6">
          <CardTitle className="mb-4">Documents</CardTitle>
          <div className="grid gap-2 md:grid-cols-2">
            {order.documents.map((doc, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  doc.available ? 'bg-gray-50 hover:bg-gray-100 cursor-pointer' : 'bg-gray-50 opacity-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className={`h-5 w-5 ${doc.available ? 'text-violet-600' : 'text-gray-400'}`} />
                  <span className={doc.available ? 'font-medium' : 'text-gray-500'}>{doc.name}</span>
                </div>
                {doc.available ? (
                  <Badge variant="success" size="sm">Download</Badge>
                ) : (
                  <Badge variant="default" size="sm">Pending</Badge>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Tracking ID: {trackingId}</p>
          <p className="mt-1">Need help? Contact us at support@autolead.ai</p>
        </div>
      </main>
    </div>
  );
}
