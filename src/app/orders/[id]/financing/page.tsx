'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { PageContainer } from '@/components/layout';
import { Card, CardTitle, Button, Badge, Input, Select } from '@/components/ui';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  Building2,
  Calculator,
  FileText,
  CheckCircle,
  Clock,
  DollarSign,
  Percent,
  Calendar,
} from 'lucide-react';

interface FinancingBank {
  id: string;
  name: string;
  minDownPayment: number;
  maxTerm: number;
  interestRateFrom: number;
  interestRateTo: number;
  processingFee: number;
  features: string[];
  approvalTime: string;
}

interface FinancingCalculation {
  vehiclePrice: number;
  downPayment: number;
  downPaymentPercent: number;
  loanAmount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  processingFee: number;
}

interface FinancingPageProps {
  params: Promise<{ id: string }>;
}

export default function FinancingPage({ params }: FinancingPageProps) {
  const { id: orderId } = use(params);
  const [banks, setBanks] = useState<FinancingBank[]>([]);
  const [calculation, setCalculation] = useState<FinancingCalculation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const [formData, setFormData] = useState({
    vehiclePrice: '200000',
    downPaymentPercent: '20',
    termMonths: '48',
    interestRate: '3.5',
    customerType: 'salaried'
  });

  const fetchBanks = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/financing?type=banks');
      const result = await res.json();

      if (result.success) {
        setBanks(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch banks');
      }
    } catch (err) {
      setError('Failed to fetch banks');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateFinancing = async () => {
    setIsCalculating(true);

    try {
      const params = new URLSearchParams({
        type: 'calculate',
        vehiclePrice: formData.vehiclePrice,
        downPaymentPercent: formData.downPaymentPercent,
        interestRate: formData.interestRate,
        termMonths: formData.termMonths
      });

      const res = await fetch(`/api/financing?${params}`);
      const result = await res.json();

      if (result.success) {
        setCalculation(result.data);
      }
    } catch (err) {
      console.error('Calculation error:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  useEffect(() => {
    if (formData.vehiclePrice && parseFloat(formData.vehiclePrice) > 0) {
      const debounce = setTimeout(() => {
        calculateFinancing();
      }, 500);
      return () => clearTimeout(debounce);
    }
  }, [formData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <PageContainer title="Financing Options" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="Financing Options" subtitle="Error loading data">
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchBanks} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Financing Options"
      subtitle="Calculate and compare financing plans"
    >
      <div className="mb-6">
        <Link href={`/orders/${orderId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Order
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calculator */}
        <div className="lg:col-span-1">
          <Card>
            <CardTitle className="mb-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-violet-600" />
                Calculator
              </div>
            </CardTitle>
            <div className="space-y-4">
              <Input
                label="Vehicle Price (AED)"
                type="number"
                value={formData.vehiclePrice}
                onChange={(e) => setFormData({ ...formData, vehiclePrice: e.target.value })}
              />
              <Input
                label="Down Payment (%)"
                type="number"
                value={formData.downPaymentPercent}
                onChange={(e) => setFormData({ ...formData, downPaymentPercent: e.target.value })}
                min="15"
                max="80"
              />
              <Select
                label="Loan Term"
                value={formData.termMonths}
                onChange={(e) => setFormData({ ...formData, termMonths: e.target.value })}
              >
                <option value="12">12 months</option>
                <option value="24">24 months</option>
                <option value="36">36 months</option>
                <option value="48">48 months</option>
                <option value="60">60 months</option>
              </Select>
              <Input
                label="Interest Rate (% p.a.)"
                type="number"
                value={formData.interestRate}
                onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                step="0.1"
              />
              <Select
                label="Customer Type"
                value={formData.customerType}
                onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
              >
                <option value="salaried">Salaried Employee</option>
                <option value="self_employed">Self Employed</option>
                <option value="company">Company</option>
              </Select>
            </div>
          </Card>

          {/* Calculation Result */}
          {calculation && (
            <Card className="mt-4 bg-violet-50 border-violet-200">
              <CardTitle className="mb-4 text-violet-900">Monthly Payment</CardTitle>
              <div className="text-center mb-4">
                <p className="text-4xl font-bold text-violet-600">
                  {formatCurrency(calculation.monthlyPayment)}
                </p>
                <p className="text-sm text-violet-500">per month for {calculation.termMonths} months</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Down Payment</span>
                  <span className="font-medium">{formatCurrency(calculation.downPayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Loan Amount</span>
                  <span className="font-medium">{formatCurrency(calculation.loanAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Interest</span>
                  <span className="font-medium">{formatCurrency(calculation.totalInterest)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Processing Fee</span>
                  <span className="font-medium">{formatCurrency(calculation.processingFee)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-medium">Total Payment</span>
                  <span className="font-bold">{formatCurrency(calculation.totalPayment)}</span>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Bank Options */}
        <div className="lg:col-span-2">
          <CardTitle className="mb-4">Available Banks</CardTitle>
          <div className="space-y-4">
            {banks.map((bank) => (
              <Card
                key={bank.id}
                className={`cursor-pointer transition-all ${
                  selectedBank === bank.id
                    ? 'border-violet-500 ring-2 ring-violet-200'
                    : 'hover:border-violet-300'
                }`}
                onClick={() => {
                  setSelectedBank(bank.id);
                  setFormData({
                    ...formData,
                    downPaymentPercent: Math.max(
                      parseFloat(formData.downPaymentPercent),
                      bank.minDownPayment
                    ).toString(),
                    interestRate: ((bank.interestRateFrom + bank.interestRateTo) / 2).toString()
                  });
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                      <Building2 className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{bank.name}</h3>
                      <p className="text-sm text-gray-500">
                        Approval in {bank.approvalTime}
                      </p>
                    </div>
                  </div>
                  {selectedBank === bank.id && (
                    <CheckCircle className="h-6 w-6 text-violet-600" />
                  )}
                </div>

                <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-500">
                      <Percent className="h-4 w-4" />
                    </div>
                    <p className="font-semibold">{bank.interestRateFrom}% - {bank.interestRateTo}%</p>
                    <p className="text-xs text-gray-500">Interest Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-500">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <p className="font-semibold">{bank.minDownPayment}%</p>
                    <p className="text-xs text-gray-500">Min Down</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-500">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <p className="font-semibold">{bank.maxTerm} mo</p>
                    <p className="text-xs text-gray-500">Max Term</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-500">
                      <FileText className="h-4 w-4" />
                    </div>
                    <p className="font-semibold">{bank.processingFee}%</p>
                    <p className="text-xs text-gray-500">Proc. Fee</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {bank.features.map((feature, idx) => (
                    <Badge key={idx} variant="outline" size="sm">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          {/* Apply Button */}
          {selectedBank && calculation && (
            <div className="mt-6">
              <Button className="w-full" size="lg">
                <FileText className="mr-2 h-5 w-5" />
                Start Application with {banks.find(b => b.id === selectedBank)?.name}
              </Button>
              <p className="text-sm text-gray-500 text-center mt-2">
                You&apos;ll need to provide: Emirates ID, Salary Certificate, Bank Statements
              </p>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
