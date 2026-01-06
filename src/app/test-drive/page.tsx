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
  XCircle,
  Users,
  UserPlus,
  Search,
  ArrowRight,
  X,
  Phone,
  Mail,
  Gauge,
  Calendar,
  FileSignature,
  Car,
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

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  testDriveAvailable: boolean;
}

interface TestDrive {
  id: string;
  status: string;
  createdAt: string;
  scheduledDate?: string;
  scheduledTime?: string;
  customer: {
    name: string;
  };
  vehicle: {
    make: string;
    model: string;
    year: number;
  };
}

const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  DRAFT: { icon: Clock, color: 'text-[#94a3b8]', label: 'Draft' },
  IDENTITY_VERIFIED: { icon: FileSignature, color: 'text-[#0ea5e9]', label: 'Identity Verified' },
  VEHICLE_SELECTED: { icon: Car, color: 'text-[#f59e0b]', label: 'Vehicle Selected' },
  AGREEMENT_SIGNED: { icon: CheckCircle, color: 'text-[#22c55e]', label: 'Ready' },
  IN_PROGRESS: { icon: Gauge, color: 'text-[#8b5cf6]', label: 'In Progress' },
  COMPLETED: { icon: CheckCircle, color: 'text-[#22c55e]', label: 'Completed' },
  CANCELLED: { icon: XCircle, color: 'text-[#ef4444]', label: 'Cancelled' },
  NO_SHOW: { icon: AlertCircle, color: 'text-[#ef4444]', label: 'No Show' },
};

