'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DarkLayout } from '@/components/trade-in';
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

const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  DRAFT: { icon: Clock, color: 'text-[#94a3b8]', label: 'Draft' },
  SUBMITTED: { icon: Clock, color: 'text-[#0ea5e9]', label: 'Submitted' },
  UNDER_REVIEW: { icon: Clock, color: 'text-[#f59e0b]', label: 'Under Review' },
  PRICED: { icon: DollarSign, color: 'text-[#22c55e]', label: 'Priced' },
  ACCEPTED: { icon: CheckCircle, color: 'text-[#22c55e]', label: 'Accepted' },
  REJECTED: { icon: AlertCircle, color: 'text-[#ef4444]', label: 'Rejected' },
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

  // Start trade-in for selected customer
  const handleStartTradeIn = async () => {
    if (!selectedCustomer) return;

    // Get sales executive (use first available user, in production this would come from auth)
    const salesExecutive = users.find(
      (u) => u.role === 'SALESPERSON' || u.role === 'SALES_EXECUTIVE'
    ) || users[0];

    if (!salesExecutive) {
      console.error('No sales executive available');
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
      console.error('Failed to start trade-in:', err);
      setIsStartingTradeIn(false);
    }
  };

  return (
    <DarkLayout showBackButton backHref="/dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-white">Trade-In Portal</h1>
          <p className="text-sm text-[#94a3b8] mt-1">
            Start a new trade-in or view existing appraisals
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'new'
                ? 'bg-[#0ea5e9] text-white'
                : 'bg-[#334155] text-[#94a3b8] hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            New Trade-In
          </button>
          <button
            onClick={() => setActiveTab('existing')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'existing'
                ? 'bg-[#0ea5e9] text-white'
                : 'bg-[#334155] text-[#94a3b8] hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Existing ({appraisals.length})
          </button>
        </div>

        {activeTab === 'new' ? (
          <div className="space-y-6">
            {/* Selected Customer Card */}
            {selectedCustomer && (
              <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#22c55e] font-medium mb-1">Selected Customer</p>
                    <p className="text-white font-semibold">{selectedCustomer.name}</p>
                    <p className="text-sm text-[#94a3b8]">{selectedCustomer.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedCustomer(null)}
                      className="p-2 text-[#94a3b8] hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleStartTradeIn}
                      disabled={isStartingTradeIn}
                      className="dark-btn-primary"
                    >
                      {isStartingTradeIn ? (
                        'Starting...'
                      ) : (
                        <>
                          Start Trade-In
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Create Walk-In Button */}
            <button
              onClick={() => setShowWalkInForm(true)}
              className="w-full bg-[#1e293b] hover:bg-[#334155] border-2 border-dashed border-[#475569] rounded-lg p-6 transition-colors"
            >
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#0ea5e9]/10 flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-[#0ea5e9]" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-white">Create Walk-In Customer</p>
                  <p className="text-sm text-[#64748b]">New customer in showroom</p>
                </div>
              </div>
            </button>

            {/* Walk-In Form Modal */}
            {showWalkInForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                <div className="bg-[#1e293b] rounded-xl p-6 w-full max-w-md">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-white">New Walk-In Customer</h2>
                    <button
                      onClick={() => setShowWalkInForm(false)}
                      className="text-[#94a3b8] hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateWalkIn} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#f8fafc] mb-2">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        value={walkInName}
                        onChange={(e) => setWalkInName(e.target.value)}
                        placeholder="e.g., Ahmed Al Rashid"
                        required
                        className="dark-input w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#f8fafc] mb-2">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                        <input
                          type="tel"
                          value={walkInPhone}
                          onChange={(e) => setWalkInPhone(e.target.value)}
                          placeholder="+971-50-123-4567"
                          required
                          className="dark-input w-full pl-10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#f8fafc] mb-2">
                        Email (Optional)
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                        <input
                          type="email"
                          value={walkInEmail}
                          onChange={(e) => setWalkInEmail(e.target.value)}
                          placeholder="customer@email.com"
                          className="dark-input w-full pl-10"
                        />
                      </div>
                    </div>

                    {walkInError && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
                        {walkInError}
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowWalkInForm(false)}
                        className="dark-btn-secondary flex-1 justify-center"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isCreatingWalkIn}
                        className="dark-btn-primary flex-1 justify-center"
                      >
                        {isCreatingWalkIn ? 'Creating...' : 'Create Customer'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Existing Customers Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#0ea5e9]" />
                <h2 className="text-lg font-medium text-white">Select Existing Customer</h2>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, phone, or email..."
                  className="dark-input w-full pl-10"
                />
              </div>

              {/* Customer List */}
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-[#1e293b] rounded-lg p-4 animate-pulse">
                      <div className="h-4 bg-[#334155] rounded w-1/3 mb-2" />
                      <div className="h-3 bg-[#334155] rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="bg-[#1e293b] rounded-lg p-8 text-center">
                  <p className="text-[#94a3b8]">
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
                          ? 'bg-[#0ea5e9]/10 border border-[#0ea5e9]'
                          : 'bg-[#1e293b] hover:bg-[#334155] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">{customer.name}</p>
                          <p className="text-sm text-[#94a3b8]">{customer.phone}</p>
                          {customer.email && (
                            <p className="text-xs text-[#64748b]">{customer.email}</p>
                          )}
                        </div>
                        {selectedCustomer?.id === customer.id && (
                          <CheckCircle className="w-5 h-5 text-[#0ea5e9]" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Existing Appraisals Tab */
          <div className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-[#1e293b] rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-[#334155] rounded w-1/3 mb-2" />
                    <div className="h-3 bg-[#334155] rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : appraisals.length === 0 ? (
              <div className="bg-[#1e293b] rounded-lg p-8 text-center">
                <p className="text-[#94a3b8]">No trade-in appraisals yet</p>
                <button
                  onClick={() => setActiveTab('new')}
                  className="mt-4 text-[#0ea5e9] hover:underline text-sm"
                >
                  Start your first trade-in
                </button>
              </div>
            ) : (
              appraisals.map((appraisal) => {
                const config = statusConfig[appraisal.status] || statusConfig.DRAFT;
                const StatusIcon = config.icon;

                return (
                  <Link
                    key={appraisal.id}
                    href={`/trade-in/${appraisal.id}`}
                    className="block bg-[#1e293b] hover:bg-[#334155] rounded-lg p-4 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-white">
                          {appraisal.customer.name}
                        </h3>
                        {(appraisal.ocrVehicleMake || appraisal.ocrVehicleModel) && (
                          <p className="text-sm text-[#94a3b8] mt-0.5">
                            {[appraisal.ocrVehicleMake, appraisal.ocrVehicleModel]
                              .filter(Boolean)
                              .join(' ')}
                          </p>
                        )}
                        <p className="text-xs text-[#64748b] mt-1">
                          {new Date(appraisal.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`flex items-center gap-1.5 ${config.color}`}>
                          <StatusIcon className="w-4 h-4" />
                          <span className="text-sm font-medium">{config.label}</span>
                        </div>
                        {appraisal.tentativePrice && (
                          <p className="text-sm text-[#22c55e] mt-1">
                            AED {appraisal.tentativePrice.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        )}
      </div>
    </DarkLayout>
  );
}
