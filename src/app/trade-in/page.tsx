'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageContainer } from '@/components/layout';
import { Card } from '@/components/ui';
import {
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Users,
  UserPlus,
  Search,
  ArrowRight,
  X,
  Phone,
  Mail,
  ClipboardCheck,
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface TradeInAppraisal {
  id: string;
  status: string;
  createdAt: string;
  expectedPrice: number | null;
  tentativePrice: number | null;
  customer: {
    name: string;
  };
  ocrVehicleMake?: string;
  ocrVehicleModel?: string;
}

const statusConfig: Record<string, { icon: typeof Clock; color: string; bgColor: string; label: string }> = {
  DRAFT: { icon: Clock, color: 'text-gray-500', bgColor: 'bg-gray-100', label: 'Draft' },
  SUBMITTED: { icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-50', label: 'Submitted' },
  UNDER_REVIEW: { icon: Clock, color: 'text-orange-600', bgColor: 'bg-orange-50', label: 'Under Review' },
  PRICED: { icon: DollarSign, color: 'text-green-600', bgColor: 'bg-green-50', label: 'Priced' },
  ACCEPTED: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50', label: 'Accepted' },
  REJECTED: { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50', label: 'Rejected' },
};

export default function TradeInListPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'new' | 'existing'>('new');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [appraisals, setAppraisals] = useState<TradeInAppraisal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Walk-in form state
  const [showWalkInForm, setShowWalkInForm] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInEmail, setWalkInEmail] = useState('');
  const [isCreatingWalkIn, setIsCreatingWalkIn] = useState(false);
  const [walkInError, setWalkInError] = useState<string | null>(null);

  // Starting trade-in state
  const [isStartingTradeIn, setIsStartingTradeIn] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // Fetch customers, users, and appraisals
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [customersRes, usersRes, appraisalsRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/users'),
          fetch('/api/trade-ins'),
        ]);

        if (customersRes.ok) {
          const { data } = await customersRes.json();
          setCustomers(data);
        }

        if (usersRes.ok) {
          const { data } = await usersRes.json();
          setUsers(data);
        }

        if (appraisalsRes.ok) {
          const { data } = await appraisalsRes.json();
          setAppraisals(data);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Filter customers based on search
  const filteredCustomers = customers.filter((customer) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.phone.includes(query) ||
      customer.email?.toLowerCase().includes(query)
    );
  });

  // Create walk-in customer
  const handleCreateWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingWalkIn(true);
    setWalkInError(null);

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: walkInName,
          phone: walkInPhone,
          email: walkInEmail || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to create customer');
      }

      // Add to list and select
      setCustomers((prev) => [result.data, ...prev]);
      setSelectedCustomer(result.data);
      setShowWalkInForm(false);
      setWalkInName('');
      setWalkInPhone('');
      setWalkInEmail('');
    } catch (err) {
      setWalkInError(err instanceof Error ? err.message : 'Failed to create customer');
    } finally {
      setIsCreatingWalkIn(false);
    }
  };

  // Get current sales executive (use first available user, in production this would come from auth)
  const salesExecutive = users.find(
    (u) => u.role === 'SALESPERSON' || u.role === 'SALES_EXECUTIVE'
  ) || users[0];

  // Start trade-in for selected customer
  const handleStartTradeIn = async () => {
    if (!selectedCustomer) return;
    setStartError(null);

    if (!salesExecutive) {
      setStartError('No sales executive available. Please try again.');
      return;
    }

    setIsStartingTradeIn(true);

    try {
      // Create trade-in appraisal
      const response = await fetch('/api/trade-ins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          salesExecutiveId: salesExecutive.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to create trade-in');
      }

      // Navigate to wizard
      router.push(`/trade-in/${result.data.id}`);
    } catch (err) {
      setStartError(err instanceof Error ? err.message : 'Failed to start trade-in');
      setIsStartingTradeIn(false);
    }
  };

  return (
    <PageContainer
      title="Trade-In Portal"
      subtitle="Start a new trade-in or view existing appraisals"
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'new'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            New Trade-In
          </button>
          <button
            onClick={() => setActiveTab('existing')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'existing'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Existing ({appraisals.length})
          </button>
          <Link
            href="/trade-in/review"
            className="px-4 py-2 rounded-lg font-medium text-sm transition-colors bg-purple-600 text-white hover:bg-purple-700 ml-auto"
          >
            <ClipboardCheck className="w-4 h-4 inline mr-2" />
            Inspector Review
          </Link>
        </div>

        {activeTab === 'new' ? (
          <div className="space-y-6">
            {/* Selected Customer Card */}
            {selectedCustomer && (
              <Card className="bg-green-50 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-green-600 font-medium mb-1">Selected Customer</p>
                    <p className="text-gray-900 font-semibold">{selectedCustomer.name}</p>
                    <p className="text-sm text-gray-500">{selectedCustomer.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedCustomer(null)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleStartTradeIn}
                      disabled={isStartingTradeIn || isLoading || !salesExecutive}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isStartingTradeIn ? (
                        'Starting...'
                      ) : isLoading ? (
                        'Loading...'
                      ) : (
                        <>
                          Start Trade-In
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
                {startError && (
                  <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                    {startError}
                  </div>
                )}
              </Card>
            )}

            {/* Create Walk-In Button */}
            <button
              onClick={() => setShowWalkInForm(true)}
              className="w-full bg-white hover:bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 transition-colors"
            >
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Create Walk-In Customer</p>
                  <p className="text-sm text-gray-500">New customer in showroom</p>
                </div>
              </div>
            </button>

            {/* Walk-In Form Modal */}
            {showWalkInForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                <Card className="w-full max-w-md">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">New Walk-In Customer</h2>
                    <button
                      onClick={() => setShowWalkInForm(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateWalkIn} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        value={walkInName}
                        onChange={(e) => setWalkInName(e.target.value)}
                        placeholder="e.g., Ahmed Al Rashid"
                        required
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          value={walkInPhone}
                          onChange={(e) => setWalkInPhone(e.target.value)}
                          placeholder="+971-50-123-4567"
                          required
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email (Optional)
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          value={walkInEmail}
                          onChange={(e) => setWalkInEmail(e.target.value)}
                          placeholder="customer@email.com"
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                        />
                      </div>
                    </div>

                    {walkInError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                        {walkInError}
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowWalkInForm(false)}
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isCreatingWalkIn}
                        className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isCreatingWalkIn ? 'Creating...' : 'Create Customer'}
                      </button>
                    </div>
                  </form>
                </Card>
              </div>
            )}

            {/* Existing Customers Section */}
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-medium text-gray-900">Select Existing Customer</h2>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, phone, or email..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                />
              </div>

              {/* Customer List */}
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <p className="text-gray-500">
                    {searchQuery ? 'No customers found' : 'No customers yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => setSelectedCustomer(customer)}
                      className={`w-full text-left rounded-lg p-4 transition-colors ${
                        selectedCustomer?.id === customer.id
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{customer.name}</p>
                          <p className="text-sm text-gray-500">{customer.phone}</p>
                          {customer.email && (
                            <p className="text-xs text-gray-400">{customer.email}</p>
                          )}
                        </div>
                        {selectedCustomer?.id === customer.id && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>
        ) : (
          /* Existing Appraisals Tab */
          <Card padding="none">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : appraisals.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">No trade-in appraisals yet</p>
                <button
                  onClick={() => setActiveTab('new')}
                  className="mt-4 text-blue-600 hover:underline text-sm"
                >
                  Start your first trade-in
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {appraisals.map((appraisal) => {
                  const config = statusConfig[appraisal.status] || statusConfig.DRAFT;
                  const StatusIcon = config.icon;

                  return (
                    <Link
                      key={appraisal.id}
                      href={`/trade-in/${appraisal.id}`}
                      className="block hover:bg-gray-50 p-4 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {appraisal.customer.name}
                          </h3>
                          {(appraisal.ocrVehicleMake || appraisal.ocrVehicleModel) && (
                            <p className="text-sm text-gray-500 mt-0.5">
                              {[appraisal.ocrVehicleMake, appraisal.ocrVehicleModel]
                                .filter(Boolean)
                                .join(' ')}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(appraisal.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${config.bgColor} ${config.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            <span className="text-xs font-medium">{config.label}</span>
                          </div>
                          {appraisal.tentativePrice && (
                            <p className="text-sm text-green-600 font-medium mt-1">
                              AED {appraisal.tentativePrice.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