export default function TestDriveListPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'new' | 'existing'>('new');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [testDrives, setTestDrives] = useState<TestDrive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Walk-in form state
  const [showWalkInForm, setShowWalkInForm] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInEmail, setWalkInEmail] = useState('');
  const [isCreatingWalkIn, setIsCreatingWalkIn] = useState(false);
  const [walkInError, setWalkInError] = useState<string | null>(null);

  // Starting test drive state
  const [isStartingTestDrive, setIsStartingTestDrive] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [customersRes, usersRes, vehiclesRes, testDrivesRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/users'),
          fetch('/api/vehicles?testDriveAvailable=true'),
          fetch('/api/test-drives'),
        ]);

        if (customersRes.ok) {
          const { data } = await customersRes.json();
          setCustomers(data);
        }

        if (usersRes.ok) {
          const { data } = await usersRes.json();
          setUsers(data);
        }

        if (vehiclesRes.ok) {
          const { data } = await vehiclesRes.json();
          setVehicles(data.filter((v: Vehicle) => v.testDriveAvailable));
        }

        if (testDrivesRes.ok) {
          const { data } = await testDrivesRes.json();
          setTestDrives(data);
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

  // Get current sales executive
  const salesExecutive = users.find(
    (u) => u.role === 'SALESPERSON' || u.role === 'SALES_EXECUTIVE'
  ) || users[0];

  // Start test drive
  const handleStartTestDrive = async () => {
    if (!selectedCustomer || !selectedVehicle) return;
    setStartError(null);

    if (!salesExecutive) {
      setStartError('No sales executive available. Please try again.');
      return;
    }

    setIsStartingTestDrive(true);

    try {
      const response = await fetch('/api/test-drives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          salesExecutiveId: salesExecutive.id,
          vehicleId: selectedVehicle.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to create test drive');
      }

      // Navigate to wizard
      router.push(`/test-drive/${result.data.id}`);
    } catch (err) {
      setStartError(err instanceof Error ? err.message : 'Failed to start test drive');
      setIsStartingTestDrive(false);
    }
  };

  return (
    <DarkLayout showBackButton backHref="/dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-white">Test Drive Portal</h1>
          <p className="text-sm text-[#94a3b8] mt-1">
            Schedule and manage customer test drives
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
            New Test Drive
          </button>
          <button
            onClick={() => setActiveTab('existing')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'existing'
                ? 'bg-[#0ea5e9] text-white'
                : 'bg-[#334155] text-[#94a3b8] hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Scheduled ({testDrives.length})
          </button>
        </div>

        {activeTab === 'new' ? (
          <div className="space-y-6">
            {/* Selection Summary */}
            {(selectedCustomer || selectedVehicle) && (
              <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4 space-y-3">
                {selectedCustomer && (
                  <div className="flex items-center justify-between bg-[#0ea5e9]/10 rounded-lg p-3">
                    <div>
                      <p className="text-xs text-[#0ea5e9] font-medium">Customer</p>
                      <p className="text-white font-medium">{selectedCustomer.name}</p>
                      <p className="text-sm text-[#94a3b8]">{selectedCustomer.phone}</p>
                    </div>
                    <button
                      onClick={() => setSelectedCustomer(null)}
                      className="p-2 text-[#94a3b8] hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {selectedVehicle && (
                  <div className="flex items-center justify-between bg-[#22c55e]/10 rounded-lg p-3">
                    <div>
                      <p className="text-xs text-[#22c55e] font-medium">Vehicle</p>
                      <p className="text-white font-medium">
                        {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                      </p>
                      {selectedVehicle.color && (
                        <p className="text-sm text-[#94a3b8]">{selectedVehicle.color}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedVehicle(null)}
                      className="p-2 text-[#94a3b8] hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {selectedCustomer && selectedVehicle && (
                  <button
                    onClick={handleStartTestDrive}
                    disabled={isStartingTestDrive || isLoading || !salesExecutive}
                    className="w-full dark-btn-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isStartingTestDrive ? (
                      'Starting...'
                    ) : (
                      <>
                        Start Test Drive
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}

                {startError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
                    {startError}
                  </div>
                )}
              </div>
            )}

            {/* Step 1: Select Customer */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0ea5e9]/20 flex items-center justify-center text-[#0ea5e9] font-semibold text-sm">
                  1
                </div>
                <h2 className="text-lg font-medium text-white">Select Customer</h2>
                {selectedCustomer && <CheckCircle className="w-5 h-5 text-[#22c55e]" />}
              </div>

              {/* Create Walk-In Button */}
              <button
                onClick={() => setShowWalkInForm(true)}
                className="w-full bg-[#1e293b] hover:bg-[#334155] border-2 border-dashed border-[#475569] rounded-lg p-4 transition-colors"
              >
                <div className="flex items-center justify-center gap-3">
                  <UserPlus className="w-5 h-5 text-[#0ea5e9]" />
                  <span className="text-white font-medium">Create Walk-In Customer</span>
                </div>
              </button>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search customers..."
                  className="dark-input w-full !pl-10"
                />
              </div>

              {/* Customer List */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {filteredCustomers.slice(0, 5).map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className={`w-full text-left rounded-lg p-3 transition-colors ${
                      selectedCustomer?.id === customer.id
                        ? 'bg-[#0ea5e9]/10 border border-[#0ea5e9]'
                        : 'bg-[#1e293b] hover:bg-[#334155] border border-transparent'
                    }`}
                  >
                    <p className="font-medium text-white">{customer.name}</p>
                    <p className="text-sm text-[#94a3b8]">{customer.phone}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Select Vehicle */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#22c55e]/20 flex items-center justify-center text-[#22c55e] font-semibold text-sm">
                  2
                </div>
                <h2 className="text-lg font-medium text-white">Select Vehicle</h2>
                {selectedVehicle && <CheckCircle className="w-5 h-5 text-[#22c55e]" />}
              </div>

              {/* Vehicle List */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {vehicles.length === 0 ? (
                  <div className="bg-[#1e293b] rounded-lg p-6 text-center">
                    <Car className="w-8 h-8 text-[#64748b] mx-auto mb-2" />
                    <p className="text-[#94a3b8]">No vehicles available for test drive</p>
                  </div>
                ) : (
                  vehicles.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      onClick={() => setSelectedVehicle(vehicle)}
                      className={`w-full text-left rounded-lg p-3 transition-colors ${
                        selectedVehicle?.id === vehicle.id
                          ? 'bg-[#22c55e]/10 border border-[#22c55e]'
                          : 'bg-[#1e293b] hover:bg-[#334155] border border-transparent'
                      }`}
                    >
                      <p className="font-medium text-white">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </p>
                      {vehicle.color && (
                        <p className="text-sm text-[#94a3b8]">{vehicle.color}</p>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

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
                          className="dark-input w-full !pl-10"
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
                          className="dark-input w-full !pl-10"
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
          </div>
        ) : (
          /* Existing Test Drives Tab */
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
            ) : testDrives.length === 0 ? (
              <div className="bg-[#1e293b] rounded-lg p-8 text-center">
                <Gauge className="w-12 h-12 text-[#64748b] mx-auto mb-3" />
                <p className="text-[#94a3b8]">No test drives scheduled yet</p>
                <button
                  onClick={() => setActiveTab('new')}
                  className="mt-4 text-[#0ea5e9] hover:underline text-sm"
                >
                  Schedule your first test drive
                </button>
              </div>
            ) : (
              testDrives.map((testDrive) => {
                const config = statusConfig[testDrive.status] || statusConfig.DRAFT;
                const StatusIcon = config.icon;

                return (
                  <Link
                    key={testDrive.id}
                    href={`/test-drive/${testDrive.id}`}
                    className="block bg-[#1e293b] hover:bg-[#334155] rounded-lg p-4 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-white">
                          {testDrive.customer.name}
                        </h3>
                        <p className="text-sm text-[#94a3b8] mt-0.5">
                          {testDrive.vehicle.year} {testDrive.vehicle.make} {testDrive.vehicle.model}
                        </p>
                        {testDrive.scheduledDate && testDrive.scheduledTime && (
                          <p className="text-xs text-[#64748b] mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(testDrive.scheduledDate).toLocaleDateString()} at {testDrive.scheduledTime}
                          </p>
                        )}
                      </div>
                      <div className={`flex items-center gap-1.5 ${config.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{config.label}</span>
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
