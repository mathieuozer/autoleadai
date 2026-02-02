'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageContainer } from '@/components/layout';
import { Card, CardTitle, Button, Badge, Input, Select } from '@/components/ui';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  Phone,
  PhoneCall,
  PhoneOff,
  PhoneMissed,
  Clock,
  User,
  Car,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  Calendar,
} from 'lucide-react';

interface Lead {
  id: string;
  customer: {
    name: string;
    phone: string;
    email: string | null;
  };
  vehicle: {
    make: string;
    model: string;
    year: number;
  };
  source: string;
  status: string;
  priority: 'high' | 'medium' | 'low';
  lastCallAt: string | null;
  lastCallResult: string | null;
  callAttempts: number;
  nextCallScheduled: string | null;
  assignedTo: string | null;
  createdAt: string;
  notes: string | null;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'scheduled' | 'contacted'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [callingLeadId, setCallingLeadId] = useState<string | null>(null);

  const fetchLeads = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In production, this would fetch from the API
      // For now, using mock data
      const mockLeads: Lead[] = [
        {
          id: 'lead-1',
          customer: { name: 'Ahmed Al Rashid', phone: '+971501234567', email: 'ahmed@example.com' },
          vehicle: { make: 'Toyota', model: 'Camry', year: 2024 },
          source: 'Website',
          status: 'NEW',
          priority: 'high',
          lastCallAt: null,
          lastCallResult: null,
          callAttempts: 0,
          nextCallScheduled: null,
          assignedTo: null,
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          notes: null
        },
        {
          id: 'lead-2',
          customer: { name: 'Sarah Johnson', phone: '+971507654321', email: 'sarah@example.com' },
          vehicle: { make: 'Honda', model: 'Accord', year: 2024 },
          source: 'Walk-in',
          status: 'CONTACTED',
          priority: 'medium',
          lastCallAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          lastCallResult: 'INTERESTED',
          callAttempts: 1,
          nextCallScheduled: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
          assignedTo: 'Sales Team',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          notes: 'Interested in test drive'
        },
        {
          id: 'lead-3',
          customer: { name: 'Mohammed Ali', phone: '+971509876543', email: null },
          vehicle: { make: 'Nissan', model: 'Patrol', year: 2024 },
          source: 'Referral',
          status: 'CALL_BACK',
          priority: 'high',
          lastCallAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          lastCallResult: 'BUSY',
          callAttempts: 2,
          nextCallScheduled: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
          assignedTo: null,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
          notes: 'Call back requested'
        },
        {
          id: 'lead-4',
          customer: { name: 'Fatima Hassan', phone: '+971502345678', email: 'fatima@example.com' },
          vehicle: { make: 'Lexus', model: 'ES', year: 2024 },
          source: 'Campaign',
          status: 'NEW',
          priority: 'medium',
          lastCallAt: null,
          lastCallResult: null,
          callAttempts: 0,
          nextCallScheduled: null,
          assignedTo: null,
          createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          notes: null
        },
        {
          id: 'lead-5',
          customer: { name: 'John Smith', phone: '+971504567890', email: 'john@example.com' },
          vehicle: { make: 'BMW', model: 'X5', year: 2024 },
          source: 'Website',
          status: 'NO_ANSWER',
          priority: 'low',
          lastCallAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          lastCallResult: 'NO_ANSWER',
          callAttempts: 3,
          nextCallScheduled: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
          assignedTo: null,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
          notes: 'Multiple attempts, no answer'
        }
      ];

      setLeads(mockLeads);
    } catch (err) {
      setError('Failed to fetch leads');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleCall = (leadId: string) => {
    setCallingLeadId(leadId);
    // In production, this would initiate a call via VoIP or open the phone app
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      window.open(`tel:${lead.customer.phone}`);
    }
    setTimeout(() => setCallingLeadId(null), 2000);
  };

  const handleLogCall = (leadId: string, result: string) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id === leadId) {
        return {
          ...lead,
          lastCallAt: new Date().toISOString(),
          lastCallResult: result,
          callAttempts: lead.callAttempts + 1,
          status: result === 'INTERESTED' ? 'CONTACTED' : result === 'NO_ANSWER' ? 'NO_ANSWER' : lead.status
        };
      }
      return lead;
    }));
  };

  const filteredLeads = leads.filter(lead => {
    if (filter === 'pending') return ['NEW', 'CALL_BACK'].includes(lead.status);
    if (filter === 'scheduled') return lead.nextCallScheduled !== null;
    if (filter === 'contacted') return lead.status === 'CONTACTED';
    return true;
  }).filter(lead => {
    if (!searchTerm) return true;
    return lead.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           lead.customer.phone.includes(searchTerm);
  });

  const priorityConfig = {
    high: { color: 'bg-red-100 text-red-700', label: 'High' },
    medium: { color: 'bg-amber-100 text-amber-700', label: 'Medium' },
    low: { color: 'bg-gray-100 text-gray-700', label: 'Low' }
  };

  const callResultConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
    INTERESTED: { icon: CheckCircle, color: 'text-green-600', label: 'Interested' },
    NOT_INTERESTED: { icon: XCircle, color: 'text-red-600', label: 'Not Interested' },
    BUSY: { icon: Clock, color: 'text-amber-600', label: 'Busy' },
    NO_ANSWER: { icon: PhoneMissed, color: 'text-gray-500', label: 'No Answer' },
    WRONG_NUMBER: { icon: PhoneOff, color: 'text-red-500', label: 'Wrong Number' }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (isLoading) {
    return (
      <PageContainer title="Lead Management" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="Lead Management" subtitle="Error loading data">
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchLeads} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Lead Management"
      subtitle="Contact Center - Call queue and lead tracking"
    >
      <div className="mb-6 flex items-center justify-between">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <Button onClick={fetchLeads} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="text-center">
          <p className="text-3xl font-bold text-violet-600">
            {leads.filter(l => ['NEW', 'CALL_BACK'].includes(l.status)).length}
          </p>
          <p className="text-sm text-gray-500">Pending Calls</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-green-600">
            {leads.filter(l => l.status === 'CONTACTED').length}
          </p>
          <p className="text-sm text-gray-500">Contacted Today</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-amber-600">
            {leads.filter(l => l.nextCallScheduled !== null).length}
          </p>
          <p className="text-sm text-gray-500">Scheduled</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-red-600">
            {leads.filter(l => l.priority === 'high').length}
          </p>
          <p className="text-sm text-gray-500">High Priority</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'scheduled', 'contacted'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Leads List */}
      <div className="space-y-4">
        {filteredLeads.map((lead) => (
          <Card key={lead.id}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  lead.priority === 'high' ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                  <User className={`h-6 w-6 ${
                    lead.priority === 'high' ? 'text-red-600' : 'text-gray-600'
                  }`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{lead.customer.name}</h3>
                    <Badge className={priorityConfig[lead.priority].color} size="sm">
                      {priorityConfig[lead.priority].label}
                    </Badge>
                    {lead.lastCallResult && callResultConfig[lead.lastCallResult] && (
                      <Badge variant="outline" size="sm">
                        {callResultConfig[lead.lastCallResult].label}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{lead.customer.phone}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      {lead.vehicle.year} {lead.vehicle.make} {lead.vehicle.model}
                    </span>
                    <span>Source: {lead.source}</span>
                    <span>Attempts: {lead.callAttempts}</span>
                    {lead.lastCallAt && (
                      <span>Last call: {formatTime(lead.lastCallAt)}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {lead.nextCallScheduled && (
                  <div className="text-right mr-4">
                    <p className="text-xs text-gray-500">Scheduled</p>
                    <p className="text-sm font-medium">
                      {new Date(lead.nextCallScheduled).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}

                <Button
                  onClick={() => handleCall(lead.id)}
                  disabled={callingLeadId === lead.id}
                  className={callingLeadId === lead.id ? 'bg-green-600' : ''}
                >
                  {callingLeadId === lead.id ? (
                    <>
                      <PhoneCall className="mr-2 h-4 w-4 animate-pulse" />
                      Calling...
                    </>
                  ) : (
                    <>
                      <Phone className="mr-2 h-4 w-4" />
                      Call
                    </>
                  )}
                </Button>

                <Select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleLogCall(lead.id, e.target.value);
                    }
                  }}
                  className="w-40"
                >
                  <option value="">Log Result...</option>
                  <option value="INTERESTED">Interested</option>
                  <option value="NOT_INTERESTED">Not Interested</option>
                  <option value="BUSY">Busy</option>
                  <option value="NO_ANSWER">No Answer</option>
                  <option value="WRONG_NUMBER">Wrong Number</option>
                </Select>
              </div>
            </div>

            {lead.notes && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Notes:</span> {lead.notes}
                </p>
              </div>
            )}
          </Card>
        ))}

        {filteredLeads.length === 0 && (
          <Card className="text-center py-12">
            <Phone className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">No leads found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
